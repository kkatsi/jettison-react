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
  type ThunkDispatch,
  type UnknownAction,
} from '@reduxjs/toolkit';

/** One instance, added to the store once. */
export const reactionsMiddleware = createListenerMiddleware();

// Thunk-capable, because a cache patch (updateQueryData) is a thunk — a plain
// Dispatch would type-error at the one call every reaction has to make. The state
// parameter is `any` on purpose: a cache patch is typed against the store state it
// belongs to, and core may not import app to learn what that is. Reactions read
// their data from the event payload, never from getState, so nothing is lost.
// oxlint-disable-next-line typescript/no-explicit-any
export type ReactionDispatch = ThunkDispatch<any, unknown, UnknownAction>;

type ReactionApi = ListenerEffectAPI<unknown, ReactionDispatch>;

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
