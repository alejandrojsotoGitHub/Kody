import { useCallback, useEffect, useState } from 'react'
import { Check, Smartphone } from 'lucide-react'
import { LocalNotifications } from '@capacitor/local-notifications'
import { Sheet } from './ui'
import { setPref, usePrefs } from '../db/settings'
import { device, errorText, isNative, type AppInfo, type DeviceStatus, type SettingsTarget } from '../native/device'

/** Panel de permisos y opciones del teléfono (solo tiene efecto en la app Android). */
export default function PhoneSettings() {
  const prefs = usePrefs()
  const [st, setSt] = useState<DeviceStatus | null>(null)
  const [notif, setNotif] = useState(false)
  const [apps, setApps] = useState<AppInfo[]>([])
  const [pick, setPick] = useState(false)
  const [q, setQ] = useState('')
  const [msg, setMsg] = useState('')

  const refresh = useCallback(async () => {
    if (!isNative) return
    setSt(await device.getStatus())
    try { setNotif((await LocalNotifications.checkPermissions()).display === 'granted') } catch { /* sin soporte */ }
  }, [])

  useEffect(() => {
    void refresh()
    const on = () => document.visibilityState === 'visible' && void refresh()
    document.addEventListener('visibilitychange', on)
    window.addEventListener('focus', on)
    return () => { document.removeEventListener('visibilitychange', on); window.removeEventListener('focus', on) }
  }, [refresh])

  if (!isNative) {
    return (
      <div className="glass card stack">
        <h2>Teléfono · Android</h2>
        <div className="row"><Smartphone size={22} style={{ color: 'var(--a1)' }} /><b>Disponible en la app Android</b></div>
        <div className="small muted">No Molestar automático, bloqueo de apps distractoras, tiempo de uso real, recordatorios con la app cerrada y dictado nativo funcionan al instalar el APK de Kody. En el navegador no es posible.</div>
      </div>
    )
  }

  const open = (t: SettingsTarget) => { void device.openSettings(t) }
  const row = (label: string, ok: boolean | undefined, target: SettingsTarget, hint?: string) => (
    <div className="item" style={{ alignItems: 'flex-start' }}>
      <div className="grow">
        <div>{label}</div>
        {hint && <div className="small muted">{hint}</div>}
      </div>
      {ok ? <span className="chip" style={{ color: 'var(--ok)' }}><Check size={12} /> Activo</span> : <button className="btn sm primary" onClick={() => open(target)}>Conceder</button>}
    </div>
  )

  const choose = async () => {
    setPick(true)
    if (!apps.length) setApps(await device.getInstalledApps())
  }
  const toggleApp = (pkg: string) => setPref('blockedApps', prefs.blockedApps.includes(pkg) ? prefs.blockedApps.filter((p) => p !== pkg) : [...prefs.blockedApps, pkg])

  const testDnd = async () => {
    try {
      await device.setDnd(true, prefs.dndMode, Date.now() + 15000)
      setMsg('No Molestar activado 15 segundos…')
      setTimeout(async () => { try { await device.setDnd(false) } catch { /* nada */ } setMsg('Prueba terminada') }, 15000)
    } catch (e) { setMsg(errorText(e)) }
  }

  return (
    <>
      <div className="glass card">
        <h2>Permisos del teléfono</h2>
        {row('No Molestar', st?.dnd, 'dnd', 'Para silenciar el teléfono durante un enfoque')}
        {row('Tiempo de uso de apps', st?.usage, 'usage', 'Para medir cuánto usas cada app en Analíticas')}
        {row('Bloqueo de apps (Accesibilidad)', st?.accessibility, 'accessibility', 'Activa "Kody" en la lista. En Android 13+ puede pedirte antes permitir ajustes restringidos en Información de la app')}
        {row('Notificaciones y alarmas', notif, 'notifications', 'Para avisarte de eventos con la app cerrada')}
        {row('Micrófono', st?.microphone, 'app', 'Se pide al usar el dictado por voz')}
        <button className="btn sm" style={{ marginTop: 8 }} onClick={() => open('app')}>Abrir información de la app</button>
      </div>

      <div className="glass card stack">
        <h2>Durante un enfoque</h2>
        <label className="row small"><input type="checkbox" checked={prefs.focusDnd} onChange={(e) => setPref('focusDnd', e.target.checked)} /> Activar No Molestar</label>
        {prefs.focusDnd && (
          <div className="seg">
            {([['priority', 'Solo prioritarias'], ['alarms', 'Solo alarmas'], ['none', 'Silencio total']] as const).map(([k, l]) => (
              <button key={k} className={prefs.dndMode === k ? 'on' : ''} onClick={() => setPref('dndMode', k)}>{l}</button>
            ))}
          </div>
        )}
        <label className="row small"><input type="checkbox" checked={prefs.focusBlock} onChange={(e) => setPref('focusBlock', e.target.checked)} /> Bloquear apps distractoras</label>
        {prefs.focusBlock && <button className="btn" onClick={choose}>Elegir apps distractoras ({prefs.blockedApps.length})</button>}
        <label className="row small"><input type="checkbox" checked={prefs.confirmDeviceActions} onChange={(e) => setPref('confirmDeviceActions', e.target.checked)} /> Pedir confirmación antes de que Kody (la IA) actúe sobre el teléfono</label>
        <button className="btn" onClick={testDnd}>Probar No Molestar (15 s)</button>
        {msg && <div className="small muted">{msg}</div>}
      </div>

      <Sheet open={pick} onClose={() => setPick(false)} title="Apps distractoras">
        <input className="input" placeholder="Buscar app…" value={q} onChange={(e) => setQ(e.target.value)} style={{ marginBottom: 10 }} />
        {apps.length === 0 && <div className="empty">Cargando…</div>}
        {apps.filter((a) => a.label.toLowerCase().includes(q.toLowerCase())).map((a) => (
          <label key={a.pkg} className="item">
            <input type="checkbox" checked={prefs.blockedApps.includes(a.pkg)} onChange={() => toggleApp(a.pkg)} />
            <span className="grow">{a.label}</span>
          </label>
        ))}
      </Sheet>
    </>
  )
}
