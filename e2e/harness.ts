import { crc32, deflateSync } from 'node:zlib';

import { expect, test as base, type Locator } from '@playwright/test';

/** A quiet console is a precondition: a library's own warning is a finding here. */
export const test = base.extend({
  // `run`, not `use`: the argument is positional, and a bare `use` reads to every
  // hooks linter as React's.
  page: async ({ page }, run) => {
    const noise: string[] = [];

    page.on('console', (message) => {
      if (message.type() === 'error') noise.push(message.text());
    });
    page.on('pageerror', (error) => noise.push(error.message));

    await run(page);

    expect(noise, 'the browser console must stay quiet').toEqual([]);
  },
});

export { expect };

/** A press the way a hand makes one: `click()` lands down and up in the same
    millisecond, which dodges every bug that lives in the hold. */
export async function press(target: Locator, holdMs = 120): Promise<void> {
  const box = await target.boundingBox();
  if (!box) throw new Error('press: the target has no box on screen');

  const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };

  // Who owns the pixel, before anyone blames a handler.
  const isOnTop = await target.evaluate((node, at) => {
    const top = document.elementFromPoint(at.x, at.y);
    return top !== null && (node === top || node.contains(top));
  }, point);
  expect(isOnTop, 'something else owns the pixel this press lands on').toBe(true);

  const { mouse } = target.page();
  await mouse.move(point.x, point.y);
  await mouse.down();
  await target.page().waitForTimeout(holdMs);
  await mouse.up();
}

/** A cover the stores would accept, built rather than committed — a binary would be
    the one fixture in the repo nobody can read. */
export function squarePng(size: number): Buffer {
  // Black: then the filter byte every row needs is zero too, so the raster is.
  const raster = Buffer.alloc(size * (1 + size * 3));

  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bit depth
  header[9] = 2; // truecolour

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raster)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function chunk(type: string, data: Buffer): Buffer {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4, 'ascii');

  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])), 0);

  return Buffer.concat([head, data, checksum]);
}
