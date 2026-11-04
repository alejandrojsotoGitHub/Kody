import { subDays } from 'date-fns'
import { ymd } from './dates'
import type { Habit, HabitLog } from '../db/schema'

/** Racha: días programados consecutivos cumplidos (hoy no rompe la racha si aún no se hace). */
export function habitStreak(h: Habit, logs: HabitLog[]): number {
  const done = new Set(logs.filter((l) => l.habitId === h.id).map((l) => l.date))
  let streak = 0
  for (let i = 0; i < 400; i++) {
    const d = subDays(new Date(), i)
    if (!h.days.includes(d.getDay())) continue
    if (done.has(ymd(d))) streak++
    else if (i === 0) continue
    else break
  }
  return streak
}

export const levelOf = (xp: number) => ({ level: Math.floor(xp / 100) + 1, into: xp % 100 })

export const cssVar = (name: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#5eead4'
