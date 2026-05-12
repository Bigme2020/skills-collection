#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import process from 'node:process';

const CONFIG_FILE = '.duitang-upload.local.json';
const DEFAULT_TYPE = 'OPS';
const DEFAULT_OSS_NAME = 'jd';

const MIME_BY_EXT = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
};

const parseArgs = (argv) => {
  const args = { type: DEFAULT_TYPE, ossName: DEFAULT_OSS_NAME };
  const positional = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) {
      positional.push(arg);
      continue;
    }

    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
      continue;
    }

    args[key] = next;
    i++;
  }

  return { args, filePath: positional[0] };
};

const normalizeHost = (host) => {
  if (!host) {
    throw new Error(`Missing host. Add it to ${CONFIG_FILE} or pass --host <host>.`);
  }
  return host.startsWith('http://') || host.startsWith('https://') ? host.replace(/\/$/, '') : `https://${host}`;
};

const loadConfig = async (configPath) => {
  try {
    return JSON.parse(await readFile(configPath, 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') {
      throw new Error(`Missing ${CONFIG_FILE}. Create it in the repository root with host and cookie.`);
    }
    throw error;
  }
};

const getExt = (filePath) => {
  const match = basename(filePath).match(/\.([^.]+)$/);
  return match ? match[1].toLowerCase() : 'bin';
};

const getMimeType = (filePath) => MIME_BY_EXT[getExt(filePath)] || 'application/octet-stream';

const readUInt24LE = (buffer, offset) => buffer[offset] + (buffer[offset + 1] << 8) + (buffer[offset + 2] << 16);

const readPngSize = (buffer) => {
  if (buffer.length < 24 || buffer.toString('ascii', 1, 4) !== 'PNG') return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
};

const readGifSize = (buffer) => {
  if (buffer.length < 10 || buffer.toString('ascii', 0, 3) !== 'GIF') return null;
  return { width: buffer.readUInt16LE(6), height: buffer.readUInt16LE(8) };
};

const readJpegSize = (buffer) => {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;

  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) return null;
    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    const isSofMarker =
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf);

    if (isSofMarker) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }
    offset += 2 + length;
  }

  return null;
};

const readWebpSize = (buffer) => {
  if (buffer.length < 30 || buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WEBP') {
    return null;
  }

  const chunk = buffer.toString('ascii', 12, 16);
  if (chunk === 'VP8X') {
    return { width: readUInt24LE(buffer, 24) + 1, height: readUInt24LE(buffer, 27) + 1 };
  }
  if (chunk === 'VP8 ' && buffer.length >= 30) {
    return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
  }
  if (chunk === 'VP8L' && buffer.length >= 25) {
    const bits = buffer.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }

  return null;
};

const getImageSize = (buffer) => {
  return readPngSize(buffer) || readJpegSize(buffer) || readGifSize(buffer) || readWebpSize(buffer) || { width: 1, height: 1 };
};

const requestJson = async (url, options) => {
  const response = await fetch(url, options);
  const text = await response.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }

  if (!response.ok) {
    throw new Error(`Request failed ${response.status} ${response.statusText}: ${text.slice(0, 300)}`);
  }

  return json;
};

const main = async () => {
  const { args, filePath } = parseArgs(process.argv.slice(2));
  if (!filePath) {
    throw new Error('Usage: node .codex/skills/duitang-image-upload/scripts/upload-backend-image.mjs <image-path>');
  }

  const config = await loadConfig(resolve(process.cwd(), args.config || CONFIG_FILE));
  const cookie = args.cookie || config.cookie;
  if (!cookie) {
    throw new Error(`Missing cookie. Add it to ${CONFIG_FILE}.`);
  }

  const host = normalizeHost(args.host || config.host);
  const absolutePath = resolve(process.cwd(), filePath);
  const buffer = await readFile(absolutePath);
  const mimeType = args.mimeType || getMimeType(absolutePath);
  const fileType = args.fileExt || getExt(absolutePath);
  const { width, height } = getImageSize(buffer);
  const hash = createHash('md5').update(buffer).digest('hex');

  const tokenPayload = {
    type: args.type || DEFAULT_TYPE,
    bucket: args.bucket || config.bucket,
    file_type: fileType,
    size: buffer.byteLength,
    mime_type: mimeType,
    width,
    height,
    oss_name: args.ossName || DEFAULT_OSS_NAME,
  };

  const tokenResponse = await requestJson(`${host}/operator/upload/file/generate_token_by_custom_filename/`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      cookie,
    },
    body: JSON.stringify(tokenPayload),
  });

  const uploadData = Array.isArray(tokenResponse.data) ? tokenResponse.data[0] : tokenResponse.data;
  if (!uploadData?.upload_url) {
    throw new Error(`Invalid token response: ${JSON.stringify(tokenResponse).slice(0, 500)}`);
  }

  const putResponse = await fetch(uploadData.upload_url.replace('http://', 'https://'), {
    method: 'PUT',
    headers: { 'content-type': mimeType },
    body: buffer,
  });
  if (!putResponse.ok) {
    throw new Error(`OSS upload failed ${putResponse.status} ${putResponse.statusText}`);
  }

  const confirmPayload = {
    type: args.type || DEFAULT_TYPE,
    file_type: fileType,
    size: buffer.byteLength,
    mime_type: mimeType,
    width,
    height,
    photo_id: uploadData.photo_id,
    key: uploadData.key,
    hash,
    bucket: uploadData.bucket,
  };

  const confirmResponse = await requestJson(`${host}/operator/upload/file/photo/confirm/`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      cookie,
    },
    body: JSON.stringify(confirmPayload),
  });

  if (!confirmResponse.data) {
    throw new Error(`Confirm returned falsy data: ${JSON.stringify(confirmResponse).slice(0, 500)}`);
  }

  const endpoint = uploadData.endpoint?.replace(/\/$/, '');
  const result = {
    url: endpoint ? `${endpoint}/${uploadData.key}` : uploadData.key,
    endpoint,
    key: uploadData.key,
    photo_id: uploadData.photo_id,
    photo_width: width,
    photo_height: height,
    mime_type: mimeType,
  };

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
};

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
