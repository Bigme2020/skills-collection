import { test } from "node:test";
import assert from "node:assert/strict";
import { summarize, compare } from "./evidence-summary.mjs";
const box = { x: 0, y: 0, width: 80, height: 80, right: 80, bottom: 80 };
const result = {
  ok: true,
  records: [
    {
      id: "a",
      ok: true,
      screenshot: "a.png",
      geometry: { ".item": [box] },
      timingsMs: { resources: 10, screenshot: 20 },
    },
  ],
};
test("摘要、同几何比较不冒充视觉验收", () => {
  assert.deepEqual(summarize(result).timingsMs, {
    resources: 10,
    screenshot: 20,
  });
  assert.equal(
    compare(result, structuredClone(result)).geometryEquivalent,
    true,
  );
  assert.equal(compare(result, result).visualVerdict, "pending");
});
test("缺目标、缺元素、几何变化及失败结果可识别", () => {
  assert.equal(
    compare(result, { ok: true, records: [] }).geometryEquivalent,
    false,
  );
  const other = structuredClone(result);
  other.records[0].geometry[".item"][0].height = 86;
  assert.equal(compare(result, other).geometryEquivalent, false);
  other.records[0].ok = false;
  other.ok = false;
  assert.equal(summarize(other).failures.length, 1);
  assert.throws(() => compare(result, other, -1));
});
