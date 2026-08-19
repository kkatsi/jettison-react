/**
 * Settle a promise or give up. Rejection is one failure mode; never settling at all
 * is the other, and it is the one that shows as a blank screen rather than an error.
 * Publishable to npm as-is (Ch. 2 §7).
 */
export async function withDeadline<T>(work: Promise<T>, ms: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      work,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(message)), ms);
      }),
    ]);
  } finally {
    // The loser of the race is still pending; without this its timer keeps the
    // event loop alive, which in a test run reads as a suite that will not exit.
    clearTimeout(timer);
  }
}
