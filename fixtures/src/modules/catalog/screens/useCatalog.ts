// COMPLIANT — the hook orchestrates: it may hold the store and the endpoints.
import { useDispatch } from 'react-redux';

import { fetchReleases } from '../api';

export function useCatalog() {
  const dispatch = useDispatch();
  return {
    releases: fetchReleases(),
    onRefresh: () => dispatch({ type: 'catalog/refresh' }),
  };
}
