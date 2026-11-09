import { expect, test, type Page } from '@playwright/test'
import pg from 'pg'
import { databaseUrl } from '../playwright.config'

test('loads the app', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('link', { name: 'NSM', exact: true })).toBeVisible()
})

async function sql(query: string) {
  const client = new pg.Client(databaseUrl)
  await client.connect()
  await client.query(query)
  await client.end()
}

// Keys are only saved once intervals.icu accepts them, so store one that cannot be decrypted.
const saveUnreadableApiKey = () =>
  sql(
    `INSERT INTO intervals_connections (user_id, api_key_encrypted)
     SELECT id, 'unreadable' FROM "user" WHERE email = 'runner@example.com'
     ON CONFLICT DO NOTHING`,
  )

async function openPlannedWeek(page: Page) {
  await page.goto('/')
  const hours = page.getByLabel('Weekly Duration hours')
  await expect(hours).toBeVisible()
  if (!(await hours.inputValue())) await hours.fill('7')
}

test('Scheduled Sync stays on or off across a reload and keeps its Sync Time', async ({ page }) => {
  await saveUnreadableApiKey()
  await openPlannedWeek(page)
  const scheduledSync = page.getByRole('switch', { name: 'Scheduled Sync' })
  const weekday = page.getByRole('combobox', { name: 'Sync Time weekday' })

  await scheduledSync.click()
  await expect(scheduledSync).toBeChecked()
  await weekday.click()
  await page.getByRole('option', { name: 'monday' }).click()
  await expect(weekday).toHaveText('monday')
  await page.waitForLoadState('networkidle')

  await openPlannedWeek(page)
  await expect(page.getByText(/· Next Mon /)).toBeVisible()
  await expect(scheduledSync).toBeHidden()
  await page.getByText('Sync settings & history').click()
  await expect(scheduledSync).toBeChecked()
  await expect(weekday).toHaveText('monday')
  await scheduledSync.click()
  await expect(scheduledSync).not.toBeChecked()
  await page.waitForLoadState('networkidle')

  await openPlannedWeek(page)
  await expect(scheduledSync).not.toBeChecked()
  await expect(weekday).toHaveText('monday')
})

test('a failed manual Sync appears in the Sync History', async ({ page }) => {
  await saveUnreadableApiKey()
  await openPlannedWeek(page)
  const sync = page.getByRole('button', { name: 'Sync now' })
  await expect(sync).toBeEnabled()
  await sync.click()
  const dialog = page.getByRole('dialog')
  // A mouse click is dropped: the calendar replaces the day button between mousedown and mouseup.
  await dialog
    .getByRole('button', { name: /^Today/ })
    .first()
    .dispatchEvent('click')
  await dialog.getByRole('button', { name: 'Sync', exact: true }).click()
  await expect(dialog.getByText('Save your intervals.icu API key')).toBeVisible()
  await page.keyboard.press('Escape')

  await expect(page.getByText(/^Last attempt failed/)).toBeVisible()
  // Row 0 is the header.
  const latest = page.getByRole('table', { name: 'Sync History' }).getByRole('row').nth(1)
  await expect(latest).toContainText('Manual')
  await expect(latest).toContainText('Failed')
  await expect(latest).toContainText('Save your intervals.icu API key')
})

test('a runner without an API key cannot Sync now or turn on Scheduled Sync', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ baseURL, storageState: { cookies: [], origins: [] } })
  await context.request.post('/api/auth/sign-up/email', {
    data: { name: 'Keyless Runner', email: 'keyless@example.com', password: 'password123' },
  })
  const page = await context.newPage()
  await openPlannedWeek(page)

  await expect(page.getByRole('button', { name: 'Sync now' })).toBeDisabled()
  await expect(page.getByRole('switch', { name: 'Scheduled Sync' })).toBeDisabled()
  await expect(page.getByText('Save your key to Sync now or turn on Scheduled Sync.')).toBeVisible()
  const save = page.getByRole('button', { name: 'Save', exact: true })
  await expect(save).toBeDisabled()
  await page.getByLabel('intervals.icu API key').fill('a-key')
  await expect(save).toBeEnabled()
  await context.close()
})

test('a saved API key can be changed or kept', async ({ page }) => {
  await saveUnreadableApiKey()
  await openPlannedWeek(page)
  const change = page.getByRole('button', { name: 'Change' })

  await change.click()
  await expect(page.getByLabel('intervals.icu API key')).toBeVisible()
  await page.getByRole('button', { name: 'Cancel' }).click()
  await expect(page.getByLabel('intervals.icu API key')).toHaveCount(0)
  await expect(change).toBeVisible()
})

test('the Sync section shows the latest successful Sync', async ({ page }) => {
  await sql(
    `INSERT INTO sync_records (user_id, ran_at, monday, trigger, outcome)
     SELECT id, now() - interval '3 hours', '2026-11-09', 'manual', 'succeeded'
     FROM "user" WHERE email = 'runner@example.com'`,
  )
  await openPlannedWeek(page)

  await expect(page.getByText(/^Last Synced about 3 hours ago · 9 - 15 Nov 2026/)).toBeVisible()
  await expect(
    page
      .getByRole('table', { name: 'Sync History' })
      .getByRole('row')
      .filter({ hasText: '9 - 15 Nov 2026' })
      .filter({ hasText: 'Synced' }),
  ).toBeVisible()
})

test('the Week shows the dates of the Synced Week and can Sync again when it differs', async ({
  page,
}) => {
  const nextMonday = new Date()
  nextMonday.setDate(nextMonday.getDate() + ((8 - nextMonday.getDay()) % 7 || 7))
  await saveUnreadableApiKey()
  await sql(
    `INSERT INTO sync_records (user_id, ran_at, monday, trigger, outcome, fingerprint)
     SELECT id, now(), '${nextMonday.toLocaleDateString('en-CA')}', 'scheduled', 'succeeded', 'stale'
     FROM "user" WHERE email = 'runner@example.com'`,
  )
  await openPlannedWeek(page)

  await expect(page.getByText(/^Week of .+ · Synced less than a minute ago/)).toBeVisible()
  await expect(
    page.getByRole('button', { name: new RegExp(`mon ${nextMonday.getDate()}\\b`, 'i') }),
  ).toBeVisible()
  await expect(page.getByText('Differs from your calendar')).toBeVisible()

  await page.getByRole('button', { name: 'Sync again' }).click()
  await expect(page.getByRole('alert').getByText(/^Last attempt failed/)).toBeVisible()
  // Row 0 is the header.
  const latest = page.getByRole('table', { name: 'Sync History' }).getByRole('row').nth(1)
  await expect(latest).toContainText('Manual')
  await expect(latest).toContainText('Failed')
})
