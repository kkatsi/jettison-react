# Chapter 4 — The Data Layer

> The whole chapter in one line: **one API client in `core`, endpoints owned by modules, and cross-module cache sync through domain events — because tag invalidation lies when your backend is eventually consistent.**

---

## 1. One client, module-owned endpoints

Two forces pull in opposite directions. Auth, retries, token refresh, and error handling must be implemented **once** — per-feature HTTP clients are how an app ends up with four subtly different token-refresh races. But endpoint *definitions* belong to the modules that use them — a central `api/` folder that owns every endpoint becomes the one directory every team edits, and the layer where module boundaries quietly dissolve.

The doctrine resolves the tension — and it is library-agnostic; any query library with a central client and programmatic cache access can implement it (the reference implementation uses RTK Query — [ADR-001](adr/001-why-rtk-query-in-2026.md); the TanStack Query mapping is in the [appendix](#appendix--porting-this-chapter-to-tanstack-query)):

- **`core/api/`** owns the single client: base query, auth header injection, token refresh (behind a mutex, so concurrent 401s trigger one refresh), retry policy, and the central cache-tag registry (one commented block per module). *The reference app's [`core/api/api.ts`](../src/core/api/api.ts) has the header, the retry policy and the registry; it has no refresh, because the mock backend has no refresh flow to build one against. The file says so where the mutex would go — a doctrine this repo cannot demonstrate is named rather than implied.*
- **Each module** defines its endpoints in `modules/<name>/api/endpoints.ts` by *registering them with* the core client (RTK Query: `api.injectEndpoints(...)`) and exports the generated hooks from there. Consumers import hooks from the owning module's `api/`, never from `core`.

When two modules need the same resource, each defines its own endpoint for it. Duplicating a five-line endpoint definition is cheaper than a shared data module coupling them — and identical tags keep the underlying cache entries consistent regardless of who defined the endpoint.

### The naming taxonomy inside `api/`

Four words, four meanings, never mixed:

| File | Contains | Never contains |
|---|---|---|
| `endpoints.ts` | endpoint definitions + their declared cache effects | UI shapes, components |
| `transformations.ts` | server response → UI shape, **nothing else** | cache patching, business rules |
| inline cache recipes | draft updaters passed to `updateQueryData`, defined beside the endpoint using them (promoted to `cache-recipes.ts` only when 2+ endpoints share one) | fetching, DTO mapping |
| `types.ts` | DTOs + domain types | logic |

`transformations.ts` earns special respect: it is the boundary where the server's shape stops mattering. Transform once, at the edge, into the shape the UI consumes — and it is a prime unit-test target (R10), because mapping bugs are quiet and expensive.

## 2. The state placement table

The pain: **the same value is in a slice, a query, a prop and a `useState` — four copies that immediately disagree**, and the bug only reproduces on one screen because that screen reads a different copy. Nobody set out to build that. It is what happens when each new piece of state is placed by whoever added it, on the day they added it.

Every piece of state has exactly one correct home. The table is the whole doctrine:

| Kind of state | Home | Examples |
|---|---|---|
| Server data | the query cache — only | releases, tracks, streams, payouts |
| Local UI state | `useState` in the component | modal open, hovered row, active tab |
| Form state | React Hook Form | every form |
| URL-worthy state | the router (query params) | filters, pagination, selected tab that should survive reload |
| Feature/subtree state | context or `useReducer` at the feature root | a canvas tool's selection, an inline editor's mode |
| Module state that survives navigation | module slice in `modules/*/state`, registered in `app/store.ts` | drafts, long-lived selections |
| App-global state | a global slice — **requires an ADR** | session, tokens, active tenant |

The reference app never reaches that row — it has no React context at all. Its one multi-step flow keeps the current step in the URL, because a wizard step is linkable and must survive a reload, which makes it the row above. Take that as the table working: escalate only when the level below demonstrably fails, and most flows never need the escalation.

Resolution order when unsure: **props → context → store.** Escalate only when the current level demonstrably fails, and never let context cross a module boundary — inside a module it is a dependency-injection tool; across modules it would be a hidden bus.

Two prohibitions with teeth: server data never gets copied into a slice ("mirroring the cache" creates two sources of truth that immediately disagree), and new *global* slices don't happen without a written decision — global state is the most expensive kind, so it carries the highest burden of proof.

## 3. The cache consistency problem

Here is where most architectures go quiet, and where this one was forged.

The scenario: the **release-editor** module submits a release for distribution. The **catalog** module's screens — its distribution board, its releases list — must reflect that immediately. The textbook answer is tag invalidation: the mutation invalidates `['Releases']`, catalog's queries refetch, done.

The textbook answer assumes the backend is **read-your-writes consistent**. Real enterprise backends often aren't: writes land in a command store, read models are projected asynchronously, and for a second or three the list endpoint *does not yet contain what you just wrote*. Under eventual consistency, invalidation isn't just insufficient — it is **destructive**: the refetch races the projection, returns the stale list, and the query library dutifully replaces the cache with it. If you had optimistically patched the cache, the refetch *clobbers your correct patch with stale server data*. The user watches their freshly submitted release appear and then vanish.

The reference app's mock backend simulates this lag on purpose (see ADR-002), so the failure is reproducible on screen. Flip the demo to `?cache=naive`, submit a release, and it is simply not on the distribution board when you arrive — and it stays missing until something else refetches, which is how this bug reaches the backlog as "works after a refresh."

Note what you do *not* see: the row appearing and then vanishing. The patch is made and destroyed in about 140ms, while the route transition to the board takes closer to 250 — so the race is over before the screen that would show it exists. The demo proves the outcome, not the flicker. That is the ordinary case: most users never witness the race, they just report the result.

So every cache effect is first **classified**:

| Class | Situation | Mechanism |
|---|---|---|
| **A** | Same-module feedback — the editor patching its own release detail after a save | Manual patch in the mutation's `onQueryStarted` |
| **B** | Cross-module, and the read model is consistent by the time the user can reach the other screen | Plain `invalidatesTags` |
| **C** | Cross-module **and** eventually consistent — the release just submitted must appear in catalog's lists *now* | **Patch-then-verify via domain events** (§5) |

## 4. Rule one: mutations own their cache effects

Nothing about a mutation's aftermath is the caller's job. No exported `updateXCacheAfterY` helpers that components must remember to call — that design guarantees the eventual second call path that forgets. A mutation's endpoint declares everything: its Class-A patches in `onQueryStarted`, its Class-B tags in `invalidatesTags`, and for Class C it dispatches a **domain event**. Callers just `await mutation().unwrap()`.

One hard prohibition follows: **a module never patches another module's cached queries.** Manual `updateQueryData` against a foreign module's endpoints is a module boundary violation through the cache — invisible to import rules, so it must be law here.

## 5. Rule two: cross-module sync travels as domain events

The shape is classic Redux, in modern spelling:

- **`shared/events/`** holds the domain events — typed `createAction` definitions, zero logic. This is the "action constants file": a complete, readable catalogue of every fact that may cross a module boundary. `domain/releases/submitted`, `domain/releases/withdrawn`.
- **The mutating module announces.** After `queryFulfilled`, the endpoint dispatches `releaseSubmitted({ release })` alongside its own Class-A patches.
- **Each interested module reacts** in `state/reactions.ts` — its "reducer switch": one `on(event, handler)` per case. The handler upserts into *its own* cached queries immediately (the patch), and schedules a delayed tag invalidation as reconciliation (the verify) — by the time it fires, the read model has caught up, and the refetch confirms rather than clobbers.
- **One core file** ([`core/redux/reactions.ts`](../src/core/redux/reactions.ts), under fifty lines, written once) wraps the store's listener mechanism (RTK: `createListenerMiddleware`) into a `createReactions((on) => …)` helper. No module ever touches middleware; `app/store.ts` registers each module's reactions inside the reactions marker region — one of the registration lines the jettison test strips (Chapter 1 §3).

```
editor endpoint                          shared/events                 catalog/state/reactions.ts
───────────────                          ─────────────                 ──────────────────────────
onQueryStarted:
  patch own detail (Class A)
  dispatch(releaseSubmitted(rel)) ──▶  releaseSubmitted  ──────────▶  on(releaseSubmitted):
                                                                        upsert into own lists   (patch)
                                                                        invalidate after delay  (verify)
```

Why this preserves the architecture:

- **The jettison test survives.** Jettison catalog → the editor dispatches events nobody hears; jettison the editor → events never fire and catalog still compiles. Events are fire-and-forget by construction.
- **Debugging is a timeline, not a hunt.** DevTools shows the event action followed by the exact patches it caused.
- **It cannot regrow into a cache-update monolith,** because the mechanics are contained: generic list surgery (`upsertListItem`, `patchListItem`, `removeListItem`, `invalidateTagsAfterDelay`) lives once in `core/api/cache-utils.ts`; reactions files split per entity past ~100 lines; and a handler is a routing table — one lookup, one cache-util call, one delayed invalidation. A handler past ~10 lines is smuggling logic that belongs in a transformation or util.

Two conventions contain the indirection cost: all events live in `shared/events/` with the `domain/` prefix — one place to read the app's entire cross-module vocabulary — and reactions exist *only* in `state/reactions.ts`, nowhere else.

## 6. Consequences, stated honestly

**You gain:** a data layer where auth exists once, endpoint ownership matches module ownership, every mutation's aftermath is declared where it can't be skipped, and cross-module consistency that works under the backend behavior enterprises actually have.

**You pay with:** indirection (an event between cause and effect — priced at two conventions and a DevTools timeline), the `tagTypes` registry as a shared file modules append to, and delayed invalidation timers that are a heuristic, not a proof (the *verify* step exists precisely because the *patch* might be wrong).

**Not negotiable:** one base client, mutations own their effects, no cross-module cache writes. The event mechanism is the recommended Class-C vehicle; a team that finds a better one may swap it — behind the same three rules.

---

## Appendix — Porting this chapter to TanStack Query

Unlike every other section in these chapters, this one answers an objection rather than a pain — *"this is RTK-specific, so it isn't for us."* It earns its place because the chapters claim to be library-agnostic, and a claim like that is worth exactly as much as the mapping that makes it checkable.

The doctrine above names no library, and every mechanism has a TanStack Query equivalent. If your team is on TanStack Query, the mapping is:

| Doctrine element | RTK Query (reference impl) | TanStack Query equivalent |
|---|---|---|
| One client in `core` | `createApi` + base query | one `queryClient` + one fetch wrapper (auth, refresh mutex, retry) in `core/api/` |
| Module-owned endpoints | `injectEndpoints` per module | query/mutation option factories (`releaseQueries.list()`, `queryOptions(...)`) per module `api/` |
| Cache tags | `tagTypes` registry | hierarchical query keys; the registry becomes a `core` query-key factory convention |
| Class A: own-cache patch | `onQueryStarted` + `updateQueryData` | `onMutate`/`onSuccess` + `queryClient.setQueryData` |
| Class B: plain invalidation | `invalidatesTags` | `queryClient.invalidateQueries({ queryKey })` |
| Class C: domain events | `createAction` + listener middleware | a typed event emitter in `shared/events/` (or keep a minimal Redux store just for events) |
| Reactions | `state/reactions.ts` via `createReactions` | `state/reactions.ts` subscribing to the emitter, calling `setQueryData` + delayed `invalidateQueries` |
| Registration line the jettison test strips | `registerCatalogReactions()` in `store.ts` | `registerCatalogReactions()` in app bootstrap |

What survives the port unchanged: the three non-negotiables (one client, mutations own their effects, no cross-module cache writes), the A/B/C classification, patch-then-verify, and the jettison test. What you lose: the single Redux DevTools timeline where each event is followed by the exact cache patches it caused — with TanStack Query the event log and the cache live in different tools. That loss is the substance of [ADR-001](adr/001-why-rtk-query-in-2026.md); weigh it for your team rather than inheriting our conclusion.

---

*Decisions and trade-offs behind these chapters: [`docs/adr/`](adr). The running proof: the Low Orbit Records console in [`src/`](../src).*
