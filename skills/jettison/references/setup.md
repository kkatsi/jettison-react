# Wiring the enforcement into a repo

An architecture that is not enforced is a suggestion. This skill can describe Jettison; only these four steps make it fail a build.

Do not run any of this unprompted on an existing repo. Read its agent instructions first, check `git status`, and ask before restructuring a tree someone else has to review.

## 1. Declare the layers

Four folders and four aliases. The aliases are not cosmetic: they make every cross-layer import syntactically recognisable, which is what lets a rule target it — and lets `../../core/api` be banned outright.

```
src/
├── app/       # the shell that composes: router, store, providers, layouts
├── modules/   # one folder per business capability
├── shared/    # business-agnostic and reusable
└── core/      # infrastructure: API client, config, cache utils. No JSX, no domain.
```

`tsconfig.json`:

```jsonc
"paths": {
  "@app/*": ["src/app/*"],
  "@modules/*": ["src/modules/*"],
  "@shared/*": ["src/shared/*"],
  "@core/*": ["src/core/*"]
}
```

The same four in the bundler (Vite: `resolve.alias`). Then the same four in the plugin's `ALIASES` map — see step 2, and read the warning there before skipping it.

**In a migration, adopt folder by folder.** The plugin classifies by path prefix, so anything not yet under those four folders is unclassified and unconstrained: no red build on day one, and every folder you move is a ratchet that cannot roll back.

## 2. Copy the enforcement

From the target repo's root, with `<skill>` being this skill's directory:

```bash
mkdir -p tools/oxlint scripts
cp -R <skill>/assets/jettison tools/oxlint/jettison
cp <skill>/assets/unregister-module.mjs scripts/unregister-module.mjs
```

Install the linter at current versions rather than remembered ones — query `npm view oxlint version` and `npm view @oxlint/plugins version`, then install both as dev dependencies with the repo's own package manager. A TypeScript plugin needs **Node 22.18+**; below that oxlint refuses to start and prints the refusal on stdout, so a script checking only stderr reads a broken toolchain as a clean run.

Merge `<skill>/assets/oxlint.jettison.ts` into the repo's oxlint config — the plugin registration, the two rules, and the two overrides — keeping every existing rule, ignore and plugin. Adjust the package names in the R1/R5 override lists to the stack this repo actually uses (its store, its router, its HTTP client), and add `tools/oxlint/**` to `ignorePatterns`.

**Then change the alias-to-folder map in `tools/oxlint/jettison/index.ts` to match this repo's layout.** That map is load-bearing: rename an alias in `tsconfig.json` and forget it here, and every import through it is unclassified — **every rule silently passes**.

Ship every rule as `error`.

## 3. Keep a violating fixture

This is the step people skip and the one that matters. **A boundary config that matches nothing is indistinguishable from one that is satisfied** — and that goes double when the rules are yours.

Create one deliberately violating file per rule group, outside the linted tree (`fixtures/src/…`), and a test that runs the real config against them and asserts each rule fires:

- `fixtures/src/core/…` importing `@shared/…` — core is the bottom layer
- `fixtures/src/shared/…` importing `@modules/…` — shared may only import core
- `fixtures/src/modules/a/…` importing `@modules/b` — modules never import each other
- `fixtures/src/app/…` importing `@modules/b/services/x` — a module has one door
- a `.tsx` importing a store hook and an endpoint — R1
- a `services/*.ts` importing `react` and an endpoint — R5

Run oxlint against the fixtures with `--format json` and assert on the rule names present. Exclude the fixture folder from the main lint run, and keep it type-checked by its own tsconfig so the violations stay real code.

## 4. Add the jettison test

The acceptance criterion for everything above: deleting a module and stripping its registration lines leaves a compiling app.

Registration is deliberately mechanical. Each module registers in the shell inside marker regions, one line per file, beside the import that feeds it:

```ts
// jettison:routes:start — one spread per module
...catalogRoutes,
// jettison:routes:end
```

`scripts/unregister-module.mjs` strips, without reading the code: any line importing `@modules/<name>`, plus any line naming the module inside a marker region. A module that needs judgement to unregister was never jettisonable.

Then one CI job per module — discover the matrix from `src/modules/` so adding a module cannot forget to add the job:

```yaml
strategy:
  matrix:
    module: ${{ fromJson(needs.modules.outputs.list) }}
steps:
  - run: rm -rf src/modules/${{ matrix.module }}
  - run: node scripts/unregister-module.mjs ${{ matrix.module }}
  - run: npm run type-check && npm run build
```

If anyone — or any agent — sneaks a cross-module import past review, this fails on the next push with the module's name in the job title.

## What is deliberately not installed

- **Type-evidence rules.** Not ours to ship: [anti-slop](https://github.com/dmmulroy/anti-slop) by Dillon Mulroy, MIT, which upstream distributes by vendoring and installs with its own skill — `npx skills add dmmulroy/anti-slop --skill install-anti-slop`.
- **Accessibility rules.** Turn on every rule the linter ships, at `error`, rather than a subset — a subset is a preference. They read markup and nothing else, so focus order, contrast and reachability still need a browser or a hand on the tab key.
- **A dependency-graph check.** Optional, and worth it: generate the import matrix from the real graph and fail CI when the committed copy is stale, so the diagram in the README cannot drift from the code.
