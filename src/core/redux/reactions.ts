// =============================================================================
// Reactions — the one place middleware is touched.
// =============================================================================
// A module reacts to another module's domain events without either knowing the
// other exists (Chapter 4 §5). The mechanism is Redux listener middleware; the
// point of this file is that no module ever has to know that.
//
// A module writes, in `state/reactions.ts`:
//
//   export const registerCatalogReactions = createReactions((on) => {
//     on(releaseSubmitted, ({ release }, { dispatch }) => { … });
//   });
//
// and `app/store.ts` calls `registerCatalogReactions()` — the one line the
// jettison test strips when it throws the module overboard.
// =============================================================================

import {
  createListenerMiddleware,
  type ActionCreatorWithPayload,
  type ListenerEffectAPI,
  type Dispatch,
  type UnknownAction,
} from '@reduxjs/toolkit';

/** The single listener instance, added to the store once in `app/store.ts`. */
export const reactionsMiddleware = createListenerMiddleware();

type ReactionApi = ListenerEffectAPI<unknown, Dispatch<UnknownAction>>;

type Register = <Payload>(
  event: ActionCreatorWithPayload<Payload>,
  handler: (payload: Payload, api: ReactionApi) => void | Promise<void>,
) => void;

/**
 * Declare a module's reactions. Returns the registration function `app/store.ts`
 * calls; nothing is listening until it does, which is what keeps a jettisoned
 * module's reactions from lingering as a dangling subscription.
 */
export function createReactions(declare: (on: Register) => void): () => void {
  return () => {
    declare((event, handler) => {
      reactionsMiddleware.startListening({
        actionCreator: event,
        effect: (action, api) => handler(action.payload, api),
      });
    });
  };
}
