# @jettison/eslint-config

The enforcement layer of the [Jettison architecture](../../README.md), as an installable package (workspace-only in v1 — not published to npm yet).

**Status: not yet built** — Phase 1 of [IMPLEMENTATION.md](../../IMPLEMENTATION.md). It will ship:

- ESLint 9 **flat config**
- The layer boundary rules (`app → modules → shared → core`) via `eslint-plugin-boundaries`, preconfigured
- Module privacy: external imports only through `modules/<name>/index.ts`
- The R1 view restriction: no query/store/router imports in `.tsx` files
- The R5 service restriction: no React/store imports in service files
- **Violation fixtures asserted in CI** — because a boundaries config that matches nothing is indistinguishable from one that is satisfied

The reference app consumes this package as a real workspace dependency, which keeps the config honest: if the rules break, the app's lint breaks.
