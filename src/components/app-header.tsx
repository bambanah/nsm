import { LogOutIcon } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { cn } from 'cn'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'

const ON_BRAND = 'hover:bg-brand-foreground/15 hover:text-brand-foreground'

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('relative inline-block font-black tracking-tight', className)}>
      NSM
      <span className="absolute inset-x-[-4%] top-[55%] h-[0.14em] -rotate-2 bg-strike" />
    </span>
  )
}

export function AppHeader({
  user,
  onSignOut,
}: {
  user?: { name: string }
  onSignOut?: () => void
}) {
  return (
    <header className="flex h-11 items-center gap-4 bg-brand px-4 text-brand-foreground">
      <Link to="/" aria-label="NSM">
        <Wordmark className="text-xl" />
      </Link>
      <nav className="flex gap-3 text-sm font-semibold">
        {(
          [
            ['/', 'Planner'],
            ['/how-it-works', 'How this works'],
          ] as const
        ).map(([to, label]) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: true }}
            className="border-b-2 border-transparent opacity-80 hover:opacity-100 data-[status=active]:border-brand-foreground data-[status=active]:opacity-100"
          >
            {label}
          </Link>
        ))}
      </nav>
      <div className="ml-auto flex items-center gap-1 text-sm">
        {user && <span className="mr-2 opacity-80 max-sm:hidden">{user.name}</span>}
        <ThemeToggle className={ON_BRAND} />
        {onSignOut && (
          <Button
            variant="ghost"
            size="icon-sm"
            className={ON_BRAND}
            aria-label="Sign out"
            title="Sign out"
            onClick={onSignOut}
          >
            <LogOutIcon />
          </Button>
        )}
      </div>
    </header>
  )
}
