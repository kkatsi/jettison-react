# ADR-004: Put URL-worthy state in the URL with nuqs, not by hand

---

## Status

Accepted

## Date

2026-08-13

## Normative level

**MUST** — a screen that keeps filter, sort, pagination or tab state in `useState` when the state is URL-worthy (Chapter 4 §2) fails review. **SHOULD** for the library: use nuqs unless the screen has a reason it cannot, stated in the PR.

## Context

Chapter 4's state placement table is unambiguous: state a colleague should be able to link to, and a reload should survive, lives in the router's query string. Filters, pagination, the selected tab. That is doctrine, and it is easy to agree with.

What it does not say is who writes the parsing. The first two screens in this codebase — the activity feed and the catalogue — each grew their own `readFilters` / `filterParams` pair: a parser with an allowlist so a hand-edited URL falls back instead of blanking the screen, a serialiser that omits values equal to their default so a clean view produces a clean link, a `replace: true` on every write so filtering doesn't fill the back button, and a boolean saying whether anything is filtered at all. Forty-odd lines and two test suites per screen, describing a policy that is identical everywhere and was already drifting between the two copies.

Six more screens are coming — the wizard's step, the analytics range and selection, the board's filters. Hand-rolling this eight times is how a codebase ends up with eight subtly different answers to "what happens when someone edits the URL", which is the exact failure this architecture exists to prevent.

## Decision

1. **URL state is read and written with [nuqs](https://nuqs.dev)**, mounted once via its React Router adapter in `app/layouts/AppLayout.tsx`, above every routed screen.
2. **Each screen declares its URL contract as a parser map** beside its hook — `parseAsStringLiteral` for anything with an allowlist, `parseAsInteger` for pagination, every one carrying `.withDefault(...)`.
3. **The defaults live in the screen's service file** (`DEFAULT_FILTERS`), so the pure functions that filter and the parsers that read the URL cannot disagree about what "unfiltered" means.
4. **Services keep the deciding, nuqs keeps the plumbing.** What survives in `*-filters.ts` is the part that is ours: which releases a filter admits, how a page is sliced, which page numbers are worth rendering. Those stay pure, and stay tested.

nuqs's defaults are the conventions this codebase had already written by hand: `clearOnDefault: true` (a value equal to its default is removed from the query string), `history: 'replace'`, and a literal parser that falls back to the default rather than propagating a value nobody allowed.

## Costs & sharp edges (be honest)

- **A dependency for something the platform can do.** `URLSearchParams` is built in and free; nuqs is a package that must be updated, and whose major versions will eventually cost a migration. We are buying consistency, not capability.
- **An adapter that must match the router.** nuqs talks to React Router through a versioned adapter (`nuqs/adapters/react-router/v8`). A router major upgrade is now two upgrades, and the second one gates the first. This is the sharpest edge in this decision.
- **A provider the jettison test must tolerate.** `NuqsAdapter` sits in the app layer, not in any module, so ejecting a module cannot break it — but anything that ever moves it inside a module would quietly couple the app shell to that module's survival.
- **Parsers are configuration, and configuration is easy to get subtly wrong.** A parser whose allowlist drifts from the service's own list of valid values produces a filter that reads fine and matches nothing. The mitigation is §3 — one set of defaults, imported by both — and it is a discipline, not a mechanism.
- **Testing moves.** The parse/serialise tests we deleted were testing our own code; the equivalent behaviour is now nuqs's, and a bug there is diagnosed rather than unit-tested. What remains under test is the logic, which is where the bugs that cost money live anyway (R10).
- **It is one more thing a reader must know** to follow a screen's hook. Small, but real: `useSearchParams` needs no explanation.

## Alternatives considered

**Hand-rolled per screen — the status quo.** Zero dependencies, complete control, and it worked. It lost on arithmetic: the same forty lines, once per screen, already inconsistent at two screens, with six to come. Duplication is the right answer at a module boundary for three lines of logic (Chapter 2 §6); it is the wrong answer for a policy that must be identical everywhere.

**One shared `useUrlFilters` hook in `shared/hooks`.** The obvious middle path, and genuinely tempting: no dependency, one implementation. It lost because the honest version of it — typed parsers, defaults, clear-on-default, throttled writes, history control, a way to update several keys in one navigation — is nuqs, minus the tests, minus the maintenance, minus other people finding its bugs first. Writing a worse copy of an existing library and owning it forever is not the cheap option; it only looks like one on the day it is written.

**Zod schemas over `useSearchParams`.** Zod is already a dependency and could validate the query string. But validation is the easy half: it does nothing about serialising, omitting defaults, batching updates, or history behaviour, so this ends up being the shared-hook alternative with a nicer parser and the same bill.

## Consequences

**Positive** — one answer to "how does this screen keep state in the URL", enforced by shape rather than by review. Roughly ninety lines and five tests of plumbing deleted across two screens, and not written for the six screens still to come. A hand-edited URL falls back to a working screen everywhere, because that is the parser's behaviour and not a habit each screen has to remember.

**Negative** — a dependency, and a router upgrade that now requires an adapter release first.

**Neutral** — screens declare their URL contract explicitly, in one place per screen, instead of implying it across a parser and a serialiser.

## Related

- [Chapter 4 §2 — the state placement table](../04-data-layer.md), which requires this state to live in the URL and names no library.
- `src/app/layouts/AppLayout.tsx` — where the adapter is mounted.
- `src/modules/catalog/screens/Catalog/useCatalog.ts` — the parser map, and the screen's URL contract.
- `src/modules/catalog/screens/Catalog/catalog-filters.ts` — what stays ours, and stays tested.
