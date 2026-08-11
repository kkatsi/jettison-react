# ADR-001: Why RTK Query in 2026

> Architecture Decision Record

---

## Status

Accepted

## Date

2026-08-11

## Normative level

**MUST** — all server communication goes through the single RTK Query instance. No feature-level HTTP clients, no raw `fetch` in modules.

## Context

The architecture (Chapter 4) requires three properties from its data layer: auth/retry/refresh implemented exactly once; endpoint definitions ownable by modules without a central bottleneck; and programmatic cache access from *outside* React components — the domain-event reactions (Chapter 4 §5) patch cached queries from listener middleware, not from hooks.

The realistic candidates in 2026: TanStack Query, RTK Query, or a hand-rolled client with SWR-style caching.

## Decision

One `createApi` instance in `core/api/`, endpoints injected per module via `injectEndpoints`, all client state and server cache under one Redux store.

The deciding property is the third one: **reactions need first-class cache access from plain TypeScript.** RTK Query's cache *is* Redux state — `api.util.updateQueryData` is dispatchable from any middleware, and DevTools shows every event followed by the exact cache patches it caused. TanStack Query can be scripted from outside React too (`queryClient` is an object), but pairing it with the event/reaction system would mean two state universes — the query cache and the store — with the event bus straddling them, and no single timeline of what happened.

## Costs & sharp edges (be honest)

- **Redux is the price of admission.** Teams allergic to Redux pay it everywhere; the store, middleware, and DevTools become mandatory vocabulary.
- **The `tagTypes` registry is a central file modules must append to.** A mild, deliberate bottleneck — kept tolerable by treating it as a commented registry.
- **RTK Query's cache does not normalize across queries.** The same entity in two lists is two copies; the reactions system exists partly to keep them coherent, and it is convention-held, not machine-proven.
- **Optimistic patches are Immer recipes against inferred draft types** — the least type-safe corner of the stack. Kept small and colocated (the cache-recipe convention) for exactly that reason.

## Alternatives considered

**TanStack Query + Zustand.** The stronger pure-fetching DX and the default choice elsewhere. Lost on the two-universe problem above: cross-module consistency under eventual consistency is this architecture's hardest requirement, and it wants one inspectable state timeline.

**Hand-rolled client.** Full control, zero dependency risk, and a guarantee the team spends its year rebuilding request dedup, cache lifetimes, and invalidation. Rejected without much grief.

## Consequences

**Positive** — one auth implementation; module-owned endpoints; cache, events, and reactions in one timeline; generated, typed hooks.
**Negative** — Redux buy-in; central tag registry; per-copy cache coherence maintained by convention.
**Neutral** — the store also hosts the few genuine client-state slices (Chapter 4 §2), so its existence is amortized.

## Related

Chapter 4 (including its "Porting to TanStack Query" appendix — the honest map of what the alternative costs and saves); ADR-002 (the backend behavior this layer is built for); `core/api/` in the reference app.
