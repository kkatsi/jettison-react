// =============================================================================
// Domain events — the complete vocabulary of facts that cross a module boundary.
// =============================================================================
// One file, readable top to bottom, containing every cross-module fact in the
// application. That readability is the whole reason the events are centralised
// here rather than exported from the module that announces them: a reader (or a
// new joiner, or an agent) can learn what this app *does* in one screenful.
//
// Rules for anything added below:
//
//   1. Naming: `domain/<entity>/<past-tense fact>` — 'domain/releases/submitted'.
//      Events are facts that already happened, never commands ('submitRelease').
//   2. Payload: the smallest thing every listener needs. Prefer the entity that
//      changed over an id, so a reaction can patch its own cache without a fetch.
//   3. Zero logic. `createAction` calls only — no thunks, no defaults, no
//      normalisation. A file that decides something is not a vocabulary.
//   4. Fire-and-forget. A producer never knows who listens, and an event with no
//      listener is not an error — that is precisely why a module can be
//      jettisoned without touching the modules that talked to it.
//
// A payload type is itself a cross-module contract, so it is declared here too —
// `shared` may not import a module's types, and that constraint is doing useful
// work: it forces the payload to be the minimum both sides agree on, not one
// module's internal DTO leaking into another's reaction.
//
// The first events arrive with the catalog module (Phase 4):
//
//   export type SubmittedRelease = { id: string; catalogNumber: string; title: string };
//
//   export const releaseSubmitted = createAction<{ release: SubmittedRelease }>(
//     'domain/releases/submitted',
//   );
//
// Empty until then. Events are declared when something announces them.
// =============================================================================

export {};
