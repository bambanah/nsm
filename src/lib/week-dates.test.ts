import { describe, expect, it } from 'vitest'
import { mondayOf, weekLabel } from './week-dates'

describe('mondayOf', () => {
  it('finds the Monday of the week a date falls in', () => {
    expect(mondayOf(new Date(2026, 9, 11))).toBe('2026-10-05')
    expect(mondayOf(new Date(2026, 9, 12))).toBe('2026-10-12')
  })
})

describe('weekLabel', () => {
  it.each([
    ['2026-10-12', '12 - 18 Oct 2026'],
    ['2026-09-28', '28 Sep - 4 Oct 2026'],
    ['2026-12-28', '28 Dec 2026 - 3 Jan 2027'],
  ])('labels the week of %s as %s', (monday, label) => {
    expect(weekLabel(monday)).toBe(label)
  })
})
