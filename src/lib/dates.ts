import { format } from 'date-fns'

export const ymd = (d: Date = new Date()) => format(d, 'yyyy-MM-dd')
export const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6]
export const DAY_LABELS = ['D', 'L', 'M', 'X', 'J', 'V', 'S']

/** Parsea 'yyyy-MM-dd' como fecha local (sin desfase de zona horaria). */
export const parseYmd = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
