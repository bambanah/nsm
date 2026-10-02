import { MonitorIcon, MoonIcon, SunIcon } from 'lucide-react'
import { useEffect, useSyncExternalStore } from 'react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type Theme = 'system' | 'light' | 'dark'

const options = [
  { value: 'system', label: 'System', Icon: MonitorIcon },
  { value: 'light', label: 'Light', Icon: SunIcon },
  { value: 'dark', label: 'Dark', Icon: MoonIcon },
] as const
const darkQuery = '(prefers-color-scheme: dark)'

function apply(theme: Theme) {
  const root = document.documentElement
  const update = () => {
    root.dataset.theme = theme
    root.classList.toggle(
      'dark',
      theme === 'dark' || (theme === 'system' && matchMedia(darkQuery).matches),
    )
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
    if (theme === 'system') localStorage.removeItem('theme')
    else localStorage.setItem('theme', theme)
  } catch {}
}

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributeFilter: ['data-theme'] })
  return () => observer.disconnect()
}

const getTheme = () => document.documentElement.dataset.theme as Theme

export function ThemeMenu() {
  const theme = useSyncExternalStore<Theme>(subscribe, getTheme, () => 'system')

  useEffect(() => {
    if (theme !== 'system') return
    const media = matchMedia(darkQuery)
    const onChange = () => apply('system')
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [theme])

  const select = (value: string) => {
    save(value as Theme)
    apply(value as Theme)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="theme-menu" aria-label="Theme">
          <span className="grid">
            {options.map(({ value, Icon }) => (
              <Icon key={value} data-theme-icon={value} />
            ))}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={theme} onValueChange={select}>
          {options.map(({ value, label, Icon }) => (
            <DropdownMenuRadioItem key={value} value={value}>
              <Icon />
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
