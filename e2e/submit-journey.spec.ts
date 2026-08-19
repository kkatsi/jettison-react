import type { Page } from '@playwright/test';

import { expect, press, squarePng, test } from './harness';

// Journey A: a submitted release has to be on the board it lands on, seconds before
// the list endpoint will admit it exists. In `?cache=naive`, the same journey fails.

/** A seeded draft: titled, credited, tracks ready — a cover is all it lacks. */
const DRAFT = { catalogNumber: 'LOR-0069', title: 'Fluorescent Kids' };

/** Already in the pipeline, so an empty board can't pass for a missing row. */
const ANCHOR = 'LOR-0058';

const COVER = {
  name: 'fluorescent-kids.png',
  mimeType: 'image/png',
  buffer: squarePng(3000),
};

/** Past the read-model lag and the reconcile it schedules (2500 + 3500 in config). */
const AFTER_RECONCILE_MS = 4500;

test('a submitted release is on the board, and stays there', async ({ page }) => {
  await submitTheDraft(page, '/catalog');

  const row = boardRow(page);
  await expect(row).toBeVisible({ timeout: 3000 });

  // The verify half: the refetch that lands here confirms the patch instead of
  // clobbering it with a list that predates the write.
  await page.waitForTimeout(AFTER_RECONCILE_MS);
  await expect(row).toBeVisible();
});

test('naive mode lands on a board that is missing it', async ({ page }) => {
  await submitTheDraft(page, '/catalog?cache=naive');

  await expect(page.getByRole('row').filter({ hasText: ANCHOR })).toBeVisible({ timeout: 3000 });
  await expect(boardRow(page)).toHaveCount(0);

  // And it does not arrive late: nothing refetches again, so the row the user just
  // created is absent until something else asks for the list.
  await page.waitForTimeout(AFTER_RECONCILE_MS);
  await expect(boardRow(page)).toHaveCount(0);
});

const boardRow = (page: Page) => page.getByRole('row').filter({ hasText: DRAFT.catalogNumber });

async function submitTheDraft(page: Page, from: string): Promise<void> {
  await page.goto(from);

  await page.getByPlaceholder('Search releases, artists, cat. no.').fill(DRAFT.title);
  await expect(page.getByRole('row').filter({ hasText: DRAFT.catalogNumber })).toBeVisible();

  await press(page.getByRole('button', { name: `Actions for ${DRAFT.title}` }));
  await page.getByRole('menuitem', { name: 'Continue editing' }).click();

  await press(page.getByRole('button', { name: /Artwork & Credits/ }));

  // Reachable without a mouse: a `display: none` input leaves the wizard
  // uncompletable from the keyboard, and every static check stays green.
  const picker = page.locator('input[type=file]').first();
  await picker.focus();
  await expect(picker).toBeFocused();

  await picker.setInputFiles(COVER);
  await expect(page.getByText(`${COVER.name} · 3000×3000`)).toBeVisible();
  await expect(page.getByText('Passes')).toBeVisible();

  await press(page.getByRole('button', { name: /Review/ }));

  const submit = page.getByRole('button', { name: 'Submit for distribution' });
  await expect(submit).toBeEnabled();
  await press(submit);

  await expect(page.getByText(`${DRAFT.title} submitted for distribution`)).toBeVisible();
  await expect(page).toHaveURL(/\/distribution/);
}
