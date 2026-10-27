import { expect, test, type Page } from '@playwright/test'

test.use({ storageState: { cookies: [], origins: [] } })

const TOAST = 'Saved on this device only. Sign in to plan from other devices.'

const chosenSession = (page: Page) =>
  page.getByRole('combobox').filter({ hasText: '2×10′ @30K', hasNotText: '(planner)' })

async function planAWeek(page: Page) {
  await page.goto('/')
  await page.getByLabel('Weekly Duration hours').fill('6')
  await page.getByLabel('5K Time').fill('19:45')
  await expect(page.getByText(TOAST)).toBeVisible()
  await page.getByRole('combobox').filter({ hasText: '(planner)' }).click()
  await page.getByRole('option', { name: /^2×10′ @30K/ }).click()
  await expect(chosenSession(page)).toBeVisible()
}

const guestPlan = (page: Page) => page.evaluate(() => localStorage.getItem('guestPlan'))

test('a Guest plans a Week that survives a reload', async ({ page }) => {
  await planAWeek(page)
  await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible()
  await expect(page.getByText(TOAST)).toHaveCount(1)

  await page.reload()
  await expect(page.getByLabel('Weekly Duration hours')).toHaveValue('6')
  await expect(page.getByLabel('5K Time')).toHaveValue('19:45')
  await expect(chosenSession(page)).toBeVisible()

  await page.getByRole('button', { name: 'Reshuffle' }).click()
  await page.waitForTimeout(1000)
  await expect(page.getByText(TOAST)).toHaveCount(0)
})

test('a Guest cannot Sync', async ({ page }) => {
  await planAWeek(page)
  const sync = page.getByRole('button', { name: 'Sync to intervals.icu' })
  await expect(sync).toBeDisabled()
  await sync.hover({ force: true })
  await expect(page.getByText('to Sync to intervals.icu')).toBeVisible()
})

test("a Guest who signs up keeps their plan as the account's plan", async ({ page }) => {
  await planAWeek(page)
  await page.getByRole('link', { name: 'Sign in' }).first().click()
  await page.getByRole('button', { name: 'No account? Sign up' }).click()
  await page.getByLabel('Name').fill('Guest Runner')
  await page.getByLabel('Email').fill('guest@example.com')
  await page.getByLabel('Password').fill('password123')
  await page.getByRole('button', { name: 'Sign up' }).click()

  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible()
  expect(await guestPlan(page)).toBeNull()
  await page.reload()
  await expect(page.getByLabel('Weekly Duration hours')).toHaveValue('6')
  await expect(chosenSession(page)).toBeVisible()

  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible()
  await expect(page.getByLabel('Weekly Duration hours')).toHaveValue('')
})
