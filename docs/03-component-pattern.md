# Chapter 3 — The Component Pattern

> The whole chapter in one line: **views render, hooks orchestrate, services decide — and fourteen rules make it law.**

---

## 1. The pattern in one picture

Every rich component in a Jettison codebase follows a single pattern:

```
ReviewStep/
├── ReviewStep.tsx                 # VIEW — JSX + rendering logic only (styling via the shared/ui kit + utility classes)
├── useReviewStep.ts               # VIEW LOGIC — orchestration; returns ONE view-model object
├── release-eligibility.ts         # BUSINESS LOGIC — pure functions
├── release-eligibility.test.ts    # tests for the business logic
└── constants.ts                   # UI copy, keyed by domain codes
```

That is the shape at birth. In the reference app the last three files have already climbed the ladder (Ch. 2 §6), because a second caller appeared: the wizard's rail flags issues from every step, not only the one that lists them. So the real layout is `screens/ReviewStep/ReviewStep.tsx` + `useReviewStep.ts` beside it, with `hooks/useSubmitRelease.ts`, `services/release-eligibility.ts` and `constants.ts` at module level. The pattern is unchanged by the move — which is the point of §7.

(When a component defines its own visual variants, a colocated `SubmitReleaseSection.variants.ts` holds the cva definitions — styling files exist on demand, not by template.)

```
 View (.tsx)         ──calls──▶  Hook (useX.ts)      ──calls──▶  Services (pure .ts)
 renders a view-model            orchestrates                    decide
 · JSX                           · query/mutation hooks          · business rules
 · conditional rendering         · selectors / dispatch          · calculations
 · mapping data → elements       · navigation                    · validation
 · styling                       · modal & flow state            · data mapping
                                 · event handlers                · NO React, NO store
```

Data flows right to left (services → hook → view); calls flow left to right. Each layer talks only to its neighbor.

This is **not** the old container/presentational component pair — there is no second component. The logic layer is a _hook_, colocated with the one view that consumes it, and the business layer is _plain TypeScript_, which is the part that makes the whole arrangement testable.

## 2. Why — the failure mode this prevents

The default fate of a rich component is to become a single `.tsx` that does everything: four query hooks, store reads, business rules inlined in `useMemo`s, a map that mixes UI copy with navigation with eligibility logic, mutation calls with hand-rolled follow-ups, two modals' state, and the JSX. Every codebase has this file. It is always the file nobody wants to touch.

Its three structural costs:

1. **It cannot be unit-tested.** Every rule needs a rendered tree, a store, a router, and a mock server — so the rules go untested.
2. **Its rules cannot be reused.** The next screen that needs "can this be submitted?" re-implements it, and the copies drift.
3. **Every change is a full-file review.** Rendering tweaks and business-rule changes land in the same diff, so reviewers stop distinguishing them.

The pattern dissolves all three by giving each kind of code exactly one home. In the reference app, the wizard's review step is the worked example: eligibility rules (artwork missing, audio still processing, release date too soon) live in [`release-eligibility.ts`](../src/modules/release-editor/services/release-eligibility.ts) as pure functions with [unit tests](../src/modules/release-editor/services/release-eligibility.test.ts); [`useSubmitRelease.ts`](../src/modules/release-editor/hooks/useSubmitRelease.ts) wires queries and store reads into those functions, maps each returned code to copy and to the action that fixes it, and returns one view-model; [`ReviewStep.tsx`](../src/modules/release-editor/screens/ReviewStep/ReviewStep.tsx) renders it. A subtle class of bug — a second code path that calls the mutation directly and skips the follow-up logic — becomes structurally impossible, because there is exactly one orchestrated path.

## 3. The rules

Repo law — enforced by lint where possible, by review where not.

**R1 — Forbidden imports in `.tsx`.** A view may import React, styling, design-system components, child components, its own colocated hook, and types. It may never import query/mutation hooks, store hooks (`useSelector`/`useDispatch`), API modules, HTTP clients, or `useNavigate`. Navigation is a handler; handlers come from the hook. _(Enforced: `no-restricted-imports` override for `**/*.tsx`.)_

**R2 — One colocated hook per rich component.** If a component needs anything from R1's forbidden list, it gets exactly one `use<ComponentName>.ts` beside it, and calls only that. Purely presentational components — props in, JSX out — need no hook, and most components should be presentational.

**R3 — The hook returns ONE view-model object.** Render-ready data, boolean flags, handlers — nothing the view must recompute or decide on. If the `.tsx` contains a `useMemo` or a business `if`, the view-model is incomplete. Group related members: `confirmDialog: { isOpen, close, confirm }`.

**R4 — Hooks orchestrate, services decide.** Any pure computation with business meaning — a threshold, an eligibility check, a total, a validation, a mapping — is a named function in a service file, even at three lines. Heuristic: **if you can describe the logic without saying "React," it is a service.**

**R5 — Services are React-free and store-free.** No imports from `react`, `react-*`, the store, the router, or any hook. Plain functions, deterministic wherever possible. _(Enforced: `no-restricted-imports` override for service files.)_

**R6 — Services return domain facts, not presentation.** Codes, booleans, numbers, domain objects — never UI copy, never JSX, never navigation, never toasts. Copy lives in `constants.ts`, keyed by the codes; the hook maps code → message → action.

**R7 — Placement follows reuse.** Logic is born colocated and climbs the promotion ladder (Chapter 2 §6) only when a real second caller appears.

**R8 — Cache logic lives on endpoints; state derivation lives in selectors.** Cache effects are declared on the endpoint that causes them (Chapter 4); derived store state is a memoized selector beside the state it reads. Hooks consume both and inline neither.

**R9 — Size triggers, measured per declaration.** A view component past ~150 lines splits into child components; a hook function past ~150 lines extracts sub-hooks or pushes logic into services; a service file past ~200 lines splits by topic. Review triggers, not hard gates.

Count the declaration, not the file. A file holding a screen and its two row components is not a 240-line view, and imports and the exported view-model type are not the kind of length this rule is about — R3 asks you to declare that type, so counting it here would penalise following R3. The trigger is asking one question: _is any single component or hook doing too much to read in one sitting?_

**R10 — Tests follow the layers.** Services: **mandatory** colocated unit tests — this is where the bugs live. Selectors and transformations: the same. Hooks: `renderHook` tests when the orchestration itself is non-trivial. Views: no tests — a view that needs a test is hiding logic that belongs one layer down. What only a hand can find — an overlay on a primary action, a popup that shuts on release — belongs in the browser suite instead, one spec per claim (§5).

**R11 — Mutations own their side effects.** No exported "remember to call this after the mutation" functions; cache effects are declared on the endpoint, cross-module effects travel as domain events (Chapter 4 §5). A hook cannot forget what it never sees.

**R12 — "Service" is a role, not a folder — and `utils` may not speak the domain.** Any pure business-logic file is a service, wherever it sits, and it is named for its topic (Chapter 2 §7). Domain vocabulary in a file named `utils` fails review.

**R13 — Types keep the evidence they were handed.** A boundary parses; everything inside it works with what parsing produced. So: no `unknown` parameter standing in for a value the caller knows the shape of, no `as` without a `SAFETY:` line naming the invariant that makes it true, no lookup table annotated `Record<Union, X>` when `satisfies` would keep the keys, and no `typeof` check doing the job a parse should have done at the edge. The failure this prevents is quiet: a function that accepts `unknown` and casts its way back to a type compiles forever and is wrong the first time the payload changes. Enforced by fifteen lint rules (section 5 of the config, [ADR-006](adr/006-evidence-preserving-types.md)); the exemption is the simulated backend, which fabricates its own data and would only be parsing its own seeds.

**R14 — A control the keyboard cannot reach is not shipped.** Every interactive element is focusable, named, and shows where focus is. A file input hidden with `display: none` is not a styling choice, it is a control that no longer exists for half the people using it — and the console had exactly that until the rules were turned on. Enforced by thirty-six lint rules (section 6 of the config, [ADR-007](adr/007-accessibility-as-enforcement.md)), which read markup and nothing else: focus order, contrast and reachability are asserted in `e2e/` or by tabbing through the screen, and green lint is not the same as accessible.

```
Where does this code go?
│
├─ JSX / what-to-show-when / mapping data to elements?
│        → the .tsx                      (view)
│
├─ Touches a query, mutation, store, router, modal state, or event?
│        → the useX hook                 (view logic)
│
├─ A rule, calculation, validation, or mapping you could explain
│  to a backend developer without mentioning React?
│        → a service function + test     (business logic)
│
├─ About the query cache — tags, optimistic updates?
│        → the endpoint's declared cache effects   (Chapter 4)
│
├─ Derived from module state?
│        → a memoized selector beside it
│
└─ A user-facing string?
         → constants.ts, keyed by domain code
```

## 5. The testing doctrine, defended

Jettison tests **business logic only**: services, transformations, selectors, and non-trivial hooks. Views get no tests, and this is a position, not an omission.

The reasoning: in the layered pattern, a view contains nothing but rendering — every value pre-computed, every decision pre-made. Testing it re-tests the framework. Meanwhile every function that can be _wrong in a way that costs money_ is a pure function with trivial test setup: input object in, codes out, no mocks, no DOM. The pattern doesn't just permit this testing strategy — it _produces_ it. Test coverage grows exactly where refactoring happens, because extracting a service without its test fails review (R10).

What a unit test cannot reach, a browser does. [`e2e/`](../e2e) drives four claims that exist nowhere else: a submitted release that survives its own reconciling refetch, the same journey in `?cache=naive` landing on a board without it, a withdrawal crossing from one module into another, and a popup that stays open under a real press-and-hold rather than an instant click. One spec per claim, not per screen — and each was verified to go red when the behaviour it names is removed, because a browser test that cannot fail is the same lie as a lint rule that matches nothing.

What the doctrine still gives up: pixel-level regression safety, and coverage of screens that make no architectural claim. Teams that need those add them per screen with intent — as a decision, not a default.

## 6. Consequences, stated honestly

**You gain:** unit-testable business rules, views readable as UI descriptions, diffs that separate rendering changes from rule changes, and a single orchestrated path for every flow.

**You pay with:** more files per component (four instead of one), a view-model discipline that feels ceremonial for the first week, and judgment calls at the margins (is this `useMemo` rendering logic or a business decision? — the flowchart answers most, not all).

**Not negotiable:** R1, R5, R6, R10. Those four carry the pattern; the rest tune it.

---

_Next: [Chapter 4 — The data layer](04-data-layer.md), where the hooks' queries come from and how caches stay consistent across modules._
