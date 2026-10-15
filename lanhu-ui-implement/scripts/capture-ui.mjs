// 无项目依赖；同一个函数可用于 Playwright 测试或 playwright-cli run-code。
// 保持函数自包含：CLI 会序列化函数，而不是在浏览器执行环境里 import。
export async function captureUI(page, plan, prepare) {
  const records = [];
  const requireValue = (ok, message) => {
    if (!ok) throw new Error(message);
  };
  requireValue(
    Array.isArray(plan.targets) && plan.targets.length > 0,
    "targets 必须为非空数组",
  );
  const ids = new Set();
  for (const target of plan.targets) {
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
  for (const target of plan.targets) {
    const record = { id: target.id, ok: false, checks: [], screenshot: null };
    records.push(record);
    let animationStyle;
    try {
      const timeout = plan.timeoutMs ?? 10000;
      if (target.viewport) await page.setViewportSize(target.viewport);
      if (target.url)
        await page.goto(target.url, { waitUntil: "domcontentloaded", timeout });
      else await page.reload({ waitUntil: "domcontentloaded", timeout });
      if (prepare) await prepare(page, target);
      // 设备模式由调用方创建 context 时设置；改 viewport 不会自动切换设备模式。
      await page.locator(target.ready).waitFor({ state: "visible", timeout });
      await page
        .locator(target.resourceRoot)
        .first()
        .waitFor({ state: "visible", timeout });
      const context = page.context();
      const actual = {
        viewport: page.viewportSize(),
        browser: context.browser()?.version() ?? null,
        // Playwright 的公开 context 选项不提供事后读取接口；实测信号不冒充创建参数。
        ...(await page.evaluate(() => ({
          dpr: devicePixelRatio,
          zoom: window.visualViewport?.scale ?? 1,
          touchPoints: navigator.maxTouchPoints,
          userAgent: navigator.userAgent,
        }))),
      };
      record.actual = actual;
      for (const key of ["dpr", "zoom"]) {
        if (plan.expected?.[key] !== undefined)
          requireValue(
            Math.abs(actual[key] - plan.expected[key]) < 0.001,
            `${key} 与捕获契约不符`,
          );
      }
      if (plan.expected?.touch !== undefined)
        requireValue(
          actual.touchPoints > 0 === plan.expected.touch,
          "触摸能力与捕获契约不符",
        );
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
      // 等两帧完成布局；不依赖 run-code 沙箱提供全局计时器。
      await page.evaluate(
        () =>
          new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          ),
      );
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
      record.geometry = await page.evaluate(
        ({ measurements, checks }) => {
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
          return Object.fromEntries(
            [...selectors].map((selector) => [
              selector,
              [...document.querySelectorAll(selector)].map(rect),
            ]),
          );
        },
        {
          measurements: target.measurements || {},
          checks: target.checks || [],
        },
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
      record.page = await page.evaluate(() => ({
        url: location.href,
        width: innerWidth,
        height: innerHeight,
        documentWidth: document.documentElement.scrollWidth,
        scrollX,
        scrollY,
      }));
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
    }
  }
  return {
    ok: records.every((record) => record.ok),
    records,
    visualVerdict: "pending",
  };
}
