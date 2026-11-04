import { db } from '../db/schema'
import { ymd } from './dates'
import { useKody } from '../mascot/store'

const KEY = 'kody-fired'
const fired = new Set<string>(JSON.parse(localStorage.getItem(KEY) ?? '[]'))

/** Revisa eventos de hoy y avisa (notificación + mascota). Se llama cada 30 s con la app abierta. */
export async function checkReminders() {
  const today = ymd()
  const now = Date.now()
  const events = await db.events.where('date').equals(today).toArray()
  for (const e of events) {
    if (!e.time) continue
    const [h, m] = e.time.split(':').map(Number)
    const at = new Date(); at.setHours(h, m, 0, 0)
    const fireAt = at.getTime() - (e.remindMinutes ?? 0) * 60000
    const key = `${e.id}_${today}`
    if (now >= fireAt && now < at.getTime() + 5 * 60000 && !fired.has(key)) {
      fired.add(key)
      localStorage.setItem(KEY, JSON.stringify([...fired].slice(-200)))
      const msg = `${e.title} · ${e.time}`
      useKody.getState().react('alert', `🔔 ${msg}`, 8000)
      if ('Notification' in window && Notification.permission === 'granted') new Notification('Kody · Recordatorio', { body: msg })
      navigator.vibrate?.([150, 80, 150])
    }
  }
}
