// VIOLATION — R1: a view that fetches, dispatches and navigates.
// Expected: @typescript-eslint/no-restricted-imports (x3)
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router';

import { baseUrl } from '@core/api/api';

export function BadView() {
  const releases = useSelector(() => []);
  const navigate = useNavigate();

  return (
    <button onClick={() => navigate(baseUrl)}>{releases.length}</button>
  );
}
