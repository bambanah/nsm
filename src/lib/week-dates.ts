import { addDays, format } from 'date-fns'

export const isoDate = (date: Date) => format(date, 'yyyy-MM-dd')

export const mondayOf = (date: Date) =>
  isoDate(new Date(date.getFullYear(), date.getMonth(), date.getDate() - ((date.getDay() + 6) % 7)))

export const addDaysTo = (date: string, days: number) => isoDate(addDays(parseDate(date), days))

export const parseDate = (date: string) => {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function weekLabel(monday: string) {
  const from = parseDate(monday)
  const to = addDays(from, 6)
  const fromFormat =
    from.getFullYear() !== to.getFullYear()
      ? 'd MMM yyyy'
      : from.getMonth() !== to.getMonth()
        ? 'd MMM'
        : 'd'
  return `${format(from, fromFormat)} - ${format(to, 'd MMM yyyy')}`
}
