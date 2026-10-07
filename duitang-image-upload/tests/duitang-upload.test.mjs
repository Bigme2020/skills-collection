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
  return root;
};

const runCli = (root, files = [], args = [], env = {}) => {
  const child = spawn(process.execPath, [CLI, ...files, ...args], {
    cwd: root,
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return new Promise((resolvePromise) => {
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => (stdout += chunk));
    child.stderr.on('data', (chunk) => (stderr += chunk));
    child.on('close', (code) => resolvePromise({ code, stdout, stderr }));
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

test('requires local file arguments and rejects removed JSON workflow options', async () => {
  const root = await makeWorkspace();
  const empty = await runCli(root);
  assert.equal(empty.code, 1);
  assert.match(empty.stderr, /At least one local file is required/);

  for (const option of ['--manifest', '--out', '--validate']) {
    const execution = await runCli(root, ['pixel.png'], [option, 'unused.json']);
    assert.equal(execution.code, 1);
    assert.match(execution.stderr, new RegExp(`Unknown option: ${option}`));
  }
});

test('reports missing files on stderr without producing stdout', async () => {
  const root = await makeWorkspace();
  const config = join(root, 'config.json');
  await writeFile(config, JSON.stringify({ host: 'operate.duitang.com', cookie: 'dt_auth=fixture' }));

  const execution = await runCli(root, ['./missing.png'], ['--config', config]);
  assert.equal(execution.code, 1);
  assert.equal(execution.stdout, '');
  assert.match(execution.stderr, /^\.\/missing\.png: FILE_NOT_FOUND:/);
  assert.equal(execution.stderr.includes('dt_auth=fixture'), false);
});

test('uploads by default, prints only the URL, and keeps cookie off signed PUT', async () => {
  const root = await makeWorkspace();
  const { key, cert } = await createCertificate(root);
  const calls = [];
  const server = createServer({ key, cert }, async (request, response) => {
    for await (const _chunk of request) {}
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
    const cache = join(root, 'cache');
    await writeFile(config, JSON.stringify({
      host: `https://127.0.0.1:${server.address().port}`,
      cookie: 'dt_auth=fixture; locale=ignored',
      bucket: 'dt-img',
    }));
    const execution = await runCli(
      root,
      ['./pixel.png'],
      ['--config', config, '--cache-dir', cache],
      { NODE_TLS_REJECT_UNAUTHORIZED: '0', NODE_NO_WARNINGS: '1' },
    );
    assert.equal(execution.code, 0, execution.stderr);
    assert.equal(execution.stdout, 'https://cdn.test.invalid/pixel.png\n');
    assert.equal(execution.stderr, '');
    assert.deepEqual(calls.map(({ method, path }) => ({ method, path })), [
      { method: 'POST', path: '/operator/upload/file/generate_token_by_custom_filename/' },
      { method: 'PUT', path: '/signed-put' },
      { method: 'POST', path: '/operator/upload/file/photo/confirm/' },
    ]);
    assert.equal(calls[0].cookie, 'dt_auth=fixture');
    assert.equal(calls[1].cookie, null);
    assert.equal(calls[2].cookie, 'dt_auth=fixture');

    calls.length = 0;
    const cached = await runCli(
      root,
      [join(root, 'pixel.png')],
      ['--config', config, '--cache-dir', cache],
      { NODE_TLS_REJECT_UNAUTHORIZED: '0', NODE_NO_WARNINGS: '1' },
    );
    assert.equal(cached.code, 0, cached.stderr);
    assert.equal(cached.stdout, 'https://cdn.test.invalid/pixel.png\n');
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
    }));
    const first = await runCli(
      root,
      ['pixel.png'],
      ['--config', config, '--cache-dir', cache],
      { NODE_TLS_REJECT_UNAUTHORIZED: '0', NODE_NO_WARNINGS: '1' },
    );
    assert.equal(first.code, 1);
    assert.equal(first.stdout, '');
    assert.match(first.stderr, /^pixel\.png: UPLOAD_HTTP_503:/);
    assert.deepEqual(calls.map(({ method }) => method), ['POST', 'PUT', 'POST', 'POST', 'POST']);

    rejectConfirm = false;
    calls.length = 0;
    const resumed = await runCli(
      root,
      ['pixel.png'],
      ['--config', config, '--cache-dir', cache],
      { NODE_TLS_REJECT_UNAUTHORIZED: '0', NODE_NO_WARNINGS: '1' },
    );
    assert.equal(resumed.code, 0, resumed.stderr);
    assert.equal(resumed.stdout, 'https://cdn.test.invalid/pending.png\n');
    assert.deepEqual(calls, [{ method: 'POST', path: '/operator/upload/file/photo/confirm/' }]);
  } finally {
    await new Promise((resolvePromise) => server.close(resolvePromise));
  }
});

test('duplicate input paths produce duplicate ordered URLs but upload once', async () => {
  const root = await makeWorkspace();
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
      ['./pixel.png', './pixel.png'],
      ['--config', config, '--cache-dir', join(root, 'cache')],
      { NODE_TLS_REJECT_UNAUTHORIZED: '0', NODE_NO_WARNINGS: '1' },
    );
    assert.equal(execution.code, 0, execution.stderr);
    assert.equal(execution.stdout, [
      'https://cdn.test.invalid/shared.png',
      'https://cdn.test.invalid/shared.png',
      '',
    ].join('\n'));
    assert.deepEqual(calls.map(({ method }) => method), ['POST', 'PUT', 'POST']);
  } finally {
    await new Promise((resolvePromise) => server.close(resolvePromise));
  }
});

test('audio and video keep input order while using distinct backend routes', async () => {
  const root = await makeWorkspace();
  await writeFile(join(root, 'sound.mp3'), Buffer.from('ID3mock-audio'));
  await writeFile(join(root, 'clip.mp4'), Buffer.from([0, 0, 0, 24, 0x66, 0x74, 0x79, 0x70, ...Buffer.from('mock-video')]));
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
      ['./sound.mp3', join(root, 'clip.mp4')],
      ['--config', config, '--cache-dir', join(root, 'cache')],
      { NODE_TLS_REJECT_UNAUTHORIZED: '0', NODE_NO_WARNINGS: '1' },
    );
    assert.equal(execution.code, 0, execution.stderr);
    assert.equal(execution.stdout, [
      'https://cdn.test.invalid/sound.mp3',
      'https://cdn.test.invalid/clip.mp4',
      '',
    ].join('\n'));
    const audioToken = calls.find((call) => call.path.includes('generate_token/audio'));
    const videoToken = calls.find((call) => call.path.includes('generate_token_by_custom_filename'));
    assert.equal(JSON.parse(audioToken.body).type, 'ops_audio');
    assert.equal(JSON.parse(videoToken.body).type, 'OPS_VIDEO');
    assert.equal(calls.filter((call) => call.path.includes('photo/confirm')).length, 1);
  } finally {
    await new Promise((resolvePromise) => server.close(resolvePromise));
  }
});

test('rejects directories and remote URLs', async () => {
  const root = await makeWorkspace();
  const config = join(root, 'config.json');
  await writeFile(config, JSON.stringify({ host: 'operate.duitang.com', cookie: 'dt_auth=fixture' }));

  const execution = await runCli(root, ['.', 'https://example.com/a.png'], ['--config', config]);
  assert.equal(execution.code, 1);
  assert.equal(execution.stdout, '');
  assert.match(execution.stderr, /^\.: NOT_A_FILE:/m);
  assert.match(execution.stderr, /^https:\/\/example\.com\/a\.png: INVALID_INPUT:/m);
});

// 在隔离子进程中模拟系统读取边界，不访问开发者真实浏览器或钥匙串。
const runDiscoveryFixture = async (mode) => {
  const root = await makeWorkspace();
  const preload = join(root, 'auth-boundary.mjs');
  await writeFile(preload, `
    import fs from 'node:fs';
    import childProcess from 'node:child_process';
    import { syncBuiltinESMExports } from 'node:module';
    const mode = ${JSON.stringify(mode)};
    const readDirectory = fs.promises.readdir;
    const fileStat = fs.promises.stat;
    const execute = childProcess.execFileSync;
    const denied = () => Object.assign(new Error('sensitive-auth-fixture'), { code: 'EPERM' });
    fs.promises.readdir = async (path, ...args) => {
      if (String(path).endsWith('Google/Chrome')) {
        if (mode === 'directory-denied' || mode === 'fallback') throw denied();
        if (mode === 'no-profile') return [];
        return [{ name: 'Default', isDirectory: () => true }];
      }
      if (mode === 'fallback' && String(path).endsWith('Microsoft Edge')) {
        return [{ name: 'Default', isDirectory: () => true }];
      }
      return readDirectory(path, ...args);
    };
    fs.promises.stat = async (path, ...args) => {
      if (String(path).endsWith('/Default/Cookies')) return { isFile: () => true, mtimeMs: 1 };
      return fileStat(path, ...args);
    };
    childProcess.execFileSync = (file, args, ...options) => {
      if (file === '/usr/bin/sqlite3') {
        if (mode === 'database-failed') throw denied();
        if (mode === 'cookie-missing') return '[]';
        const plain = mode === 'plaintext' || mode === 'fallback';
        return JSON.stringify([{ host_key: '.duitang.com', name: 'dt_auth',
          value: plain ? 'sensitive-auth-fixture' : '', encrypted_value: plain ? '' : '763130000000', expires_utc: '0' }]);
      }
      if (file === '/usr/bin/security') {
        if (mode === 'decrypt-failed') return 'sensitive-auth-fixture';
        throw denied();
      }
      return execute(file, args, ...options);
    };
    syncBuiltinESMExports();
  `);
  return runCli(root, ['missing.png'], [], {
    HOME: root, NODE_OPTIONS: `--import=${preload}`,
    DUITANG_UPLOAD_CONFIG: '', DUITANG_UPLOAD_COOKIE: '', DUITANG_UPLOAD_HOST: 'operate.duitang.com',
  });
};

for (const [mode, code] of [
  ['directory-denied', 'AUTH_BROWSER_ACCESS_DENIED'],
  ['database-failed', 'AUTH_COOKIE_DATABASE_READ_FAILED'],
  ['keychain-failed', 'AUTH_KEYCHAIN_UNAVAILABLE'],
  ['decrypt-failed', 'AUTH_COOKIE_DECRYPT_FAILED'],
  ['no-profile', 'AUTH_BROWSER_PROFILE_NOT_FOUND'],
  ['cookie-missing', 'AUTH_COOKIE_NOT_FOUND'],
]) {
  test(`认证发现区分 ${mode}，且不泄露凭据或原始命令错误`, async () => {
    const result = await runDiscoveryFixture(mode);
    assert.equal(result.code, 1);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, new RegExp(`^${code}:`));
    assert.equal(result.stderr.includes('sensitive-auth-fixture'), false);
  });
}

for (const mode of ['plaintext', 'fallback']) {
  test(`认证发现 ${mode} 可用时继续处理文件，不被其他读取错误阻断`, async () => {
    const result = await runDiscoveryFixture(mode);
    assert.equal(result.code, 1);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /^missing\.png: FILE_NOT_FOUND:/);
    assert.equal(result.stderr.includes('sensitive-auth-fixture'), false);
  });
}
