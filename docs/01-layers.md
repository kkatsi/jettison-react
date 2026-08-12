# Chapter 1 — Layers & the Jettison Test

> The whole chapter in one line: **code flows in one direction — `app → modules → shared → core` — and any module can be thrown overboard without breaking the build.**

---

## 1. The problem this solves

Every long-lived React codebase drifts toward the same failure: everything imports everything. A billing component reaches into the campaign feature for a helper, the campaign feature reads the settings feature's constants, and a "shared" folder accumulates code that is shared by exactly one caller. None of these imports felt wrong when they were written. Each one was the shortest path that day.

The consequence isn't aesthetic. When everything imports everything:

- **You cannot predict the blast radius of a change.** Touching one file may break screens you've never opened.
- **You cannot delete anything.** Dead features stay because nobody can prove they're unplugged.
- **You cannot parallelize work.** Two teams in one dependency tangle merge-conflict forever.

Folder conventions do not fix this, because folders don't stop imports. Only rules that fail the build stop imports.

## 2. The four layers

```
src/
├── app/        # Application shell — the ONLY place that knows all modules exist
├── modules/    # Business domains — the application itself
├── shared/     # Reusable, dumb, business-agnostic building blocks
└── core/       # Infrastructure — framework-facing, zero business logic, zero JSX
```

| Layer | Contains | May import from |
|-------|----------|-----------------|
| **`app`** | Router composition, store composition, providers, layouts, route guards | `modules`, `shared`, `core` |
| **`modules`** | Business domains: screens, features, domain services, module state, module-owned API endpoints | `shared`, `core` |
| **`shared`** | Design-system components, generic hooks, generic utils, cross-cutting types, domain events | `core` |
| **`core`** | API base client, config, auth plumbing, storage, monitoring | *(nothing above it)* |

### The dependency rule

**Imports flow left to right only: `app → modules → shared → core`.**

Three corollaries do most of the work:

1. **Modules never import other modules.** If two modules need the same thing, it moves *down* — to `shared` (UI, utils, types) or `core` (infrastructure). And sometimes the right answer is duplication: a five-line helper copied into two modules is cheaper than a coupling between them.
2. **Modules are consumed only through their public API** — a single `index.ts` that exports the module's routes and, deliberately and rarely, anything else. Deep imports (`modules/billing/features/...` from outside `modules/billing`) are lint errors. The public API is the module's contract; everything behind it is private and refactorable without repository-wide impact.
3. **Only `app` composes.** The router knows which modules exist. The store knows which slices exist. No module knows any of that.

### What goes where — the litmus tests

- **Could this be published to npm without mentioning your product?** → `shared` (if UI/util) or `core` (if infrastructure).
- **Does it mention a domain concept** (a mission, an invoice, a campaign)? → it belongs to a module. Domain code in `shared` is the first symptom of decay.
- **Is it framework plumbing** — the HTTP client, token refresh, env config, error monitoring? → `core`. `core` contains no JSX and no business rules, ever.
- **Does it need to know every module?** → `app`, and only `app`.

## 3. The jettison test

The acceptance criterion for the entire layer system — the test this architecture is named after:

> **Deleting `modules/X/`, plus its one line in the router and its one line in the store, must leave a compiling, working application.** Any module can be jettisoned; the ship keeps flying.

This is what "loosely coupled" means when you refuse to let it be a vibe. The jettison test is falsifiable — it either passes or it doesn't — which makes it the perfect CI job:

```yaml
# .github/workflows/jettison-test.yml (reference app)
strategy:
  matrix:
    module: [mission-planner, fleet, telemetry, ops-log]
steps:
  - run: rm -rf src/modules/${{ matrix.module }}
  - run: node scripts/unregister-module.mjs ${{ matrix.module }}  # strips the 2 registration lines
  - run: npm run type-check && npm run build
```

If a teammate (or an AI agent — they are prolific import writers) sneaks a cross-module import in, this job fails on the next push, with the module name in the job title. The wiki diagram can't drift from the codebase, because the diagram *is* a test.

The jettison test also forces honest answers to design questions. "Can the fleet module use the planner's eligibility service?" becomes "would fleet still compile if the planner were jettisoned?" — and the answer designs the code for you: the service either moves down to `shared`, gets duplicated, or the requirement is rethought.

## 4. Enforcement

Rules that live in a doc are suggestions. These live in ESLint and fail in the editor, at the moment the bad import is being typed.

### Path aliases first

Every layer gets an alias — `@app/*`, `@modules/*`, `@shared/*`, `@core/*` — declared in `tsconfig.json` and resolved by Vite. This is not cosmetic: aliases make every cross-layer import *syntactically recognizable*, so lint rules can target them, and a relative-path disguise (`../../core/api`) can be banned outright.

### eslint-plugin-boundaries

The layer matrix becomes configuration:

```jsonc
// element types: app | modules | shared | core  (matched by folder)
// rules:
//   core    → imports nothing above itself
//   shared  → may import core
//   modules → may import shared, core — and NEVER another module
//   app     → may import everything
// plus: external access to a module only via modules/<name>/index.ts
```

The full, working configuration is this repo's own [`eslint.config.js`](../eslint.config.js) — deliberately written as one annotated file you can read top-to-bottom and adapt to your own codebase.

### Rules ship as `error` from day one

In a greenfield project there is nothing to grandfather. In a migration, `boundaries` with `default: allow` constrains only the folders that have adopted the layout — so legacy code is untouched until it moves, and every migrated folder becomes a ratchet that cannot roll back. Never ship boundary rules as `warn`: warnings are wallpaper within a week.

### Hard-won gotchas (verify your config actually fires)

These are the failure modes that make boundary configs *silently useless* — each one produces a green build with zero enforcement:

- `eslint-plugin-boundaries` resolves imports through `import/resolver`. Without `eslint-import-resolver-typescript`, alias imports are classified as `external` and **every rule silently passes**.
- A `references` array in `tsconfig.json` can make the resolver treat it as a solution-style config and ignore `compilerOptions.paths` entirely.
- Element patterns match **folders** — files sitting directly in `src/` are unclassified and unconstrained.

The discipline that follows: **keep a deliberately violating file in the test suite.** A boundaries config that matches nothing is indistinguishable from one that is satisfied. This repo keeps violation fixtures in `fixtures/` and a Vitest suite asserts each rule fires, in CI.

## 5. Consequences, stated honestly

**You gain:** predictable blast radius, parallel-team safety, jettisonability, and a codebase where any developer can guess where code lives before opening the editor.

**You pay with:** occasional duplication (embraced deliberately), friction when two modules genuinely need the same domain logic (the answer — move it down, duplicate it, or rethink — is sometimes annoying), and an up-front investment in lint config that must itself be tested.

**Not negotiable:** the direction of flow, module privacy behind `index.ts`, and enforcement as `error`. If those bend, the rest of this document is decoration.

---

*Next: [Chapter 2 — Module anatomy](02-module-anatomy.md), the internal shape every module shares.*
