import { useRef, useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export function HoverPopover({
  trigger,
  children,
}: {
  trigger: React.ReactElement
  children: React.ReactNode
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
      <PopoverTrigger
        asChild
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
        {trigger}
      </PopoverTrigger>
      <PopoverContent
        onPointerEnter={hover(true)}
        onPointerLeave={hover(false)}
        onOpenAutoFocus={(e) => openedByHover.current && e.preventDefault()}
      >
        {children}
      </PopoverContent>
    </Popover>
  )
}
