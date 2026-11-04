// Lógica pura de evolución (sin base de datos) para poder probarla en Node.

export const THRESHOLDS = [0, 100, 300, 700, 1400, 2500]
export const MAX_STAGE = THRESHOLDS.length - 1

export interface EvoState {
  growth: number
  health: number // 0-100
  maxStage: number
}

export const stageOf = (growth: number) => THRESHOLDS.reduce((s, t, i) => (growth >= t ? i : s), 0)

/** Piso del deterioro: como máximo se retrocede una etapa respecto a la máxima alcanzada. */
export const floorFor = (maxStage: number) => THRESHOLDS[Math.max(0, maxStage - 1)]

export const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

export type HealthTier = 'ok' | 'tired' | 'damaged' | 'critical'
export const healthTier = (h: number): HealthTier => (h >= 60 ? 'ok' : h >= 40 ? 'tired' : h >= 20 ? 'damaged' : 'critical')

/** Puntos que faltan para la siguiente etapa y progreso 0-1 dentro de la etapa actual. */
export function nextInfo(growth: number) {
  const s = stageOf(growth)
  if (s >= MAX_STAGE) return { stage: s, next: null as number | null, pct: 1, missing: 0 }
  const lo = THRESHOLDS[s], hi = THRESHOLDS[s + 1]
  return { stage: s, next: hi, pct: (growth - lo) / (hi - lo), missing: hi - growth }
}

/** Recompensa por completar algo: sube el crecimiento y recupera algo de salud. */
export function applyReward(s: EvoState, xp: number): { state: EvoState; stageUp: boolean } {
  const growth = s.growth + xp
  const maxStage = Math.max(s.maxStage, stageOf(growth))
  return {
    state: { growth, health: clamp(s.health + 3, 0, 100), maxStage },
    stageUp: maxStage > s.maxStage,
  }
}

/** Cumplimiento de un día (null si no había nada agendado → día neutro). */
export const dayRatio = (done: number, total: number) => (total > 0 ? done / total : null)

/** Efecto de un día ya cerrado sobre Kody. */
export function applyDay(s: EvoState, done: number, total: number): EvoState {
  const r = dayRatio(done, total)
  if (r === null) return s
  if (r >= 0.7) return { ...s, health: clamp(s.health + 10, 0, 100) }
  if (r >= 0.4) return s
  const loss = 10 + Math.round(15 * (1 - r / 0.4)) // 10 … 25
  const floor = floorFor(s.maxStage)
  return {
    ...s,
    health: clamp(s.health - loss, 0, 100),
    growth: Math.max(floor, s.growth - Math.round(loss / 2)),
  }
}
