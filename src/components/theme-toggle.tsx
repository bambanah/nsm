import { MoonIcon, SunIcon } from 'lucide-react'
import { useSyncExternalStore } from 'react'

import { Button } from '@/components/ui/button'

type Theme = 'light' | 'dark'

const icons = [
  { value: 'light', Icon: SunIcon },
  { value: 'dark', Icon: MoonIcon },
] as const

function apply(theme: Theme) {
  const root = document.documentElement
  const update = () => {
    root.dataset.theme = theme
    root.classList.toggle('dark', theme === 'dark')
  }
  if (
    !('startViewTransition' in document) ||
    matchMedia('(prefers-reduced-motion: reduce)').matches
  )
    update()
  else document.startViewTransition(update)
}

function save(theme: Theme) {
  try {
    localStorage.setItem('theme', theme)
  } catch {}
}

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributeFilter: ['data-theme'] })
  return () => observer.disconnect()
}

const getTheme = () => document.documentElement.dataset.theme as Theme

export const useTheme = () => useSyncExternalStore<Theme>(subscribe, getTheme, () => 'light')

export function ThemeToggle() {
  const theme = useTheme()
  const next = theme === 'dark' ? 'light' : 'dark'

  const toggle = () => {
    save(next)
    apply(next)
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className="theme-toggle"
      aria-label={`Switch to ${next} theme`}
      onClick={toggle}
    >
      <span className="grid">
        {icons.map(({ value, Icon }) => (
          <Icon key={value} data-theme-icon={value} />
        ))}
      </span>
    </Button>
  )
}
