import { expect, test, type Page } from '@playwright/test'
import pg from 'pg'
import { databaseUrl } from '../playwright.config'

test('loads the app', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('link', { name: 'NSM', exact: true })).toBeVisible()
})

// Keys are only saved by a Sync that intervals.icu accepts, so store one that cannot be decrypted.
async function saveUnreadableApiKey() {
  const client = new pg.Client(databaseUrl)
  await client.connect()
  await client.query(
    `INSERT INTO intervals_connections (user_id, api_key_encrypted)
     SELECT id, 'unreadable' FROM "user" WHERE email = 'runner@example.com'
     ON CONFLICT DO NOTHING`,
  )
  await client.end()
}

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
  await expect(scheduledSync).toBeChecked()
  await expect(weekday).toHaveText('monday')
  await expect(page.getByText(/· Next Mon /)).toBeVisible()
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
  await expect(dialog.getByText('Enter your intervals.icu API key')).toBeVisible()
  await page.keyboard.press('Escape')

  await expect(page.getByText(/^Last attempt failed/)).toBeVisible()
  // Row 0 is the header.
  const latest = page.getByRole('table', { name: 'Sync History' }).getByRole('row').nth(1)
  await expect(latest).toContainText('Manual')
  await expect(latest).toContainText('Failed')
  await expect(latest).toContainText('Enter your intervals.icu API key')
})
