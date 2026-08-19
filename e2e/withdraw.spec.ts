import { expect, press, test } from './harness';

// Cross-module sync, driven: catalog withdraws, activity shows it, and no import
// runs between them — only the event they both know.

const RELEASE = { catalogNumber: 'LOR-0042', title: 'Neon Arterial' };

/** Long enough that the feed's own reconcile has landed (config: 2500 + 3500). */
const AFTER_RECONCILE_MS = 4500;

test('withdrawing a release writes it into the activity feed', async ({ page }) => {
  const withdrawals = page.getByText('domain/releases/withdrawn');

  await page.goto('/activity');
  await page.getByPlaceholder('Search events, releases, people').fill(RELEASE.catalogNumber);
  const before = await withdrawals.count();

  await page.getByRole('link', { name: 'Catalog' }).click();
  await page.getByPlaceholder('Search releases, artists, cat. no.').fill(RELEASE.title);
  await page.getByRole('row').filter({ hasText: RELEASE.catalogNumber }).click();
  await expect(page).toHaveURL(/\/catalog\/lor-0042/);

  await press(page.getByRole('button', { name: 'Withdraw from distribution' }));
  await expect(page.getByText(`Withdraw ${RELEASE.title}?`)).toBeVisible();
  await press(page.getByRole('button', { name: 'Withdraw from all stores' }));

  await expect(page.getByText(`${RELEASE.title} withdrawn from distribution`)).toBeVisible();

  await page.getByRole('link', { name: 'Activity' }).click();
  await page.getByPlaceholder('Search events, releases, people').fill(RELEASE.catalogNumber);

  // Inside the read-model lag: nothing has refetched yet, so the only thing that can
  // have put this row on screen is the reaction.
  await expect(withdrawals).toHaveCount(before + 1, { timeout: 1500 });

  // And after the reconcile, still one — the backend recorded the same fact under its
  // own id, so the refetch replaces the row rather than doubling it.
  await page.waitForTimeout(AFTER_RECONCILE_MS);
  await expect(withdrawals).toHaveCount(before + 1);
});
