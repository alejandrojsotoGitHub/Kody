import { LocalNotifications } from '@capacitor/local-notifications'
import type { CalEvent } from '../db/schema'
import { isNative } from './device'
import { parseYmd } from '../lib/dates'

// ID numérico estable a partir del id de texto del evento
const numId = (s: string) => {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h) % 2_000_000_000
}

/** Programa los recordatorios de eventos futuros como notificaciones del sistema (suenan con la app cerrada). */
export async function syncNativeReminders(events: CalEvent[]) {
  if (!isNative) return
  try {
    let perm = await LocalNotifications.checkPermissions()
    if (perm.display === 'prompt' || perm.display === 'prompt-with-rationale') perm = await LocalNotifications.requestPermissions()
    if (perm.display !== 'granted') return

    const pending = await LocalNotifications.getPending()
    if (pending.notifications.length) await LocalNotifications.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) })

    const now = Date.now()
    const list = events
      .filter((e) => e.time)
      .map((e) => {
        const d = parseYmd(e.date)
        const [h, m] = (e.time as string).split(':').map(Number)
        d.setHours(h, m, 0, 0)
        const at = new Date(d.getTime() - (e.remindMinutes ?? 0) * 60000)
        return { e, at }
      })
      .filter(({ at }) => at.getTime() > now)
      .sort((a, b) => a.at.getTime() - b.at.getTime())
      .slice(0, 60)
      .map(({ e, at }) => ({
        id: numId(e.id),
        title: 'Kody · Recordatorio',
        body: `${e.title} · ${e.time}`,
        schedule: { at, allowWhileIdle: true },
      }))
    if (list.length) await LocalNotifications.schedule({ notifications: list })
  } catch {
    /* sin permiso de alarmas exactas o sin soporte: los avisos solo suenan con la app abierta */
  }
}
