export type RepLength = '15K' | 'HM' | '30K'

export interface RepFormat {
  repLength: RepLength
  reps: number
  repMinutes: number
}

export const RECOVERY_MINUTES: Record<RepLength, number> = { '15K': 1, HM: 1, '30K': 2 }

export const workMinutes = (f: RepFormat) => f.reps * f.repMinutes

const formats = (repLength: RepLength, pairs: [number, number][]) =>
  pairs.map(([reps, repMinutes]): RepFormat => ({ repLength, reps, repMinutes }))

// Order breaks ties when choosing the closest Rep Format.
export const REP_FORMATS: RepFormat[] = [
  ...formats('15K', [
    [7, 3],
    [8, 3],
    [8, 4],
    [9, 3],
    [9, 4],
    [10, 3],
    [10, 4],
    [11, 3],
    [11, 4],
    [12, 3],
    [12, 4],
  ]),
  ...formats('HM', [
    [3, 6],
    [4, 6],
    [4, 7],
    [4, 8],
    [5, 6],
    [5, 7],
    [5, 8],
    [6, 6],
    [6, 7],
    [6, 8],
  ]),
  ...formats('30K', [
    [2, 10],
    [2, 11],
    [2, 12],
    [3, 10],
    [3, 11],
    [3, 12],
  ]),
]
