import { expect, test } from '@playwright/test';

test('renders the ERP workspace shell', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: 'ERP workspace foundation' }),
  ).toBeVisible();
  await expect(page.getByText('REST boundary enforced')).toBeVisible();
  await expect(page.getByText('Backend auth core is wired')).toBeVisible();
});
