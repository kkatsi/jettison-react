// VIOLATION — a module is consumed only through its index.ts.
// Expected: boundaries/entry-point
import { deriveReleaseStatus } from '@modules/catalog/services/release-status';

export const status = deriveReleaseStatus([]);
