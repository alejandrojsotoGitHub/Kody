import { create } from 'zustand'
import { db, uid } from '../db/schema'
import { reward } from '../db/actions'
import { useKody } from '../mascot/store'

interface FocusState {
  endAt: number | null
  minutes: number
  taskId: string
  projectId: string
  start: (minutes: number, taskId: string, projectId: string) => void
  cancel: () => void
  tick: () => Promise<void>
}

export const useFocus = create<FocusState>((set, get) => ({
  endAt: null, minutes: 25, taskId: '', projectId: '',
  start: (minutes, taskId, projectId) => {
    set({ endAt: Date.now() + minutes * 60000, minutes, taskId, projectId })
    useKody.getState().react('thinking', 'Modo enfoque activado. Yo vigilo.', 2500)
  },
  cancel: () => set({ endAt: null }),
  tick: async () => {
    const { endAt, minutes, taskId, projectId } = get()
    if (!endAt || Date.now() < endAt) return
    set({ endAt: null })
    await db.focusSessions.add({ id: uid(), startedAt: endAt - minutes * 60000, minutes, taskId: taskId || undefined, projectId: projectId || undefined, completed: true })
    await reward(minutes, `¡Sesión de ${minutes} min completada! +${minutes} XP`)
    useKody.getState().react('alert', '¡Tiempo! Buen enfoque. 🎯', 6000)
    if ('Notification' in window && Notification.permission === 'granted') new Notification('Kody', { body: `Sesión de enfoque de ${minutes} min terminada` })
    navigator.vibrate?.([200, 100, 200])
  },
}))
