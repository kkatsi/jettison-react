// VIOLATION — modules never import other modules (the jettison test, as lint).
// Expected: jettison/layer-dependencies
import { releaseEditorRoutes } from '@modules/release-editor';

export const hasEditor = Boolean(releaseEditorRoutes);
