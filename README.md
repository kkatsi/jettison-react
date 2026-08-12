# Jettison

[![CI](https://github.com/kkatsi/jettison-react/actions/workflows/ci.yml/badge.svg)](https://github.com/kkatsi/jettison-react/actions/workflows/ci.yml)
[![Jettison test](https://github.com/kkatsi/jettison-react/actions/workflows/jettison-test.yml/badge.svg)](https://github.com/kkatsi/jettison-react/actions/workflows/jettison-test.yml)

> **jettison** (v.) — to throw cargo overboard, deliberately, to keep the ship flying.

**Jettison is an enforced architecture for enterprise React applications.** Its boldest claim is its name: any module in a Jettison codebase can be thrown overboard — delete its folder plus its two registration lines — and the application still compiles and runs. That claim is not a diagram in a wiki; it is a CI job (**the jettison test**) that runs on every push.

Not a folder structure, not a style guide — a system of rules with teeth: every boundary is a lint error, every claim of modularity is machine-verified, and every decision is recorded with its costs stated honestly.

The documentation is the product. The application in this repo — the operations console of **Low Orbit Records**, a fictional indie record label — exists to prove the rules survive contact with a real product: forms, wizards, cross-module data flow, an eventually consistent backend, and charts.

---

## The thesis

Most React architectures fail the same way: they are described, agreed on, and then violated one convenient import at a time. Six months later the diagram in the wiki describes a codebase that no longer exists.

Jettison's position: **an architecture that is not enforced is a suggestion.** Every structural rule in this system exists in two forms — a documented rationale (the chapters below) and a machine check (ESLint boundaries, CI jobs). If a rule cannot be enforced, it is demoted to advice and labeled as such.

The second position: **modularity must be falsifiable.** "Loosely coupled" is not a property you assert — it is a property you test. Hence the jettison test: remove any module and the ship keeps flying, verified in CI on every push.

## The four pillars

| # | Chapter | One-line claim |
|---|---------|----------------|
| 1 | [Layers & the jettison test](docs/01-layers.md) | Code flows in one direction — `app → modules → shared → core` — and every module is jettisonable. |
| 2 | [Module anatomy](docs/02-module-anatomy.md) | Every module has the same internal shape, features are mini-modules, and no folder exists before it is needed. |
| 3 | [The component pattern](docs/03-component-pattern.md) | Views render, hooks orchestrate, services decide. Twelve rules make it law. |
| 4 | [The data layer](docs/04-data-layer.md) | One API client, module-owned endpoints, and cross-module cache sync through domain events — because tag invalidation lies when your backend is eventually consistent. |

The chapters are written library-agnostic; the concrete choices behind the reference implementation — including the ones with real costs — live in [`docs/adr/`](docs/adr).

## What's in this repo

One application — the **Low Orbit Records console** — carrying the whole system:

```
jettison-react/
├── README.md                 # You are here
├── docs/                     # The architecture — four chapters + ADRs
├── eslint.config.js          # The enforcement — every boundary rule, heavily commented, copyable
├── scripts/                  # incl. the jettison-test module unregistration script
├── .github/workflows/        # CI + the jettison test
└── src/
    ├── app/                  # Shell: router, store, providers, layouts
    ├── modules/              # release-editor · catalog · analytics · activity
    ├── shared/               # ui kit, events, generic hooks/utils
    ├── core/                 # api client, cache utils, reactions, config
    └── mocks/                # MSW backend with deliberate eventual consistency
```

**The jettison test** is a CI job, not a claim: for every module under `src/modules/`, a matrix job deletes the folder, runs [`scripts/unregister-module.mjs`](scripts/unregister-module.mjs) to strip its registration lines from the app shell, and requires `type-check` and `build` to pass without it. Unregistering is mechanical — an import line and whatever sits inside the `// jettison:…` marker regions — because a module that needs judgement to remove was never jettisonable. [`src/modules/activity/`](src/modules/activity) is the copyable example: the whole module template at its smallest honest size, and the test's cheapest victim.

**`eslint.config.js`** is a deliberate showpiece: the entire boundary system — layers, module privacy, view and service restrictions — as one annotated flat config you can read top-to-bottom and adapt to your own codebase. A Vitest suite runs it against violation fixtures and asserts each rule actually fires, because a boundaries config that matches nothing is indistinguishable from one that is satisfied.

**The console** is a deliberately real product: the back office of an indie record label. Release creation (a multi-step wizard with drafts and audio that processes asynchronously), catalog and distribution management (lists kept consistent across modules through domain events), and streaming analytics (charts fed by tested transformations). Its mock backend simulates **eventual consistency** — reads lag writes by seconds — because that is how music distribution actually behaves (delivery takes hours, stats lag days), and a demo backend that hides the problem would prove nothing.

## Who this is for

Teams building React applications that must survive years of feature work, team turnover, and parallel development — the environment where "we all know the conventions" stops scaling. Jettison borrows its starting point from [bulletproof-react](https://github.com/alan2207/bulletproof-react) (feature folders, unidirectional flow, colocation) and extends it where enterprise codebases actually bleed: cross-module cache consistency, form-state ownership, boundary enforcement, and architectural governance. Scope, stated plainly: long-lived enterprise SPAs — no SSR, no RSC, by thesis.

## Status

- [x] Chapters 1–4 (drafts)
- [x] ADR template + founding decisions
- [x] `eslint.config.js` + violation fixtures
- [x] App shell: core + shared + app layers
- [x] Jettison-test CI
- [ ] Modules: ~~activity~~, catalog, release-editor, analytics
- [ ] Deployed demo (Cloudflare Workers)

---

*MIT licensed. Built by Kostas Katsinaris.*
