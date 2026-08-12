// Every fact that crosses a module boundary, in one readable list.
//
// Naming: domain/<entity>/<past-tense fact>. Payload: the smallest thing a
// listener needs, and its type lives here too (shared can't import a module).
// No logic — createAction calls only.
//
// First ones arrive with catalog:
//
//   export type SubmittedRelease = { id: string; catalogNumber: string; title: string };
//   export const releaseSubmitted = createAction<{ release: SubmittedRelease }>(
//     'domain/releases/submitted',
//   );

export {};
