import { db, uid, type Habit, type Project, type Routine, type Task } from './schema'
import { useKody } from '../mascot/store'
import { ymd, ALL_DAYS } from '../lib/dates'
import { TEMPLATES } from './templates'

export async function reward(xp: number, msg?: string) {
  const r = await db.settings.get('xp')
  await db.settings.put({ key: 'xp', value: ((r?.value as number) ?? 0) + xp })
  if (msg) useKody.getState().react('happy', msg)
}

export async function toggleTask(t: Task) {
  const done = !t.done
  await db.tasks.update(t.id, { done, doneAt: done ? Date.now() : undefined })
  if (done) await reward(10, '¡Tarea completada! +10 XP')
}

export async function toggleHabit(habitId: string, date = ymd()) {
  const id = `${habitId}_${date}`
  if (await db.habitLogs.get(id)) await db.habitLogs.delete(id)
  else {
    await db.habitLogs.put({ id, habitId, date })
    await reward(5, 'Hábito registrado +5 XP')
  }
}

export async function toggleStep(routine: Routine, stepId: string, date = ymd()) {
  const id = `${routine.id}_${date}`
  const log = (await db.routineLogs.get(id)) ?? { id, routineId: routine.id, date, doneSteps: [] as string[] }
  const had = log.doneSteps.includes(stepId)
  log.doneSteps = had ? log.doneSteps.filter((s) => s !== stepId) : [...log.doneSteps, stepId]
  await db.routineLogs.put(log)
  if (!had) {
    const all = routine.steps.every((s) => log.doneSteps.includes(s.id))
    if (all) await reward(25, `Rutina "${routine.name}" completa +25 XP`)
    else await reward(2)
  }
}

export async function addTask(p: Partial<Task> & { title: string }) {
  const task: Task = {
    id: uid(), priority: 2, done: false, subtasks: [], source: 'manual', createdAt: Date.now(), ...p,
  }
  await db.tasks.add(task)
  return task
}

export async function addProject(name: string, area: string, color: string, template = ''): Promise<Project> {
  const project: Project = { id: uid(), name, area, color, status: 'activo', createdAt: Date.now() }
  await db.projects.add(project)
  const tpl = TEMPLATES[template]
  if (tpl) {
    for (const r of tpl.routines) {
      await db.routines.add({
        id: uid(), name: r.name, slot: r.slot, days: r.days ?? ALL_DAYS, projectId: project.id,
        steps: r.steps.map((title) => ({ id: uid(), title })), createdAt: Date.now(),
      })
    }
    for (const h of tpl.habits) {
      await db.habits.add({ id: uid(), name: h.name, icon: h.icon, color, days: ALL_DAYS, projectId: project.id, createdAt: Date.now() })
    }
    for (const t of tpl.tasks) await addTask({ title: t, projectId: project.id, source: 'proyecto' })
  }
  return project
}

export async function deleteProject(id: string) {
  await db.transaction('rw', [db.projects, db.tasks, db.routines, db.habits, db.events, db.focusSessions], async () => {
    await db.tasks.where('projectId').equals(id).delete()
    await db.routines.where('projectId').equals(id).delete()
    await db.habits.where('projectId').equals(id).delete()
    await db.events.where('projectId').equals(id).delete()
    await db.focusSessions.where('projectId').equals(id).modify({ projectId: undefined })
    await db.projects.delete(id)
  })
}

export async function deleteHabit(h: Habit) {
  await db.habitLogs.where('habitId').equals(h.id).delete()
  await db.habits.delete(h.id)
}

export async function deleteRoutine(id: string) {
  await db.routineLogs.where('routineId').equals(id).delete()
  await db.routines.delete(id)
}

export async function toggleSection(t: Task, sectionId: string) {
  const subtasks = t.subtasks.map((s) => (s.id === sectionId ? { ...s, done: !s.done } : s))
  const allDone = subtasks.length > 0 && subtasks.every((s) => s.done)
  const justDone = subtasks.find((s) => s.id === sectionId)?.done
  await db.tasks.update(t.id, { subtasks, done: allDone, doneAt: allDone ? Date.now() : undefined })
  if (allDone && !t.done) await reward(15, '¡Todas las secciones listas! +15 XP')
  else if (justDone) await reward(3, 'Sección completada +3 XP')
}

export async function logProgress(t: Task, amount: number) {
  if (!t.progress) return
  const current = Math.max(0, Math.min(t.progress.total, t.progress.current + amount))
  const done = current >= t.progress.total
  await db.tasks.update(t.id, {
    progress: { ...t.progress, current },
    progressLog: [...(t.progressLog ?? []), { date: ymd(), amount }],
    done, doneAt: done ? Date.now() : t.doneAt,
  })
  if (done && !t.done) await reward(20, '¡Meta alcanzada! +20 XP')
  else if (amount > 0) await reward(3, `+${amount} ${t.progress.unit} registrados`)
}
