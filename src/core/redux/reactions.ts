// The only file that touches middleware. A module declares reactions:
//
//   export const registerCatalogReactions = createReactions((on) => {
//     on(releaseSubmitted, ({ release }, { dispatch }) => { … });
//   });
//
// and app/store.ts calls it — the line the jettison test strips.

import {
  createListenerMiddleware,
  type ActionCreatorWithPayload,
  type ListenerEffectAPI,
  type Dispatch,
  type UnknownAction,
} from '@reduxjs/toolkit';

/** One instance, added to the store once. */
export const reactionsMiddleware = createListenerMiddleware();

type ReactionApi = ListenerEffectAPI<unknown, Dispatch<UnknownAction>>;

type Register = <Payload>(
  event: ActionCreatorWithPayload<Payload>,
  handler: (payload: Payload, api: ReactionApi) => void | Promise<void>,
) => void;

/** Nothing listens until the returned function is called. */
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
