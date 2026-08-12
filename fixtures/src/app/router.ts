// COMPLIANT — only app composes: it may import every module's public API.
import { catalogRoutes } from '@modules/catalog';
import { releaseEditorRoutes } from '@modules/release-editor';

export const routes = [catalogRoutes, releaseEditorRoutes];
