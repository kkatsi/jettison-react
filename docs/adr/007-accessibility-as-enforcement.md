# ADR-007: Enforce the accessibility rules, and say what they cannot reach

---

## Status

Accepted

## Date

2026-08-19

## Normative level

**MUST** (violations block merge)

## Context

The four chapters police structure, and section 5 polices types. Nothing in either polices whether the console can be operated. That gap has a specific shape in a repo built on this thesis: an architecture whose whole argument is _enforced, not asserted_ had one quality dimension — the one a linter can genuinely check for a frontend — left entirely to review. Accessibility was described as arriving with the kit ([ADR-003](003-shadcn-on-base-ui-as-the-kit.md)) and never checked anywhere.

What made this actionable is what enabling the rules found. Not a stylistic drizzle: **the release wizard could not be completed with a keyboard.** The cover-art file input carried `className="hidden"`, so `display: none` took it out of the tab order, and no button existed beside it to click it — while every static check stayed green, the screen looked right, and the screenshots showed nothing. A label manager who cannot use a mouse could not give a release its cover, and nothing in the repo could have told anyone.

## Decision

1. **Section 6 of `oxlint.config.ts` enables all thirty-six `jsx-a11y` rules at `error`**, listed one by one rather than left to a category, so the config states a decision about each. This is [R14](../03-component-pattern.md).
2. **Two rules carry options that restore the upstream defaults.** `no-noninteractive-element-interactions` gets jsx-a11y's own handler list (pointer and keyboard, not drag: a drop target has no keyboard equivalent to demand, which is exactly why the input beside it must be reachable on its own). `label-has-associated-control` is told that `FilePicker` is a control, because the rule cannot see into a component.
3. **One exemption, by filename.** `src/shared/ui/input-group.tsx` came from the registry, and ADR-003 §5 forbids editing inside generated files so that `shadcn add --diff` keeps working. Three rules are off for that one file; the rest of the kit is policed like any other folder.
4. **The fix for the finding was the control, not the rule.** The cover picker is `sr-only` rather than `hidden` — in the tab order, named by the label that wraps it — and the label carries the focus ring the clipped input cannot show. The tracks picker stays hidden, because the focusable "Add track" button beside it already clicks it and a second tab stop would only duplicate it. That asymmetry is written in both files.
5. **`e2e/` asserts the reachability, because lint cannot.** The submit journey focuses the cover picker and requires it to take focus, which fails on `display: none`.

## Costs & sharp edges (be honest)

**Green lint is not accessible, and this ADR is where that has to be said.** All thirty-six rules are static: they read JSX and know nothing about focus order, contrast, reading order, a live region that announces too often, or a control that is visible and unreachable. Turning them on produced nine findings, and **not one of them was the keyboard bug.** It came from reading the file a neighbouring rule pointed at — `label-has-associated-control` fired on the label, and the input inside it turned out to be `display: none` — and it was confirmed by tabbing through the screen. The rules would not report it today either. Enforcement raises the floor; it does not certify the building.

**Thirty-six lines of config that mostly do nothing here.** `media-has-caption`, `iframe-has-title`, `no-distracting-elements` and several others have no matching syntax in this codebase and may never fire. They are listed anyway, because a partial set is a preference and the point of section 6 is that the decision was made once, for all of them. The cost is a config section that reads longer than its findings justify.

**The exemption is a file, and files get renamed.** `src/shared/ui/input-group.tsx` is matched by name. A registry rename, or the same pattern arriving in a second generated component, silently produces either a new error or a new exemption request — and the second one is the dangerous shape, because the honest answer ("upstream does this and we do not edit generated files") is also the easy excuse.

**`sr-only` is a focus trap for the eye, not the keyboard.** A clipped input can take focus with nothing visible to show it. The console answers with `has-[input:focus-visible]:` on the wrapping label, which means the focus indicator for that control now lives on a _different element_ than the control — one more thing that a refactor can quietly drop, with no rule to catch it. It was verified by driving a real browser: twelve tab stops to reach the picker, `:focus-visible` matching, a 3px brand ring painted on the label.

**No screen-reader verification.** Nothing here was tested with VoiceOver or NVDA. The rules check markup, the browser suite checks reachability, and announcement order remains unverified — stated rather than implied.

## Alternatives considered

**Leave the plugin off and keep accessibility a review concern.** What the repo did until now. Rejected on the evidence it produced the moment it was tested: a wizard step that could not be completed without a mouse, in a codebase that had already been reviewed screen by screen.

**Enable only the `correctness` category and let oxlint choose.** Cheapest to write, and it would have caught most of the real defects. Rejected because the config is the showpiece: "we turned on whatever the linter defaults to" is not a decision anyone can copy or argue with, and the two option overrides above would have been invisible.

**Fix the finding and skip the rules.** Tempting, and the honest case for it is above: the rules did not find the bug that matters, and four of their nine findings were preferences. Rejected because it is the exact move this repo exists to argue against — the fix without the check is a rule demoted to advice, and the next `hidden` input arrives on a Friday.

**Exempt `src/shared/ui/**` wholesale for the three rules the registry trips.** One line shorter, and wrong: the kit is where accessibility matters most, and a folder-wide exemption would have covered nine hand-written components to spare one generated file.

## Consequences

**Positive** — the console can be operated from the keyboard where it could not be, the one frontend quality a linter can check is now checked at `error`, and the exemption and its reason are in the config rather than in someone's memory.

**Negative** — a long config section with a low hit rate, a filename-matched exemption that can rot, a focus indicator that lives one element away from its control, and no screen-reader coverage.

**Neutral** — two file inputs in the same module are deliberately different, and both say why in place.

## Related

- [Chapter 3, R14](../03-component-pattern.md) — the law this ADR enforces
- [Chapter 3 §5](../03-component-pattern.md) — the testing doctrine, and what `e2e/` is for
- [ADR-003 §5](003-shadcn-on-base-ui-as-the-kit.md) — why a generated file is exempted rather than fixed
- [ADR-006](006-evidence-preserving-types.md) — the other rule set that arrived as a block, and its costs
- [`oxlint.config.ts`](../../oxlint.config.ts) — section 6 and the one exemption
- [`fixtures/src/modules/catalog/violations/InaccessibleView.tsx`](../../fixtures/src/modules/catalog/violations/InaccessibleView.tsx) — the violating fixture the suite asserts on
