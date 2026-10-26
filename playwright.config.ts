import { defineConfig, devices } from '@playwright/test'

const baseURL = 'http://localhost:3030'
export const authFile = 'playwright/.auth/user.json'

export default defineConfig({
  testDir: 'e2e',
  use: { baseURL },
  projects: [
    { name: 'setup', testMatch: 'auth.setup.ts' },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: authFile },
      dependencies: ['setup'],
    },
  ],
  webServer: {
    command: 'node e2e/reset-db.ts && node migrate.js && vite dev --port 3030',
    url: baseURL,
    env: {
      DATABASE_URL: 'postgres://postgres:postgres@localhost:5434/nsm_e2e',
      BETTER_AUTH_URL: baseURL,
      BETTER_AUTH_SECRET: 'Xn3vQ8pZr2LkT7wYb5HcJ9mFd4sGa6Ue',
    },
  },
})
