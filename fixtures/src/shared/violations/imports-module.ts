// VIOLATION — shared is business-agnostic; it may not import a module.
// Expected: boundaries/dependencies
import { catalogRoutes } from '@modules/catalog';

export const routeCount = Object.keys(catalogRoutes).length;
