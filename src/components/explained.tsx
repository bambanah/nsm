import { Link } from '@tanstack/react-router'
import { HoverPopover } from '@/components/hover-popover'

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
  return (
    <HoverPopover
      trigger={
        <button
          type="button"
          className="cursor-help text-left [text-transform:inherit] underline decoration-dotted decoration-from-font underline-offset-4"
        >
          {children}
        </button>
      }
    >
      <p>{explanation}</p>
      <Link
        to="/how-it-works"
        hash={section}
        className="self-end font-semibold text-primary hover:underline"
      >
        More →
      </Link>
    </HoverPopover>
  )
}
