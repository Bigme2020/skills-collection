import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtempSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createRequire } from "node:module";
import { captureUI, inspectPlan } from "./capture-ui.mjs";

// 只使用调用项目已有的 Playwright；不会安装、下载或重链接依赖。
const { chromium } = createRequire(resolve("package.json"))("@playwright/test");
test("静态预检复用真实合并规则，覆盖契约拦截两类适配错误且不接触页面", async () => {
  const plan = {
    defaults: {
      ready: "main",
      resourceRoot: "body",
      boundaryProbe: true,
      measurements: { footer: "footer" },
      screenshot: { fullPage: false },
      checks: [{ type: "equal", selector: ".item", metric: "height" }],
    },
    targets: [
      {
        id: "single",
        boundaryProbe: false,
        checks: [],
        steps: [
          { id: "start", measurements: { item: ".single" } },
          { id: "end", measurements: { item: ".last" } },
        ],
      },
    ],
    coverage: {
      "single-start": {
        measurements: { item: ".single", footer: "footer" },
        boundaryProbe: false,
        checks: [],
      },
      "single-end": {
        measurements: { footer: "footer", item: ".last" },
        boundaryProbe: false,
      },
    },
  };
  const snapshot = structuredClone(plan);
  const inspected = await inspectPlan(plan);
  assert.deepEqual(plan, snapshot);
  assert.equal(inspected.visualVerdict, "pending");
  assert.deepEqual(
    inspected.targets.map((t) => [t.id, t.reuse]),
    [
      ["single-start", false],
      ["single-end", true],
    ],
  );
  assert.deepEqual(inspected.targets[0].measurements, {
    footer: "footer",
    item: ".single",
  });
  assert.deepEqual(inspected.targets[0].checks, []);
  assert.deepEqual(inspected.targets[0].screenshot, { fullPage: false });
  // 任何页面读取或prepare都会让测试失败，证明错误在浏览器边界之前被拦下。
  const page = new Proxy(
    {},
    {
      get() {
        assert.fail("预检不应访问页面");
      },
    },
  );
  for (const [change, error] of [
    [
      (p) => {
        delete p.targets[0].boundaryProbe;
      },
      /single-start.boundaryProbe/,
    ],
    [
      (p) => {
        p.defaults.measurements.extra = ".pair";
      },
      /single-start.measurements/,
    ],
    [
      (p) => {
        delete p.coverage["single-end"];
      },
      /coverage 目标不符/,
    ],
    [
      (p) => {
        p.coverage.unused = {};
      },
      /coverage 目标不符/,
    ],
    [
      (p) => {
        p.targets[0].steps[1].viewport = { width: 1, height: 1 };
      },
      /复用捕获点/,
    ],
    [
      (p) => {
        p.targets[0].steps = [];
      },
      /steps/,
    ],
    [
      (p) => {
        p.targets[0].steps[1].id = "start";
      },
      /唯一/,
    ],
    [
      (p) => {
        p.targets[0].checks = [{ type: "guess" }];
      },
      /未知检查/,
    ],
    [
      (p) => {
        p.targets = {};
      },
      /targets/,
    ],
  ]) {
    const bad = structuredClone(plan);
    change(bad);
    // 实际捕获仍要求输出路径；保持其他输入合法以验证目标错误。
    for (const target of Array.isArray(bad.targets) ? bad.targets : [])
      if (Array.isArray(target.steps))
        for (const step of target.steps)
          step.screenshot = { path: "/unused.png" };
    await assert.rejects(
      captureUI(page, bad, () => assert.fail("不应prepare")),
      error,
    );
  }
  const legacy = structuredClone(plan);
  delete legacy.coverage;
  assert.equal((await inspectPlan(legacy)).ok, true);
});

const picture =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="red"/></svg>',
  );
const fixture = `<!doctype html><meta name="viewport" content="width=device-width, initial-scale=1"><style>
body{margin:0}.row{display:flex;width:160px;overflow:auto;scroll-behavior:auto}.tile{flex:0 0 80px;height:80px;background-image:url('${picture}')}.pair{flex-basis:160px}.broken .pair{height:86px}.short{height:20px;overflow:auto}.short>div{height:80px} img{width:8px;height:8px}
</style><main><div class="row"><div class="tile"></div><div class="tile pair"></div><div class="tile"></div></div><div class="short"><div>end</div></div><img src="${picture}"></main><script>
if(location.pathname==='/broken')document.body.className='broken';
if(location.pathname==='/missing')document.querySelector('img').src='/404.png';
</script>`;

test("通用捕获：不同布局、资源、滚动及失败证据", async (t) => {
  const server = createServer((req, res) => {
    if (req.url === "/404.png") {
      res.writeHead(404);
      res.end();
    } else {
      res.setHeader("content-type", "text/html");
      res.end(fixture);
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${server.address().port}`; // 独立合成fixture，不访问项目页面。
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
    viewport: { width: 360, height: 640 },
  });
  const page = await context.newPage();
  const directory = mkdtempSync(join(tmpdir(), "capture-ui-test-"));
  const target = (id, extra = {}) => ({
    id,
    url,
    ready: "main",
    resourceRoot: "main",
    screenshot: { path: join(directory, `${id}.png`) },
    measurements: { tiles: ".tile" },
    ...extra,
  });
  try {
    await t.test(
      "移动上下文、资源、混排等高和顶部对齐通过，清除动画注入",
      async () => {
        const result = await captureUI(page, {
          expected: { touch: true, dpr: 2, zoom: 1 },
          targets: [
            target("mixed", {
              checks: [
                { type: "equal", selector: ".tile", metric: "height" },
                { type: "equal", selector: ".tile", metric: "y" },
                {
                  type: "size",
                  selector: ".tile",
                  metric: "height",
                  value: 80,
                },
                { type: "inside", selector: ".row", container: "main" },
              ],
            }),
          ],
        });
        assert.equal(result.ok, true);
        assert.equal(result.visualVerdict, "pending");
        assert.equal(result.records[0].resources.total, 1);
        assert.equal(await page.locator("style").count(), 1);
        assert.ok(existsSync(result.records[0].screenshot));
      },
    );
    await t.test("共享默认值、连续捕获只导航一次且逐点重验资源", async () => {
      let navigations = 0;
      const goto = page.goto.bind(page);
      page.goto = (...args) => {
        navigations++;
        return goto(...args);
      };
      try {
        const result = await captureUI(page, {
          defaults: {
            ready: "main",
            resourceRoot: "main",
            measurements: { tiles: ".tile" },
            checks: [{ type: "equal", selector: ".tile", metric: "height" }],
          },
          targets: [
            {
              id: "scene",
              url,
              steps: [
                {
                  id: "first",
                  screenshot: { path: join(directory, "first.png") },
                },
                {
                  id: "end",
                  scroll: { selector: ".row", axis: "x", to: "end" },
                  screenshot: { path: join(directory, "end.png") },
                },
              ],
            },
          ],
        });
        assert.equal(navigations, 1);
        assert.equal(result.ok, true);
        assert.equal(result.records.length, 2);
        assert.ok(
          result.records.every(
            (record) =>
              record.resources.total === 1 && record.timingsMs.screenshot >= 0,
          ),
        );
        const failure = await captureUI(page, {
          defaults: { ready: "main", resourceRoot: "main" },
          targets: [
            {
              id: "failed-scene",
              url,
              steps: [
                {
                  id: "first",
                  checks: [
                    {
                      type: "size",
                      selector: ".tile",
                      metric: "height",
                      value: 999,
                    },
                  ],
                  screenshot: { path: join(directory, "bad.png") },
                },
                {
                  id: "second",
                  screenshot: { path: join(directory, "blocked.png") },
                },
              ],
            },
          ],
        });
        assert.equal(failure.records[1].ok, false);
        assert.equal(failure.records[1].screenshot, null);
      } finally {
        page.goto = goto;
      }
    });
    await t.test("多资源根与显式元素裁剪可复用同一捕获器", async () => {
      const result = await captureUI(page, {
        targets: [
          target("crop", {
            resourceRoot: ".row, .short",
            screenshot: { path: join(directory, "crop.png"), selector: ".row" },
          }),
        ],
      });
      assert.equal(result.ok, true);
      assert.equal(result.records[0].resources.total, 1);
      assert.ok(existsSync(result.records[0].screenshot));
    });
    await t.test(
      "80/86混排不等高必须失败但留下诊断图，独立场景继续",
      async () => {
        const result = await captureUI(page, {
          targets: [
            target("broken", {
              url: `${url}/broken`,
              checks: [{ type: "equal", selector: ".tile", metric: "height" }],
            }),
            target("after"),
          ],
        });
        assert.equal(result.ok, false);
        assert.equal(result.records[0].checks[0].ok, false);
        assert.ok(existsSync(result.records[0].screenshot));
        assert.equal(result.records[1].ok, true);
      },
    );
    await t.test("横滚末项可达，记录程序滚动而非手势认证", async () => {
      const result = await captureUI(page, {
        targets: [
          target("scroll", {
            scroll: {
              selector: ".row",
              axis: "x",
              to: "end",
              requireOverflow: true,
            },
            checks: [
              {
                type: "inside",
                selector: ".tile:last-child",
                container: ".row",
              },
            ],
          }),
        ],
      });
      assert.equal(result.ok, true);
      assert.equal(result.records[0].scroll.method, "programmatic");
      assert.equal(result.records[0].scroll.status, "applicable");
    });
    await t.test("无溢出为不适用；明确要求溢出才失败", async () => {
      const scroll = { selector: "main", axis: "y", to: "end" };
      const result = await captureUI(page, {
        targets: [
          target("no-scroll", { scroll }),
          target("required-scroll", {
            scroll: { ...scroll, requireOverflow: true },
          }),
        ],
      });
      assert.equal(result.records[0].ok, true);
      assert.equal(result.records[0].scroll.status, "not_applicable");
      assert.equal(result.records[1].ok, false);
    });
    await t.test("纵滚末项与包含关系检查", async () => {
      const result = await captureUI(page, {
        targets: [
          target("vertical", {
            scroll: {
              selector: ".short",
              axis: "y",
              to: "end",
              requireOverflow: true,
            },
          }),
        ],
      });
      assert.equal(result.ok, true);
      assert.equal(
        await page.locator(".short").evaluate((el) => el.scrollTop),
        60,
      );
    });
    await t.test("可选prepare准备业务状态，RTL滚动仍记录真实末端", async () => {
      const result = await captureUI(
        page,
        {
          targets: [
            target("rtl", {
              scroll: {
                selector: ".row",
                axis: "x",
                to: "end",
                requireOverflow: true,
              },
            }),
          ],
        },
        async (current) => {
          await current.locator(".row").evaluate((el) => {
            el.style.direction = "rtl";
          });
        },
      );
      assert.equal(result.ok, true);
      assert.ok(result.records[0].scroll.actual < 0);
      assert.equal(
        result.records[0].scroll.actual,
        result.records[0].scroll.requested,
      );
    });
    await t.test("图片失败不产生可比较截图", async () => {
      const result = await captureUI(page, {
        targets: [target("missing", { url: `${url}/missing` })],
      });
      assert.equal(result.ok, false);
      assert.equal(result.records[0].resources.failed.length, 1);
      assert.equal(result.records[0].screenshot, null);
    });
    await t.test("就绪超时、零匹配检查和错误DPR不假通过", async () => {
      const result = await captureUI(page, {
        timeoutMs: 100,
        targets: [
          target("timeout", { ready: ".absent" }),
          target("zero", {
            checks: [
              { type: "size", selector: ".absent", metric: "width", value: 0 },
            ],
          }),
        ],
      });
      assert.equal(result.records[0].ok, false);
      assert.equal(result.records[1].checks[0].ok, false);
      const wrongDpr = await captureUI(page, {
        expected: { dpr: 1 },
        targets: [target("dpr")],
      });
      assert.equal(wrongDpr.ok, false);
      await assert.rejects(
        captureUI(page, {
          targets: [target("unknown", { checks: [{ type: "guess" }] })],
        }),
        /未知检查/,
      );
    });
    await t.test(
      "桌面上下文与移动上下文分离，视口大小不冒充移动模式",
      async () => {
        const desktop = await browser.newContext({
          viewport: { width: 360, height: 640 },
        });
        try {
          const result = await captureUI(await desktop.newPage(), {
            expected: { touch: true },
            targets: [target("desktop")],
          });
          assert.equal(result.ok, false);
          assert.match(result.records[0].error, /触摸/);
        } finally {
          await desktop.close();
        }
      },
    );
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
    rmSync(directory, { recursive: true });
  }
});
