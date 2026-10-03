import { describe, expect, it } from 'vitest'
import { formatDuration, repPaces } from './rep-paces'

const seconds = (time: string) => {
  const [m, s] = time.split(':').map(Number)
  return m * 60 + s
}

const expectWithinASecond = (actual: number, expected: string) =>
  expect(Math.abs(actual - seconds(expected))).toBeLessThanOrEqual(1)

describe('repPaces', () => {
  it('derives each Rep Pace from a 20:00 5K Time', () => {
    const paces = repPaces(seconds('20:00'))
    expectWithinASecond(paces['15K'].fast, '4:15')
    expectWithinASecond(paces['15K'].slow, '4:23')
    expectWithinASecond(paces.HM.fast, '4:21')
    expectWithinASecond(paces.HM.slow, '4:29')
    expectWithinASecond(paces['30K'].fast, '4:27')
    expectWithinASecond(paces['30K'].slow, '4:35')
  })

  it('widens the range by a fixed 10 s/km at 5:00/km and slower', () => {
    const paces = repPaces(seconds('25:00'))
    expectWithinASecond(paces['15K'].fast, '5:20')
    expectWithinASecond(paces.HM.fast, '5:27')
    expectWithinASecond(paces['30K'].fast, '5:34')
    for (const { fast, slow } of Object.values(paces)) expect(slow - fast).toBeCloseTo(10)
  })

  it('derives fast ends from a 15:00 5K Time', () => {
    const paces = repPaces(seconds('15:00'))
    expectWithinASecond(paces['15K'].fast, '3:11')
    expectWithinASecond(paces.HM.fast, '3:15')
    expectWithinASecond(paces['30K'].fast, '3:20')
  })
})

describe('formatDuration', () => {
  it.each([
    [255, '4:15'],
    [1200, '20:00'],
    [254.6, '4:15'],
    [65, '1:05'],
  ])('formats %s seconds as %s', (value, expected) => {
    expect(formatDuration(value)).toBe(expected)
  })
})
