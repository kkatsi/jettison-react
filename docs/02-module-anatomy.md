# Chapter 2 — Module Anatomy

> The whole chapter in one line: **every module has the same internal shape, a feature is a mini-module governed by the same rules one level down, and no folder exists before it is needed.**

---

## 1. Why anatomy matters

Chapter 1 made modules *isolated*. This chapter makes them *predictable*. The goal is stated as Jettison's first design goal: **any developer can guess where a piece of code lives before opening the editor.** That is only possible if every module answers the same questions the same way — where do screens go, where do business rules go, where does module state go — so that learning one module means learning all of them.

## 2. The template

```
modules/<name>/
├── index.ts              # PUBLIC API — exports routes (and nothing else unless deliberate)
├── routes.tsx            # The module's route tree (lazy-loaded screens)
├── api/                  # Query endpoints THIS module owns (→ Chapter 4)
│   ├── endpoints.ts      #   endpoint definitions + their cache effects
│   ├── transformations.ts#   server response → UI shape, nothing else
│   └── types.ts          #   DTOs + domain types for this module
├── screens/              # One folder per routed screen — composition only
│   └── CatalogOverview/
│       └── CatalogOverview.tsx
├── features/             # Big self-contained chunks of behavior (see §4)
│   └── distribution-board/
│       ├── components/
│       ├── hooks/
│       └── services/
├── components/           # Module-scoped components shared by its screens/features
├── hooks/                # Module-scoped view-logic hooks
├── services/             # Module-scoped pure business logic (plain TS, no React)
├── state/                # Module slice / reactions, if the module needs them
├── types.ts
└── constants.ts
```

Two structural facts carry most of the weight:

1. **`index.ts` is the only door.** It exports the module's routes; everything else is private. If a module deliberately exports more (a rare, documented event), that export is a *contract* — reviewed like one, changed like one.
2. **The hierarchy is `module → feature → component`,** and the same import rules apply at each level: features inside a module don't import from sibling features; if two features share something, it moves *up* to the module's own `components/`, `hooks/`, or `services/`. The layer discipline is fractal.

## 3. Screens

A **screen** is a routed page. Its job is composition: arrange features and components, read route params, call at most one orchestrating hook. A screen contains no business logic, no fetch calls, no data transformation — if a screen is longer than a page, it's doing someone else's job.

Screens are the natural code-splitting boundary: every screen is lazy-loaded from the module's `routes.tsx` (`React.lazy` + `Suspense`). Splitting below the screen level is done only for a specific, profiled reason — over-splitting multiplies requests and usually degrades what it claims to improve.

Screens are also where **error boundaries** live. A boundary per routed screen contains a failure to the screen that caused it; the rest of the app keeps working. One boundary at the app root produces the enterprise-grade experience of a full blank page because a tooltip threw.

## 4. Features — the promotion from "big component"

A component becomes a **feature** when it owns a meaningful chunk of *behavior* — a wizard step sequence, an autosave system, a live-updating schedule board — not merely when it gets big. Size is a symptom; ownership of behavior is the criterion.

A feature is a mini-module: its own `components/`, `hooks/`, `services/`, governed by the same rules. What it does *not* get: its own routes (the module's `routes.tsx` owns routing) or its own public API ceremony (inside a module, direct imports between a feature and the module's shared folders are fine — the formality lives at module boundaries, not inside them).

**The reference app has no `features/` folder, and that is the honest outcome, not an omission.** The plan expected the release wizard to become one; it didn't. Its four steps are routed, so they are screens by §3's definition, and what they share climbed to the module's own `hooks/` and `services/` instead — which §6's ladder is exactly what you get when a "feature" turns out to be a route group. The section stands as doctrine for the case that does arrive: a self-contained chunk of behaviour that is *not* a route. Per §5, we did not build one to have an example of one.

## 5. No folder before need

The template above is the *maximum* shape, not the mandatory one. A module with 12 files needs no `features/` directory, possibly no `state/`, maybe just `api/index.ts` instead of three api files. Empty scaffolding is worse than absence — it implies structure that doesn't exist and trains readers to ignore folder names.

The rule: **create a folder at the moment the second file that belongs in it appears.** Corollary: the smallest honest module is `index.ts` + `routes.tsx` + one screen. The reference app's `activity` module is intentionally this small — it exists to prove the template scales *down*, and to be the jettison test's cheapest victim.

## 6. The promotion ladder

Where does a piece of logic live? At the lowest level that contains all its callers — and it moves only when a real second caller appears:

```
colocated with the component        # birth: one caller
  → feature/services/               # a second component in the feature uses it
    → module/services/              # a second feature in the module uses it
      → shared/ or core/            # a second MODULE needs it — or it gets duplicated
```

Three disciplines keep the ladder honest:

- **Never promote preemptively.** "Someone might need this" is how `shared/` becomes a landfill. Promotion is triggered by an actual import, not a prophecy.
- **Never keep two copies while promoting.** Promotion is a move, not a copy.
- **At the module boundary, duplication is a legitimate answer.** A small rule needed by two modules can simply exist twice. Coupling is a cost you pay forever; duplication is a cost you pay when the rule changes. For three lines of logic, duplication usually wins.

## 7. Naming is a boundary mechanism

One naming rule does outsized work: **files named `utils` may not speak the domain.**

If a function mentions a domain word — release, track, royalty, invoice — it is *business logic*, and it lives in a `services/` file named for its topic (`release-eligibility.ts`, `royalty-split.ts`). If it could be published to npm without mentioning your product (`formatDuration`, `groupBy`, `clamp`), it is a util. A new `utils.ts` containing domain vocabulary fails code review.

Why so strict: `utils.ts` is where business logic goes to hide. It starts with one innocent mapper, and two years later it is an 800-line file that is really the domain model of the application, untested and unnamed. Naming the topic forces the file to *have* a topic — which is what makes it findable, testable, and ownable.

## 8. Module state

If a module needs client state that must survive navigation between its screens (a draft, a selection, a multi-step flow), it owns a slice in `state/`, registered in `app/store.ts` inside the reducers marker region — one of the registration lines the jettison test strips (Chapter 1 §3). Everything with a shorter lifetime stays lower: component state in the component, subtree state in a context at the feature root. The full state placement doctrine is Chapter 4's table; the anatomical point here is only *where the slice lives*: inside the module, never in a global `store/` folder that accumulates everyone's state.

---

*Next: [Chapter 3 — The component pattern](03-component-pattern.md), the shape of every rich component inside these folders.*
