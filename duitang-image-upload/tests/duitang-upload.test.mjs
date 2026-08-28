import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:https';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test, { afterEach } from 'node:test';

const TEST_DIR = dirname(fileURLToPath(import.meta.url));
const CLI = resolve(TEST_DIR, '../scripts/duitang-upload.mjs');
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nQAAAABJRU5ErkJggg==',
  'base64',
);
const temporaryRoots = [];

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

const makeWorkspace = async () => {
  const root = await mkdtemp(join(tmpdir(), 'duitang-upload-test-'));
  temporaryRoots.push(root);
  await writeFile(join(root, 'pixel.png'), PNG);
  await writeFile(
    join(root, 'manifest.json'),
    JSON.stringify({ schemaVersion: 1, files: [{ id: 'pixel', path: './pixel.png' }] }),
  );
  return root;
};

const runCli = (root, args, env = {}) => {
  const output = join(root, args.includes('--out') ? args[args.indexOf('--out') + 1] : 'result.json');
  const result = spawn(process.execPath, [CLI, '--manifest', join(root, 'manifest.json'), '--out', output, ...args], {
    cwd: root,
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return new Promise((resolvePromise) => {
    let stdout = '';
    let stderr = '';
    result.stdout.on('data', (chunk) => (stdout += chunk));
    result.stderr.on('data', (chunk) => (stderr += chunk));
    result.on('close', (code) => resolvePromise({ code, stdout, stderr, output }));
  });
};

const createCertificate = async (root) => {
  const key = join(root, 'key.pem');
  const cert = join(root, 'cert.pem');
  execFileSync('/usr/bin/openssl', [
    'req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', key, '-out', cert,
    '-days', '1', '-subj', '/CN=127.0.0.1',
  ], { stdio: 'ignore' });
  return { key: await readFile(key), cert: await readFile(cert) };
};

test('validate checks local files without uploading', async () => {
  const root = await makeWorkspace();
  const config = join(root, 'config.json');
  await writeFile(config, JSON.stringify({ host: 'operate.duitang.com', cookie: 'dt_auth=fixture' }));

  const execution = await runCli(root, ['--out', 'validated.json', '--config', config, '--validate']);
  assert.equal(execution.code, 0, execution.stderr);
  const result = JSON.parse(await readFile(execution.output, 'utf8'));
  assert.equal(result.status, 'success');
  assert.equal(result.items[0].status, 'validated');
  assert.equal(result.items[0].mimeType, 'image/png');
  assert.equal(result.items[0].width, 1);
  assert.equal(result.items[0].height, 1);
  assert.equal(JSON.stringify(result).includes('dt_auth=fixture'), false);
});

test('validation reports a missing file without hiding valid items', async () => {
  const root = await makeWorkspace();
  await writeFile(
    join(root, 'manifest.json'),
    JSON.stringify({
      schemaVersion: 1,
      files: [
        { id: 'valid', path: './pixel.png' },
        { id: 'missing', path: './missing.png' },
      ],
    }),
  );
  const config = join(root, 'config.json');
  await writeFile(config, JSON.stringify({ host: 'operate.duitang.com', cookie: 'dt_auth=fixture' }));

  const execution = await runCli(root, ['--out', 'partial.json', '--config', config, '--validate']);
  assert.equal(execution.code, 1);
  const result = JSON.parse(await readFile(execution.output, 'utf8'));
  assert.equal(result.status, 'partial_failure');
  assert.deepEqual(result.items.map((item) => item.status), ['validated', 'failed']);
  assert.equal(result.items[1].error.code, 'FILE_NOT_FOUND');
});

test('ordinary execution uploads by default and keeps cookie off signed PUT', async () => {
  const root = await makeWorkspace();
  const { key, cert } = await createCertificate(root);
  const calls = [];
  const server = createServer({ key, cert }, async (request, response) => {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    calls.push({ method: request.method, path: request.url, cookie: request.headers.cookie || null });
    response.setHeader('content-type', 'application/json');
    if (request.url?.includes('generate_token_by_custom_filename')) {
      response.end(JSON.stringify({ data: [{
        upload_url: `https://127.0.0.1:${server.address().port}/signed-put`,
        endpoint: 'https://cdn.test.invalid', key: 'pixel.png', photo_id: 7, bucket: 'dt-img',
      }] }));
    } else if (request.url === '/signed-put') {
      response.end('{}');
    } else if (request.url?.includes('photo/confirm')) {
      response.end(JSON.stringify({ data: true }));
    } else {
      response.statusCode = 404;
      response.end('{}');
    }
  });
  await new Promise((resolvePromise) => server.listen(0, '127.0.0.1', resolvePromise));

  try {
    const config = join(root, 'config.json');
    await writeFile(config, JSON.stringify({
      host: `https://127.0.0.1:${server.address().port}`,
      cookie: 'dt_auth=fixture; locale=希',
      bucket: 'dt-img',
    }));
    const execution = await runCli(
      root,
      ['--out', 'uploaded.json', '--config', config, '--cache-dir', join(root, 'cache')],
      { NODE_TLS_REJECT_UNAUTHORIZED: '0' },
    );
    assert.equal(execution.code, 0, execution.stderr);
    const result = JSON.parse(await readFile(execution.output, 'utf8'));
    assert.equal(result.items[0].status, 'success');
    assert.equal(result.items[0].url, 'https://cdn.test.invalid/pixel.png');
    assert.deepEqual(calls.map(({ method, path }) => ({ method, path })), [
      { method: 'POST', path: '/operator/upload/file/generate_token_by_custom_filename/' },
      { method: 'PUT', path: '/signed-put' },
      { method: 'POST', path: '/operator/upload/file/photo/confirm/' },
    ]);
    assert.equal(calls[0].cookie, 'dt_auth=fixture');
    assert.equal(calls[1].cookie, null);
    assert.equal(calls[2].cookie, 'dt_auth=fixture');

    calls.length = 0;
    const cachedExecution = await runCli(
      root,
      ['--out', 'cached.json', '--config', config, '--cache-dir', join(root, 'cache')],
      { NODE_TLS_REJECT_UNAUTHORIZED: '0' },
    );
    assert.equal(cachedExecution.code, 0, cachedExecution.stderr);
    const cachedResult = JSON.parse(await readFile(cachedExecution.output, 'utf8'));
    assert.equal(cachedResult.items[0].status, 'cached');
    assert.equal(cachedResult.items[0].url, 'https://cdn.test.invalid/pixel.png');
    assert.equal(calls.length, 0);
  } finally {
    await new Promise((resolvePromise) => server.close(resolvePromise));
  }
});

test('pending confirm resumes without requesting another token or PUT', async () => {
  const root = await makeWorkspace();
  const { key, cert } = await createCertificate(root);
  const calls = [];
  let rejectConfirm = true;
  const server = createServer({ key, cert }, async (request, response) => {
    for await (const _chunk of request) {}
    calls.push({ method: request.method, path: request.url });
    response.setHeader('content-type', 'application/json');
    if (request.url?.includes('generate_token_by_custom_filename')) {
      response.end(JSON.stringify({ data: [{
        upload_url: `https://127.0.0.1:${server.address().port}/signed-put`,
        endpoint: 'https://cdn.test.invalid', key: 'pending.png', photo_id: 9, bucket: 'dt-img',
      }] }));
    } else if (request.url === '/signed-put') {
      response.end('{}');
    } else if (request.url?.includes('photo/confirm') && rejectConfirm) {
      response.statusCode = 503;
      response.end('{}');
    } else if (request.url?.includes('photo/confirm')) {
      response.end(JSON.stringify({ data: true }));
    } else {
      response.statusCode = 404;
      response.end('{}');
    }
  });
  await new Promise((resolvePromise) => server.listen(0, '127.0.0.1', resolvePromise));

  try {
    const config = join(root, 'config.json');
    const cache = join(root, 'cache');
    await writeFile(config, JSON.stringify({
      host: `https://127.0.0.1:${server.address().port}`,
      cookie: 'dt_auth=fixture',
      bucket: 'dt-img',
    }));
    const first = await runCli(
      root,
      ['--out', 'pending.json', '--config', config, '--cache-dir', cache],
      { NODE_TLS_REJECT_UNAUTHORIZED: '0' },
    );
    assert.equal(first.code, 1);
    const pending = JSON.parse(await readFile(first.output, 'utf8'));
    assert.equal(pending.items[0].status, 'pending_confirm');
    assert.deepEqual(calls.map(({ method }) => method), ['POST', 'PUT', 'POST', 'POST', 'POST']);

    rejectConfirm = false;
    calls.length = 0;
    const resumed = await runCli(
      root,
      ['--out', 'resumed.json', '--config', config, '--cache-dir', cache],
      { NODE_TLS_REJECT_UNAUTHORIZED: '0' },
    );
    assert.equal(resumed.code, 0, resumed.stderr);
    const resumedResult = JSON.parse(await readFile(resumed.output, 'utf8'));
    assert.equal(resumedResult.items[0].status, 'success');
    assert.equal(resumedResult.items[0].resumedConfirm, true);
    assert.deepEqual(calls, [{ method: 'POST', path: '/operator/upload/file/photo/confirm/' }]);
  } finally {
    await new Promise((resolvePromise) => server.close(resolvePromise));
  }
});

test('concurrent items with identical bytes upload once', async () => {
  const root = await makeWorkspace();
  await writeFile(
    join(root, 'manifest.json'),
    JSON.stringify({
      schemaVersion: 1,
      files: [
        { id: 'first-use', path: './pixel.png' },
        { id: 'second-use', path: './pixel.png' },
      ],
    }),
  );
  const { key, cert } = await createCertificate(root);
  const calls = [];
  const server = createServer({ key, cert }, async (request, response) => {
    for await (const _chunk of request) {}
    calls.push({ method: request.method, path: request.url });
    response.setHeader('content-type', 'application/json');
    if (request.url?.includes('generate_token_by_custom_filename')) {
      response.end(JSON.stringify({ data: [{
        upload_url: `https://127.0.0.1:${server.address().port}/signed-put`,
        endpoint: 'https://cdn.test.invalid', key: 'shared.png', photo_id: 11, bucket: 'dt-img',
      }] }));
    } else if (request.url === '/signed-put') {
      response.end('{}');
    } else if (request.url?.includes('photo/confirm')) {
      response.end(JSON.stringify({ data: true }));
    } else {
      response.statusCode = 404;
      response.end('{}');
    }
  });
  await new Promise((resolvePromise) => server.listen(0, '127.0.0.1', resolvePromise));

  try {
    const config = join(root, 'config.json');
    await writeFile(config, JSON.stringify({
      host: `https://127.0.0.1:${server.address().port}`,
      cookie: 'dt_auth=fixture',
    }));
    const execution = await runCli(
      root,
      ['--out', 'deduped.json', '--config', config, '--cache-dir', join(root, 'cache')],
      { NODE_TLS_REJECT_UNAUTHORIZED: '0' },
    );
    assert.equal(execution.code, 0, execution.stderr);
    const result = JSON.parse(await readFile(execution.output, 'utf8'));
    assert.deepEqual(result.items.map((item) => item.url), [
      'https://cdn.test.invalid/shared.png',
      'https://cdn.test.invalid/shared.png',
    ]);
    assert.deepEqual(calls.map(({ method }) => method), ['POST', 'PUT', 'POST']);
  } finally {
    await new Promise((resolvePromise) => server.close(resolvePromise));
  }
});

test('audio and video use their distinct backend routes', async () => {
  const root = await makeWorkspace();
  await writeFile(join(root, 'sound.mp3'), Buffer.from('ID3mock-audio'));
  await writeFile(join(root, 'clip.mp4'), Buffer.from([0, 0, 0, 24, 0x66, 0x74, 0x79, 0x70, ...Buffer.from('mock-video')]));
  await writeFile(
    join(root, 'manifest.json'),
    JSON.stringify({
      schemaVersion: 1,
      files: [
        { id: 'sound', path: './sound.mp3' },
        { id: 'clip', path: './clip.mp4' },
      ],
    }),
  );
  const { key, cert } = await createCertificate(root);
  const calls = [];
  const server = createServer({ key, cert }, async (request, response) => {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    const body = Buffer.concat(chunks).toString('utf8');
    calls.push({ method: request.method, path: request.url, body });
    response.setHeader('content-type', 'application/json');
    if (request.url?.includes('generate_token/audio')) {
      response.end(JSON.stringify({ data: [{
        upload_url: `https://127.0.0.1:${server.address().port}/audio-put`,
        endpoint: 'https://cdn.test.invalid', key: 'sound.mp3',
      }] }));
    } else if (request.url?.includes('generate_token_by_custom_filename')) {
      response.end(JSON.stringify({ data: [{
        upload_url: `https://127.0.0.1:${server.address().port}/video-put`,
        endpoint: 'https://cdn.test.invalid', key: 'clip.mp4', photo_id: 12, bucket: 'dt-img',
      }] }));
    } else if (request.url === '/audio-put' || request.url === '/video-put') {
      response.end('{}');
    } else if (request.url?.includes('photo/confirm')) {
      response.end(JSON.stringify({ data: true }));
    } else {
      response.statusCode = 404;
      response.end('{}');
    }
  });
  await new Promise((resolvePromise) => server.listen(0, '127.0.0.1', resolvePromise));

  try {
    const config = join(root, 'config.json');
    await writeFile(config, JSON.stringify({
      host: `https://127.0.0.1:${server.address().port}`,
      cookie: 'dt_auth=fixture',
    }));
    const execution = await runCli(
      root,
      ['--out', 'media.json', '--config', config, '--cache-dir', join(root, 'cache')],
      { NODE_TLS_REJECT_UNAUTHORIZED: '0' },
    );
    assert.equal(execution.code, 0, execution.stderr);
    const result = JSON.parse(await readFile(execution.output, 'utf8'));
    assert.deepEqual(result.items.map((item) => item.url).sort(), [
      'https://cdn.test.invalid/clip.mp4',
      'https://cdn.test.invalid/sound.mp3',
    ]);
    const audioToken = calls.find((call) => call.path.includes('generate_token/audio'));
    const videoToken = calls.find((call) => call.path.includes('generate_token_by_custom_filename'));
    assert.equal(JSON.parse(audioToken.body).type, 'ops_audio');
    assert.equal(JSON.parse(videoToken.body).type, 'OPS_VIDEO');
    assert.equal(calls.filter((call) => call.path.includes('photo/confirm')).length, 1);
  } finally {
    await new Promise((resolvePromise) => server.close(resolvePromise));
  }
});
