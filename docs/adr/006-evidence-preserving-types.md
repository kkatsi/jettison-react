# ADR-006: Enforce evidence-preserving types with a vendored rule set

---

## Status

Accepted

## Date

2026-08-19

## Normative level

**MUST** (violations block merge)

## Context

The four chapters police _structure_: which folder a file lives in, which layer it may import, which of view, hook or service owns a decision. Nothing in them polices what happens to a **type** once it is inside the right file.

That gap has a shape. A boundary parses a payload into `Release`, and three files later a function takes `unknown` and asserts its way back to `Release`. A lookup table typed `Record<PipelineStage, Chip>` throws away the fact that it has an entry for every stage, so the next reader indexes it with a plain `string` and gets a `Chip` that isn't there at runtime. A `typeof value === 'string'` check narrows a representation without ever establishing a contract. None of this fails a review reliably, because each instance is locally reasonable — and none of it fails a build, which is the point: it compiles forever and is wrong the first time the payload changes.

Two facts made this actionable. The rules already exist as a maintained set: [anti-slop](https://github.com/dmmulroy/anti-slop) by Dillon Mulroy, MIT, fifteen of them, generic, no project vocabulary. And running them against this codebase produced 67 findings in application code — not a stylistic drizzle but four recurring patterns, one of them 36 instances of the same unexplained cast.

## Decision

1. **Section 5 of `oxlint.config.ts` enables all fifteen rules at `error`**, alongside the structural sections. This is [R13](../03-component-pattern.md).
2. **The rule source is vendored**, at `tools/oxlint/anti-slop/`, and excluded from lint and type-check. It is a dependency that happens to live in the repo, not code we maintain. The copy is verbatim from upstream `main` at commit `6d53855`, minus its opt-in Effect rules, and [upstream's licence](../../tools/oxlint/anti-slop/LICENSE) travels with it.
3. **One exemption, stated in the config:** `src/mocks/` — five of the rules — because the simulated backend fabricates its own data and asserts on JSON it just produced. Parsing its own seeds would be theatre. Every other rule still applies there.
4. **Fixes preserve behaviour or add a test.** Findings are resolved by parsing, naming a type, or `satisfies` — never by widening a signature, never by an `as` that quiets the rule reporting the `as`.

## Costs & sharp edges (be honest)

**A rule set nobody here voted for now has veto power over merges.** Fifteen rules arrived as a block. They are generic and they were run before being trusted, but the repo has taken on a lint dependency whose taste is not its own — and unlike the structural rules, no chapter derived these from a pain this codebase felt.

**`satisfies` on a lookup table changes its exported type.** `Record<Tone, string>` gave every consumer a `string` for any `Tone`; `satisfies Record<Tone, string>` gives them the literal keys. That is the improvement — indexing with an arbitrary `string` now fails — but it is a breaking change to a public type, and in a library it would be one.

**`SAFETY:` comments rot.** A rule that accepts a comment as justification accepts a _stale_ comment as justification. The invariant named beside a cast in 2026 can be false by 2027 with the comment still sitting there, now actively misleading. Reviews must read them as code.

**Vendored means manually upgraded.** No `npm update` moves `tools/oxlint/anti-slop/`. It drifts from upstream silently, and re-copying it is a deliberate act somebody has to remember. The one thing that keeps the drift measurable is that nothing in there is edited: `cmp -r` against `skills/install-anti-slop/assets/anti-slop` in a fresh clone of upstream still passes, so "how far behind are we" is a diff rather than an archaeology exercise. A local fix would cost that, which is why the two rules that argue with vendored UI were answered in `src/`, not upstream.

**Two rules argue with vendored UI.** shadcn components carry a CSS-custom-property style cast and a `e.target as HTMLElement`; the first needed a `SAFETY:` line and the second an `instanceof`. Every future `shadcn add` will land more of them, and the fix is a small edit to code the repo does not own.

**One rule we disagree with, and did not disable.** `no-runtime-typeof` flags the SSR guard `typeof window === 'undefined'`. The honest reading is that this is a representation check with nowhere better to live; it was resolved with `globalThis.location?.search` rather than an exemption, which is a slightly clever line where a plain one used to be. If that pattern recurs, the rule earns a scoped `off` and this ADR gets a supersession.

## Alternatives considered

**Leave it to review.** What the repo did until now. Rejected on evidence: 67 instances survived review, including 36 of one pattern in a single file. A rule review reliably misses is not a rule.

**Enable a subset — just the assertion rule.** Tempting, since one rule accounted for over half the findings. Rejected because the other patterns were the interesting ones: the widened lookup tables are what let a `string` index a closed union, and that is a runtime bug in waiting rather than a missing comment.

**Write our own smaller set.** The repo already owns [one lint plugin](../../tools/oxlint/jettison/index.ts) and that was justified because nobody ships layer rules. These rules _are_ shipped. Writing a second homegrown plugin to re-derive them would be the mistake ADR-005 accepted deliberately, repeated without a reason.

**Type-aware rules instead** (`no-unsafe-assignment`, `no-unsafe-argument`, and the rest of the type-checked tier). They catch a superset and they need the type checker in the lint path, which trades the sub-second lint this repo relies on for a multi-second one. `npm run type-check` already owns whole-program truth; the lint stays syntactic. Revisit if oxlint's `--type-aware` becomes cheap.

## Consequences

**Positive** — boundaries stay boundaries: a parsed type keeps its evidence all the way to the view. 20 lookup tables now carry their keys, one select can no longer hand a filter a string it does not accept (the generic `FilterSelect`), and the one cast the repo genuinely needs states its invariant.

**Negative** — a vendored rule set to upgrade by hand, `SAFETY:` comments to police in review, friction with newly-added shadcn components, and one rule the repo tolerates rather than agrees with.

**Neutral** — `src/mocks/` reads differently from `src/`, deliberately and in writing.

## Related

- [Chapter 3, R13](../03-component-pattern.md) — the law this ADR enforces
- [ADR-005](005-oxlint-with-a-local-boundaries-plugin.md) — the linter that runs it, and the other plugin decision
- [`oxlint.config.ts`](../../oxlint.config.ts) — section 5, and the `src/mocks/` exemption
- [dmmulroy/anti-slop](https://github.com/dmmulroy/anti-slop) — the rule set itself, and where an upgrade comes from
