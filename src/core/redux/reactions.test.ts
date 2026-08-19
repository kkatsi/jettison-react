// The seam the whole event mechanism rests on: an event defined in shared's
// vocabulary must still be the thing a module's reaction listens for. Nothing else
// asserts that — a broken match here is silent, and every cross-module update stops.
import { configureStore } from '@reduxjs/toolkit';
import { afterEach, describe, expect, it } from 'vitest';

import { defineEvent } from '../events/events';
import { createReactions, reactionsMiddleware } from './reactions';

const somethingHappened = defineEvent<{ id: string }>('domain/tests/happened');
const somethingElseHappened = defineEvent<{ id: string }>('domain/tests/also-happened');

const storeWithReactions = () =>
  configureStore({
    reducer: () => ({}),
    middleware: (getDefault) => getDefault().prepend(reactionsMiddleware.middleware),
  });

afterEach(() => void reactionsMiddleware.clearListeners());

describe('createReactions', () => {
  it('delivers the payload of the event it registered for', () => {
    const seen: string[] = [];
    createReactions((on) => on(somethingHappened, ({ id }) => void seen.push(id)))();

    storeWithReactions().dispatch(somethingHappened({ id: 'lor-0042' }));

    expect(seen).toEqual(['lor-0042']);
  });

  it('ignores every other event', () => {
    const seen: string[] = [];
    createReactions((on) => on(somethingHappened, ({ id }) => void seen.push(id)))();

    storeWithReactions().dispatch(somethingElseHappened({ id: 'lor-0043' }));

    expect(seen).toEqual([]);
  });

  it('registers nothing until the returned function is called', () => {
    const seen: string[] = [];
    createReactions((on) => on(somethingHappened, ({ id }) => void seen.push(id)));

    storeWithReactions().dispatch(somethingHappened({ id: 'lor-0044' }));

    expect(seen).toEqual([]);
  });
});
