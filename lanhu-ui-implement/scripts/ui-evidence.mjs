#!/usr/bin/env node
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  lstatSync,
  readlinkSync,
  renameSync,
} from 'node:fs';
import { resolve, join, relative, isAbsolute, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { captureUI, inspectPlan } from './capture-ui.mjs';
import { summarize } from './evidence-summary.mjs';

const hash = (value) => createHash('sha256').update(value).digest('hex');
const git = (args) => {
  const result = spawnSync('git', args, {
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
  if (result.status !== 0) throw new Error(result.stderr || result.error?.message || 'Cannot read Git identity');
  return result.stdout;
};
export function sourceIdentity(sourceFiles) {
  // Explicit inputs come from verified page dependencies; identify content, including untracked and ignored files.
  // Git is not required, and unrelated changes must not invalidate this scoped identity.
  if (sourceFiles !== undefined) {
    if (
      !Array.isArray(sourceFiles) ||
      sourceFiles.length === 0 ||
      sourceFiles.some((file) => typeof file !== 'string' || !file.trim())
    )
      throw new Error('sourceFiles must be a nonempty array of file paths');
    const root = process.cwd();
    const files = [...new Set(sourceFiles.map((file) => relative(root, resolve(file))))].sort();
    for (const file of files)
      if (!file || file === '..' || file.startsWith(`..${sep}`) || isAbsolute(file))
        throw new Error('sourceFiles must remain within the current working directory');
    return {
      kind: 'files',
      root,
      files: files.map((file) => [file, hash(readFileSync(resolve(file)))]),
    };
  }
  const head = git(['rev-parse', 'HEAD']).trim();
  const status = git(['status', '--porcelain=v1', '--untracked-files=all']);
  const diffHash = hash(git(['diff', 'HEAD', '--binary']));
  const root = git(['rev-parse', '--show-toplevel']).trim();
  const untracked = git(['ls-files', '--others', '--exclude-standard', '-z'])
    .split('\0')
    .filter(Boolean)
    .map((path) => {
      const file = join(root, path);
      return [path, hash(lstatSync(file).isSymbolicLink() ? readlinkSync(file) : readFileSync(file))];
    });
  return {
    head,
    status,
    diffHash,
    untrackedHash: hash(JSON.stringify(untracked)),
  };
}
const readPlan = (file) => {
  try {
    return JSON.parse(readFileSync(resolve(file), 'utf8'));
  } catch (error) {
    throw new Error(`Cannot read capture plan ${file}: ${error.message}`);
  }
};
export async function main(argv) {
  if (argv.length === 2 && argv[0] === '--inspect') {
    const plan = readPlan(argv[1]);
    console.log(JSON.stringify(await inspectPlan(plan), null, 2));
    return 0;
  }
  if (argv.length !== 3 || argv.some((arg) => arg.startsWith('--'))) {
    console.log(
      'Usage: node ui-evidence.mjs <plan.json> <existing-browser-session> <output-dir>\nStatic preflight: node ui-evidence.mjs --inspect <plan.json>\nRun from the tested repository; use an external or ignored output directory. Does not create browsers, install dependencies, or grant visual acceptance.',
    );
    return argv.includes('--help') ? 0 : 2;
  }
  const [config, session, directory] = argv;
  const plan = readPlan(config);
  // Fail before creating output, reading Git, or connecting to the session; capture validates the same plan.
  await inspectPlan(plan);
  const source = sourceIdentity(plan.sourceFiles);
  const out = resolve(directory);
  mkdirSync(out, { recursive: true });
  for (const target of plan.targets || []) {
    if (!/^[\w-]+$/.test(target.id)) throw new Error('target.id allows only letters, digits, _, and -');
    if (target.steps) {
      for (const step of target.steps) {
        if (!/^[\w-]+$/.test(step.id)) throw new Error('step.id allows only letters, digits, _, and -');
        step.screenshot = {
          ...step.screenshot,
          path: join(out, `${target.id}-${step.id}.png`),
        };
      }
    } else
      target.screenshot = {
        ...target.screenshot,
        path: join(out, `${target.id}.png`),
      };
  }
  const temporary = mkdtempSync(join(tmpdir(), 'ui-evidence-'));
  let result;
  try {
    const script = join(temporary, 'capture.js');
    writeFileSync(script, `async page => (${captureUI.toString()})(page, ${JSON.stringify(plan)})`);
    const child = spawnSync('playwright-cli', [`-s=${session}`, '--raw', 'run-code', `--filename=${script}`], {
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
    });
    writeFileSync(join(out, 'capture.stdout.log'), child.stdout || '');
    writeFileSync(join(out, 'capture.stderr.log'), child.stderr || '');
    if (child.error || child.status !== 0)
      throw new Error(child.error?.message || `playwright-cli exit=${child.status}`);
    result = JSON.parse(child.stdout);
    if (typeof result.ok !== 'boolean' || !Array.isArray(result.records))
      throw new Error('Invalid capture result format; inspect raw stdout');
  } catch (error) {
    result = {
      ok: false,
      records: [],
      error: error.message,
      visualVerdict: 'pending',
    };
  } finally {
    rmSync(temporary, { recursive: true });
  }
  let after = null;
  let sourceAfterError;
  try {
    after = sourceIdentity(plan.sourceFiles);
  } catch (error) {
    // Deleted or unreadable inputs invalidate source identity too; retain screenshots and the failure manifest.
    sourceAfterError = error.message;
  }
  const sourceUnchanged = after !== null && JSON.stringify(source) === JSON.stringify(after);
  result.ok &&= sourceUnchanged;
  const manifest = {
    schemaVersion: 1,
    source,
    sourceAfter: after,
    sourceUnchanged,
    // Checkout identity is not service provenance: callers must verify the preview process and build inputs.
    servedRevision: 'unverified',
    plan,
    ...result,
  };
  if (sourceAfterError) manifest.sourceAfterError = sourceAfterError;
  for (const record of manifest.records) {
    if (record.screenshot) {
      const bytes = readFileSync(record.screenshot);
      record.image = {
        sha256: hash(bytes),
        width: bytes.readUInt32BE(16),
        height: bytes.readUInt32BE(20),
      };
    }
  }
  const manifestPath = join(out, 'manifest.json');
  writeFileSync(`${manifestPath}.tmp`, JSON.stringify(manifest, null, 2) + '\n');
  // Replace atomically after a complete write so a partial manifest cannot appear sealed.
  renameSync(`${manifestPath}.tmp`, manifestPath);
  console.log(
    JSON.stringify({
      ...summarize(manifest),
      sourceUnchanged,
      manifest: manifestPath,
      visualVerdict: 'pending',
    }),
  );
  return manifest.ok ? 0 : 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    process.exitCode = await main(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
