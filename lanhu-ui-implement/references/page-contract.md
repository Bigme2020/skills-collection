# Page and artboard contract

Read in Step 1. Draft from the request and project rules, leaving design-dependent fields pending; resolve them from current Lanhu evidence in Step 2 rather than guessing or asking for information Lanhu can supply. Record intended conditions here and verify actual conditions at capture time.

## Capture contract

Store conditions in each target's checkpoint. Shared conditions may be recorded once with explicit per-artboard overrides; preserve referenced records and resolve them fully for an independent reviewer.

For every artboard, establish:

- Entry and reproducible variant/business data; real device mode, including in-app/out-of-app state.
- Browser/version, viewport CSS dimensions, DPR, and zoom.
- Original design dimensions, project unit conversion, uniform screenshot scale, crop, page range, and included whitespace.
- Scroll position, font/image readiness, and animation state.

Use the appropriate real device context through `playwright-cli`, apply any project device switch, then refresh and await fonts, images, and stable state before capture. Screen dimensions alone do not establish device mode.

For corresponding-artboard comparison, prove range/crop mapping and equal horizontal/vertical scale. Correct controllable conditions before comparing, under the main retry bound; ask only for uncertainty current sources cannot resolve. Pressure scenarios within selected device scope instead test reflow, reachability, occlusion, and visual integrity, without requiring whole-artboard scaling or adding platforms/artboards. A missing matching design limits equivalence claims, not judgment of visible defects.

## Artboard contract

Keep one region-level record per artboard:

- `required`, `forbidden`, and `excluded` regions, with the exclusion basis below.
- `layout relationships`: each critical region's attachment, neighboring reserved space, visible-boundary/container evidence, and sourced judgment or user decision.
- Its capture conditions or resolved shared reference.

Distinguish page shell, scroller, and inner cards; specify content-driven, fill, or fixed height from their own relationships, not total artboard height. For mixed content/states, identify intentional differences and matching edges, baselines, inner images, gaps, and badge anchors rather than assuming equal height. Name diagnostic representatives for baseline-first inspection without reducing variant coverage. Absolute positioning alone does not establish overlap.

Keep observed geometry, check results, and repair history in checkpoint evidence, not duplicated contracts. Record requirements and relationships rather than enumerating design nodes/CSS properties or recreating Lanhu output. Acceptance stays independent per artboard; shared-condition changes invalidate affected evidence under the main validity rule.

## Authorized exclusions

Unmistakable OS chrome framing a device mockup is external by default: clock/signal/battery rows, gesture/Home Indicators, Android system bars, device frames, and hardware cutouts. Include it only for an explicitly requested device mockup. App/WebView bars, navigation, and blank regions remain in scope unless user/requirements/project rules assign them outside the page.

Record each exclusion's artboard, boundary/description, reason, and authority. Remove the graphic from implementation/comparison rather than imitating it with placeholders, while preserving page-owned spacing and system clearance.

Rebase ordinary top/in-flow content to the page origin. Move other regions by their recorded attachment: viewport-bottom retains viewport distance, page-bottom stays at page bottom, and parent-attached content retains that relationship. A removed top strip is not a global offset. Compare proved in-scope ranges even when resulting total heights differ.

### Bottom safe area and minimum spacing

Excluding a Home Indicator does not remove the adjacent operation area's minimum bottom spacing. Prefer annotations; otherwise infer the minimum from content/container edges, including same-region symmetry when supported. Record value, unit, and basis; resolve remaining ambiguity through the main workflow, not a universal indicator height.

Reuse project safe-area facilities, verifying units and parent clearance. Combine design minimum and system clearance by replacement, maximum, or addition according to actual design/project semantics; count each space once without imposing a component or spacer. At zero safe area verify the minimum; at nonzero verify clearance without duplication. Symmetry may establish the zero-area minimum, not symmetric spacing on every device. Preserve justified spacing when excluding the system graphic.

## Verification-environment interference

Before the baseline, move/disable an occluding verification aid only when its identity and lack of retention requirement are established. Use existing controls in the verification browser context, recording restoration; keep shared initialization unchanged. Investigate uncertain identity/impact before asking. Preserve business overlays, real errors, and required UI and address their impact rather than hiding defects.

## Dynamic content

Fix dynamic values where possible. Otherwise record selector/reason and ignore only the value, still judging wrapper position, dimensions, background, border, spacing, and typography. Do not mask the whole region.
