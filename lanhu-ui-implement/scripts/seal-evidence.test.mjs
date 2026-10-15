import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  lstatSync,
  readlinkSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";
import { sealEvidence } from "./seal-evidence.mjs";

const script = fileURLToPath(new URL("./seal-evidence.mjs", import.meta.url));
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
  "base64",
);
function fixture(t) {
  const cwd = mkdtempSync(join(tmpdir(), "seal-evidence-test-"));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  const root = join(cwd, "evidence");
  mkdirSync(join(root, "capture"), { recursive: true });
  const source = {
    head: "business-version",
    status: "",
    diffHash: hash(""),
    untrackedHash: hash("[]"),
  };
  const manifest = {
    ok: true,
    source,
    sourceAfter: { ...source },
    sourceUnchanged: true,
    servedRevision: "unverified",
    records: [
      {
        id: "sample",
        ok: true,
        checks: [{ ok: true }],
        resources: { fonts: "loaded", failed: [] },
        screenshot: "/sealed/location/sample.png",
      },
    ],
    boundaryRecords: [
      { id: "sample", horizontal: { left: 9, max: 9 }, note: "只保留既有观察" },
    ],
  };
  const checkpoint = {
    businessRevision: source.head,
    toolRevision: "capture-version",
    servedProof: "served-proof.json",
    budget: { used: 1, limit: 2 },
    visualVerdict: "existing-difference",
    images: [
      {
        id: "sample",
        file: "capture/sample.png",
        sha256: hash(png),
        width: 1,
        height: 1,
        scanned: true,
        verdict: "existing-difference",
        observation: "不抄入图片元数据",
      },
    ],
    geometry: { relationships: 7 },
  };
  const identity = { current: "capture-version" };
  const proof = {
    businessRevision: source.head,
    localHash: hash("source"),
    servedHash: hash("source"),
    matches: true,
  };
  const paths = [
    join(root, "capture/manifest.json"),
    join(root, "checkpoint.json"),
    join(root, "identity.json"),
    join(cwd, "out/receipt.json"),
  ];
  const save = () => {
    for (const [path, value] of [
      [paths[0], manifest],
      [paths[1], checkpoint],
      [paths[2], identity],
      [join(root, "served-proof.json"), proof],
    ])
      writeFileSync(path, JSON.stringify(value));
  };
  save();
  writeFileSync(join(root, "capture/sample.png"), png);
  writeFileSync(join(root, "index.json"), "existing index");
  mkdirSync(join(root, "baseline"));
  writeFileSync(
    join(root, "baseline/failed.stderr"),
    "original failed material\n",
  );
  return {
    cwd,
    root,
    paths,
    manifest,
    checkpoint,
    identity,
    proof,
    save,
    run: () => sealEvidence(...paths),
  };
}
function snapshot(root) {
  const result = {};
  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.isFile())
        result[path.slice(root.length + 1)] = hash(readFileSync(path));
    }
  }
  walk(root);
  return result;
}
function blocked(f, code) {
  const before = snapshot(f.root);
  const receipt = f.run();
  assert.equal(receipt.ok, false);
  assert.ok(
    receipt.issues.some((issue) => issue.code === code),
    JSON.stringify(receipt.issues),
  );
  assert.deepEqual(snapshot(f.root), before, "输入包括失败材料保持不变");
  assert.deepEqual(
    JSON.parse(readFileSync(f.paths[3])),
    JSON.parse(JSON.stringify(receipt)),
  );
  assert.notEqual(receipt.visual?.verdict, "passed");
  return receipt;
}

test("sealEvidence 封存完整文件清单，继承版本、边界、预算与视觉而不升级", (t) => {
  const f = fixture(t);
  const before = snapshot(f.root);
  const receipt = f.run();
  assert.equal(receipt.ok, true, JSON.stringify(receipt.issues));
  assert.equal(receipt.schemaVersion, 1);
  assert.deepEqual(receipt.issues, []);
  assert.deepEqual(receipt.counts, {
    targets: 1,
    screenshots: 1,
    boundaryGroups: 1,
    relationships: 7,
    resourceFailures: 0,
  });
  assert.deepEqual(receipt.source, f.manifest.source);
  assert.deepEqual(receipt.sourceAfter, f.manifest.sourceAfter);
  assert.equal(receipt.sourceUnchanged, true);
  assert.equal(receipt.businessRevision, f.checkpoint.businessRevision);
  assert.equal(receipt.captureToolRevision, f.identity.current);
  assert.equal(receipt.servedRevision, "unverified");
  assert.deepEqual(receipt.visual, {
    verdict: "existing-difference",
    budget: f.checkpoint.budget,
    carriedForward: true,
  });
  assert.deepEqual(receipt.boundaryRecords, f.manifest.boundaryRecords);
  for (const [field, path] of [
    ["manifest", "capture/manifest.json"],
    ["checkpoint", "checkpoint.json"],
    ["toolIdentity", "identity.json"],
  ])
    assert.deepEqual(receipt[field], { path, sha256: before[path] });
  assert.deepEqual(receipt.servedProof, {
    path: "served-proof.json",
    sha256: before["served-proof.json"],
    ...f.proof,
  });
  assert.deepEqual(Object.keys(receipt.images[0]), [
    "id",
    "file",
    "sha256",
    "width",
    "height",
    "scanned",
    "verdict",
  ]);
  assert.deepEqual(
    receipt.files.map((file) => file.path),
    Object.keys(before).sort(),
  );
  for (const file of receipt.files) {
    assert.equal(file.sha256, before[file.path]);
    assert.equal(file.bytes, readFileSync(join(f.root, file.path)).length);
  }
  assert.deepEqual(snapshot(f.root), before);
  assert.deepEqual(JSON.parse(readFileSync(f.paths[3])), receipt);
  assert.deepEqual(
    readdirSync(dirname(f.paths[3])),
    ["receipt.json"],
    "原子写入临时目录清理",
  );
});

for (const [name, change, code] of [
  [
    "漏图",
    (f) => unlinkSync(join(f.root, "capture/sample.png")),
    "missing_image",
  ],
  [
    "hash 不符",
    (f) => {
      f.checkpoint.images[0].sha256 = hash("wrong");
    },
    "image_hash_mismatch",
  ],
  [
    "尺寸不符",
    (f) => {
      f.checkpoint.images[0].width = 2;
    },
    "image_dimensions_mismatch",
  ],
  [
    "非法 PNG",
    (f) => writeFileSync(join(f.root, "capture/sample.png"), "not png"),
    "invalid_png",
  ],
  [
    "未看图",
    (f) => {
      f.checkpoint.images[0].scanned = false;
    },
    "unreviewed_image",
  ],
  [
    "前后源码不同",
    (f) => {
      f.manifest.sourceAfter.diffHash = hash("changed");
    },
    "source_mismatch",
  ],
  [
    "声明源码不符",
    (f) => {
      f.checkpoint.businessRevision = "stale";
    },
    "source_mismatch",
  ],
  [
    "源码声明变化",
    (f) => {
      f.manifest.sourceUnchanged = false;
    },
    "source_mismatch",
  ],
  [
    "工具声明不符",
    (f) => {
      f.identity.current = "other";
    },
    "tool_revision_mismatch",
  ],
  [
    "空工具版本",
    (f) => {
      f.checkpoint.toolRevision = f.identity.current = "";
    },
    "tool_revision_mismatch",
  ],
  [
    "重复目标",
    (f) => {
      f.manifest.records.push(f.manifest.records[0]);
    },
    "duplicate_target",
  ],
  [
    "重复图片",
    (f) => {
      f.checkpoint.images.push(f.checkpoint.images[0]);
    },
    "duplicate_target",
  ],
  [
    "缺失目标",
    (f) => {
      f.checkpoint.images = [];
    },
    "target_coverage",
  ],
  [
    "多余图片目标",
    (f) => {
      f.checkpoint.images[0].id = "extra";
    },
    "target_coverage",
  ],
  [
    "缺失截图字段",
    (f) => {
      delete f.manifest.records[0].screenshot;
    },
    "missing_image",
  ],
  [
    "截图文件名不符",
    (f) => {
      f.manifest.records[0].screenshot = "/old/wrong.png";
    },
    "image_path_mismatch",
  ],
  [
    "record 图片元数据不符",
    (f) => {
      f.manifest.records[0].image = { sha256: hash(png), width: 2, height: 1 };
    },
    "image_metadata_mismatch",
  ],
  [
    "字体失败",
    (f) => {
      f.manifest.records[0].resources.fonts = "loading";
    },
    "font_not_loaded",
  ],
  [
    "资源失败",
    (f) => {
      f.manifest.records[0].resources.failed = ["broken.png"];
    },
    "resource_failed",
  ],
  [
    "断言失败",
    (f) => {
      f.manifest.records[0].checks[0].ok = false;
    },
    "assertion_failed",
  ],
  [
    "目标失败",
    (f) => {
      f.manifest.records[0].ok = false;
    },
    "record_failed",
  ],
  [
    "清单失败",
    (f) => {
      f.manifest.ok = false;
    },
    "manifest_failed",
  ],
  [
    "服务版本不符",
    (f) => {
      f.proof.businessRevision = "other";
    },
    "served_proof_mismatch",
  ],
  [
    "服务 hash 不符",
    (f) => {
      f.proof.servedHash = hash("other");
    },
    "served_proof_mismatch",
  ],
  [
    "服务 matches 不符",
    (f) => {
      f.proof.matches = false;
    },
    "served_proof_mismatch",
  ],
  [
    "服务证明缺失",
    (f) => {
      f.checkpoint.servedProof = "missing.json";
    },
    "served_proof_mismatch",
  ],
  [
    "图片路径越界",
    (f) => {
      f.checkpoint.images[0].file = "../outside.png";
    },
    "unsafe_image",
  ],
])
  test(`sealEvidence 阻断${name}且不改输入`, (t) => {
    const f = fixture(t);
    change(f);
    f.save();
    blocked(f, code);
  });

test("sealEvidence malformed JSON 输出明确 issues，不伪造成功", (t) => {
  const f = fixture(t);
  writeFileSync(f.paths[0], "{broken");
  blocked(f, "invalid_input");
});

test("sealEvidence 不读取根外文件或目录符号链接", (t) => {
  const f = fixture(t);
  const outside = join(f.cwd, "secret");
  mkdirSync(outside);
  writeFileSync(join(outside, "secret.txt"), "never inventory");
  symlinkSync(outside, join(f.root, "outside"));
  symlinkSync(join(outside, "secret.txt"), join(f.root, "linked.txt"));
  f.checkpoint.images[0].file = "outside/secret.txt";
  f.save();
  const receipt = blocked(f, "unsafe_image");
  assert.ok(receipt.issues.some((issue) => issue.code === "unsafe_path"));
  assert.ok(
    !receipt.files.some(
      (file) => file.path.includes("secret") || file.path.includes("linked"),
    ),
  );
  assert.equal(
    readFileSync(join(outside, "secret.txt"), "utf8"),
    "never inventory",
  );
});

test("sealEvidence 输入 JSON 链接不作为可信材料读取", (t) => {
  const f = fixture(t);
  const outside = join(f.cwd, "identity.json");
  writeFileSync(outside, JSON.stringify(f.identity));
  unlinkSync(f.paths[2]);
  symlinkSync(outside, f.paths[2]);
  blocked(f, "invalid_input");
});

test("sealEvidence 禁止输出在输入根、覆盖原证据或经目录链接回到根内", (t) => {
  const f = fixture(t);
  symlinkSync(f.root, join(f.cwd, "alias"));
  symlinkSync(f.paths[0], join(f.cwd, "linked-output.json"));
  const dangling = join(f.cwd, "dangling-output.json");
  const missing = join(f.root, "missing.json");
  symlinkSync(missing, dangling);
  const before = snapshot(f.root);
  for (const output of [
    join(f.root, "receipt.json"),
    f.paths[0],
    join(f.cwd, "alias/new/receipt.json"),
    join(f.cwd, "linked-output.json"),
    dangling,
  ]) {
    const receipt = sealEvidence(...f.paths.slice(0, 3), output);
    assert.equal(receipt.ok, false);
    assert.equal(receipt.issues[0].code, "unsafe_output");
    assert.deepEqual(snapshot(f.root), before);
  }
  assert.equal(readdirSync(f.root).includes("new"), false);
  assert.equal(lstatSync(dangling).isSymbolicLink(), true);
  assert.equal(readlinkSync(dangling), missing);
});

test("sealEvidence 失败清单的计数仍按原始 records 累计，不因重复 ID 去重", (t) => {
  const f = fixture(t);
  f.manifest.records.push({
    ...f.manifest.records[0],
    resources: { fonts: "loaded", failed: ["broken.png"] },
  });
  f.save();
  const receipt = blocked(f, "duplicate_target");
  assert.equal(receipt.counts.targets, 2);
  assert.equal(receipt.counts.screenshots, 2);
  assert.equal(receipt.counts.resourceFailures, 1);
});

test("sealEvidence CLI 经目录链接调用仍落盘，异常和 usage 非零", (t) => {
  const f = fixture(t);
  const alias = join(f.cwd, "script-directory-link");
  symlinkSync(
    dirname(script),
    alias,
    process.platform === "win32" ? "junction" : "dir",
  );
  const linkedScript = join(alias, basename(script));
  const before = snapshot(f.root);
  const success = spawnSync(process.execPath, [linkedScript, ...f.paths], {
    encoding: "utf8",
  });
  assert.equal(success.status, 0, success.stderr);
  assert.equal(JSON.parse(success.stdout).ok, true);
  assert.equal(JSON.parse(readFileSync(f.paths[3])).ok, true);
  assert.deepEqual(snapshot(f.root), before);

  f.checkpoint.images[0].scanned = false;
  f.save();
  const unreviewed = snapshot(f.root);
  const failure = spawnSync(process.execPath, [linkedScript, ...f.paths], {
    encoding: "utf8",
  });
  assert.equal(failure.status, 1, failure.stderr);
  assert.equal(JSON.parse(failure.stdout).ok, false);
  const receipt = JSON.parse(readFileSync(f.paths[3]));
  assert.equal(receipt.ok, false);
  assert.ok(receipt.issues.some((issue) => issue.code === "unreviewed_image"));
  assert.deepEqual(snapshot(f.root), unreviewed);

  const usage = spawnSync(process.execPath, [linkedScript], {
    encoding: "utf8",
  });
  assert.equal(usage.status, 1, usage.stderr);
  assert.equal(JSON.parse(usage.stdout).issues[0].code, "usage");
});

test("sealEvidence 库导入允许 argv[1] 为空、不存在或不是当前模块且不执行 CLI", (t) => {
  const f = fixture(t);
  const alias = join(f.cwd, "import-directory-link");
  symlinkSync(
    dirname(script),
    alias,
    process.platform === "win32" ? "junction" : "dir",
  );
  const moduleURL = pathToFileURL(join(alias, basename(script))).href;
  for (const entry of [
    undefined,
    "",
    join(f.cwd, "missing-entry.mjs"),
    fileURLToPath(import.meta.url),
  ]) {
    const code = `
      process.argv = [process.execPath, ${JSON.stringify(entry)}, ...${JSON.stringify(f.paths)}];
      const { sealEvidence } = await import(${JSON.stringify(moduleURL)});
      console.log(typeof sealEvidence);
    `;
    const result = spawnSync(
      process.execPath,
      ["--input-type=module", "-e", code],
      { encoding: "utf8" },
    );
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, "function\n");
    assert.equal(result.stderr, "");
    assert.throws(() => lstatSync(f.paths[3]), { code: "ENOENT" });
  }
});

test("sealEvidence CLI 紧凑输出位置，成功与失败退出码真实", (t) => {
  const f = fixture(t);
  const stdout = execFileSync(process.execPath, [script, ...f.paths], {
    encoding: "utf8",
  });
  assert.equal(stdout.trim().split("\n").length, 1);
  assert.deepEqual(JSON.parse(stdout), {
    ok: true,
    issues: [],
    output: f.paths[3],
  });
  f.checkpoint.images[0].scanned = false;
  f.save();
  const failure = spawnSync(process.execPath, [script, ...f.paths], {
    encoding: "utf8",
  });
  assert.equal(failure.status, 1);
  assert.equal(JSON.parse(failure.stdout).ok, false);
  const usage = spawnSync(process.execPath, [script], { encoding: "utf8" });
  assert.equal(usage.status, 1);
  assert.equal(JSON.parse(usage.stdout).issues[0].code, "usage");
});
