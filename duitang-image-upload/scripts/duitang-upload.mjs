#!/usr/bin/env node
import { createHash, createDecipheriv, pbkdf2Sync } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import {
  mkdir,
  readFile,
  readdir,
  rename,
  stat,
  writeFile,
} from 'node:fs/promises';
import { homedir } from 'node:os';
import { basename, dirname, extname, join, resolve } from 'node:path';
import process from 'node:process';

const DEFAULT_HOST = 'operate.duitang.com';
const DEFAULT_BUCKET = 'dt-img';
const DEFAULT_OSS_NAME = 'jd';
const DEFAULT_CONCURRENCY = 4;
const MAX_ATTEMPTS = 3;

const usage = () => `Usage:
  duitang-upload <file...>
    [--config <config.json>] [--cache-dir <path>]
    [--concurrency <number>]

Prints one stable CDN URL per input file, in input order.`;

const parseArgs = (argv) => {
  const args = { files: [] };
  const options = new Set(['--config', '--cache-dir', '--concurrency']);
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--help' || arg === '-h') {
      args.help = true;
      continue;
    }
    if (!arg.startsWith('--')) {
      args.files.push(arg);
      continue;
    }
    if (!options.has(arg)) throw new Error(`Unknown option: ${arg}`);
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${arg}`);
    args[arg.slice(2)] = value;
    index += 1;
  }
  return args;
};

const assert = (condition, message, code = 'INVALID_INPUT') => {
  if (!condition) {
    const error = new Error(message);
    error.code = code;
    throw error;
  }
};

const safeMessage = (error) =>
  String(error instanceof Error ? error.message : error)
    .replace(/https?:\/\/[^\s"']+/gi, '[redacted-url]')
    .replace(/((?:cookie|authorization)\s*[:=]\s*)[^\r\n]+/gi, '$1[redacted]');

const readJson = async (filePath, label) => {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'));
  } catch (error) {
    const wrapped = new Error(`Cannot read ${label}: ${safeMessage(error)}`);
    wrapped.code = 'INVALID_JSON';
    throw wrapped;
  }
};

const writeJson = async (filePath, value) => {
  await mkdir(dirname(filePath), { recursive: true });
  const temporary = `${filePath}.tmp-${process.pid}`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  await rename(temporary, filePath);
};

const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex');
const md5 = (buffer) => createHash('md5').update(buffer).digest('hex');

const normalizeHost = (host) => {
  const raw = String(host || DEFAULT_HOST).trim().replace(/\/$/, '');
  return raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`;
};

const hostNameOf = (host) => new URL(normalizeHost(host)).hostname;

const readPng = (buffer) =>
  buffer.length >= 24 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    ? { mimeType: 'image/png', width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }
    : null;

const readGif = (buffer) =>
  buffer.length >= 10 && buffer.subarray(0, 3).toString('ascii') === 'GIF'
    ? { mimeType: 'image/gif', width: buffer.readUInt16LE(6), height: buffer.readUInt16LE(8) }
    : null;

const readJpeg = (buffer) => {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) break;
    while (buffer[offset] === 0xff) offset += 1;
    const marker = buffer[offset];
    offset += 1;
    if (marker === 0xd8 || marker === 0xd9) continue;
    const length = buffer.readUInt16BE(offset);
    if (length < 2 || offset + length > buffer.length) break;
    const sof =
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf);
    if (sof) {
      return { mimeType: 'image/jpeg', height: buffer.readUInt16BE(offset + 3), width: buffer.readUInt16BE(offset + 5) };
    }
    offset += length;
  }
  return null;
};

const readWebp = (buffer) => {
  if (buffer.length < 25 || buffer.subarray(0, 4).toString('ascii') !== 'RIFF' || buffer.subarray(8, 12).toString('ascii') !== 'WEBP') return null;
  const chunk = buffer.subarray(12, 16).toString('ascii');
  if (chunk === 'VP8X' && buffer.length >= 30) {
    return { mimeType: 'image/webp', width: buffer.readUIntLE(24, 3) + 1, height: buffer.readUIntLE(27, 3) + 1 };
  }
  if (chunk === 'VP8 ' && buffer.length >= 30) {
    return { mimeType: 'image/webp', width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
  }
  if (chunk === 'VP8L') {
    const bits = buffer.readUInt32LE(21);
    return { mimeType: 'image/webp', width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  return null;
};

const readSvg = (buffer) => {
  const text = buffer.subarray(0, Math.min(buffer.length, 32768)).toString('utf8').replace(/^\uFEFF/, '').trimStart();
  if (!text.startsWith('<svg') && !text.startsWith('<?xml')) return null;
  const tag = text.match(/<svg\b[^>]*>/i)?.[0] || '';
  const number = (name) => {
    const raw = tag.match(new RegExp(`\\b${name}=["']([0-9.]+)(?:px)?["']`, 'i'))?.[1];
    return raw ? Math.round(Number(raw)) : 0;
  };
  const viewBox = tag.match(/\bviewBox=["']([^"']+)["']/i)?.[1]?.trim().split(/[ ,]+/).map(Number);
  return {
    mimeType: 'image/svg+xml',
    width: number('width') || (viewBox?.length === 4 ? Math.round(viewBox[2]) : 0),
    height: number('height') || (viewBox?.length === 4 ? Math.round(viewBox[3]) : 0),
  };
};

const detectFile = (buffer, filePath, kindOverride) => {
  const image = readPng(buffer) || readJpeg(buffer) || readGif(buffer) || readWebp(buffer) || readSvg(buffer);
  let detected;
  if (image) {
    detected = { kind: 'image', ...image };
  } else if (buffer.subarray(0, 4).toString('ascii') === 'OggS') {
    detected = { kind: 'audio', mimeType: 'audio/ogg' };
  } else if (buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WAVE') {
    detected = { kind: 'audio', mimeType: 'audio/wav' };
  } else if (buffer.subarray(0, 3).toString('ascii') === 'ID3' || (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0)) {
    detected = { kind: 'audio', mimeType: 'audio/mpeg' };
  } else if (buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))) {
    detected = { kind: 'video', mimeType: 'video/webm' };
  } else if (buffer.length >= 12 && buffer.subarray(4, 8).toString('ascii') === 'ftyp') {
    const extension = extname(filePath).toLowerCase();
    const audio = ['.m4a', '.aac'].includes(extension);
    detected = audio
      ? { kind: 'audio', mimeType: 'audio/mp4' }
      : { kind: 'video', mimeType: extension === '.mov' ? 'video/quicktime' : 'video/mp4' };
  } else {
    const error = new Error(`Unsupported file type: ${basename(filePath)}`);
    error.code = 'UNSUPPORTED_FILE_TYPE';
    throw error;
  }
  assert(!kindOverride || kindOverride === detected.kind, `Declared kind ${kindOverride} does not match ${detected.kind}.`, 'MIME_KIND_MISMATCH');
  assert(detected.kind !== 'image' || (detected.width > 0 && detected.height > 0), `Image dimensions are unreadable: ${basename(filePath)}`, 'INVALID_DIMENSIONS');
  return detected;
};

const inspectFile = async (inputPath) => {
  assert(!/^https?:\/\//i.test(inputPath), `Remote URLs are unsupported: ${inputPath}`);
  const absolutePath = resolve(inputPath);
  let details;
  try {
    details = await stat(absolutePath);
  } catch {
    const error = new Error(`Cannot read local file: ${inputPath}`);
    error.code = 'FILE_NOT_FOUND';
    throw error;
  }
  assert(details.isFile(), `Input is not a file: ${inputPath}`, 'NOT_A_FILE');
  const buffer = await readFile(absolutePath).catch(() => {
    const error = new Error(`Cannot read local file: ${inputPath}`);
    error.code = 'FILE_NOT_FOUND';
    throw error;
  });
  const detected = detectFile(buffer, absolutePath);
  return {
    inputPath,
    absolutePath,
    buffer,
    sha256: sha256(buffer),
    fileType: extname(absolutePath).slice(1).toLowerCase(),
    size: buffer.byteLength,
    ...detected,
  };
};

const listBrowserDatabases = async (issues) => {
  const userHome = homedir();
  const browsers = [
    { root: join(userHome, 'Library/Application Support/Google/Chrome'), service: 'Chrome Safe Storage' },
    { root: join(userHome, 'Library/Application Support/Microsoft Edge'), service: 'Microsoft Edge Safe Storage' },
    { root: join(userHome, 'Library/Application Support/Arc/User Data'), service: 'Arc Safe Storage' },
    { root: join(userHome, 'Library/Application Support/Chromium'), service: 'Chromium Safe Storage' },
  ];
  const found = [];
  for (const browser of browsers) {
    let profiles = [];
    try {
      profiles = (await readdir(browser.root, { withFileTypes: true }))
        .filter((entry) => entry.isDirectory() && (entry.name === 'Default' || entry.name.startsWith('Profile ')))
        .map((entry) => join(browser.root, entry.name));
    } catch (error) {
      if (!['ENOENT', 'ENOTDIR'].includes(error.code)) {
        issues.push({
          code: ['EPERM', 'EACCES'].includes(error.code) ? 'AUTH_BROWSER_ACCESS_DENIED' : 'AUTH_BROWSER_READ_FAILED',
          message: `Cannot list ${browser.root} (${error.code || 'read failed'}). Browser login status is unknown; check OS access for the current terminal/application.`,
        });
      }
      continue;
    }
    for (const profile of profiles) {
      for (const candidate of [join(profile, 'Cookies'), join(profile, 'Network/Cookies')]) {
        try {
          const details = await stat(candidate);
          if (details.isFile()) found.push({ path: candidate, service: browser.service, modified: details.mtimeMs });
        } catch (error) {
          if (!['ENOENT', 'ENOTDIR'].includes(error.code)) {
            issues.push({
              code: ['EPERM', 'EACCES'].includes(error.code) ? 'AUTH_BROWSER_ACCESS_DENIED' : 'AUTH_BROWSER_READ_FAILED',
              message: `Cannot inspect ${candidate} (${error.code || 'read failed'}). Check OS access for the current terminal/application.`,
            });
          }
        }
      }
    }
  }
  return found.sort((left, right) => right.modified - left.modified);
};

const readSafeStoragePassword = (service, issues) => {
  try {
    const password = execFileSync('/usr/bin/security', ['find-generic-password', '-w', '-s', service], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 15000,
    }).trim();
    if (password) return password;
  } catch {
    // security 的原始输出不进入日志；失败不能作为“用户未登录”的证据。
  }
  issues.push({
    code: 'AUTH_KEYCHAIN_UNAVAILABLE',
    message: `Cannot read ${service} from Keychain (unavailable, locked, denied, or timed out). Check the system permission prompt; browser login status is unknown.`,
  });
  return null;
};

const decryptBrowserValue = (hexValue, password, hostKey) => {
  const encrypted = Buffer.from(hexValue || '', 'hex');
  if (!password || encrypted.length <= 3 || !['v10', 'v11'].includes(encrypted.subarray(0, 3).toString())) return '';
  try {
    const key = pbkdf2Sync(password, 'saltysalt', 1003, 16, 'sha1');
    const decipher = createDecipheriv('aes-128-cbc', key, Buffer.alloc(16, 0x20));
    const plaintext = Buffer.concat([decipher.update(encrypted.subarray(3)), decipher.final()]);
    const hostDigest = createHash('sha256').update(hostKey).digest();
    const cookieValue = plaintext.subarray(0, 32).equals(hostDigest) ? plaintext.subarray(32) : plaintext;
    return cookieValue.toString('utf8');
  } catch {
    return '';
  }
};

const cookieMatchesHost = (cookieHost, targetHost) =>
  cookieHost === targetHost ||
  (cookieHost.startsWith('.') && (targetHost === cookieHost.slice(1) || targetHost.endsWith(cookieHost)));

const extractDtAuthCookie = (value) =>
  String(value || '')
    .split(';')
    .map((part) => part.trim())
    .find((part) => {
      const separator = part.indexOf('=');
      return separator > 0 && part.slice(0, separator).trim() === 'dt_auth' &&
        [...part].every((character) => character.codePointAt(0) <= 0xff);
    }) || '';

const chromeExpiryNow = () => BigInt(Date.now()) * 1000n + 11644473600000000n;

const discoverBrowserCookie = async (targetHost) => {
  const candidates = [];
  const issues = [];
  const databases = await listBrowserDatabases(issues);
  for (const database of databases) {
    let rows;
    try {
      const query = "SELECT host_key,name,value,hex(encrypted_value) AS encrypted_value,CAST(expires_utc AS TEXT) AS expires_utc FROM cookies WHERE name='dt_auth' AND host_key LIKE '%duitang.com';";
      const raw = execFileSync('/usr/bin/sqlite3', ['-json', database.path, query], {
        encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 5000,
      });
      rows = JSON.parse(raw || '[]').filter((row) => cookieMatchesHost(row.host_key, targetHost));
    } catch {
      // sqlite 错误可能包含查询结果，只保留阶段和文件路径，不输出原始stderr。
      issues.push({
        code: 'AUTH_COOKIE_DATABASE_READ_FAILED',
        message: `Cannot read or parse ${database.path}. Check database access/lock and sqlite3 availability; browser login status is unknown.`,
      });
      continue;
    }
    const activeRows = rows.filter((row) => row.name === 'dt_auth' &&
      (!row.expires_utc || row.expires_utc === '0' || BigInt(row.expires_utc) > chromeExpiryNow()));
    if (activeRows.length === 0) continue;
    const needsDecryption = activeRows.some((row) => !row.value && row.encrypted_value);
    const password = needsDecryption ? readSafeStoragePassword(database.service, issues) : null;
    const cookies = activeRows
      .map((row) => {
        const value = row.value || decryptBrowserValue(row.encrypted_value, password, row.host_key);
        if (!value && password && row.encrypted_value) {
          issues.push({
            code: 'AUTH_COOKIE_DECRYPT_FAILED',
            message: `Cannot decrypt dt_auth in ${database.path}. Check browser encryption compatibility; this does not establish that the user is signed out.`,
          });
        }
        return { name: row.name, value };
      })
      .filter((row) => row.value && [...`${row.name}=${row.value}`].every((character) => character.codePointAt(0) <= 0xff));
    if (cookies.length > 0) {
      candidates.push({ cookies, score: cookies.length, modified: database.modified });
    }
  }
  candidates.sort((left, right) => right.score - left.score || right.modified - left.modified);
  if (candidates.length > 0) return candidates[0].cookies.map(({ name, value }) => `${name}=${value}`).join('; ');
  // 其他浏览器可用时继续上传；全部候选失败时保留真正的失败阶段，而非误报未登录。
  if (issues.length > 0) {
    assert(false, issues.map((issue, index) => index === 0 ? issue.message : `${issue.code}: ${issue.message}`).join(' | '), issues[0].code);
  }
  assert(databases.length > 0,
    'No supported browser profile with a Cookies database was found. Check the browser/profile location or provide local authentication configuration.',
    'AUTH_BROWSER_PROFILE_NOT_FOUND');
  return null;
};

const loadAuth = async (args) => {
  let config = {};
  const configPath = args.config || process.env.DUITANG_UPLOAD_CONFIG;
  if (configPath) config = await readJson(resolve(configPath), 'upload config');
  const host = normalizeHost(config.host || process.env.DUITANG_UPLOAD_HOST || DEFAULT_HOST);
  const targetHost = hostNameOf(host);
  const cookie = extractDtAuthCookie(
    config.cookie ||
    process.env.DUITANG_UPLOAD_COOKIE ||
    (await discoverBrowserCookie(targetHost)),
  );
  assert(cookie, `No usable dt_auth Cookie found for ${targetHost}. Verify the browser/profile, target domain and cookie expiry, or provide local authentication configuration.`, 'AUTH_COOKIE_NOT_FOUND');
  return {
    host,
    cookie,
    bucket: config.bucket || process.env.DUITANG_UPLOAD_BUCKET || DEFAULT_BUCKET,
    ossName: config.ossName || process.env.DUITANG_UPLOAD_OSS_NAME || DEFAULT_OSS_NAME,
  };
};

class HttpError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.code = status ? `UPLOAD_HTTP_${status}` : 'UPLOAD_NETWORK_ERROR';
    this.status = status;
    this.retryable = status === 0 || status >= 500;
  }
}

const request = async (url, options) => {
  let response;
  try {
    response = await fetch(url, { ...options, signal: AbortSignal.timeout(30000) });
  } catch (error) {
    throw new HttpError(`Upload request failed: ${safeMessage(error)}`);
  }
  const text = await response.text();
  if (!response.ok) throw new HttpError(`Upload request returned HTTP ${response.status}.`, response.status);
  if (options.expectJson === false) return null;
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    const error = new Error('Upload API returned invalid JSON.');
    error.code = 'INVALID_API_RESPONSE';
    throw error;
  }
};

const retry = async (operation) => {
  let lastError;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!error.retryable || attempt === MAX_ATTEMPTS) throw error;
    }
  }
  throw lastError;
};

const postJson = (url, body, cookie) =>
  retry(() => request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie },
    body: JSON.stringify(body),
  }));

const putFile = (url, buffer, mimeType) =>
  retry(() => request(url.replace('http://', 'https://'), {
    method: 'PUT',
    headers: { 'content-type': mimeType },
    body: buffer,
    expectJson: false,
  }));

const firstData = (response, label) => {
  const data = Array.isArray(response?.data) ? response.data[0] : response?.data;
  assert(data && typeof data === 'object', `${label} returned no upload data.`, 'INVALID_API_RESPONSE');
  return data;
};

const stableUrl = (endpoint, key) => `${String(endpoint || '').replace(/\/$/, '')}/${String(key || '').replace(/^\//, '')}`;

const confirmUpload = async (auth, payload) => {
  const response = await postJson(`${auth.host}/operator/upload/file/photo/confirm/`, payload, auth.cookie);
  assert(response?.data, 'Upload confirm returned false.', 'CONFIRM_REJECTED');
};

const uploadOrdinary = async (file, auth) => {
  const uploadType = file.kind === 'video' ? 'OPS_VIDEO' : 'OPS';
  const payload = {
    type: uploadType,
    bucket: auth.bucket,
    file_type: file.fileType,
    size: file.size,
    mime_type: file.mimeType,
    width: file.width || 1,
    height: file.height || 1,
    oss_name: auth.ossName,
  };
  const token = firstData(
    await postJson(`${auth.host}/operator/upload/file/generate_token_by_custom_filename/`, payload, auth.cookie),
    'Upload token API',
  );
  assert(token.upload_url && token.endpoint && token.key, 'Upload token response is incomplete.', 'INVALID_API_RESPONSE');
  await putFile(token.upload_url, file.buffer, file.mimeType);
  const confirmPayload = {
    type: uploadType,
    file_type: file.fileType,
    size: file.size,
    mime_type: file.mimeType,
    width: file.width || 1,
    height: file.height || 1,
    photo_id: token.photo_id,
    key: token.key,
    hash: md5(file.buffer),
    bucket: token.bucket,
  };
  try {
    await confirmUpload(auth, confirmPayload);
  } catch (error) {
    if (error.retryable) {
      return {
        status: 'pending_confirm',
        url: stableUrl(token.endpoint, token.key),
        confirmation: { payload: confirmPayload },
        error,
      };
    }
    throw error;
  }
  return { status: 'success', url: stableUrl(token.endpoint, token.key) };
};

const uploadAudio = async (file, auth) => {
  const token = firstData(
    await postJson(`${auth.host}/operator/upload/file/generate_token/audio/`, {
      type: 'ops_audio',
      file_type: file.fileType,
    }, auth.cookie),
    'Audio token API',
  );
  assert(token.upload_url && token.endpoint && token.key, 'Audio token response is incomplete.', 'INVALID_API_RESPONSE');
  await putFile(token.upload_url, file.buffer, file.mimeType);
  return { status: 'success', url: stableUrl(token.endpoint, token.key) };
};

const cacheKey = (file, auth) => {
  const type = file.kind === 'video' ? 'OPS_VIDEO' : file.kind === 'audio' ? 'ops_audio' : 'OPS';
  return sha256(Buffer.from(JSON.stringify({ sha256: file.sha256, host: auth.host, bucket: auth.bucket, ossName: auth.ossName, type })));
};

const loadCache = async (cacheDir) => {
  try {
    const cache = await readJson(join(cacheDir, 'index.json'), 'upload cache');
    return cache?.schemaVersion === 1 && cache.entries && typeof cache.entries === 'object'
      ? cache
      : { schemaVersion: 1, entries: {} };
  } catch {
    return { schemaVersion: 1, entries: {} };
  }
};

const errorItem = (inputPath, error) => ({
  path: inputPath,
  status: 'failed',
  error: {
    code: error?.code || 'UPLOAD_FAILED',
    message: safeMessage(error),
  },
});

const mapConcurrent = async (items, concurrency, handler) => {
  const results = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await handler(items[index], index);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
};

const main = async () => {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  assert(args.files.length > 0, 'At least one local file is required.');
  const cacheDir = resolve(args['cache-dir'] || join(homedir(), '.duitang-upload-cli/cache'));
  const concurrency = Number(args.concurrency || DEFAULT_CONCURRENCY);
  assert(Number.isInteger(concurrency) && concurrency > 0 && concurrency <= 32, '--concurrency must be an integer from 1 to 32.');

  try {
    const auth = await loadAuth(args);
    const cache = await loadCache(cacheDir);
    const inFlight = new Map();
    let cacheWrite = Promise.resolve();
    const saveCache = () => {
      cacheWrite = cacheWrite.then(() => writeJson(join(cacheDir, 'index.json'), cache));
      return cacheWrite;
    };

    const entries = await mapConcurrent(args.files, concurrency, async (inputPath) => {
      let file;
      try {
        file = await inspectFile(inputPath);
        const key = cacheKey(file, auth);
        const cached = cache.entries[key];
        if (cached?.status === 'success' && cached.url) {
          return { path: inputPath, status: 'cached', url: cached.url };
        }
        const shared = inFlight.has(key);
        if (!shared) {
          const operation = (async () => {
            if (cached?.status === 'pending_confirm' && cached.confirmation?.payload) {
              try {
                await confirmUpload(auth, cached.confirmation.payload);
                cache.entries[key] = { status: 'success', url: cached.url, metadata: cached.metadata };
                await saveCache();
                return { status: 'success', url: cached.url, resumedConfirm: true };
              } catch (error) {
                if (!error.retryable) throw error;
                return { status: 'pending_confirm', url: cached.url, error };
              }
            }

            const uploaded = file.kind === 'audio' ? await uploadAudio(file, auth) : await uploadOrdinary(file, auth);
            const metadata = { sha256: file.sha256, mimeType: file.mimeType, kind: file.kind, width: file.width, height: file.height };
            if (uploaded.status === 'pending_confirm') {
              cache.entries[key] = {
                status: 'pending_confirm',
                url: uploaded.url,
                confirmation: uploaded.confirmation,
                metadata,
              };
            } else {
              cache.entries[key] = { status: 'success', url: uploaded.url, metadata };
            }
            await saveCache();
            return uploaded;
          })();
          inFlight.set(key, operation);
        }

        const uploaded = await inFlight.get(key);
        if (uploaded.status === 'pending_confirm') {
          return {
            path: inputPath,
            status: 'pending_confirm',
            url: uploaded.url,
            error: { code: uploaded.error?.code || 'CONFIRM_FAILED', message: safeMessage(uploaded.error) },
          };
        }
        return { path: inputPath, status: shared ? 'cached' : 'success', url: uploaded.url };
      } catch (error) {
        return errorItem(inputPath, error);
      }
    });

    const urls = entries.filter((item) => ['success', 'cached'].includes(item.status)).map((item) => item.url);
    if (urls.length > 0) process.stdout.write(`${urls.join('\n')}\n`);
    const failures = entries.filter((item) => ['failed', 'pending_confirm'].includes(item.status));
    for (const item of failures) {
      process.stderr.write(`${item.path}: ${item.error.code}: ${item.error.message}\n`);
    }
    if (failures.length > 0) process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`${error.code || 'CLI_FAILED'}: ${safeMessage(error)}\n`);
    process.exitCode = 1;
  }
};

await main();
