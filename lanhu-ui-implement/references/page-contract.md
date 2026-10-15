# Page and artboard contract

Read this reference in Step 1 before implementation. Draft known conditions from the user's request and project rules; mark missing artboard selection, dimensions, and other design-dependent fields as pending rather than guessing or asking the user for information Lanhu can provide. Finalize them from current Lanhu evidence in Step 2. Capture conditions specify the intended setup; verify actual browser state and readiness at capture time.

## Capture contract

For one artboard, store its complete capture conditions directly in its checkpoint. For multiple artboards with substantial shared conditions, optionally record those once and use explicit references with per-artboard overrides. Resolve the following for every artboard:

- shared or distinct page entry and reproducible variant state;
- original design width and height;
- browser viewport CSS width and height;
- DPR, zoom, browser, and browser version;
- the explicit scale between the design and browser screenshot;
- the page range, crop, and whitespace contained in both images;
- the real device mode, such as PC, H5, in-app, or out-of-app;
- fixed business state and data;
- scroll position;
- font and image readiness;
- animation state.

Different resolutions are comparable only through a proved uniform scale, such as `750x1624` to `375x812`. Horizontal and vertical scale must match. If crop, offset, scale, page range, or device state cannot be proved, stop comparison and correct capture conditions under the agent's control, following the main loop's retry limit. Ask the user only for missing evidence or a required decision that cannot be resolved from current sources.

Use the project's real device switch, reload, wait for fonts and images, freeze animations, and capture the complete required page range. Record the design-unit conversion from the project assertions rather than assuming a viewport.

## Artboard contract

Record one compact contract per artboard:

- `required`: variant-specific regions that must be visible;
- `forbidden`: regions that must not appear in this variant;
- `excluded`: external chrome removed from the implementation and comparison;
- `layout relationships`: for each layout-critical region, what it stays attached to, whether nearby content leaves space for it, the visible-boundary or reserved-container evidence, and whether the user confirmed it or authorized inference;
- reference to its capture conditions above, without duplicating those fields.

For each major container, specify whether its height follows content, fills available space, or is fixed by the design. Distinguish the page shell, scroll container, and inner content cards; artboard height does not establish card height.

混排关系按组明确：不同内容类型和加载／成功／失败状态之间，哪些边缘、基线、内图、间距或角标锚点应一致，哪些差异是设计有意保留。将证据或用户确认绑定到关系；不把等高当作通用默认。标明最有诊断价值的代表状态，供基线优先检查，仍保留所有变体的独立契约和完整覆盖。

Keep the contract at region level: requirements, capture conditions, and relationship decisions belong here; observed geometry, check results, and repair history belong in the checkpoint or linked check evidence. Reference these records rather than copying them between files. Do not enumerate design nodes, CSS properties, or recreate the Lanhu result. Keep relationships and acceptance independent per artboard. Preserve referenced shared conditions with the evidence on exit; expand the effective contract, including dynamic ignores, when dispatching an independent reviewer. A shared-condition change invalidates affected prior checks.

## Authorized exclusions

Treat unmistakable operating-system chrome used only to frame a device mockup as external by default. This includes clock, signal and battery rows, gesture or Home Indicators, Android system bars, device frames, and hardware cutouts. Keep them only when the request explicitly asks for a device mockup.

Other regions remain in scope unless the user, requirement, or project rule assigns them to an external container. Appearance alone does not make an app bar, WebView title bar, navigation area, or blank region external.

For each exclusion, record the artboard, visible boundary or description, reason, and authorization source.

Exclusion means removal of the external graphic, not imitation. Render no element or placeholder merely to reproduce external chrome, and exclude its graphic from the comparison. Preserve page-owned spacing and device-required safe-area clearance according to the rule below. Rebase ordinary top and normally ordered page content to the corresponding page origin, but move each layout-critical region according to its recorded relationship. A region attached to the bottom of the visible browser area keeps its bottom distance; a page-bottom region stays at the page bottom; a region attached to a parent keeps its relationship to that parent. Do not apply a removed top region's offset to every region. The design and browser ranges may then have different total heights; compare only their proved in-scope ranges.

### Bottom safe area and minimum spacing

When an artboard includes a system Home Indicator, exclude the indicator graphic but inspect the safe-area clearance and minimum spacing required by the adjacent bottom operation area, popup, or panel. Prefer explicit design annotations for the minimum distance; otherwise infer it from content-to-container edge relationships. When top and bottom spacing are symmetric, the top spacing of that same region may establish the minimum bottom distance. Record the value, unit, and annotation or inference evidence in the layout contract. If unresolved, confirm the relationship through the main workflow rather than substituting a universal indicator height.

Prefer the project's SafeSpace / useSafeSpace or equivalent abstraction, and verify parameter units. By default, use `actual safe-area clearance = max(system safe-area distance, design-required minimum distance)`. Add the two only when the design explicitly requires safe-area clearance in addition to ordinary bottom padding; count each spacing requirement once. Place a spacer below the content and ensure Flex layout cannot shrink it.

With a zero safe area, verify the minimum spacing. With a nonzero safe area, verify clearance and absence of duplicate spacing. Symmetry establishes the visual minimum for a zero safe area; it does not require symmetric spacing on devices with a safe area. Exclude the system-rendered indicator from comparison without automatically cropping justified page spacing or safe-area clearance, or treating either as excess whitespace.

## Dynamic content

Fix dynamic values when possible. Otherwise record the content selector and reason, then ignore only that value during semantic comparison. Continue checking its wrapper's position, dimensions, background, border, spacing, and typography. Do not hide the whole region with an image mask.
