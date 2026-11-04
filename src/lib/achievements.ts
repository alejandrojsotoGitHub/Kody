import { db } from '../db/schema'
import { getPrefs } from '../db/settings'
import { useKody } from '../mascot/store'
import { habitStreak } from './stats'
import { grantXp } from './evolution'

export interface Ctx {
  tasksDone: number
  bestStreak: number
  routineDays: number
  focusMin: number
  projects: number
  projectClosed: boolean
  chats: number
  aiTasks: number
  progressDone: boolean
  maxStage: number
  recovered: boolean
}

export interface Achievement {
  id: string
  icon: string
  name: string
  desc: string
  xp: number
  test: (c: Ctx) => boolean
  progress?: (c: Ctx) => [number, number]
}

const count = (key: keyof Ctx, n: number) => (c: Ctx): [number, number] => [Math.min(Number(c[key]), n), n]

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_task', icon: '🌱', name: 'Primer paso', desc: 'Completa tu primera tarea', xp: 5, test: (c) => c.tasksDone >= 1, progress: count('tasksDone', 1) },
  { id: 'tasks_10', icon: '⚡', name: 'En marcha', desc: 'Completa 10 tareas', xp: 15, test: (c) => c.tasksDone >= 10, progress: count('tasksDone', 10) },
  { id: 'tasks_50', icon: '🔧', name: 'Máquina', desc: 'Completa 50 tareas', xp: 40, test: (c) => c.tasksDone >= 50, progress: count('tasksDone', 50) },
  { id: 'tasks_100', icon: '💯', name: 'Centenario', desc: 'Completa 100 tareas', xp: 80, test: (c) => c.tasksDone >= 100, progress: count('tasksDone', 100) },
  { id: 'streak_3', icon: '🔥', name: 'Calentando', desc: 'Racha de 3 días en un hábito', xp: 10, test: (c) => c.bestStreak >= 3, progress: count('bestStreak', 3) },
  { id: 'streak_7', icon: '🔥', name: 'Semana perfecta', desc: 'Racha de 7 días', xp: 30, test: (c) => c.bestStreak >= 7, progress: count('bestStreak', 7) },
  { id: 'streak_30', icon: '🌋', name: 'Imparable', desc: 'Racha de 30 días', xp: 120, test: (c) => c.bestStreak >= 30, progress: count('bestStreak', 30) },
  { id: 'routine_1', icon: '🔁', name: 'Rutina completa', desc: 'Termina todos los pasos de una rutina', xp: 10, test: (c) => c.routineDays >= 1, progress: count('routineDays', 1) },
  { id: 'routine_10', icon: '⚙️', name: 'Engranaje', desc: 'Completa 10 rutinas', xp: 40, test: (c) => c.routineDays >= 10, progress: count('routineDays', 10) },
  { id: 'focus_60', icon: '🎯', name: 'Una hora de foco', desc: 'Acumula 60 min de enfoque', xp: 15, test: (c) => c.focusMin >= 60, progress: count('focusMin', 60) },
  { id: 'focus_600', icon: '🧘', name: 'Monje del enfoque', desc: 'Acumula 10 horas de enfoque', xp: 80, test: (c) => c.focusMin >= 600, progress: count('focusMin', 600) },
  { id: 'first_project', icon: '📁', name: 'Arquitecto', desc: 'Crea tu primer proyecto', xp: 5, test: (c) => c.projects >= 1, progress: count('projects', 1) },
  { id: 'project_closed', icon: '🏁', name: 'Proyecto cerrado', desc: 'Termina todas las tareas de un proyecto (mín. 3)', xp: 50, test: (c) => c.projectClosed },
  { id: 'marathon', icon: '📚', name: 'Maratón', desc: 'Completa una tarea de varios días o con secciones', xp: 25, test: (c) => c.progressDone },
  { id: 'chat', icon: '💬', name: 'Hablando con Kody', desc: 'Conversa con Kody', xp: 5, test: (c) => c.chats >= 1 },
  { id: 'delegate', icon: '🤖', name: 'Delegado', desc: 'Deja que Kody cree una tarea por ti', xp: 15, test: (c) => c.aiTasks >= 1 },
  { id: 'stage_2', icon: '✨', name: 'Kody despierta', desc: 'Lleva a Kody a la etapa 3', xp: 20, test: (c) => c.maxStage >= 2 },
  { id: 'stage_3', icon: '🚀', name: 'Evolución', desc: 'Lleva a Kody a la etapa 4', xp: 40, test: (c) => c.maxStage >= 3 },
  { id: 'stage_5', icon: '👑', name: 'Forma final', desc: 'Lleva a Kody a la etapa máxima', xp: 150, test: (c) => c.maxStage >= 5 },
  { id: 'recovered', icon: '💚', name: 'Resurgimiento', desc: 'Recupera a Kody después de dejarlo muy dañado', xp: 30, test: (c) => c.recovered },
]

export async function buildCtx(): Promise<Ctx> {
  const [tasks, routines, routineLogs, habits, habitLogs, sessions, projects, chats, p, damaged] = await Promise.all([
    db.tasks.toArray(), db.routines.toArray(), db.routineLogs.toArray(), db.habits.toArray(), db.habitLogs.toArray(),
    db.focusSessions.toArray(), db.projects.toArray(), db.chatMessages.where('role').equals('model').count().catch(() => 0),
    getPrefs(), db.settings.get('wasDamaged'),
  ])
  const routineDays = routineLogs.filter((l) => {
    const r = routines.find((x) => x.id === l.routineId)
    return !!r && r.steps.length > 0 && r.steps.every((s) => l.doneSteps.includes(s.id))
  }).length
  return {
    tasksDone: tasks.filter((t) => t.done).length,
    bestStreak: Math.max(0, ...habits.map((h) => habitStreak(h, habitLogs))),
    routineDays,
    focusMin: sessions.reduce((n, s) => n + s.minutes, 0),
    projects: projects.length,
    projectClosed: projects.some((pr) => {
      const t = tasks.filter((x) => x.projectId === pr.id)
      return t.length >= 3 && t.every((x) => x.done)
    }),
    chats,
    aiTasks: tasks.filter((t) => t.source === 'ia').length,
    progressDone: tasks.some((t) => t.done && (t.subtasks.length > 0 || !!t.progress)),
    maxStage: p.maxStage,
    recovered: !!damaged?.value && p.health >= 80,
  }
}

/** Desbloquea los logros cumplidos (con su XP). Repite si un bono desbloquea otro. */
export async function checkAchievements() {
  for (let pass = 0; pass < 3; pass++) {
    const have = ((await db.settings.get('achievements'))?.value ?? {}) as Record<string, number>
    const c = await buildCtx()
    const fresh = ACHIEVEMENTS.filter((a) => !have[a.id] && a.test(c))
    if (!fresh.length) return
    const next = { ...have }
    for (const a of fresh) next[a.id] = Date.now()
    await db.settings.put({ key: 'achievements', value: next })
    for (const a of fresh) {
      await grantXp(a.xp)
      useKody.getState().react('happy', `🏅 Logro: ${a.name} (+${a.xp} XP)`, 4000)
    }
  }
}
