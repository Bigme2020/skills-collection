// 无项目依赖；同一个函数可用于 Playwright 测试或 playwright-cli run-code。
// 保持函数自包含：CLI 会序列化函数，而不是在浏览器执行环境里 import。
export async function captureUI(page, plan, prepare) {
  const records = [];
  const defaults = plan.defaults || {};
  const merge = (base, override) => ({
    ...base,
    ...override,
    measurements: { ...base.measurements, ...override.measurements },
    screenshot: { ...base.screenshot, ...override.screenshot },
  });
  // steps 只描述同一场景内的捕获点；业务操作仍由 prepare 回调执行。
  const targets = (plan.targets || []).flatMap((target) => {
    const scene = merge(defaults, target);
    if (!target.steps) return [{ ...scene, reuse: false }];
    if (!Array.isArray(target.steps) || !target.steps.length)
      throw new Error("steps 必须是非空数组");
    return target.steps.map((step, index) => {
      if (index > 0 && (step.url !== undefined || step.viewport !== undefined))
        throw new Error("复用捕获点不允许改变 url/viewport，请另建场景");
      if (!step.id) throw new Error("每个捕获点必须指定 id");
      return {
        ...merge(scene, step),
        id: `${target.id}-${step.id}`,
        reuse: index > 0,
      };
    });
  });
  let previousSucceeded = false;
  const browserVersion = page.context().browser()?.version() ?? null;
  const requireValue = (ok, message) => {
    if (!ok) throw new Error(message);
  };
  requireValue(
    Array.isArray(plan.targets) && targets.length > 0,
    "targets 必须为非空数组",
  );
  const ids = new Set();
  for (const target of targets) {
    requireValue(
      typeof target.id === "string" &&
        /^[\w-]+$/.test(target.id) &&
        !ids.has(target.id),
      "target.id 必须唯一且只含字母、数字、_、-",
    );
    ids.add(target.id);
    requireValue(
      typeof target.ready === "string" &&
        typeof target.resourceRoot === "string",
      `${target.id}: 必须指定 ready 和 resourceRoot`,
    );
    requireValue(
      target.screenshot && typeof target.screenshot.path === "string",
      `${target.id}: 必须指定 screenshot.path`,
    );
    for (const rule of target.checks || []) {
      requireValue(
        ["equal", "size", "inside"].includes(rule.type),
        `未知检查类型 ${rule.type}`,
      );
      requireValue(
        rule.tolerance === undefined ||
          (Number.isFinite(rule.tolerance) && rule.tolerance >= 0),
        "tolerance 必须是非负有限数",
      );
      requireValue(
        rule.type === "inside"
          ? typeof rule.container === "string"
          : ["x", "y", "right", "bottom", "width", "height"].includes(
              rule.metric,
            ),
        "检查缺少有效的 metric/container",
      );
      requireValue(
        rule.type !== "size" || Number.isFinite(rule.value),
        "size.value 必须是有限数",
      );
      requireValue(typeof rule.selector === "string", "检查必须指定 selector");
    }
    if (target.scroll) {
      requireValue(
        ["x", "y"].includes(target.scroll.axis) &&
          ["start", "end"].includes(target.scroll.to),
        "scroll 必须指定 axis=x/y、to=start/end",
      );
      requireValue(
        typeof target.scroll.selector === "string",
        "scroll 必须指定容器 selector",
      );
    }
  }
  for (const target of targets) {
    const record = { id: target.id, ok: false, checks: [], screenshot: null };
    records.push(record);
    let animationStyle;
    let phaseStarted = Date.now();
    record.timingsMs = {};
    const mark = (name) => {
      const now = Date.now();
      record.timingsMs[name] = now - phaseStarted;
      phaseStarted = now;
    };
    try {
      const timeout = plan.timeoutMs ?? 10000;
      if (target.reuse)
        requireValue(previousSucceeded, "前一捕获点失败，不复用未验证页面状态");
      else {
        if (
          target.viewport &&
          JSON.stringify(page.viewportSize()) !==
            JSON.stringify(target.viewport)
        )
          await page.setViewportSize(target.viewport);
        if (target.url)
          await page.goto(target.url, {
            waitUntil: "domcontentloaded",
            timeout,
          });
        else await page.reload({ waitUntil: "domcontentloaded", timeout });
      }
      mark("navigation");
      if (prepare) await prepare(page, target);
      mark("prepare");
      await page.locator(target.ready).waitFor({ state: "visible", timeout });
      await page
        .locator(target.resourceRoot)
        .first()
        .waitFor({ state: "visible", timeout });
      mark("ready");
      animationStyle = await page.addStyleTag({
        content:
          "*,*::before,*::after{animation-play-state:paused!important;transition:none!important;caret-color:transparent!important}",
      });
      if (target.scroll) {
        const scroll = target.scroll;
        requireValue(
          (await page.locator(scroll.selector).count()) === 1,
          "滚动容器必须唯一",
        );
        record.scroll = await page
          .locator(scroll.selector)
          .evaluate((el, setting) => {
            const horizontal = setting.axis === "x";
            const max = Math.max(
              0,
              horizontal
                ? el.scrollWidth - el.clientWidth
                : el.scrollHeight - el.clientHeight,
            );
            const end =
              horizontal && getComputedStyle(el).direction === "rtl"
                ? -max
                : max;
            const requested = setting.to === "end" ? end : 0;
            const behavior = el.style.scrollBehavior;
            el.style.scrollBehavior = "auto";
            if (horizontal) el.scrollLeft = requested;
            else el.scrollTop = requested;
            el.style.scrollBehavior = behavior;
            return {
              max,
              requested,
              status: max > 0 ? "applicable" : "not_applicable",
              method: "programmatic",
            };
          }, scroll);
        requireValue(
          !scroll.requireOverflow || record.scroll.max > 0,
          "契约要求溢出，但实际无溢出",
        );
      }
      mark("scroll");
      // 仅发生滚动/业务准备时等待观察器；普通导航无需额外预等待。
      if (target.scroll || prepare)
        // 先让滚动触发的视口观察器有机会更新资源；异步业务加载仍由 ready/prepare 明确等待。
        await page.evaluate(
          () =>
            new Promise((resolve) =>
              requestAnimationFrame(() => requestAnimationFrame(resolve)),
            ),
        );
      record.resources = await page.evaluate(
        async ({ selector, timeout }) => {
          const roots = [...document.querySelectorAll(selector)];
          if (!roots.length) throw new Error("resourceRoot 未匹配元素");
          const nodes = new Set(
            roots.flatMap((root) => [root, ...root.querySelectorAll("*")]),
          );
          const urls = new Set();
          for (const el of nodes) {
            if (el instanceof HTMLImageElement) {
              const src = el.currentSrc || el.src;
              // 在场景指定滚动位置读取当前资源；不改页面的懒加载策略。
              if (src) urls.add(src);
            }
            for (const pseudo of [null, "::before", "::after"]) {
              const background = getComputedStyle(el, pseudo).backgroundImage;
              for (const match of background.matchAll(
                /url\(\s*["']?([^"')]+?)["']?\s*\)/g,
              ))
                urls.add(match[1]);
            }
          }
          let timer;
          try {
            return await Promise.race([
              (async () => {
                await document.fonts.ready;
                const results = await Promise.all(
                  [...urls].map(
                    (src) =>
                      new Promise((resolve) => {
                        const image = new Image();
                        image.onload = async () => {
                          try {
                            await image.decode();
                            resolve({ src, ok: true });
                          } catch {
                            resolve({ src, ok: false });
                          }
                        };
                        image.onerror = () => resolve({ src, ok: false });
                        image.src = src;
                      }),
                  ),
                );
                return {
                  total: urls.size,
                  failed: results
                    .filter((item) => !item.ok)
                    .map((item) => item.src),
                  fonts: document.fonts.status,
                };
              })(),
              new Promise((_, reject) => {
                timer = setTimeout(
                  () => reject(new Error("字体或图片就绪超时")),
                  timeout,
                );
              }),
            ]);
          } finally {
            clearTimeout(timer);
          }
        },
        { selector: target.resourceRoot, timeout },
      );
      requireValue(record.resources.failed.length === 0, "资源加载或解码失败");
      mark("resources");
      if (target.scroll) {
        record.scroll.actual = await page
          .locator(target.scroll.selector)
          .evaluate(
            (el, axis) => (axis === "x" ? el.scrollLeft : el.scrollTop),
            target.scroll.axis,
          );
        requireValue(
          Math.abs(record.scroll.actual - record.scroll.requested) <= 1,
          "未到达请求的滚动位置；检查 scroll-snap／虚拟列表等页面行为",
        );
      }
      const snapshot = await page.evaluate(
        async ({ measurements, checks }) => {
          await new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          );
          const rect = (el) => {
            const r = el.getBoundingClientRect();
            return {
              x: r.x,
              y: r.y,
              right: r.right,
              bottom: r.bottom,
              width: r.width,
              height: r.height,
            };
          };
          const selectors = new Set([
            ...Object.values(measurements),
            ...checks.flatMap((rule) => [
              rule.selector,
              ...(rule.container ? [rule.container] : []),
            ]),
          ]);
          const geometry = Object.fromEntries(
            [...selectors].map((selector) => [
              selector,
              [...document.querySelectorAll(selector)].map(rect),
            ]),
          );
          return {
            geometry,
            page: {
              url: location.href,
              width: innerWidth,
              height: innerHeight,
              documentWidth: document.documentElement.scrollWidth,
              scrollX,
              scrollY,
            },
            actual: {
              dpr: devicePixelRatio,
              zoom: window.visualViewport?.scale ?? 1,
              touchPoints: navigator.maxTouchPoints,
              userAgent: navigator.userAgent,
            },
          };
        },
        {
          measurements: target.measurements || {},
          checks: target.checks || [],
        },
      );
      record.geometry = snapshot.geometry;
      record.page = snapshot.page;
      record.actual = {
        ...snapshot.actual,
        viewport: page.viewportSize(),
        browser: browserVersion,
      };
      for (const key of ["dpr", "zoom"]) {
        if (plan.expected?.[key] !== undefined)
          requireValue(
            Math.abs(record.actual[key] - plan.expected[key]) < 0.001,
            `${key} 与捕获契约不符`,
          );
      }
      if (plan.expected?.touch !== undefined)
        requireValue(
          record.actual.touchPoints > 0 === plan.expected.touch,
          "触摸能力与捕获契约不符",
        );
      for (const rule of target.checks || []) {
        const boxes = record.geometry[rule.selector];
        const tolerance = rule.tolerance ?? 0.5;
        let ok = boxes.length >= (rule.type === "equal" ? 2 : 1);
        if (rule.type === "equal")
          ok &&= boxes.every(
            (box) =>
              Math.abs(box[rule.metric] - boxes[0][rule.metric]) <= tolerance,
          );
        if (rule.type === "size")
          ok &&= boxes.every(
            (box) => Math.abs(box[rule.metric] - rule.value) <= tolerance,
          );
        if (rule.type === "inside") {
          const containers = record.geometry[rule.container];
          ok &&=
            containers.length === 1 &&
            boxes.every(
              (box) =>
                box.x >= containers[0].x - tolerance &&
                box.y >= containers[0].y - tolerance &&
                box.right <= containers[0].right + tolerance &&
                box.bottom <= containers[0].bottom + tolerance,
            );
        }
        record.checks.push({ ...rule, ok, matched: boxes.length });
      }
      mark("geometry");
      // 断言失败仍捕获诊断图；资源/设备就绪失败不生成可比较截图。
      const screenshot = {
        path: target.screenshot.path,
        scale: "css",
        animations: "allow",
      };
      if (target.screenshot.selector) {
        const box = await page
          .locator(target.screenshot.selector)
          .boundingBox();
        requireValue(
          box &&
            box.x >= 0 &&
            box.y >= 0 &&
            box.x + box.width <= record.page.width &&
            box.y + box.height <= record.page.height,
          "元素截图须先完整滚入视口，避免自动滚动使几何证据失效",
        );
        await page.locator(target.screenshot.selector).screenshot(screenshot);
      } else
        await page.screenshot({
          ...screenshot,
          fullPage: target.screenshot.fullPage ?? false,
        });
      mark("screenshot");
      record.screenshot = screenshot.path;
      record.ok = record.checks.every((check) => check.ok);
      if (!record.ok) record.error = "布局契约断言失败";
    } catch (error) {
      record.error = error.message;
    } finally {
      if (animationStyle) {
        try {
          await animationStyle.evaluate((el) => el.remove());
        } catch (error) {
          record.ok = false;
          record.cleanupError = error.message;
        }
      }
      mark("cleanup");
      previousSucceeded = record.ok;
    }
  }
  return {
    ok: records.every((record) => record.ok),
    records,
    visualVerdict: "pending",
  };
}
