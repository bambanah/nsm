import { useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export type HowItWorksSection =
  | 'budget'
  | 'sessions'
  | 'days'
  | 'long-run'
  | 'easy-runs'
  | 'day-preferences'
  | 'pacing'
  | 'shuffle'

export function Explained({
  children,
  explanation,
  section,
}: {
  children: React.ReactNode
  explanation: React.ReactNode
  section: HowItWorksSection
}) {
  const [open, setOpen] = useState(false)
  const pointerType = useRef<string>(undefined)
  const openedByHover = useRef(false)
  const closing = useRef<ReturnType<typeof setTimeout>>(undefined)

  const hover = (entering: boolean) => (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') return
    clearTimeout(closing.current)
    if (!entering) closing.current = setTimeout(() => setOpen(false), 150)
    else if (!open) {
      openedByHover.current = true
      setOpen(true)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="cursor-help underline decoration-dotted decoration-from-font underline-offset-4"
          onPointerDown={(e) => (pointerType.current = e.pointerType)}
          onPointerEnter={hover(true)}
          onPointerLeave={hover(false)}
          onClick={(e) => {
            // Hover already opened it; a click would toggle it shut.
            if (pointerType.current === 'mouse') e.preventDefault()
            else openedByHover.current = false
            pointerType.current = undefined
          }}
        >
          {children}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="text-base"
        onPointerEnter={hover(true)}
        onPointerLeave={hover(false)}
        onOpenAutoFocus={(e) => openedByHover.current && e.preventDefault()}
      >
        <p>{explanation}</p>
        <Link
          to="/how-it-works"
          hash={section}
          className="self-end font-semibold text-primary hover:underline"
        >
          More →
        </Link>
      </PopoverContent>
    </Popover>
  )
}
