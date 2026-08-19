import { expect, press, test } from './harness';

// The regression this file exists for: the popup's own search field rendered a second
// trigger, which shut the popup on release. A screenshot of it looked fine.

test('the scope picker survives a real press, and writes the scope to the URL', async ({
  page,
}) => {
  await page.goto('/analytics');

  // The trigger is the kit's combobox; the popup's search field is the second one.
  const trigger = page.getByRole('combobox').first();
  const search = page.getByPlaceholder('Search releases and artists');

  await expect(trigger).toContainText('All releases');

  await press(trigger);
  await expect(search).toBeVisible();

  // The bug was in the release, not the press: it shut a frame later.
  await page.waitForTimeout(300);
  await expect(search).toBeVisible();

  await search.fill('Neon');
  await page.getByRole('option', { name: /Neon Arterial/ }).click();

  await expect(page).toHaveURL(/scope=/);
  await expect(trigger).toContainText('Neon Arterial');

  await press(trigger);
  await expect(search).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(search).toBeHidden();
});
