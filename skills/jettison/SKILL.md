---
name: jettison
description: Write and review React/TypeScript code inside the Jettison architecture — four layers (app → modules → shared → core), modules that can be deleted without breaking the build, views that render while hooks orchestrate and services decide, and mutations that own their cache effects. Use before creating any file under src/, adding an import, adding or removing a module, writing a component/hook/service, defining an API endpoint, deciding where state lives, or syncing caches across modules. Also use when reviewing a diff, when asked where code should go, or when asked to set Jettison up in a repo.
---

# Jettison

An enforced architecture for long-lived React applications. Its acceptance criterion: **delete any `src/modules/<name>/` folder and strip its registration lines, and the app still type-checks and builds.**

Lint catches about half of what follows. The other half is marked **(you)** — nothing will fail if you break it, which is exactly why it is written down.

## Step 0 — is the architecture installed here?

```bash
ls src/app src/modules src/shared src/core 2>/dev/null; ls tools/oxlint/jettison 2>/dev/null
```

- Layers present, plugin present → go to Step 1.
- Layers present, plugin missing → the rules are advice. Read `references/setup.md` and offer to wire it up before writing code.
- Neither → this repo has not adopted Jettison. Read `references/setup.md`; do not silently impose the layout on an existing tree.

## Step 1 — read before writing

Never write a file in a layout you have not looked at. Cheapest useful read, in the module you are about to touch:

```bash
ls src/modules
cat src/modules/<module>/index.ts src/modules/<module>/routes.tsx
```

Then one existing screen, its colocated hook, and one service with its test. Match what you find — its query library, its store, its naming. This skill states doctrine, not libraries.

## Step 2 — place it, out loud

Three answers, one line each, before any code:

- **Which layer?** `app` composes (router, store, providers, layouts) · `modules` = one business capability, whole · `shared` = could be published without naming the product · `core` = infrastructure, no JSX and no domain word, ever.
- **Which module owns it?** If the answer is "two of them", it moves _down_ to `shared`/`core`, or it gets duplicated. A cross-module import is never the answer.
- **Does its folder exist yet?** If not: does a _second_ file belong in it today? No → put it beside its caller. Empty scaffolding is worse than absence.

Imports flow one way — `app → modules → shared → core`:

| Layer     | May import       |
| --------- | ---------------- |
| `app`     | everything below |
| `modules` | `shared`, `core` |
| `shared`  | `core`           |
| `core`    | nothing above it |

- Never `@modules/a` from inside `@modules/b`. Not for a type, not for a constant, not for a five-line helper.
- Never past a module's `index.ts` from outside it — `@modules/catalog/services/x` is private to `catalog`.
- Never a relative path across layers (`../../core/api`). Aliases are what make the rule enforceable.
- The rule is fractal **(you)**: sibling features inside a module don't import each other either. Shared logic climbs to the module's own `components/ hooks/ services/`.

Logic is born colocated and climbs only when a real second caller appears — component → feature → module → `shared`/`core`. Never promote on a prophecy, never leave a copy behind when you do, and at the module boundary **duplication is a legitimate answer** — coupling costs forever, a duplicate costs when the rule changes.

**A file named `utils` may not speak the domain (you).** If a function says release, invoice, royalty, it is business logic: `services/<topic>.ts`, named for the topic. `utils.ts` is where domain models go to hide.

## Step 3 — write it, in this order

Services first, view last. Writing the `.tsx` first is how the rules end up inside it.

| Kind          | File                                          | Holds                                                                |
| ------------- | --------------------------------------------- | -------------------------------------------------------------------- |
| decisions     | `services/<topic>.ts` + **`<topic>.test.ts`** | pure business rules                                                  |
| orchestration | `useX.ts`, beside the view                    | queries, mutations, store, router, navigation, modal state, handlers |
| rendering     | `X.tsx`                                       | JSX, conditional rendering, styling — nothing else                   |

Data flows services → hook → view; each layer talks only to its neighbour. This is not container/presentational: there is no second component, and the decisions layer is plain TypeScript, which is the part that makes it testable.

- A `.tsx` may not import query/mutation hooks, `useSelector`/`useDispatch`, API modules, an HTTP client, or `useNavigate`. Navigation is a handler, and handlers come from the hook. _(lint)_
- A service may not import `react`, `react-*`, the store, or the router. _(lint)_
- **One** hook per view, and the view calls only it **(you)**. Presentational components — props in, JSX out — need no hook, and most components should be presentational.
- The hook returns **one view-model object**: render-ready values, flags, handlers. A `useMemo` or a business `if` left in the `.tsx` means the view-model is incomplete. Group related members — `confirmDialog: { isOpen, close, confirm }` **(you)**.
- A service returns **domain facts** — codes, booleans, numbers, domain objects. Never copy, JSX, toasts or navigation. Copy lives in `constants.ts` keyed by those codes; the hook maps code → message → action **(you)**.
- **A service, transformation or selector arriving without its colocated unit test is the thing to reject (you).** Views get no tests: a view that needs one is hiding logic that belongs a layer down. What only a hand can find — a press-and-hold, focus order, a control an overlay covers — belongs in the browser suite, one spec per claim, and each verified to go red when the behaviour is removed.
- A cast carries a `SAFETY:` line naming the invariant that makes it true. Parse at the boundary instead of `typeof`-checking downstream; `satisfies` instead of `Record<Union, X>`; no `unknown` parameter standing in for a shape the caller knows. _(mostly lint)_
- Every interactive element is focusable, named, and shows focus. A control hidden with `display: none` is not styled, it is gone. _(mostly lint; focus order and contrast are not — tab through it)_
- Past ~150 lines in one component or hook, or ~200 in one service file: look for the split. Count the declaration, not the file. A trigger to look, not a gate to fail **(you)**.

Where does this go?

```
JSX, what-to-show-when, mapping data to elements  → the .tsx
touches a query, mutation, store, router, modal   → the useX hook
a rule you could explain without saying "React"   → a service + its test
about the query cache — tags, optimistic patches  → the endpoint's declared effects
derived from module state                         → a memoized selector beside it
a user-facing string                              → constants.ts, keyed by domain code
```

## Step 4 — state has exactly one home

| State                               | Home                                                                      |
| ----------------------------------- | ------------------------------------------------------------------------- |
| server data                         | the query cache, and nowhere else                                         |
| modal open, hovered row, active tab | `useState` in the component                                               |
| form values                         | the form library's own store                                              |
| filters, pagination, current step   | the URL                                                                   |
| a subtree's own state               | context/`useReducer` at the feature root — never across a module boundary |
| survives navigation within a module | `modules/<name>/state/`, registered by the shell                          |
| app-global (session, tenant)        | **requires a written decision (ADR) before you write it**                 |

Escalate props → context → store only when the level below demonstrably fails. **Never copy server data into a store** — two sources of truth disagree immediately.

## Step 5 — touching the data layer?

Read `references/data-layer.md`. The three prohibitions, in short: one client in `core`, a mutation owns its own aftermath (never an exported "call this afterwards" helper), and **no module ever writes another module's cache** — a boundary violation no import rule can see.

## Step 6 — adding or removing a module?

A module must survive `rm -rf`. It registers only inside marker regions in the shell, one mechanical line each — its route spread, its reducer, its reactions, its nav entry — beside the import that feeds it:

```ts
// jettison:routes:start
...catalogRoutes,
// jettison:routes:end
```

Nothing outside those regions may name the module, and unregistering must need no judgement: any line importing `@modules/<name>`, plus any line naming it inside a marker region. Prove it before you push:

```bash
git add -A && git commit -m wip          # the rm is real
rm -rf src/modules/<name> && node scripts/unregister-module.mjs <name>
npm run type-check && npm run build      # must be green without the module
git restore . && git clean -fd src
```

## Step 7 — verify, then say what you ran

```bash
npm run lint && npm run type-check && npm test
```

Plus, when they exist in this repo: `npm run graph` if imports changed (a committed dependency graph goes stale silently), the jettison test if you added a module, `npm run test:e2e` if you touched an interaction.

Then report what the checks cannot: which **(you)** rules this diff depended on, and any judgement call you made at the margin. A green pipeline is not a claim that the architecture held — it is a claim that the half a linter can see held.

## Reviewing a diff

Read it looking only for these, in order: a cross-module or deep import · a `.tsx` that fetches, dispatches or navigates · a service without a test · a service returning copy · a `useMemo` in a view · an exported "call this after the mutation" · a cache write against a foreign module · a new `utils` speaking the domain · server data mirrored into a store · a folder created empty. That list is the review.
