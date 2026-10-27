import { expect, test } from '@playwright/test'

test('loads the app', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('link', { name: 'NSM', exact: true })).toBeVisible()
})
