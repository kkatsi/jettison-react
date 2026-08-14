import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';

import { useStartReleaseMutation } from '../../api/endpoints';

export type NewReleaseModel = {
  /** The one thing that can go wrong here: the label never issued a number. */
  failure: { onRetry: () => void } | null;
};

/**
 * `/releases/new` is not a screen, it is an allocation: the label issues the
 * catalogue number, and the wizard opens on the release that now exists — or on
 * the blank one it already had.
 */
export function useNewRelease(): NewReleaseModel {
  const [startRelease] = useStartReleaseMutation();
  const navigate = useNavigate();
  const [hasFailed, setHasFailed] = useState(false);
  // The backend deduplicates blank drafts, but StrictMode runs effects twice on
  // purpose and there is no reason to ask twice.
  const started = useRef(false);

  const start = useCallback(async () => {
    setHasFailed(false);

    try {
      const draft = await startRelease().unwrap();
      void navigate(`/releases/${draft.id}/edit/details`, { replace: true });
    } catch {
      setHasFailed(true);
    }
  }, [startRelease, navigate]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void start();
  }, [start]);

  return { failure: hasFailed ? { onRetry: () => void start() } : null };
}
