// No project dependencies; share this function between Playwright tests and playwright-cli run-code.
// Keep it self-contained: the CLI serializes the function instead of importing it in the browser runtime.
export async function captureUI(page, plan, prepare, inspectOnly = false) {
  const records = [];
  const requireValue = (ok, message) => {
    if (!ok) throw new Error(message);
  };
  requireValue(Array.isArray(plan.targets) && plan.targets.length > 0, 'targets must be a nonempty array');
  const defaults = plan.defaults || {};
  const merge = (base, override) => ({
    ...base,
    ...override,
    measurements: { ...base.measurements, ...override.measurements },
    screenshot: { ...base.screenshot, ...override.screenshot },
  });
  // steps describe capture points within one scene; prepare still handles business actions.
  const targets = (plan.targets || []).flatMap((target) => {
    const scene = merge(defaults, target);
    if (!target.steps) return [{ ...scene, reuse: false }];
    if (!Array.isArray(target.steps) || !target.steps.length) throw new Error('steps must be a nonempty array');
    return target.steps.map((step, index) => {
      if (index > 0 && (step.url !== undefined || step.viewport !== undefined))
        throw new Error('Reused capture points cannot change url/viewport; create another scene');
      if (!step.id) throw new Error('Each capture point must specify an id');
      return {
        ...merge(scene, step),
        id: `${target.id}-${step.id}`,
        reuse: index > 0,
      };
    });
  });
  const ids = new Set();
  for (const target of targets) {
    requireValue(
      typeof target.id === 'string' && /^[\w-]+$/.test(target.id) && !ids.has(target.id),
      'target.id must be unique and contain only letters, digits, _, and -',
    );
    ids.add(target.id);
    requireValue(
      typeof target.ready === 'string' && typeof target.resourceRoot === 'string',
      `${target.id}: must specify ready and resourceRoot`,
    );
    requireValue(
      inspectOnly || typeof target.screenshot.path === 'string',
      `${target.id}: must specify screenshot.path`,
    );
    for (const rule of target.checks || []) {
      requireValue(['equal', 'size', 'inside'].includes(rule.type), `Unknown check type ${rule.type}`);
      requireValue(
        rule.tolerance === undefined || (Number.isFinite(rule.tolerance) && rule.tolerance >= 0),
        'tolerance must be a finite nonnegative number',
      );
      requireValue(
        rule.type === 'inside'
          ? typeof rule.container === 'string'
          : ['x', 'y', 'right', 'bottom', 'width', 'height'].includes(rule.metric),
        'Check requires a valid metric/container',
      );
      requireValue(rule.type !== 'size' || Number.isFinite(rule.value), 'size.value must be finite');
      requireValue(typeof rule.selector === 'string', 'Check must specify selector');
    }
    if (target.scroll) {
      requireValue(
        ['x', 'y'].includes(target.scroll.axis) && ['start', 'end'].includes(target.scroll.to),
        'scroll must specify axis=x/y and to=start/end',
      );
      requireValue(typeof target.scroll.selector === 'string', 'scroll must specify a container selector');
    }
  }
  // Expectations come from the task contract, not the plan being tested. Check declared fields without inferring business rules.
  if (plan.coverage !== undefined) {
    const coverage = plan.coverage;
    requireValue(
      coverage && typeof coverage === 'object' && !Array.isArray(coverage),
      'coverage must be an object indexed by final capture-point ID',
    );
    const missing = [...ids].filter((id) => !Object.hasOwn(coverage, id));
    const extra = Object.keys(coverage).filter((id) => !ids.has(id));
    requireValue(
      !missing.length && !extra.length,
      `coverage target mismatch: missing=${missing.join(',')}; extra=${extra.join(',')}`,
    );
    // Ignore object key order but preserve array order, applying the same comparison recursively.
    const equal = (a, b) => {
      if (a === b) return true;
      if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;
      const keys = Object.keys(a);
      return (
        Array.isArray(a) === Array.isArray(b) &&
        keys.length === Object.keys(b).length &&
        keys.every((key) => Object.hasOwn(b, key) && equal(a[key], b[key]))
      );
    };
    for (const target of targets) {
      const expected = coverage[target.id];
      requireValue(
        expected && typeof expected === 'object' && !Array.isArray(expected),
        `${target.id}: coverage must declare a field object`,
      );
      for (const [key, value] of Object.entries(expected))
        requireValue(
          Object.hasOwn(target, key) && equal(target[key], value),
          `${target.id}.${key}: coverage mismatch; expected=${JSON.stringify(value)}; actual=${JSON.stringify(target[key])}`,
        );
    }
  }
  // inspectPlan shares this exact expansion/validation path; no browser state has been read or changed yet.
  if (inspectOnly)
    return {
      ok: true,
      targets: targets.map(({ steps, ...target }) => target),
      visualVerdict: 'pending',
    };
  let previousSucceeded = false;
  const browserVersion = page.context().browser()?.version() ?? null;
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
        requireValue(previousSucceeded, 'Previous capture point failed; do not reuse unverified page state');
      else {
        if (target.viewport && JSON.stringify(page.viewportSize()) !== JSON.stringify(target.viewport))
          await page.setViewportSize(target.viewport);
        if (target.url)
          await page.goto(target.url, {
            waitUntil: 'domcontentloaded',
            timeout,
          });
        else await page.reload({ waitUntil: 'domcontentloaded', timeout });
      }
      mark('navigation');
      if (prepare) await prepare(page, target);
      mark('prepare');
      await page.locator(target.ready).waitFor({ state: 'visible', timeout });
      await page.locator(target.resourceRoot).first().waitFor({ state: 'visible', timeout });
      mark('ready');
      animationStyle = await page.addStyleTag({
        content:
          '*,*::before,*::after{animation-play-state:paused!important;transition:none!important;caret-color:transparent!important}',
      });
      if (target.scroll) {
        const scroll = target.scroll;
        requireValue((await page.locator(scroll.selector).count()) === 1, 'Scroll container must be unique');
        record.scroll = await page.locator(scroll.selector).evaluate((el, setting) => {
          const horizontal = setting.axis === 'x';
          const max = Math.max(0, horizontal ? el.scrollWidth - el.clientWidth : el.scrollHeight - el.clientHeight);
          const end = horizontal && getComputedStyle(el).direction === 'rtl' ? -max : max;
          const requested = setting.to === 'end' ? end : 0;
          const behavior = el.style.scrollBehavior;
          el.style.scrollBehavior = 'auto';
          if (horizontal) el.scrollLeft = requested;
          else el.scrollTop = requested;
          el.style.scrollBehavior = behavior;
          return {
            max,
            requested,
            status: max > 0 ? 'applicable' : 'not_applicable',
            method: 'programmatic',
          };
        }, scroll);
        requireValue(!scroll.requireOverflow || record.scroll.max > 0, 'Contract requires overflow, but none exists');
      }
      mark('scroll');
      // Wait for observers only after scrolling or business preparation, not ordinary navigation.
      if (target.scroll || prepare)
        // Let scroll-triggered viewport observers update resources; ready/prepare still explicitly await async business loading.
        await page.evaluate(
          () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
        );
      record.resources = await page.evaluate(
        async ({ selector, timeout }) => {
          const roots = [...document.querySelectorAll(selector)];
          if (!roots.length) throw new Error('resourceRoot matched no elements');
          const nodes = new Set(roots.flatMap((root) => [root, ...root.querySelectorAll('*')]));
          const urls = new Set();
          for (const el of nodes) {
            if (el instanceof HTMLImageElement) {
              const src = el.currentSrc || el.src;
              // Read current resources at the scene's scroll position without changing page lazy-loading behavior.
              if (src) urls.add(src);
            }
            for (const pseudo of [null, '::before', '::after']) {
              const background = getComputedStyle(el, pseudo).backgroundImage;
              for (const match of background.matchAll(/url\(\s*["']?([^"')]+?)["']?\s*\)/g)) urls.add(match[1]);
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
                  failed: results.filter((item) => !item.ok).map((item) => item.src),
                  fonts: document.fonts.status,
                };
              })(),
              new Promise((_, reject) => {
                timer = setTimeout(() => reject(new Error('Font or image readiness timed out')), timeout);
              }),
            ]);
          } finally {
            clearTimeout(timer);
          }
        },
        { selector: target.resourceRoot, timeout },
      );
      requireValue(record.resources.failed.length === 0, 'Resource loading or decoding failed');
      mark('resources');
      if (target.scroll) {
        record.scroll.actual = await page
          .locator(target.scroll.selector)
          .evaluate((el, axis) => (axis === 'x' ? el.scrollLeft : el.scrollTop), target.scroll.axis);
        requireValue(
          Math.abs(record.scroll.actual - record.scroll.requested) <= 1,
          'Requested scroll position was not reached; inspect scroll-snap, virtual lists, or other page behavior',
        );
      }
      const snapshot = await page.evaluate(
        async ({ measurements, checks }) => {
          await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
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
            ...checks.flatMap((rule) => [rule.selector, ...(rule.container ? [rule.container] : [])]),
          ]);
          const geometry = Object.fromEntries(
            [...selectors].map((selector) => [selector, [...document.querySelectorAll(selector)].map(rect)]),
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
      for (const key of ['dpr', 'zoom']) {
        if (plan.expected?.[key] !== undefined)
          requireValue(
            Math.abs(record.actual[key] - plan.expected[key]) < 0.001,
            `${key} does not match the capture contract`,
          );
      }
      if (plan.expected?.touch !== undefined)
        requireValue(
          record.actual.touchPoints > 0 === plan.expected.touch,
          'Touch capability does not match the capture contract',
        );
      for (const rule of target.checks || []) {
        const boxes = record.geometry[rule.selector];
        const tolerance = rule.tolerance ?? 0.5;
        let ok = boxes.length >= (rule.type === 'equal' ? 2 : 1);
        if (rule.type === 'equal')
          ok &&= boxes.every((box) => Math.abs(box[rule.metric] - boxes[0][rule.metric]) <= tolerance);
        if (rule.type === 'size') ok &&= boxes.every((box) => Math.abs(box[rule.metric] - rule.value) <= tolerance);
        if (rule.type === 'inside') {
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
      mark('geometry');
      // Capture diagnostic images after assertion failure; unready resources/devices produce no comparable image.
      const screenshot = {
        path: target.screenshot.path,
        scale: 'css',
        animations: 'allow',
      };
      if (target.screenshot.selector) {
        const box = await page.locator(target.screenshot.selector).boundingBox();
        requireValue(
          box &&
            box.x >= 0 &&
            box.y >= 0 &&
            box.x + box.width <= record.page.width &&
            box.y + box.height <= record.page.height,
          'Scroll the full element into view before capture to prevent automatic scrolling from invalidating geometry',
        );
        await page.locator(target.screenshot.selector).screenshot(screenshot);
      } else
        await page.screenshot({
          ...screenshot,
          fullPage: target.screenshot.fullPage ?? false,
        });
      mark('screenshot');
      record.screenshot = screenshot.path;
      record.ok = record.checks.every((check) => check.ok);
      if (!record.ok) record.error = 'Layout contract assertion failed';
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
      mark('cleanup');
      previousSucceeded = record.ok;
    }
  }
  return {
    ok: records.every((record) => record.ok),
    records,
    visualVerdict: 'pending',
  };
}

// Capture callers supply screenshot.path; static inspection neither requires that path nor connects to a browser.
export async function inspectPlan(plan) {
  return captureUI(null, plan, undefined, true);
}
