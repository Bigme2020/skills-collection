import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

test("CLI静态预检不依赖Git或session，普通入口也在连接浏览器前检查覆盖", () => {
  const directory = mkdtempSync(join(tmpdir(), "plan-preflight-"));
  const config = join(directory, "plan.json");
  const cli = new URL("./ui-evidence.mjs", import.meta.url).pathname;
  const run = (...args) =>
    spawnSync(process.execPath, [cli, ...args], {
      cwd: directory,
      encoding: "utf8",
      env: { ...process.env, PATH: "" },
    });
  try {
    const plan = {
      defaults: {
        ready: "main",
        resourceRoot: "body",
        measurements: { footer: "footer" },
      },
      targets: [{ id: "single", boundaryProbe: false }],
      coverage: {
        single: { boundaryProbe: false, measurements: { footer: "footer" } },
      },
    };
    writeFileSync(config, JSON.stringify(plan));
    const good = run("--inspect", config);
    assert.equal(good.status, 0, good.stderr);
    assert.equal(JSON.parse(good.stdout).targets[0].boundaryProbe, false);
    plan.targets[0].boundaryProbe = true;
    writeFileSync(config, JSON.stringify(plan));
    for (const args of [
      ["--inspect", config],
      [config, "nonexistent", join(directory, "out")],
    ]) {
      const bad = run(...args);
      assert.equal(bad.status, 1);
      assert.match(bad.stderr, /single.boundaryProbe/);
    }
    assert.equal(existsSync(join(directory, "out")), false);
  } finally {
    rmSync(directory, { recursive: true });
  }
});
