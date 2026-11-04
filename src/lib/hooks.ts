import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/schema'

/** Todos los datos de la app en un solo lugar para poder cruzarlos entre módulos. */
export function useData() {
  const projects = useLiveQuery(() => db.projects.toArray(), [], [])
  const tasks = useLiveQuery(() => db.tasks.toArray(), [], [])
  const routines = useLiveQuery(() => db.routines.toArray(), [], [])
  const routineLogs = useLiveQuery(() => db.routineLogs.toArray(), [], [])
  const habits = useLiveQuery(() => db.habits.toArray(), [], [])
  const habitLogs = useLiveQuery(() => db.habitLogs.toArray(), [], [])
  const events = useLiveQuery(() => db.events.toArray(), [], [])
  const sessions = useLiveQuery(() => db.focusSessions.toArray(), [], [])
  return { projects, tasks, routines, routineLogs, habits, habitLogs, events, sessions }
}

export type Data = ReturnType<typeof useData>
