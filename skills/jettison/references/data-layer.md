# The data layer

One client, endpoints owned by modules, and cross-module cache sync through domain events — because tag invalidation lies when the backend is eventually consistent.

Library-agnostic. Any query library with a central client and programmatic cache access implements this; match whatever the target repo already uses.

## 1. One client, module-owned endpoints

Auth, retries, token refresh and error handling exist **once**, in `core/api/` — per-feature HTTP clients are how an app ends up with four subtly different refresh races. Endpoint _definitions_ belong to the module that uses them: `modules/<name>/api/endpoints.ts` registers them with the core client and exports the generated hooks. Consumers import hooks from the owning module, never from `core`.

A central `api/` folder owning every endpoint becomes the one directory every team edits, and the layer where module boundaries quietly dissolve.

When two modules need the same resource, **each defines its own endpoint for it.** Duplicating five lines is cheaper than a data module that couples them, and identical cache tags/keys keep the underlying entries consistent regardless of who defined them.

Four words inside `api/`, four meanings, never mixed:

| File                 | Contains                                                                                                         | Never contains                 |
| -------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| `endpoints.ts`       | definitions + their declared cache effects                                                                       | UI shapes, components          |
| `transformations.ts` | server response → UI shape, **nothing else**                                                                     | cache patching, business rules |
| inline cache recipes | draft updaters, beside the endpoint using them (promoted to `cache-recipes.ts` only when 2+ endpoints share one) | fetching, DTO mapping          |
| `types.ts`           | DTOs + domain types                                                                                              | logic                          |

`transformations.ts` is the boundary where the server's shape stops mattering. Transform once, at the edge. It is a prime unit-test target — mapping bugs are quiet and expensive.

## 2. Classify every cache effect before writing it

| Class | Situation                                                                                                      | Mechanism                                                                |
| ----- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **A** | same-module feedback — the editor patching its own detail after a save                                         | manual patch in the mutation's lifecycle (`onQueryStarted` / `onMutate`) |
| **B** | cross-module, and the read model is consistent by the time the user can reach the other screen                 | plain tag/key invalidation                                               |
| **C** | cross-module **and** eventually consistent — the thing just written must appear in another module's list _now_ | patch-then-verify via a domain event (§4)                                |

Class C exists because real enterprise backends are not read-your-writes consistent: writes land in a command store, read models project asynchronously, and for a second or three the list endpoint does not contain what you just wrote. Under that, invalidation is not merely insufficient — it is **destructive**: the refetch races the projection, returns the stale list, and the query library replaces your correct optimistic patch with it. The user watches their submission appear and vanish, and the bug reaches the backlog as "works after a refresh".

## 3. Mutations own their aftermath

Nothing about a mutation's consequences is the caller's job. **Never export an `updateXCacheAfterY` helper that callers must remember to call** — that design guarantees the eventual second call path that forgets. The endpoint declares everything: its Class-A patch, its Class-B invalidation, and for Class C the event it dispatches. Callers just await the mutation.

One prohibition follows: **a module never patches another module's cached queries.** Writing to a foreign module's cache is a module boundary violation travelling through the cache, invisible to every import rule — so it is law here or nowhere.

## 4. Cross-module sync travels as domain events

Classic Redux shape, in modern spelling — and portable to any typed emitter:

- **`shared/events/`** holds the vocabulary: typed event definitions, zero logic, `domain/` prefixed — `domain/releases/submitted`. One file to read the app's entire cross-module vocabulary. What an event _is_ on the wire is decided in one `core/events/` file; swap that and the vocabulary above it does not change.
- **The mutating module announces.** After the mutation resolves, the endpoint dispatches the event alongside its own Class-A patch.
- **Each interested module reacts** in its own `state/reactions.ts` — one `on(event, handler)` per case. The handler upserts into **its own** cache immediately (the patch), then schedules a delayed invalidation as reconciliation (the verify). By the time it fires the read model has caught up, so the refetch confirms rather than clobbers.
- **One core file** wraps the store's listener mechanism into a `createReactions((on) => …)` helper. No module touches middleware; the app shell registers each module's reactions inside a marker region, so the jettison test can strip it.

```
editor endpoint                       shared/events            catalog/state/reactions.ts
  patch own detail (Class A)
  dispatch(releaseSubmitted) ──▶  releaseSubmitted  ──────▶  upsert into own lists  (patch)
                                                             invalidate after delay (verify)
```

Why this preserves the architecture: jettison the listener and events fire into nothing; jettison the announcer and events never fire. Both still compile — events are fire-and-forget by construction. And it cannot regrow into a cache-update monolith, because the mechanics are contained: generic list surgery (`upsertListItem`, `patchListItem`, `removeListItem`, `invalidateTagsAfterDelay`) lives once in `core/api/cache-utils.ts`, reactions split per entity past ~100 lines, and a handler is a routing table — one lookup, one cache-util call, one delayed invalidation. **A handler past ~10 lines is smuggling logic** that belongs in a transformation or a util.

Two conventions contain the indirection: every event lives in `shared/events/`, and reactions exist **only** in `state/reactions.ts`.

## 5. The one honest exception

Some facts have no mutation behind them — a backend pipeline finished on its own. There is no mutation lifecycle to hang the announcement on, so the screen that owns the resource polls its own query, diffs against what it saw last render, and dispatches the event for each newly-changed item.

The cost is real and must be stated when you do it: **the fact is only announced while that screen is open.** Navigate away and nothing fires. A single announcement path is what makes an event log trustworthy, and this is a second one. The right home is the backend publishing the fact; this is the honest client-side approximation when the transport does not exist. It belongs in the module that owns the resource — never in a shared "watcher" that would have to know every entity.

## Non-negotiable

One base client · mutations own their effects · no cross-module cache writes. The event mechanism is the recommended Class-C vehicle; a team that finds a better one may swap it, behind those same three rules.
