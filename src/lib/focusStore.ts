import { create } from 'zustand'
import { db, uid } from '../db/schema'
import { reward } from '../db/actions'
import { useKody } from '../mascot/store'
import { getPrefs } from '../db/settings'
import { device, errorText, isNative } from '../native/device'

/** Al empezar un enfoque: No Molestar + bloqueo de apps (si hay permisos). Devuelve avisos para el usuario. */
export async function enterFocusMode(minutes: number) {
  if (!isNative) return
  const p = await getPrefs()
  const until = Date.now() + minutes * 60000
  const notes: string[] = []
  if (p.focusDnd) {
    try { await device.setDnd(true, p.dndMode, until) } catch (e) { notes.push(`No Molestar: ${errorText(e)}`) }
  }
  if (p.focusBlock && p.blockedApps.length) {
    try { await device.setBlocking(true, p.blockedApps, until) } catch (e) { notes.push(`Bloqueo de apps: ${errorText(e)}`) }
  }
  if (notes.length) useKody.getState().react('alert', notes[0], 6000)
}

export async function exitFocusMode() {
  if (!isNative) return
  try { await device.setDnd(false) } catch { /* sin permiso */ }
  try { await device.setBlocking(false, []) } catch { /* sin servicio */ }
}

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
    void enterFocusMode(minutes)
    useKody.getState().react('thinking', 'Modo enfoque activado. Yo vigilo.', 2500)
  },
  cancel: () => { set({ endAt: null }); void exitFocusMode() },
  tick: async () => {
    const { endAt, minutes, taskId, projectId } = get()
    if (!endAt || Date.now() < endAt) return
    set({ endAt: null })
    void exitFocusMode()
    await db.focusSessions.add({ id: uid(), startedAt: endAt - minutes * 60000, minutes, taskId: taskId || undefined, projectId: projectId || undefined, completed: true })
    await reward(minutes, `¡Sesión de ${minutes} min completada! +${minutes} XP`)
    useKody.getState().react('alert', '¡Tiempo! Buen enfoque. 🎯', 6000)
    if ('Notification' in window && Notification.permission === 'granted') new Notification('Kody', { body: `Sesión de enfoque de ${minutes} min terminada` })
    navigator.vibrate?.([200, 100, 200])
  },
}))
