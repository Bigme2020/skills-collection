#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

// 清单摘要只表示机械检查；不生成视觉通过结论。
export function summarize(result) {
  const timingsMs = {};
  for (const record of result.records) {
    for (const [key, value] of Object.entries(record.timingsMs || {}))
      timingsMs[key] = (timingsMs[key] || 0) + value;
  }
  return {
    ok: result.ok,
    targets: result.records.length,
    screenshots: result.records.filter((record) => record.screenshot).length,
    failures: result.records
      .filter((record) => !record.ok)
      .map(({ id, error, checks }) => ({
        id,
        error,
        checks: checks?.filter((check) => !check.ok),
      })),
    timingsMs,
    visualVerdict: "pending",
  };
}
export function compare(before, after, tolerance = 0.5) {
  if (!Number.isFinite(tolerance) || tolerance < 0)
    throw new Error("tolerance 必须是非负有限数");
  const differences = [];
  const oldRecords = new Map(
    before.records.map((record) => [record.id, record]),
  );
  const newRecords = new Map(
    after.records.map((record) => [record.id, record]),
  );
  if (
    oldRecords.size !== before.records.length ||
    newRecords.size !== after.records.length
  )
    throw new Error("清单 id 不唯一");
  for (const id of new Set([...oldRecords.keys(), ...newRecords.keys()])) {
    const left = oldRecords.get(id),
      right = newRecords.get(id);
    if (!left || !right) {
      differences.push({ id, reason: "目标覆盖不同" });
      continue;
    }
    for (const selector of new Set([
      ...Object.keys(left.geometry || {}),
      ...Object.keys(right.geometry || {}),
    ])) {
      const a = left.geometry?.[selector],
        b = right.geometry?.[selector];
      if (!a || !b || a.length !== b.length) {
        differences.push({ id, selector, reason: "测量覆盖不同" });
        continue;
      }
      a.forEach((box, index) => {
        for (const metric of ["x", "y", "width", "height", "right", "bottom"]) {
          if (
            !Number.isFinite(box[metric]) ||
            !Number.isFinite(b[index][metric]) ||
            Math.abs(box[metric] - b[index][metric]) > tolerance
          )
            differences.push({
              id,
              selector,
              index,
              metric,
              before: box[metric],
              after: b[index][metric],
            });
        }
      });
    }
  }
  return {
    before: summarize(before),
    after: summarize(after),
    geometryEquivalent: differences.length === 0,
    differences,
    visualVerdict: "pending",
  };
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    const [first, second] = process.argv.slice(2);
    if (!first || first === "--help")
      console.log(
        "用法：node evidence-summary.mjs <manifest.json> [对比manifest.json]；比较要求同目标ID/选择器，输出JSON，不代替看图。",
      );
    else {
      const before = JSON.parse(readFileSync(first, "utf8"));
      const result = second
        ? compare(before, JSON.parse(readFileSync(second, "utf8")))
        : summarize(before);
      console.log(JSON.stringify(result, null, 2));
      process.exitCode = second
        ? result.before.ok && result.after.ok && result.geometryEquivalent
          ? 0
          : 1
        : result.ok
          ? 0
          : 1;
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
