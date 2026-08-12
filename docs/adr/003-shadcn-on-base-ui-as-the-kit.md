# ADR-003: The design-system kit is shadcn/ui on Base UI, generated into `shared/ui`

> Architecture Decision Record — the Low Orbit Records console

---

## Status

Accepted

## Date

2026-08-12

## Normative level

**MUST** — a component that exists in the shadcn registry is not hand-written here.

## Context

Chapter 1 puts the design system in `shared/ui` and Chapter 2's promotion ladder says a component is not shared until a second module needs it. Neither says where the *first* version of a component comes from, and that gap has a default answer that costs real money: someone writes a `Dialog` by hand.

The components an operations console needs are dominated by ones whose value is invisible in a screenshot — dialog, select, combobox, tooltip, popover, tabs, checkbox — where correctness means focus trapping and focus return, `aria-*` wiring, roving tabindex, typeahead, escape and outside-click handling, portalling with scroll lock, and RTL. Those behaviours take years of bug reports to get right. A repo whose whole argument is "enforce the boundaries and stop rewriting things" cannot credibly rewrite them.

The counter-force: a component library imported as a dependency puts the design system behind someone else's release cycle and someone else's styling API, and this console has a specific visual identity to hit (a near-black, dense, mono-numeric label back office).

## Decision

1. **Components come from the shadcn registry, on Base UI primitives** — `shadcn init -b base`, then `shadcn add <component>`. Base UI over Radix as the primitive layer, per the same reasoning as the rest of the 2026 stack; the CLI supports it directly.
2. **Generated code lands inside `src/shared/ui` and is owned from that moment.** `components.json` points the `ui`, `components` and `utils` aliases at the kit and at `@shared/utils/cn`, not at shadcn's default `@/components/ui`. There is no `shadcn` runtime dependency in the app's import graph — only its CSS, at build time.
3. **The kit stays the single door.** Screens import from `@shared/ui`. Nothing outside this folder imports `@base-ui/react`, ever — that is what keeps the primitive layer swappable.
4. **Theming is one variable mapping, not per-component edits.** `theme.css` declares the console tokens, then aliases shadcn's variables onto them (`--primary: var(--color-brand)`, `--card: var(--color-panel)`, …). A component added six months from now arrives already themed.
5. **Customisation goes in a sibling file, not inside the generated one** — `status-badge.tsx` composing `badge.tsx`, rather than new variants inside it — so `shadcn add --overwrite` remains a safe way to take upstream fixes.
6. **Components arrive with the screen that needs them.** The kit is not populated up front.

## Costs & sharp edges (be honest)

- **The kit is a vendored copy, so upstream fixes are a pull, not an install.** Nobody is notified when shadcn fixes a focus bug in `select`; someone has to run `shadcn add select --diff` and look. Rule 5 exists to keep that cheap, and it only stays cheap while people follow it.
- **Namespace collisions are silent and ugly.** shadcn's `--muted` is a *surface*; ours was a *text* colour. Its `--accent` is a hover surface, not a brand colour. The first version of this theme had both clashing, which repainted half the UI with no error anywhere. The console's tokens are now named `subtle` and `brand` for exactly this reason — and any new token has to be checked against shadcn's set.
- **Base UI is younger than Radix.** Fewer components, fewer edge cases found by other people. We are trading maturity for the primitive API we would rather live with for the next five years, and a component that turns out to be missing means either a Radix-based fallback or a hand-written one, per case.
- **The formatter rewrites generated files.** Running Prettier over the kit makes future `--diff` output noisier than the upstream file. Consistency inside the repo won that trade; the alternative is an exempted folder that looks foreign.
- **`shadcn add` will happily reach for a component we do not need.** Rule 6 is a discipline, not a mechanism: nothing stops a contributor installing forty components on a slow afternoon.

## Alternatives considered

**A component library as a dependency (MUI, Mantine, Chakra).** Least code, real accessibility, and the fastest possible start. It loses on the thing this repo is about: the design system stops being ours, restyling means fighting a theming API rather than writing CSS variables, and every visual decision becomes a negotiation with the library's opinions. It also makes the kit's public surface someone else's, which weakens the "one door, swappable primitives" argument.

**Hand-written components on Base UI primitives, cva for variants.** This is what the first pass of Phase 2 did for four trivial components (button, badge, panel, empty state), and it was wrong even where it was harmless: it sets the precedent that a component's first version is invented here, and the precedent is what eventually produces a hand-rolled `Select`. Rejected — and the components were replaced with their registry equivalents.

**shadcn on Radix (the default registry).** Works today, more battle-tested, and would have been the fallback had the Base UI variant not been installable from the CLI. It is: `-b base` is a first-class option, so the newer primitive layer costs nothing to adopt.

## Consequences

**Positive** — accessibility behaviour arrives correct rather than aspirational; the kit is code a React developer recognises on sight; the console theme is one file; the primitive layer is swappable because exactly one folder imports it.
**Negative** — vendored code needs deliberate upgrades, Base UI's youth is a real risk, and the theme has a naming hazard that has already bitten once.
**Neutral** — the kit grows phase by phase rather than being scaffolded, so early screens are also the specification for which components exist.

## Related

Chapter 1 §2 (layers, `shared`), Chapter 2 §§5–6 (no folder before need, the promotion ladder), Chapter 3 R1 (views render), `src/shared/ui/theme.css` and `components.json`.
