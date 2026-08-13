import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';

import { useCreateDraftMutation } from '../../api/endpoints';

export type NewReleaseModel = {
  /** The one thing that can go wrong here: the label never issued a number. */
  failure: { onRetry: () => void } | null;
};

/**
 * `/releases/new` is not a screen, it is an allocation: the label issues the
 * catalogue number, and the wizard opens on the release that now exists.
 */
export function useNewRelease(): NewReleaseModel {
  const [createDraft] = useCreateDraftMutation();
  const navigate = useNavigate();
  const [hasFailed, setHasFailed] = useState(false);
  // A second draft would burn a second catalogue number, and StrictMode runs
  // effects twice on purpose.
  const started = useRef(false);

  const start = useCallback(async () => {
    setHasFailed(false);

    try {
      const draft = await createDraft().unwrap();
      void navigate(`/releases/${draft.id}/edit/details`, { replace: true });
    } catch {
      setHasFailed(true);
    }
  }, [createDraft, navigate]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void start();
  }, [start]);

  return { failure: hasFailed ? { onRetry: () => void start() } : null };
}
