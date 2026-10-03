export const REP_LENGTHS = ['15K', 'HM', '30K'] as const

export type RepLength = (typeof REP_LENGTHS)[number]

export interface RepFormat {
  repLength: RepLength
  reps: number
  repMinutes: number
}

export const RACE_PACES: Record<RepLength, string> = {
  '15K': '15K race pace',
  HM: 'half-marathon race pace',
  '30K': '30K race pace',
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
