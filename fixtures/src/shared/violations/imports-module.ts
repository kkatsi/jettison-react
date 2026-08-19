// VIOLATION — shared is business-agnostic; it may not import a module.
// Expected: jettison/layer-dependencies
import { catalogRoutes } from '@modules/catalog';

export const routeCount = Object.keys(catalogRoutes).length;
