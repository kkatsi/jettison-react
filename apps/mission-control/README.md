# Mission Control

The reference implementation of the [Jettison architecture](../../README.md) — a ground-station operations console for a fictional small-sat operator.

**Status: not yet built** — Phases 2–6 of [IMPLEMENTATION.md](../../IMPLEMENTATION.md). The planned shape:

| Module | Demonstrates |
|--------|--------------|
| `ops-log` | The smallest honest module — the jettison test's cheapest victim (Chapter 2 §5), and the first consumer of domain events |
| `fleet` | Fleet overview, satellite detail, pass board; domain events + reactions, patch-then-verify against a lagging backend (Chapter 4 §5) |
| `mission-planner` | Multi-step wizard (RHF + Zod), module-owned draft state, uplink eligibility as pure tested services (Chapter 3) |
| `telemetry` | ECharts dashboards fed by unit-tested `transformations.ts` (Chapter 4 §1) |

The mock backend (MSW) **simulates eventual consistency on purpose** — see [ADR-002](../../docs/adr/002-msw-simulated-eventual-consistency.md). A `?cache=naive` flag reproduces, on screen, the failure mode the architecture exists to prevent.

Stack: React 19 · TypeScript strict · Vite · RTK Query ([ADR-001](../../docs/adr/001-why-rtk-query-in-2026.md)) · Tailwind v4 + cva design-system kit in `shared/ui` · React Hook Form + Zod · ECharts · MSW 2 · Vitest 3. Deployed as static assets on Cloudflare Workers.
