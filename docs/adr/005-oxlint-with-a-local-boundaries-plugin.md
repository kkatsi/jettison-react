# ADR-005: Enforce the architecture with oxlint, and own the layer rules

---

## Status

Accepted

## Date

2026-08-19

## Normative level

**MUST** (violations block merge)

## Context

The enforcement started as an ESLint flat config: `eslint-plugin-boundaries` for layer direction and module privacy, `@typescript-eslint/no-restricted-imports` for R1 and R5, `eslint-plugin-react-hooks` for correctness. It worked, and it was the showpiece the README points at.

Two things then pulled against each other. A second linter arrived — oxlint, carrying a vendored plugin of rules about _evidence_ rather than _structure_: no `unknown` at a boundary, no unexplained `as`, no lookup table that throws away the keys it was built from. And two linters mean two configs, two toolchains, and two answers to "why did this not fail in CI".

Collapsing them into one meant choosing which one survives. Oxlint is the faster tool by an order of magnitude (a full run in ~0.2s against ~2s) and is where the ecosystem is heading, so it was the obvious candidate — except that the layer rules are the whole product, and oxlint does not ship them.

Measured, not assumed: oxlint loads `eslint-plugin-boundaries` as a JS plugin without error, lints the file, and reports **nothing** on a fixture ESLint flags. That is the exact failure mode Chapter 1 §4 warns about — a config that matches nothing is indistinguishable from one that is satisfied — arriving silently. Oxlint's own `import` plugin has `no-cycle` and `no-relative-parent-imports`, but nothing that expresses "no sibling-module imports" or "index.ts is the only door".

## Decision

1. **Oxlint is the only linter.** ESLint, `typescript-eslint`, `eslint-plugin-boundaries`, `eslint-plugin-react-hooks` and `eslint-import-resolver-typescript` are removed. `npm run lint` is one command over one config, `oxlint.config.ts`.
2. **Layer direction and module privacy are a local plugin**, `tools/oxlint/jettison/`, in two rules: `jettison/layer-dependencies` and `jettison/module-privacy`. They classify a file and an import specifier by path prefix and compare the two.
3. **R1 and R5 stay configuration**, ported to oxlint's `no-restricted-imports` — which supports `allowTypeImports`, pattern groups and per-entry messages, so both rules survive intact, custom wording included.
4. **`fixtures/enforcement.test.ts` runs the oxlint CLI** over the fixture tree and asserts rule IDs from its JSON output, replacing the ESLint Node API it used before.

## Costs & sharp edges (be honest)

**We now own a lint rule, and nobody upstream maintains it.** `eslint-plugin-boundaries` had years of edge cases beaten out of it. Ours has the edge cases we thought of, which is a smaller set. It earns its place only because it is short and because the fixtures test it — but a rule you own is a rule you debug at 3am.

**Classification is prefix arithmetic, not resolution.** No resolver means no resolver to misconfigure — the single largest silent-failure mode of the old config is simply gone — but it also means the plugin believes the alias map hard-coded in it. Rename `@shared` in `tsconfig.json` and forget the plugin, and every import through the alias becomes unclassified and unpoliced. The gotcha moved; it did not disappear.

**Node 22.18 is now a floor.** Oxlint's TypeScript configs and TypeScript plugins need type stripping on by default. Below that oxlint refuses to run, which is the safe direction — but it prints the refusal on **stdout**, so a wrapper that only inspects stderr reads a dead toolchain as a clean run. The enforcement test checks for JSON and prints stdout when it does not find it, for exactly this reason.

**A dependency swapped for a file is not free.** The old config was 200 annotated lines and no logic. The new one is that config plus ~140 lines of plugin, and the plugin has branches: alias vs relative vs bare specifier, static vs dynamic import, inside vs outside the module. Branches need the fixtures more than configuration did.

**The messages read differently.** Oxlint prints the rule's own text and hangs the custom message off it as `help:`. The R1/R5 wording survives, one line lower than it used to sit.

## Alternatives considered

**Keep both linters.** Zero migration work and every rule keeps its battle-tested implementation. Rejected because it doubles the toolchain permanently: two configs to keep consistent, two commands, and a Node floor that applies anyway the moment a TypeScript oxlint plugin is loaded.

**Collapse into ESLint instead.** This was the recommendation, and it was cheap: the anti-slop rules ship `eslintCompatPlugin` — documented as converting an oxlint `createOnce` plugin "to also work with ESLint" — and running all fifteen under ESLint produced identical messages at identical lines, on a Node too old for oxlint. `eslint-plugin-boundaries` and the enforcement test would not have changed at all. It lost on the tool: oxlint is the faster linter and the one this repo would otherwise be recommending against the grain of where the ecosystem is going. The cost of that choice is the section above, accepted with open eyes.

**Reimplement the layers with oxlint's `import` rules.** `no-relative-parent-imports` plus a wall of `no-restricted-imports` patterns can approximate "modules may not import each other" — one pattern per module pair, regenerated whenever a module is added. Rejected: it is more configuration than the plugin is code, and it grows quadratically with the thing this architecture is designed to add cheaply.

## Consequences

**Positive** — one linter, one config, one command; a ~10× faster lint; no import resolver in the enforcement path, removing the failure mode that used to make the whole config silently pass; the evidence rules (Section 5) now apply to the app under the same run.

**Negative** — the architecture's two load-bearing rules are code we maintain; Node 22.18+ required for `lint` _and_ `test`; type-aware rules stay out of reach (`npm run type-check` owns whole-program truth, as before).

**Neutral** — rule IDs changed, so editor squiggles and CI output read `jettison(layer-dependencies)` and `eslint(no-restricted-imports)` where they used to read `boundaries/dependencies`; disable directives now use oxlint's own naming.

## Related

- [Chapter 1 §4 — Enforcement](../01-layers.md) — the rules and the gotchas that survive this change
- [`oxlint.config.ts`](../../oxlint.config.ts) — the config this ADR describes
- [`tools/oxlint/jettison/index.ts`](../../tools/oxlint/jettison/index.ts) — the two rules we now own
- [`fixtures/enforcement.test.ts`](../../fixtures/enforcement.test.ts) — the insurance that they fire
