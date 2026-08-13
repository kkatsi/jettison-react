// The only door (Chapter 2 §2). Routes, plus the one slice this module owns —
// both registered by the app shell, both removed by the jettison test.

export { releaseEditorRoutes } from './routes';

// Exported under the module's own name, not the slice's: the shell's registration
// line has to name the module, or the jettison test cannot find it to remove.
export { draftSlice as releaseEditorSlice } from './state/draft-slice';
