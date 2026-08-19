// VIOLATION — a module is consumed only through its index.ts.
// Expected: jettison/module-privacy
import { deriveReleaseStatus } from '@modules/catalog/services/release-status';

export const status = deriveReleaseStatus([]);
