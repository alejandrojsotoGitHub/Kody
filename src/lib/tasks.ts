import type { Task } from '../db/schema'
import type { Prefs } from '../db/settings'
import { parseYmd } from './dates'

/** Avance 0-100: por secciones, por unidades (páginas…) o hecha/no hecha. */
export function taskProgress(t: Task): number {
  if (t.done) return 100
  if (t.subtasks.length) return Math.round((t.subtasks.filter((s) => s.done).length / t.subtasks.length) * 100)
  if (t.progress && t.progress.total > 0) return Math.min(100, Math.round((t.progress.current / t.progress.total) * 100))
  return 0
}

export const hasProgress = (t: Task) => t.subtasks.length > 0 || !!t.progress

/** Minutos que faltan según el estimado y el avance. */
export function remainingMin(t: Task): number {
  if (t.done || !t.estimateMin) return 0
  return Math.round(t.estimateMin * (1 - taskProgress(t) / 100))
}

export const fmtMin = (m: number) => (m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ''}` : `${m} min`)

export function capacityFor(p: Pick<Prefs, 'capacity' | 'capacityOverrides'>, date: string) {
  return p.capacityOverrides[date] ?? p.capacity[parseYmd(date).getDay()] ?? 0
}

/** Carga de un día: tareas con fecha ese día (y las vencidas si es hoy). */
export function loadFor(tasks: Task[], date: string, includeOverdue = false) {
  return tasks
    .filter((t) => !t.done && t.dueDate && (t.dueDate === date || (includeOverdue && t.dueDate < date)))
    .reduce((n, t) => n + remainingMin(t), 0)
}
