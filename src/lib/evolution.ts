import { subDays } from 'date-fns'
import { db } from '../db/schema'
import { getPrefs, usePrefs, type Prefs } from '../db/settings'
import { useKody } from '../mascot/store'
import { resolveTheme } from '../theme/themes'
import { parseYmd, ymd } from './dates'
import { applyDay, applyReward, healthTier, nextInfo, stageOf, type EvoState } from './evolutionCore'

export { THRESHOLDS, MAX_STAGE, stageOf, nextInfo, healthTier } from './evolutionCore'

/** Nombre de cada etapa de Kody según el tema. */
export const STAGE_NAMES: Record<string, string[]> = {
  aurora: ['Chispa', 'Núcleo', 'Androide', 'Guardián', 'Centinela', 'Singularidad'],
  jarvis: ['Pulso', 'Holograma', 'Asistente', 'Mayordomo digital', 'J.A.R.V.I.S.', 'Inteligencia total'],
  stark: ['Mark I · chatarra', 'Mark II', 'Mark III', 'Mark V', 'Mark 42', 'Mark 85 · nanotecnología'],
  doom: ['Máscara tosca', 'Aprendiz de Latveria', 'Hechicero de hierro', 'Armadura de Doom', 'Monarca', 'Soberano de Latveria'],
  reedr: ['Estudiante curioso', 'Becario de laboratorio', 'Científico', 'Explorador espacial', 'Mr. Fantástico', 'Líder de los 4'],
  matrix: ['Cursor parpadeante', 'Script', 'Hacker', 'Neo', 'Neo despierto', 'El Elegido'],
  meta: ['Cuarto de residencia', 'Startup', 'Equipo en crecimiento', 'Gran empresa', 'Corporación global', 'Metaverso'],
  google: ['Garaje', 'Buscador', 'Startup', 'Googleplex', 'Gigante tecnológico', 'Alphabet'],
  apple: ['Garaje', 'Apple I', 'Macintosh', 'iMac', 'iPhone', 'Apple Park'],
  anthropic: ['Idea', 'Laboratorio', 'Prototipo', 'Modelo de lenguaje', 'Asistente confiable', 'IA para todos'],
  custom: ['Chispa', 'Núcleo', 'Androide', 'Guardián', 'Centinela', 'Singularidad'],
}
export const stageNames = (themeId: string) => STAGE_NAMES[themeId] ?? STAGE_NAMES.aurora

const evoOf = (p: Prefs): EvoState => ({ growth: p.growth, health: p.health, maxStage: p.maxStage })

async function save(s: EvoState) {
  await db.settings.bulkPut([
    { key: 'growth', value: s.growth },
    { key: 'health', value: s.health },
    { key: 'maxStage', value: s.maxStage },
  ])
}

/** Primera vez: el crecimiento parte del XP que ya existía. */
export async function initEvolution() {
  if (await db.settings.get('growth')) return
  const p = await getPrefs()
  await save({ growth: p.xp, health: 100, maxStage: stageOf(p.xp) })
  await db.settings.put({ key: 'lastEval', value: ymd(subDays(new Date(), 1)) })
}

/** Suma XP (nivel) y crecimiento; celebra si Kody evoluciona. */
export async function grantXp(xp: number) {
  const p = await getPrefs()
  await db.settings.put({ key: 'xp', value: p.xp + xp })
  const { state, stageUp } = applyReward(evoOf(p), xp)
  await save(state)
  if (p.health < 40) await db.settings.put({ key: 'wasDamaged', value: true })
  if (stageUp) useKody.getState().celebrate(state.maxStage)
}

/** Cierra los días pasados: premia el cumplimiento y deteriora a Kody si se descuidó. */
export async function evaluateDays() {
  const p = await getPrefs()
  if (!p.lastEval) return
  const yesterday = ymd(subDays(new Date(), 1))
  if (p.lastEval >= yesterday) return

  const [tasks, routines, routineLogs, habits, habitLogs] = await Promise.all([
    db.tasks.toArray(), db.routines.toArray(), db.routineLogs.toArray(), db.habits.toArray(), db.habitLogs.toArray(),
  ])
  const days: string[] = []
  for (let i = 1; i <= 60; i++) {
    const d = ymd(subDays(new Date(), i))
    if (d <= p.lastEval) break
    days.push(d)
  }
  days.reverse()

  let s = evoOf(p)
  const before = { ...s }
  for (const day of days.slice(-14)) {
    const dow = parseYmd(day).getDay()
    const end = parseYmd(day).getTime() + 86399999
    let total = 0, done = 0
    for (const t of tasks) {
      if (t.dueDate !== day || t.createdAt > end) continue
      total++
      if (t.done && (t.doneAt ?? Infinity) <= end) done++
    }
    for (const r of routines) {
      if (!r.days.includes(dow) || r.createdAt > end) continue
      total += r.steps.length
      const log = routineLogs.find((l) => l.routineId === r.id && l.date === day)
      done += r.steps.filter((st) => log?.doneSteps.includes(st.id)).length
    }
    for (const h of habits) {
      if (!h.days.includes(dow) || h.createdAt > end) continue
      total++
      if (habitLogs.some((l) => l.habitId === h.id && l.date === day)) done++
    }
    s = applyDay(s, done, total)
  }
  await save(s)
  await db.settings.put({ key: 'lastEval', value: yesterday })
  if (p.health >= 40 && s.health < 40) await db.settings.put({ key: 'wasDamaged', value: true })

  if (s.health < before.health - 5) {
    const dropped = stageOf(s.growth) < stageOf(before.growth)
    useKody.getState().react('alert', dropped ? 'Me debilité y retrocedí… ¡ayúdame a recuperarme!' : 'Me siento débil… ponte al día con tus tareas.', 7000)
  }
}

/** Estado de Kody listo para mostrar en la UI. */
export function useEvolution() {
  const p = usePrefs()
  const theme = resolveTheme(p)
  const stage = stageOf(p.growth)
  const info = nextInfo(p.growth)
  return {
    growth: p.growth, health: p.health, maxStage: p.maxStage, themeId: theme.id,
    name: stageNames(theme.id)[stage], tier: healthTier(p.health), ...info,
  }
}
