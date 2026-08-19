// How a domain fact travels. `shared/events` names the facts; this file decides what
// one *is* — here a Redux action, so every event lands in the same DevTools timeline
// as the cache patches it causes (ADR-001). It is the only file a port has to
// replace, which is why the vocabulary above it names no library.

import { createAction } from '@reduxjs/toolkit';

/**
 * A fact that has already happened. The name is checked by the type: an event that
 * cannot be read as `domain/<entity>/<past-tense>` will not compile.
 */
export function defineEvent<Payload>(name: `domain/${string}/${string}`) {
  return createAction<Payload>(name);
}
