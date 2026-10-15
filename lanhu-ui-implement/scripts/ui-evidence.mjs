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
} from "node:fs";
import { resolve, join } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { captureUI } from "./capture-ui.mjs";
import { summarize } from "./evidence-summary.mjs";

const hash = (value) => createHash("sha256").update(value).digest("hex");
const git = (args) => {
  const result = spawnSync("git", args, {
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
  if (result.status !== 0)
    throw new Error(
      result.stderr || result.error?.message || "无法读取 Git 身份",
    );
  return result.stdout;
};
export function sourceIdentity() {
  const head = git(["rev-parse", "HEAD"]).trim();
  const status = git(["status", "--porcelain=v1", "--untracked-files=all"]);
  const diffHash = hash(git(["diff", "HEAD", "--binary"]));
  const root = git(["rev-parse", "--show-toplevel"]).trim();
  const untracked = git(["ls-files", "--others", "--exclude-standard", "-z"])
    .split("\0")
    .filter(Boolean)
    .map((path) => {
      const file = join(root, path);
      return [
        path,
        hash(
          lstatSync(file).isSymbolicLink()
            ? readlinkSync(file)
            : readFileSync(file),
        ),
      ];
    });
  return {
    head,
    status,
    diffHash,
    untrackedHash: hash(JSON.stringify(untracked)),
  };
}
export function main(argv) {
  if (argv.length !== 3 || argv.includes("--help")) {
    console.log(
      "用法：node ui-evidence.mjs <plan.json> <已有浏览器session> <输出目录>\n从被测仓库运行；输出目录放仓库外或已忽略路径。不会创建浏览器、安装依赖或判定视觉通过。",
    );
    return argv.includes("--help") ? 0 : 2;
  }
  const [config, session, directory] = argv;
  const plan = JSON.parse(readFileSync(resolve(config), "utf8"));
  const out = resolve(directory);
  mkdirSync(out, { recursive: true });
  for (const target of plan.targets || []) {
    if (!/^[\w-]+$/.test(target.id))
      throw new Error("target.id 仅允许字母、数字、_、-");
    if (target.steps) {
      for (const step of target.steps) {
        if (!/^[\w-]+$/.test(step.id))
          throw new Error("step.id 仅允许字母、数字、_、-");
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
  const source = sourceIdentity();
  const temporary = mkdtempSync(join(tmpdir(), "ui-evidence-"));
  let result;
  try {
    const script = join(temporary, "capture.js");
    writeFileSync(
      script,
      `async page => (${captureUI.toString()})(page, ${JSON.stringify(plan)})`,
    );
    const child = spawnSync(
      "playwright-cli",
      [`-s=${session}`, "--raw", "run-code", `--filename=${script}`],
      { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 },
    );
    writeFileSync(join(out, "capture.stdout.log"), child.stdout || "");
    writeFileSync(join(out, "capture.stderr.log"), child.stderr || "");
    if (child.error || child.status !== 0)
      throw new Error(
        child.error?.message || `playwright-cli exit=${child.status}`,
      );
    result = JSON.parse(child.stdout);
    if (typeof result.ok !== "boolean" || !Array.isArray(result.records))
      throw new Error("捕获结果格式错误；查看原始 stdout");
  } catch (error) {
    result = {
      ok: false,
      records: [],
      error: error.message,
      visualVerdict: "pending",
    };
  } finally {
    rmSync(temporary, { recursive: true });
  }
  const after = sourceIdentity();
  const sourceUnchanged = JSON.stringify(source) === JSON.stringify(after);
  result.ok &&= sourceUnchanged;
  const manifest = {
    schemaVersion: 1,
    source,
    sourceAfter: after,
    sourceUnchanged,
    // checkout 身份不是服务来源证明：调用方仍需核实预览进程及构建输入。
    servedRevision: "unverified",
    plan,
    ...result,
  };
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
  const manifestPath = join(out, "manifest.json");
  writeFileSync(
    `${manifestPath}.tmp`,
    JSON.stringify(manifest, null, 2) + "\n",
  );
  // 完整写入后原子替换，避免半份清单冒充已封存结果。
  renameSync(`${manifestPath}.tmp`, manifestPath);
  console.log(
    JSON.stringify({
      ...summarize(manifest),
      sourceUnchanged,
      manifest: manifestPath,
      visualVerdict: "pending",
    }),
  );
  return manifest.ok ? 0 : 1;
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
