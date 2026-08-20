# tools/oxlint

Two plugins. One was written for this repo; the other is somebody else's work, copied in.

## `jettison/` — ours

125 lines of rule code registering `layer-dependencies` and `module-privacy`: imports flow `app → modules → shared → core`, and a module is reachable only through its `index.ts`. It exists because no linter ships a layer matrix — and it is short because a layer is a path prefix and so is an alias, which makes classifying both ends of an import string work. [ADR-005](../../docs/adr/005-oxlint-with-a-local-boundaries-plugin.md) is the decision; [Chapter 1](../../docs/01-layers.md) is the reasoning.

The copy in [`skills/jettison/assets/`](../../skills/jettison/assets/jettison/index.ts) is this file, so a repo adopting the architecture gets the rules with the skill. `npm run skill:check` fails in CI if the two drift.

## `anti-slop/` — **Dillon Mulroy's**

[dmmulroy/anti-slop](https://github.com/dmmulroy/anti-slop), MIT, vendored verbatim from upstream `main` at commit `6d53855`, minus its opt-in Effect rules. Fifteen rules about the type a value carries — no `unknown` parameter standing in for a known shape, no `as` without a `SAFETY:` line, no lookup table that throws away its keys. Section 5 of [`oxlint.config.ts`](../../oxlint.config.ts) enables all fifteen at `error`; [ADR-006](../../docs/adr/006-evidence-preserving-types.md) is why, including the costs.

Not our code, not our taste, not our maintenance. [`anti-slop/LICENSE`](anti-slop/LICENSE) is upstream's and travels with the copy.

**Why a copy rather than a dependency:** because that is how upstream ships it — _"this project is meant to be vendored, not treated as a fixed npm dependency"_ — and `tools/oxlint/anti-slop/` is the path its own install instructions name. An oxlint plugin is loaded by path, so vendoring is the install, not a workaround for one.

**Nothing in that folder is edited.** It is excluded from lint, from type-check, and from the formatter ([`.prettierignore`](../../.prettierignore) says so and why). An upgrade is a re-copy from upstream at a named commit, which is a deliberate act somebody has to remember — the price of the sentence above. What that discipline buys is that "how far behind are we" stays a diff instead of an archaeology exercise, so a rule that argues with our code gets answered in `src/`, never in here.
