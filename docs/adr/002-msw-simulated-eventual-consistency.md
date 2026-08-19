# ADR-002: The mock backend simulates eventual consistency on purpose

> Architecture Decision Record — the Low Orbit Records console

---

## Status

Accepted

## Date

2026-08-11

## Normative level

**MUST** — for the reference app's mock backend. The lag is a feature; removing it invalidates the demo.

## Context

The reference app needs a backend that runs entirely in the browser (MSW service worker) so the demo deploys as a static SPA with zero infrastructure. The lazy default would be a mock that responds instantly and consistently — every write immediately visible to every read.

But the architecture's hardest doctrine — cache Class C, patch-then-verify via domain events (Chapter 4 §§3–5) — exists _because_ enterprise backends are frequently **not** read-your-writes consistent: writes land in a command store, read models project asynchronously. A mock that hides this property would make the architecture's most original mechanism look like ceremony. Anyone could ask "why not just `invalidatesTags`?" and the demo would have no answer.

## Decision

The MSW handlers maintain a write model and **lagging read models**. Mutations apply to the write model instantly and return success; list/aggregate read endpoints serve a projection that catches up after a configurable delay (default ~2.5s). Detail-by-id reads serve the write model directly — mirroring the common real-world split where the entity you just wrote is readable but the lists haven't caught up.

A documented demo flag (`?cache=naive`) switches the app's Class-C handling from patch-then-verify to plain tag invalidation, so the failure is reproducible on screen. Submit a release and compare where you land: in events mode the distribution board already has it; in naive mode the racing refetch has clobbered the patch with the stale projection, so the board does not, and will not until something else refetches. The lag is also honest to the domain: real music distribution takes hours to deliver, stores review releases asynchronously, and streaming stats trail by days — the mock's 2.5 seconds is that reality, compressed for a demo.

## Costs & sharp edges (be honest)

- **The demo feels briefly "broken" by design in naive mode.** That is the point, but it must be labeled loudly in the UI, or visitors will file the bug we are demonstrating.
- **The appear-then-vanish flicker is not observable, and this ADR used to claim it was.** Measured in a driven browser: the submit resolves, patches the cache and invalidates within ~140ms, while the route transition to the distribution board does not begin until ~250ms and the board does not paint until ~850ms. The clobber is finished before the screen that would show it mounts. What the demo proves is the _outcome_ — the release is absent — not the race that produced it. Making the race visible would mean navigating before the mutation resolves, which trades a real error path for a screenshot; we kept the error path.
- **A lagging mock complicates every future feature added to the reference app** — contributors must think about which endpoints read which model. This is a real tax; it is also exactly the thinking the architecture trains.
- **The lag constant is a caricature.** Real projection lag is variable and occasionally long; a fixed 2.5s cannot prove the delayed-invalidation heuristic correct (nothing can — Chapter 4 calls it a heuristic honestly). It proves the _mechanism_, not the tuning.
- **MSW in production-mode deploys means the service worker ships to visitors.** Acceptable for a demo; would be malpractice in a real product.
- **No worker, no app.** Booting the mock before the first render means the console has no degraded mode: if registration refuses or never answers, there is nothing behind any screen. That used to render as a permanently blank page — the one failure mode Ch. 2's doctrine exists to prevent. `startMockBackend` now settles either way (an 8s deadline covers a registration that hangs rather than refuses) and `main.tsx` renders [`BootFailure`](../../src/app/screens/BootFailure.tsx) with the reason. A real backend would degrade per screen instead; this one cannot, and says so.

## Alternatives considered

**Instant-consistent mock.** Simplest, and it silently deletes the argument for the architecture's centerpiece. Rejected as self-defeating.

**A real backend (small hosted API).** Maximum realism, but the demo stops being a static link, gains infrastructure to babysit, and the consistency behavior becomes an accident of the host rather than a controlled, reproducible property.

## Consequences

**Positive** — the Class A/B/C classification becomes demonstrable rather than asserted; the repo's central claim has a reproduction, not a diagram.
**Negative** — permanent extra care in mock-handler design; a demo mode that intentionally misbehaves.
**Neutral** — the write/read-model split in the mock doubles as a teaching artifact for how the real backends this architecture targets actually behave.

## Related

Chapter 4 §§3–5; the MSW handlers in [`src/mocks/`](../../src/mocks); the `?cache=naive` demo flag.
