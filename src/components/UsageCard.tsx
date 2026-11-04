import { useEffect, useState } from 'react'
import { device, isNative, type Usage } from '../native/device'

const fmt = (ms: number) => {
  const m = Math.round(ms / 60000)
  return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`
}

/** Tiempo de pantalla real por app (solo en la app Android, con permiso de uso). */
export default function UsageCard() {
  const [days, setDays] = useState(1)
  const [data, setData] = useState<Usage | null>(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!isNative) return
    let live = true
    setErr('')
    device.getUsage(days).then((u) => live && setData(u)).catch((e: Error) => live && setErr(e.message))
    return () => { live = false }
  }, [days])

  if (!isNative) return null
  const max = Math.max(1, ...(data?.apps.map((a) => a.ms) ?? [1]))

  return (
    <div className="glass card stack">
      <h2>Tiempo en el teléfono</h2>
      <div className="seg">
        <button className={days === 1 ? 'on' : ''} onClick={() => setDays(1)}>Hoy</button>
        <button className={days === 7 ? 'on' : ''} onClick={() => setDays(7)}>7 días</button>
      </div>
      {err === 'NO_PERMISSION' ? (
        <>
          <div className="small muted">Para ver cuánto usas cada app, concede el acceso de uso a Kody.</div>
          <button className="btn primary" onClick={() => void device.openSettings('usage')}>Conceder acceso de uso</button>
        </>
      ) : err ? <div className="small muted">{err}</div> : data && (
        <>
          <div className="stat"><b className="grad-text">{fmt(data.totalMs)}</b><span>Tiempo de pantalla</span></div>
          {data.apps.slice(0, 8).map((a) => (
            <div key={a.pkg}>
              <div className="row small" style={{ marginBottom: 4 }}><span className="grow">{a.label}</span><span className="mono muted">{fmt(a.ms)}</span></div>
              <div className="pbar"><div style={{ width: `${(a.ms / max) * 100}%` }} /></div>
            </div>
          ))}
          {data.apps.length === 0 && <div className="empty">Aún no hay datos de uso.</div>}
        </>
      )}
    </div>
  )
}
