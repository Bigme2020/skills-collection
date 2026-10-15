# 通用 UI 取证工具

批量截图、资源就绪、滚动或几何检查时读取本文件。机制通用，任务提供业务契约；不内置域名、路由、设计宽度、组件选择器、等高要求或通过标准。

## 入口

复用现有 `playwright-cli` session，先按项目规则创建真实桌面／移动 context。工具只调整 viewport 并导航／刷新，**不会创建或切换设备模式**。先用 `command -v playwright-cli` 和 `--version` 确认可用；遵守项目依赖安装权限，不自动下载工具。

从被测仓库运行（Node 18+）：

```bash
node <skill目录>/scripts/ui-evidence.mjs <plan.json> <session名称> <输出目录>
```

输出目录使用任务临时／证据目录，放仓库外或已忽略路径；每个源码修订／批次使用独立目录。CLI 不覆盖任务预算或修改业务源码。支持 `--help`。

工具读取 Git HEAD、tracked diff 与 untracked 内容身份；捕获前后来源变化则失败。**这只是本地 checkout 身份，不证明运行中的服务使用了该源码**。调用者仍须核实服务 cwd、构建输入与版本，再在共享检查点关联清单；`servedRevision: unverified` 不得擅自当作已验证。源码身份采集不包含 ignored 文件，如它们影响渲染，调用者必须另行固定并记录。

## 任务配置

以下为合成示例，不是默认验收要求；只填写当前契约确认的关系：

```json
{
  "timeoutMs": 10000,
  "expected": { "touch": true, "dpr": 2, "zoom": 1 },
  "targets": [
    {
      "id": "mixed-layout",
      "url": "https://example.test/preview?state=mixed",
      "viewport": { "width": 360, "height": 760 },
      "ready": "[data-page-ready]",
      "resourceRoot": "main, footer",
      "measurements": { "items": "[data-card]", "footer": "footer" },
      "checks": [
        { "type": "equal", "selector": "[data-card]", "metric": "height", "tolerance": 0.5 },
        { "type": "equal", "selector": "[data-card]", "metric": "y", "tolerance": 0.5 }
      ],
      "screenshot": { "fullPage": false }
    }
  ]
}
```

- `defaults` 放共享 `ready/resourceRoot/measurements/checks/screenshot`，目标只写差异。标量与 `checks` 数组整体覆盖；`measurements/screenshot` 按字段合并，不隐式拼接断言。`expected/timeoutMs` 仍位于计划顶层。
- `targets` 顺序执行，可将最有诊断价值的混排状态放在前面；仍需覆盖全部契约目标。`id` 唯一，只含字母、数字、`_`、`-`。
- 每项必须指定可见 `ready` 和 `resourceRoot` CSS 选择器。`url` 缺省时刷新当前页；需要点击、输入或额外 ready 条件时使用下述函数入口，不增加通用业务动作 DSL。
- `expected` 检查 DPR、zoom 和触摸能力。触摸点、UA 和屏宽都只是实测信号，**不单独证明移动模式**；context 创建参数由操作者记录在捕获契约中。
- `resourceRoot` 限定图片检查范围（含根节点、后代及伪元素 CSS 背景图）。等待字体、`img` 和背景图片解码，记录失败资源；有界超时，不依赖全页 networkidle。SVG `<image>`、canvas、视频、JS 动画和特殊组件状态由页面适配检查，不伪称全覆盖。
- `measurements` 返回每个选择器的全部元素边界。断言失败也保留诊断截图；资源／设备未就绪则不产生可比较图。字段 `ok` 只表示已配置的机械检查通过，不是视觉验收。
- `checks`：`equal` 检查至少两个匹配元素的某一边界值一致；`size` 检查全部匹配元素的值等于指定 `value`；`inside` 检查全部匹配元素在唯一 `container` 内。`metric` 为 `x/y/right/bottom/width/height`。无匹配不能通过。`tolerance` 单位为 CSS px，默认 0.5，仅吸收布局取整，不是视觉相似度阈值。
- `screenshot.fullPage` 只覆盖 document，不会自动展开嵌套滚动区；可用 `screenshot.selector` 指定元素图；该元素须先完整进入视口，否则工具报错，避免截图自动滚动使已记录几何失效。关系／滚动验证优先使用视口图并显式指定滚动位置。CLI 自动填写截图路径；函数入口必须填写绝对 `path`。

### 同一场景连续取证

同一 URL、设备和数据准备下的首屏、横滚末尾或操作后状态，可用 `steps` 复用一次导航。每个捕获点仍独立重验资源、测量、断言并截图；结果 ID 为 `场景id-捕获点id`。普通 targets 仍保持逐项导航行为，旧配置无需迁移。

```json
{
  "defaults": { "ready": "main", "resourceRoot": "main, footer" },
  "targets": [{
    "id": "mixed-small",
    "url": "https://example.test/preview?state=mixed",
    "viewport": { "width": 360, "height": 760 },
    "steps": [
      { "id": "start" },
      { "id": "end", "scroll": { "selector": ".scroller", "axis": "x", "to": "end", "requireOverflow": true } }
    ]
  }]
}
```

CLI 为每个 step 自动生成截图路径；函数入口自行填写各 step 的 `screenshot.path`。同场景后续 step 禁止重设 URL/viewport，需要改变时另建场景。后续捕获点继承前一个实际页面状态（包括滚动），**不会自动归零或恢复选中**；任务用已有 prepare 回调明确完成恢复／点击，不增加动作 DSL。前一捕获点失败则阻断其后复用点，其他独立场景可继续。共享配置不等于共享通过结论，资源与设备信号每点重新检查，不跨导航缓存。

### 滚动场景

在目标上声明：

```json
{
  "scroll": { "selector": ".scroller", "axis": "x", "to": "end", "requireOverflow": true },
  "checks": [
    { "type": "inside", "selector": ".item:last-child", "container": ".scroller" }
  ]
}
```

滚动发生在资源检查前。每项只测试一个明确位置；首尾、不同轴分别作为场景。无溢出返回 `not_applicable`，只有 `requireOverflow: true` 才失败。需要短视口压力场景时由契约明确提供；工具不会为了通过测试自动缩小视口。

**程序设置滚动位置仅证明可达性，不证明真实触摸／滚轮手势与纵横滚动互不干扰。** RTL、scroll-snap、虚拟列表、无限加载等特殊滚动应先验证工具适用性，必要时用页面适配。工具不模拟安全区、不点击重试、不推导默认选中业务。

## 函数入口与适配边界

`captureUI` 是自包含异步函数，接受现有 Playwright `page`，可直接供项目 E2E 和截图共用：

```js
import { captureUI } from '<skill目录>/scripts/capture-ui.mjs';

const result = await captureUI(page, plan);
// 或传一个可选 prepare(page, target) 回调，在每个目标导航后准备业务状态。
// 回调复用已有 fixture／用户操作；通用工具不理解业务动作。
// result.ok 必须检查；视觉结论始终是 pending，仍需模型看图。
```

任务需要导航后的点击／重试时，使用函数入口的 `prepare` 回调：在导航完成后、就绪与捕获前执行已授权业务操作或额外等待。CLI 仅接受 JSON，不执行配置里的代码；需要业务适配时用项目已有 Playwright 测试入口导入同一函数。普通页面优先固定 URL／fixture，布局测量及断言仍共用函数，不复制整段脚本。

## 证据和交付

CLI 生成 `manifest.json`、截图及原始 stdout/stderr。每个 record 的 `timingsMs` 分列导航、准备、就绪、滚动、资源、几何、截图和清理耗时；prepare 中的业务操作记在准备阶段。CLI stdout 自动汇总失败与阶段耗时，不必再人工拼验证摘要。

已有清单使用稳定摘要／比较入口：

```bash
node <skill目录>/scripts/evidence-summary.mjs <manifest.json>
node <skill目录>/scripts/evidence-summary.mjs <before.json> <after.json>
```

比较要求两份标准清单的目标 ID／测量选择器一致，机械输出覆盖缺口及几何差异；不同场景命名需由任务适配统一身份后再比较。不用工具替代图片查看、业务行为或协议特有比较；常规任务不再另写通用结果摘要／几何比较器。

清单包含实际浏览器／视口、字体／资源状态、几何和断言、滚动方式、源码身份、PNG 尺寸及 SHA-256；以原子写入保存。任一目标失败或源码变化，进程非零退出，已成功目标的证据仍保留。配置错误可阻止整批开始，不用外层 shell 成功替代内部 `ok`。

通用工具不判断设计一致、裁剪映射是否正确、业务行为是否满足，亦不设置 `visualVerdict: passed`。模型读取有效图片完成视觉判断；共享检查点记录契约、预算、观察和限制，引用清单，不重复抄录全部测量数据。收尾格式以主 skill 的 Handoff 为唯一规则。

## 自测

在已经安装 `@playwright/test` 的项目目录运行，不安装额外依赖：

```bash
node --test <skill目录>/scripts/*.test.mjs
```

测试使用独立本地合成页面和隔离浏览器 context，不访问业务服务。默认调用已有 Chrome channel；自测要求该浏览器已安装。覆盖混排不等高失败、资源失败、滚动不适用、横纵可达性、零匹配、捕获超时和设备信号错误；并不代表真机或旧浏览器验证。
