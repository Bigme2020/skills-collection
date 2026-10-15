#!/usr/bin/env node
import { createHash } from "node:crypto";
import {
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import {
  basename,
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
  sep,
} from "node:path";
import { isDeepStrictEqual } from "node:util";
import { fileURLToPath } from "node:url";
import { summarize } from "./evidence-summary.mjs";

const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const text = (value) => typeof value === "string" && value.trim().length > 0;
const object = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const inside = (root, path) => {
  const rel = relative(root, path);
  return (
    rel === "" ||
    (!isAbsolute(rel) && rel !== ".." && !rel.startsWith(`..${sep}`))
  );
};
const portable = (path) => path.split(sep).join("/");
const exists = (path) => {
  try {
    return lstatSync(path);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
};
// 未创建的输出目录也要先通过真实祖先解析，避免符号链接把输出带回证据根。
function canonicalDestination(path) {
  if (exists(path)) return realpathSync(path);
  return join(canonicalDestination(dirname(path)), basename(path));
}

// 只核对已封存的共享检查点；不访问运行环境，不产生新的视觉或服务结论。
export function sealEvidence(
  manifestPath,
  checkpointPath,
  toolIdentityPath,
  outputPath,
) {
  const receipt = { schemaVersion: 1, ok: false, issues: [] };
  const issue = (code, message) => receipt.issues.push({ code, message });
  let output;
  try {
    if (
      ![manifestPath, checkpointPath, toolIdentityPath, outputPath].every(text)
    )
      throw new Error(
        "需要 manifest、checkpoint、toolIdentity、output 四个路径",
      );
    const rootPath = resolve(dirname(checkpointPath));
    const root = realpathSync(rootPath);
    const requestedOutput = resolve(outputPath);
    try {
      if (
        inside(rootPath, requestedOutput) ||
        exists(requestedOutput)?.isSymbolicLink() ||
        inside(root, canonicalDestination(requestedOutput))
      )
        throw new Error("输出必须在证据根目录外，且不能是符号链接");
      // 固定为真实父目录，后续写入不沿原路径的目录链接。
      output = canonicalDestination(requestedOutput);
    } catch (error) {
      issue("unsafe_output", error.message);
      return receipt;
    }
    const evidencePath = (path) => {
      if (!text(path)) throw new Error("证据路径不能为空");
      const absolute = isAbsolute(path) ? resolve(path) : resolve(root, path);
      // 接受 /tmp 等根目录别名，但根内的文件/目录链接一律不读取。
      const candidate = inside(rootPath, absolute)
        ? resolve(root, relative(rootPath, absolute))
        : absolute;
      if (!inside(root, candidate)) throw new Error(`证据路径越界: ${path}`);
      let current = root;
      for (const part of relative(root, candidate).split(sep).filter(Boolean)) {
        current = join(current, part);
        if (lstatSync(current).isSymbolicLink())
          throw new Error(`证据路径包含符号链接: ${path}`);
      }
      if (!lstatSync(candidate).isFile())
        throw new Error(`不是普通文件: ${path}`);
      return candidate;
    };
    const read = (path) => readFileSync(evidencePath(path));
    const load = (path, field) => {
      try {
        const absolute = evidencePath(resolve(path));
        const bytes = readFileSync(absolute);
        receipt[field] = {
          path: portable(relative(root, absolute)),
          sha256: hash(bytes),
        };
        const value = JSON.parse(bytes);
        if (!object(value)) throw new Error("JSON 必须是对象");
        return value;
      } catch (error) {
        issue("invalid_input", `${field}: ${error.message}`);
        return {};
      }
    };
    const manifest = load(manifestPath, "manifest");
    const checkpoint = load(checkpointPath, "checkpoint");
    const identity = load(toolIdentityPath, "toolIdentity");
    for (const key of [
      "source",
      "sourceAfter",
      "sourceUnchanged",
      "servedRevision",
    ])
      receipt[key] = manifest[key];
    receipt.businessRevision = checkpoint.businessRevision;
    receipt.captureToolRevision = checkpoint.toolRevision;
    if (
      !object(manifest.source) ||
      !text(manifest.source.head) ||
      !isDeepStrictEqual(manifest.source, manifest.sourceAfter) ||
      manifest.sourceUnchanged !== true ||
      !text(checkpoint.businessRevision) ||
      checkpoint.businessRevision !== manifest.source.head
    )
      issue(
        "source_mismatch",
        "前后源码身份、sourceUnchanged 或 businessRevision 不一致",
      );
    if (
      !text(checkpoint.toolRevision) ||
      checkpoint.toolRevision !== identity.current
    )
      issue(
        "tool_revision_mismatch",
        "toolRevision 与封存的 toolIdentity.current 不一致",
      );
    if (!text(manifest.servedRevision))
      issue("invalid_input", "缺少 servedRevision");
    try {
      const bytes = read(checkpoint.servedProof);
      const proof = JSON.parse(bytes);
      receipt.servedProof = {
        path: portable(relative(root, evidencePath(checkpoint.servedProof))),
        sha256: hash(bytes),
        businessRevision: proof.businessRevision,
        localHash: proof.localHash,
        servedHash: proof.servedHash,
        matches: proof.matches,
      };
      if (
        !text(proof.businessRevision) ||
        proof.businessRevision !== checkpoint.businessRevision ||
        !/^[a-f0-9]{64}$/i.test(proof.localHash) ||
        proof.localHash !== proof.servedHash ||
        proof.matches !== true
      )
        issue(
          "served_proof_mismatch",
          "服务证明的版本、hash 或 matches 不一致",
        );
    } catch (error) {
      issue("served_proof_mismatch", error.message);
    }

    const records = Array.isArray(manifest.records) ? manifest.records : [];
    const images = Array.isArray(checkpoint.images) ? checkpoint.images : [];
    const boundaries = Array.isArray(manifest.boundaryRecords)
      ? manifest.boundaryRecords
      : [];
    if (
      !records.length ||
      !Array.isArray(checkpoint.images) ||
      !Array.isArray(manifest.boundaryRecords)
    )
      issue(
        "invalid_input",
        "需要非空 records、images 和 boundaryRecords 数组",
      );
    const index = (items, label) => {
      const map = new Map();
      for (const item of items) {
        if (!object(item) || !text(item.id)) {
          issue("invalid_target", `${label} 缺少目标 id`);
          continue;
        }
        if (map.has(item.id))
          issue("duplicate_target", `${label} 重复目标: ${item.id}`);
        map.set(item.id, item);
      }
      return map;
    };
    const recordMap = index(records, "records");
    const imageMap = index(images, "images");
    const boundaryMap = index(boundaries, "boundaryRecords");
    for (const id of new Set([...recordMap.keys(), ...imageMap.keys()]))
      if (!recordMap.has(id) || !imageMap.has(id))
        issue("target_coverage", `截图与记录的目标覆盖不同: ${id}`);
    for (const id of boundaryMap.keys())
      if (!recordMap.has(id))
        issue("target_coverage", `边界记录不在目标中: ${id}`);
    const validRecords = records.filter(object);
    let resourceFailures = 0;
    for (const record of validRecords) {
      if (record.ok !== true) issue("record_failed", `目标失败: ${record.id}`);
      if (
        !Array.isArray(record.checks) ||
        record.checks.some((check) => check?.ok !== true)
      )
        issue("assertion_failed", `目标断言未通过: ${record.id}`);
      if (!Array.isArray(record.resources?.failed))
        issue("resource_failed", `缺少资源检查: ${record.id}`);
      else {
        resourceFailures += record.resources.failed.length;
        if (record.resources.failed.length)
          issue("resource_failed", `资源失败: ${record.id}`);
      }
      if (record.resources?.fonts !== "loaded")
        issue("font_not_loaded", `字体未就绪: ${record.id}`);
      if (!text(record.screenshot))
        issue("missing_image", `目标缺少截图: ${record.id}`);
    }
    if (manifest.ok !== true) issue("manifest_failed", "manifest.ok 不是 true");
    const summary = summarize({
      ...manifest,
      records: validRecords,
    });
    if (
      !Number.isInteger(checkpoint.geometry?.relationships) ||
      checkpoint.geometry.relationships < 0
    )
      issue("invalid_input", "geometry.relationships 必须是非负整数");
    receipt.counts = {
      targets: records.length,
      screenshots: summary.screenshots,
      boundaryGroups: boundaries.length,
      relationships: checkpoint.geometry?.relationships,
      resourceFailures,
    };
    receipt.boundaryRecords = boundaries;
    receipt.visual = {
      verdict: checkpoint.visualVerdict,
      budget: checkpoint.budget,
      carriedForward: true,
    };
    if (!text(checkpoint.visualVerdict) || !object(checkpoint.budget))
      issue("invalid_input", "缺少已封存视觉结论或预算");
    receipt.images = images.filter(object).map((image) => {
      const selected = {};
      for (const key of [
        "id",
        "file",
        "sha256",
        "width",
        "height",
        "scanned",
        "verdict",
      ])
        selected[key] = image[key];
      if (image.scanned !== true)
        issue("unreviewed_image", `图片未看图: ${image.id}`);
      if (!text(image.verdict))
        issue("invalid_input", `缺少图片结论: ${image.id}`);
      const record = recordMap.get(image.id);
      if (
        record &&
        (!text(record.screenshot) ||
          !text(image.file) ||
          basename(record.screenshot) !== basename(image.file))
      )
        issue("image_path_mismatch", `截图文件名不一致: ${image.id}`);
      try {
        const bytes = read(image.file);
        if (
          bytes.length < 33 ||
          bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a" ||
          bytes.readUInt32BE(8) !== 13 ||
          bytes.toString("ascii", 12, 16) !== "IHDR" ||
          bytes.readUInt32BE(16) === 0 ||
          bytes.readUInt32BE(20) === 0
        )
          issue("invalid_png", `PNG 头无效: ${image.id}`);
        else if (
          bytes.readUInt32BE(16) !== image.width ||
          bytes.readUInt32BE(20) !== image.height
        )
          issue("image_dimensions_mismatch", `PNG 尺寸不一致: ${image.id}`);
        const sha256 = hash(bytes);
        if (sha256 !== image.sha256)
          issue("image_hash_mismatch", `PNG hash 不一致: ${image.id}`);
        if (
          record?.image &&
          !isDeepStrictEqual(record.image, {
            sha256: image.sha256,
            width: image.width,
            height: image.height,
          })
        )
          issue(
            "image_metadata_mismatch",
            `record.image 与检查点不一致: ${image.id}`,
          );
      } catch (error) {
        issue(
          error.code === "ENOENT" ? "missing_image" : "unsafe_image",
          `${image.id}: ${error.message}`,
        );
      }
      return selected;
    });
    receipt.files = [];
    const walk = (directory) => {
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name);
        if (entry.isSymbolicLink()) {
          issue(
            "unsafe_path",
            `不读取符号链接: ${portable(relative(root, path))}`,
          );
          continue;
        }
        if (entry.isDirectory()) walk(path);
        else if (entry.isFile()) {
          const bytes = read(path);
          receipt.files.push({
            path: portable(relative(root, path)),
            bytes: bytes.length,
            sha256: hash(bytes),
          });
        } else
          issue(
            "unsafe_path",
            `证据根含非普通文件: ${portable(relative(root, path))}`,
          );
      }
    };
    walk(root);
    receipt.files.sort((a, b) =>
      a.path < b.path ? -1 : a.path > b.path ? 1 : 0,
    );
  } catch (error) {
    issue("invalid_input", error.message);
  }
  receipt.ok = receipt.issues.length === 0;
  if (output) {
    let temporary;
    try {
      mkdirSync(dirname(output), { recursive: true });
      temporary = mkdtempSync(join(dirname(output), ".seal-evidence-"));
      const file = join(temporary, "receipt.json");
      writeFileSync(file, `${JSON.stringify(receipt, null, 2)}\n`, {
        flag: "wx",
      });
      renameSync(file, output);
    } catch (error) {
      issue("output_failed", error.message);
      receipt.ok = false;
    } finally {
      if (temporary) rmSync(temporary, { recursive: true, force: true });
    }
  }
  return receipt;
}

// Node 会解析模块路径的符号链接；入口也按真实路径比较，导入时忽略缺失或无效 argv[1]。
function isCLIEntry() {
  if (!process.argv[1]) return false;
  try {
    return (
      realpathSync(process.argv[1]) ===
      realpathSync(fileURLToPath(import.meta.url))
    );
  } catch {
    return false;
  }
}

if (isCLIEntry()) {
  const args = process.argv.slice(2);
  if (args.length !== 4) {
    console.log(
      JSON.stringify({
        ok: false,
        issues: [
          {
            code: "usage",
            message:
              "用法: node seal-evidence.mjs <manifest.json> <checkpoint.json> <toolIdentity.json> <output.json>",
          },
        ],
      }),
    );
    process.exitCode = 1;
  } else {
    const receipt = sealEvidence(...args);
    console.log(
      JSON.stringify({
        ok: receipt.ok,
        issues: receipt.issues,
        output: resolve(args[3]),
      }),
    );
    process.exitCode = receipt.ok ? 0 : 1;
  }
}
