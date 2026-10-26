import { expect, test as setup } from '@playwright/test'
import { authFile } from '../playwright.config'

setup('sign up', async ({ request }) => {
  const response = await request.post('/api/auth/sign-up/email', {
    data: { name: 'E2E Runner', email: 'runner@example.com', password: 'password123' },
  })
  expect(response.ok()).toBe(true)
  await request.storageState({ path: authFile })
})
