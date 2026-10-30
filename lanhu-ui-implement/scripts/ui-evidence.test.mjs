import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, existsSync, rmSync, readFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const moduleUrl = new URL('./ui-evidence.mjs', import.meta.url).href;

test('Source identity: explicit scope includes ignored inputs, excludes unrelated changes, and retains Git mode', () => {
  const directory = mkdtempSync(join(tmpdir(), 'source-identity-'));
  const readIdentity = (files) => {
    const result = spawnSync(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        `import { sourceIdentity } from ${JSON.stringify(moduleUrl)};
       console.log(JSON.stringify(sourceIdentity(${JSON.stringify(files)})));`,
      ],
      { cwd: directory, encoding: 'utf8' },
    );
    return result;
  };
  const git = (...args) => {
    const result = spawnSync('git', args, { cwd: directory, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
  };
  try {
    writeFileSync(join(directory, 'page.html'), 'first');
    writeFileSync(join(directory, 'runtime.json'), '{}');
    const files = ['page.html', 'runtime.json'];
    const first = readIdentity(files);
    assert.equal(first.status, 0, first.stderr);
    assert.equal(JSON.parse(first.stdout).kind, 'files');
    writeFileSync(join(directory, 'unrelated.txt'), 'noise');
    assert.equal(readIdentity(files).stdout, first.stdout);
    // The same explicit scope works without Git, before the first commit, and in a normal Git checkout.
    git('init', '-q');
    writeFileSync(join(directory, '.gitignore'), 'runtime.json\n');
    assert.equal(readIdentity(files).stdout, first.stdout);
    writeFileSync(join(directory, 'runtime.json'), '{"changed":true}');
    const changedRuntime = readIdentity(files);
    assert.equal(changedRuntime.status, 0, changedRuntime.stderr);
    assert.notEqual(changedRuntime.stdout, first.stdout);
    git('add', 'page.html', '.gitignore');
    git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.test', 'commit', '-qm', 'fixture');
    const full = readIdentity();
    assert.equal(full.status, 0, full.stderr);
    assert.ok(JSON.parse(full.stdout).head);
    writeFileSync(join(directory, 'unrelated.txt'), 'changed');
    const fullChanged = readIdentity();
    assert.equal(fullChanged.status, 0, fullChanged.stderr);
    assert.notEqual(fullChanged.stdout, full.stdout);
    assert.equal(readIdentity(files).stdout, changedRuntime.stdout);
    writeFileSync(join(directory, 'page.html'), 'second');
    const changedPage = readIdentity(files);
    assert.equal(changedPage.status, 0, changedPage.stderr);
    assert.notEqual(changedPage.stdout, changedRuntime.stdout);
    rmSync(join(directory, 'page.html'));
    assert.notEqual(readIdentity(files).status, 0);
    for (const invalid of [[], 'page.html', [''], ['../outside.html']])
      assert.notEqual(readIdentity(invalid).status, 0);
  } finally {
    rmSync(directory, { recursive: true });
  }
});

test('CLI source binding: unrelated changes remain valid; changed or missing inputs retain failure manifests', () => {
  const directory = mkdtempSync(join(tmpdir(), 'source-manifest-'));
  const bin = join(directory, 'bin');
  mkdirSync(bin);
  // This stub tests CLI process boundaries and manifests, not browser execution or visual acceptance.
  writeFileSync(
    join(bin, 'playwright-cli'),
    `#!${process.execPath}
    const fs = require('node:fs');
    if (process.env.CHANGE_INPUT === 'remove') fs.unlinkSync('page.html');
    else fs.writeFileSync(process.env.CHANGE_INPUT === 'change' ? 'page.html' : 'noise.txt', 'changed');
    console.log(JSON.stringify({ok:true,records:[],visualVerdict:'pending'}));
  `,
    { mode: 0o755 },
  );
  const config = join(directory, 'plan.json');
  writeFileSync(
    config,
    JSON.stringify({
      sourceFiles: ['page.html'],
      targets: [{ id: 'main', ready: 'main', resourceRoot: 'main' }],
    }),
  );
  try {
    for (const change of ['unrelated', 'change', 'remove']) {
      writeFileSync(join(directory, 'page.html'), 'first');
      const out = join(directory, change);
      const result = spawnSync(process.execPath, [new URL(moduleUrl).pathname, config, 'fixture', out], {
        cwd: directory,
        encoding: 'utf8',
        env: { ...process.env, PATH: bin, CHANGE_INPUT: change },
      });
      assert.equal(result.status, change === 'unrelated' ? 0 : 1, result.stderr);
      const manifest = JSON.parse(readFileSync(join(out, 'manifest.json'), 'utf8'));
      assert.equal(manifest.sourceUnchanged, change === 'unrelated');
      assert.equal(manifest.servedRevision, 'unverified');
      if (change === 'remove') assert.ok(manifest.sourceAfterError);
    }
  } finally {
    rmSync(directory, { recursive: true });
  }
});

test('CLI preflight needs no Git or session; ordinary capture checks coverage before browser access', () => {
  const directory = mkdtempSync(join(tmpdir(), 'plan-preflight-'));
  const config = join(directory, 'plan.json');
  const cli = new URL('./ui-evidence.mjs', import.meta.url).pathname;
  const run = (...args) =>
    spawnSync(process.execPath, [cli, ...args], {
      cwd: directory,
      encoding: 'utf8',
      env: { ...process.env, PATH: '' },
    });
  try {
    const plan = {
      defaults: {
        ready: 'main',
        resourceRoot: 'body',
        measurements: { footer: 'footer' },
      },
      targets: [{ id: 'single', boundaryProbe: false }],
      coverage: {
        single: { boundaryProbe: false, measurements: { footer: 'footer' } },
      },
    };
    writeFileSync(config, JSON.stringify(plan));
    const good = run('--inspect', config);
    assert.equal(good.status, 0, good.stderr);
    assert.equal(JSON.parse(good.stdout).targets[0].boundaryProbe, false);
    plan.targets[0].boundaryProbe = true;
    writeFileSync(config, JSON.stringify(plan));
    for (const args of [
      ['--inspect', config],
      [config, 'nonexistent', join(directory, 'out')],
    ]) {
      const bad = run(...args);
      assert.equal(bad.status, 1);
      assert.match(bad.stderr, /single.boundaryProbe/);
    }
    assert.equal(existsSync(join(directory, 'out')), false);
    writeFileSync(config, '{invalid');
    const malformed = run('--inspect', config);
    assert.equal(malformed.status, 1);
    assert.match(malformed.stderr, /Cannot read capture plan/);
  } finally {
    rmSync(directory, { recursive: true });
  }
});
