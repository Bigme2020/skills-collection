# Skill evaluation

`evals.json` checks workflow decisions. Its text-only cases do not measure visual detection or implementation quality.

For image-backed evaluation, bind each case to original design images, matching render captures and capture conditions, plus an implementation entry when repairs are evaluated. Keep user-calibrated expected findings separate from the agent's input. Use three tasks:

| Task | Agent input | Assess |
| --- | --- | --- |
| Design interpretation | Design, annotations, assets, project constraints | Correct layout relationships, typography, asset composition, and supported inferences |
| Difference detection | Design and current render, without defect hints | Missed differences, false positives, regional coverage, and verdict accuracy |
| Repair and acceptance | Current design and a reproducible implementation | Resolved differences, regressions, remaining defects, and false passes |

Include near-matching pages with typography/spacing/crop errors, repeated-item variations, and correctly rendered controls. Use both whole-page and regional evidence. Keep source identity, model/reasoning settings, device conditions, raw findings, and resulting captures with each result. Repeat cases to assess variation and include an unfamiliar design before claiming general improvement.

No image fixtures or model-run results are bundled yet. Populate cases from actual reviewed artifacts; keep historical implementations and answer keys outside new implementation contexts. Report text-case checks, image evaluations, and end-to-end runs separately.
