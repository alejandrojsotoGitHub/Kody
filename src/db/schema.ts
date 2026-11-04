import Dexie, { type EntityTable } from 'dexie'

export type ID = string

export interface Project {
  id: ID
  name: string
  area: string // Universidad | Iglesia | Emprendimiento | custom
  color: string
  description?: string
  context?: string // contexto libre que Kody también lee
  status: 'activo' | 'pausado' | 'terminado'
  createdAt: number
}

export interface Subtask {
  id: ID
  title: string
  done: boolean
  estimateMin?: number
}

export interface TaskProgress {
  unit: string // páginas, capítulos, %, ...
  total: number
  current: number
}

export interface Task {
  id: ID
  title: string
  notes?: string
  projectId?: ID
  priority: 1 | 2 | 3 // 1 alta
  dueDate?: string // yyyy-MM-dd
  done: boolean
  doneAt?: number
  subtasks: Subtask[] // secciones
  estimateMin?: number
  progress?: TaskProgress
  progressLog?: { date: string; amount: number }[]
  source: 'manual' | 'rutina' | 'proyecto' | 'ia'
  createdAt: number
}

export interface RoutineStep {
  id: ID
  title: string
}

export interface Routine {
  id: ID
  name: string
  slot: 'mañana' | 'día' | 'tarde' | 'noche'
  time?: string // HH:mm
  days: number[] // 0-6 (domingo=0)
  projectId?: ID
  steps: RoutineStep[]
  createdAt: number
}

export interface RoutineLog {
  id: ID
  routineId: ID
  date: string
  doneSteps: ID[]
}

export interface Habit {
  id: ID
  name: string
  icon: string
  projectId?: ID
  color: string
  days: number[]
  createdAt: number
}

export interface HabitLog {
  id: ID
  habitId: ID
  date: string
}

export interface CalEvent {
  id: ID
  title: string
  date: string // yyyy-MM-dd
  time?: string // HH:mm
  remindMinutes?: number
  projectId?: ID
  notes?: string
  createdAt: number
}

export interface ChatMessage {
  id: ID
  role: 'user' | 'model'
  text: string
  createdAt: number
}

export interface FocusSession {
  id: ID
  startedAt: number
  minutes: number
  projectId?: ID
  taskId?: ID
  completed: boolean
}

export interface Setting {
  key: string
  value: unknown
}

export class KodyDB extends Dexie {
  projects!: EntityTable<Project, 'id'>
  tasks!: EntityTable<Task, 'id'>
  routines!: EntityTable<Routine, 'id'>
  routineLogs!: EntityTable<RoutineLog, 'id'>
  habits!: EntityTable<Habit, 'id'>
  habitLogs!: EntityTable<HabitLog, 'id'>
  events!: EntityTable<CalEvent, 'id'>
  chatMessages!: EntityTable<ChatMessage, 'id'>
  focusSessions!: EntityTable<FocusSession, 'id'>
  settings!: EntityTable<Setting, 'key'>

  constructor() {
    super('kody')
    this.version(1).stores({
      projects: 'id, area, status',
      tasks: 'id, projectId, dueDate, done, source',
      routines: 'id, slot',
      routineLogs: 'id, routineId, date',
      habits: 'id',
      habitLogs: 'id, habitId, date',
      events: 'id, date',
      chatMessages: 'id, createdAt',
      focusSessions: 'id, startedAt',
      settings: 'key',
    })
    this.version(2).stores({
      routines: 'id, slot, projectId',
      habits: 'id, projectId',
      events: 'id, date, projectId',
      focusSessions: 'id, startedAt, projectId',
    })
  }
}

export const db = new KodyDB()

export const TABLES = [
  'projects', 'tasks', 'routines', 'routineLogs', 'habits', 'habitLogs',
  'events', 'chatMessages', 'focusSessions', 'settings',
] as const
export type TableName = (typeof TABLES)[number]

export const uid = (): ID =>
  (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36))
