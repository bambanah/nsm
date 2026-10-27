import { chromium } from '@playwright/test'

const [url, out] = process.argv.slice(2)
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 820 } })
await page.goto(url)
await page.waitForLoadState('networkidle')
// Routes with ssr: 'data-only' render their component only after hydration.
await page.waitForTimeout(1500)
await page.screenshot({ path: out })
await browser.close()
