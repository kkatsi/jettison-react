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

| Layer         | Contains                                                                                       | May import from             |
| ------------- | ---------------------------------------------------------------------------------------------- | --------------------------- |
| **`app`**     | Router composition, store composition, providers, layouts, route guards                        | `modules`, `shared`, `core` |
| **`modules`** | Business domains: screens, features, domain services, module state, module-owned API endpoints | `shared`, `core`            |
| **`shared`**  | Design-system components, generic hooks, generic utils, cross-cutting types, domain events     | `core`                      |
| **`core`**    | API base client, config, auth plumbing, storage, monitoring                                    | _(nothing above it)_        |

### The dependency rule

**Imports flow left to right only: `app → modules → shared → core`.**

Three corollaries do most of the work:

1. **Modules never import other modules.** If two modules need the same thing, it moves _down_ — to `shared` (UI, utils, types) or `core` (infrastructure). And sometimes the right answer is duplication: a five-line helper copied into two modules is cheaper than a coupling between them.
2. **Modules are consumed only through their public API** — a single `index.ts` that exports the module's routes and, deliberately and rarely, anything else. Deep imports (`modules/billing/features/...` from outside `modules/billing`) are lint errors. The public API is the module's contract; everything behind it is private and refactorable without repository-wide impact.
3. **Only `app` composes.** The router knows which modules exist. The store knows whose state it holds. No module knows any of that.

### What goes where — the litmus tests

- **Could this be published to npm without mentioning your product?** → `shared` (if UI/util) or `core` (if infrastructure).
- **Does it mention a domain concept** (a release, an invoice, a campaign)? → it belongs to a module. Domain code in `shared` is the first symptom of decay.
- **Is it framework plumbing** — the HTTP client, token refresh, env config, error monitoring? → `core`. `core` contains no JSX and no business rules, ever.
- **Does it need to know every module?** → `app`, and only `app`.

## 3. The jettison test

The acceptance criterion for the entire layer system — the test this architecture is named after:

> **Deleting `modules/X/`, plus its registration lines in the app shell, must leave a compiling, working application.** Any module can be jettisoned; the ship keeps flying.

Registration is deliberately mechanical, not minimal. A module registers where the shell composes: its route spread in `router.tsx`, its store or reactions in `store.ts`, its nav entries in `navigation.ts` — each inside a `// jettison:…` marker region, alongside the import that feeds it. The count varies by module (the reference app's `analytics` touches two files, `catalog` three), and that is fine. What must hold is that a script can strip them without reading the code: **any line importing `@modules/<name>`, plus any line naming the module inside a marker region.** A module that needs judgement to unregister was never jettisonable.

This is what "loosely coupled" means when you refuse to let it be a vibe. The jettison test is falsifiable — it either passes or it doesn't — which makes it the perfect CI job:

```yaml
# .github/workflows/jettison-test.yml (reference app)
strategy:
  matrix:
    module: [release-editor, catalog, analytics, activity]
steps:
  - run: rm -rf src/modules/${{ matrix.module }}
  - run: node scripts/unregister-module.mjs ${{ matrix.module }} # strips the registration lines
  - run: npm run type-check && npm run build
```

If a teammate (or an AI agent — they are prolific import writers) sneaks a cross-module import in, this job fails on the next push, with the module name in the job title. The wiki diagram can't drift from the codebase, because the diagram _is_ a test.

The jettison test also forces honest answers to design questions. "Can the catalog module use the release editor's eligibility service?" becomes "would catalog still compile if the editor were jettisoned?" — and the answer designs the code for you: the service either moves down to `shared`, gets duplicated, or the requirement is rethought.

## 4. Enforcement

Rules that live in a doc are suggestions. These live in oxlint and fail in the editor, at the moment the bad import is being typed.

### Path aliases first

Every layer gets an alias — `@app/*`, `@modules/*`, `@shared/*`, `@core/*` — declared in `tsconfig.json` and resolved by Vite. This is not cosmetic: aliases make every cross-layer import _syntactically recognizable_, so lint rules can target them, and a relative-path disguise (`../../core/api`) can be banned outright.

### The layer matrix, as a lint rule

Every linter ships the _shape_ of this — restricted imports, forbidden paths — and none of them ship the matrix itself. So it is a local plugin, [`tools/oxlint/jettison/`](../tools/oxlint/jettison/index.ts), and it is short: a layer is a path prefix, an alias is a path prefix, so classifying both ends of an import is string work and no module resolution is involved at all.

The rules it registers:

```jsonc
// element types: app | modules | shared | core  (matched by folder)
// rules:
//   core    → imports nothing above itself
//   shared  → may import core
//   modules → may import shared, core — and NEVER another module
//   app     → may import everything
// plus: external access to a module only via modules/<name>/index.ts
```

The full, working configuration is this repo's own [`oxlint.config.ts`](../oxlint.config.ts) — deliberately written as one annotated file you can read top-to-bottom and adapt to your own codebase. Adapting it to your own layout means editing one map of alias-to-folder pairs in the plugin.

### Rules ship as `error` from day one

In a greenfield project there is nothing to grandfather. In a migration, only the folders that have adopted the layout are classified at all — so legacy code is untouched until it moves, and every migrated folder becomes a ratchet that cannot roll back. Never ship boundary rules as `warn`: warnings are wallpaper within a week.

### Hard-won gotchas (verify your config actually fires)

These are the failure modes that make boundary configs _silently useless_ — each one produces a green build with zero enforcement:

- The rules classify by path prefix, so the alias map in the plugin is load-bearing. Rename an alias in `tsconfig.json` without renaming it there and every import through it is unclassified — **every rule silently passes.**
- Only the four layer folders are classified. Files sitting directly in `src/` (`main.tsx`) are unconstrained by design; anything else you add beside them is too.
- An import a linter cannot see is an import it cannot police. Dynamic `import()` is how every screen here is lazy-loaded, so the rules read it as well as static imports — a plugin that visited only `ImportDeclaration` would miss the entire routing layer.
- Loading a TypeScript plugin at all needs Node 22.18 or newer. Below that oxlint refuses to start, which is the safe direction to fail — but it prints that refusal on stdout, so a script that only checks stderr will read a broken toolchain as a clean run.

The discipline that follows: **keep a deliberately violating file in the test suite.** A boundary config that matches nothing is indistinguishable from one that is satisfied, and that goes double when the rules are yours. This repo keeps violation fixtures in `fixtures/` and a Vitest suite runs the real config against them and asserts each rule fires, in CI.

## 5. Consequences, stated honestly

**You gain:** predictable blast radius, parallel-team safety, jettisonability, and a codebase where any developer can guess where code lives before opening the editor.

**You pay with:** occasional duplication (embraced deliberately), friction when two modules genuinely need the same domain logic (the answer — move it down, duplicate it, or rethink — is sometimes annoying), and an up-front investment in lint config — here a 125-line plugin you own outright — that must itself be tested.

**Not negotiable:** the direction of flow, module privacy behind `index.ts`, and enforcement as `error`. If those bend, the rest of this document is decoration.

---

_Next: [Chapter 2 — Module anatomy](02-module-anatomy.md), the internal shape every module shares._
