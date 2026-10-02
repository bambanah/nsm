import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'

import appCss from '../styles.css?url'

const themeScript = `{
  let t
  try { t = localStorage.getItem('theme') } catch {}
  if (t !== 'light' && t !== 'dark') t = 'system'
  document.documentElement.dataset.theme = t
  document.documentElement.classList.toggle('dark', t === 'dark' || (t === 'system' && matchMedia('(prefers-color-scheme: dark)').matches))
}`

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'NSM Planner' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
