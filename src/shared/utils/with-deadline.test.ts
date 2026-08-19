import { describe, expect, it, vi } from 'vitest';

import { withDeadline } from './with-deadline';

describe('withDeadline', () => {
  it('passes the value through when the work settles in time', async () => {
    await expect(withDeadline(Promise.resolve('ready'), 50, 'too slow')).resolves.toBe('ready');
  });

  it('keeps the original failure rather than replacing it with the deadline', async () => {
    const failed = Promise.reject(new Error('registration refused'));

    await expect(withDeadline(failed, 50, 'too slow')).rejects.toThrow('registration refused');
  });

  it('rejects with the message when the work never settles', async () => {
    vi.useFakeTimers();
    try {
      const pending = withDeadline(new Promise<never>(() => undefined), 8000, 'too slow');
      const assertion = expect(pending).rejects.toThrow('too slow');

      await vi.advanceTimersByTimeAsync(8000);
      await assertion;
    } finally {
      vi.useRealTimers();
    }
  });

  it('clears its timer, so a finished race leaves nothing pending', async () => {
    vi.useFakeTimers();
    try {
      await withDeadline(Promise.resolve('ready'), 8000, 'too slow');

      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });
});
