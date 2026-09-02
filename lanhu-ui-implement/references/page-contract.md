# Page and artboard contract

Read this reference in Step 1 before implementation. Draft each contract from the user's request and project rules, then finalize evidence-dependent layout relationships after reading the current Lanhu evidence in Step 2.

## Capture contract

Record the following for every artboard:

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

Different resolutions are comparable only through a proved uniform scale, such as `750x1624` to `375x812`. Horizontal and vertical scale must match. Stop comparison and request a corrected capture when the contract cannot prove the crop, offset, scale, page range, or device state.

Use the project's real device switch, reload, wait for fonts and images, freeze animations, and capture the complete required page range. Record the design-unit conversion from the project assertions rather than assuming a viewport.

## Artboard contract

Record one compact contract per artboard:

- `required`: variant-specific regions that must be visible;
- `forbidden`: regions that must not appear in this variant;
- `excluded`: external chrome removed from the implementation and comparison;
- `layout relationships`: for each layout-critical region, what it stays attached to, whether nearby content leaves space for it, the visible-boundary or reserved-container evidence, and whether the user confirmed it or authorized inference;
- page entry, variant state, device mode, fixed data, and comparable page range.

Keep the contract at region level. Do not enumerate design nodes, CSS properties, or recreate the Lanhu result.

## Authorized exclusions

Treat unmistakable operating-system chrome used only to frame a device mockup as external by default. This includes clock, signal and battery rows, gesture or Home Indicators, Android system bars, device frames, and hardware cutouts. Keep them only when the request explicitly asks for a device mockup.

Other regions remain in scope unless the user, requirement, or project rule assigns them to an external container. Appearance alone does not make an app bar, WebView title bar, navigation area, or blank region external.

For each exclusion, record the artboard, visible boundary or description, reason, and authorization source.

Exclusion means removal, not imitation: render no element, spacing, blank placeholder, padding, margin, or offset for it. Crop the excluded pixels from the design comparison range. Rebase ordinary top and normally ordered page content to the corresponding page origin, but move each layout-critical region according to its recorded relationship. A region attached to the bottom of the visible browser area keeps its bottom distance; a page-bottom region stays at the page bottom; a region attached to a parent keeps its relationship to that parent. Do not apply a removed top region's offset to every region. The design and browser ranges may then have different total heights; compare only their proved in-scope ranges.

## Dynamic content

Fix dynamic values when possible. Otherwise record the content selector and reason, then ignore only that value during semantic comparison. Continue checking its wrapper's position, dimensions, background, border, spacing, and typography. Do not hide the whole region with an image mask.
