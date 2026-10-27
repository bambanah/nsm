import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    tailwindcss(),
    tanstackStart(),
    nitro({
      experimental: { tasks: true },
      tasks: {
        'scheduled-sync': {
          handler: fileURLToPath(new URL('src/sync/scheduled-sync.task.ts', import.meta.url)),
        },
      },
      scheduledTasks: { '0 * * * *': 'scheduled-sync' },
    }),
    viteReact(),
  ],
})
