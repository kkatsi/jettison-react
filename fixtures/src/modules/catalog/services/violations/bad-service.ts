// VIOLATION — R5: a service reaching for React and the endpoints.
// Expected: @typescript-eslint/no-restricted-imports (x2)
import { useMemo } from 'react';

import { fetchReleases } from '@modules/catalog/api';

export function useReleaseCount() {
  return useMemo(() => fetchReleases().length, []);
}
