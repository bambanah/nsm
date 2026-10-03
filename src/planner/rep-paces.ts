import type { RepLength } from './rep-formats'

export interface RepPace {
  fast: number
  slow: number
}

export type RepPaces = Record<RepLength, RepPace>

export const REP_PACE_WIDTH_PERCENT = 3
export const REP_PACE_FIXED_WIDTH_FROM_SECONDS = 300
export const REP_PACE_FIXED_WIDTH_SECONDS = 10

const REP_LENGTH_METRES: Record<RepLength, number> = { '15K': 15000, HM: 21097.5, '30K': 30000 }

// Daniels-Gilbert: v in m/min, t in minutes.
const vo2 = (v: number) => -4.6 + 0.182258 * v + 0.000104 * v ** 2
const fractionOfMax = (t: number) =>
  0.8 + 0.1894393 * Math.exp(-0.012778 * t) + 0.2989558 * Math.exp(-0.1932605 * t)
const vdot = (metres: number, minutes: number) => vo2(metres / minutes) / fractionOfMax(minutes)

function equivalentMinutes(metres: number, targetVdot: number) {
  let low = 1
  let high = 1000
  for (let i = 0; i < 60; i++) {
    const mid = (low + high) / 2
    if (vdot(metres, mid) > targetVdot) low = mid
    else high = mid
  }
  return (low + high) / 2
}

export function repPaces(fiveKSeconds: number): RepPaces {
  const targetVdot = vdot(5000, fiveKSeconds / 60)
  const pace = (metres: number): RepPace => {
    const fast = (equivalentMinutes(metres, targetVdot) * 60) / (metres / 1000)
    const slow =
      fast < REP_PACE_FIXED_WIDTH_FROM_SECONDS
        ? fast * (1 + REP_PACE_WIDTH_PERCENT / 100)
        : fast + REP_PACE_FIXED_WIDTH_SECONDS
    return { fast, slow }
  }
  return {
    '15K': pace(REP_LENGTH_METRES['15K']),
    HM: pace(REP_LENGTH_METRES.HM),
    '30K': pace(REP_LENGTH_METRES['30K']),
  }
}

export function formatDuration(seconds: number) {
  const whole = Math.round(seconds)
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`
}

export const formatRepPace = ({ fast, slow }: RepPace) =>
  `${formatDuration(fast)}-${formatDuration(slow)}`
