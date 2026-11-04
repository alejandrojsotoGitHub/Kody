import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Pause, Play } from 'lucide-react'
import { Ring } from '../components/ui'
import { useFocus } from '../lib/focusStore'
import { isNative } from '../native/device'
import { useData } from '../lib/hooks'
import { ymd } from '../lib/dates'

export default function Focus() {
  const d = useData()
  const [params] = useSearchParams()
  const f = useFocus()
  const [mins, setMins] = useState(25)
  const [taskId, setTaskId] = useState(params.get('task') ?? '')
  const [projectId, setProjectId] = useState('')
  const [, force] = useState(0)

  useEffect(() => { const i = setInterval(() => force((x) => x + 1), 500); return () => clearInterval(i) }, [])

  // Si eliges una tarea, el tiempo se suma también a su proyecto
  const task = d.tasks.find((t) => t.id === taskId)
  const effProject = task?.projectId ?? projectId
  const left = f.endAt ? Math.max(0, f.endAt - Date.now()) : mins * 60000
  const total = (f.endAt ? f.minutes : mins) * 60000
  const pct = Math.round(((total - left) / total) * 100)
  const mm = String(Math.floor(left / 60000)).padStart(2, '0')
  const ss = String(Math.floor((left % 60000) / 1000)).padStart(2, '0')
  const today = d.sessions.filter((s) => ymd(new Date(s.startedAt)) === ymd())
  const todayMin = today.reduce((n, s) => n + s.minutes, 0)

  const toggle = async () => {
    if (f.endAt) f.cancel()
    else {
      if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission()
      f.start(mins, taskId, effProject)
    }
  }

  return (
    <main className="page">
      <h1>Enfoque</h1>
      <p className="sub">Bloques de trabajo profundo ligados a tus tareas y proyectos.</p>

      <div className="glass card" style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
          <Ring pct={f.endAt ? pct : 0} size={230} label="" />
          <div className="timer" style={{ position: 'absolute', top: '50%', left: 0, right: 0, transform: 'translateY(-50%)' }}>{mm}:{ss}</div>
        </div>
        {!f.endAt && (
          <div className="seg" style={{ margin: '16px 0' }}>
            {[15, 25, 45, 60].map((m) => <button key={m} className={mins === m ? 'on' : ''} onClick={() => setMins(m)}>{m} min</button>)}
          </div>
        )}
        <button className="btn primary full" style={{ marginTop: f.endAt ? 16 : 0, padding: 15 }} onClick={toggle}>
          {f.endAt ? <><Pause size={16} style={{ verticalAlign: -3 }} /> Cancelar sesión</> : <><Play size={16} style={{ verticalAlign: -3 }} /> Iniciar enfoque</>}
        </button>
      </div>

      {!f.endAt && (
        <div className="glass card stack">
          <h2>Enfocarme en</h2>
          <select className="input" value={taskId} onChange={(e) => setTaskId(e.target.value)}>
            <option value="">Sin tarea específica</option>
            {d.tasks.filter((t) => !t.done).map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
          {!task && (
            <select className="input" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              <option value="">Sin proyecto</option>
              {d.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
        </div>
      )}

      <div className="glass card grid2">
        <div className="stat"><b>{todayMin}</b><span>Min hoy</span></div>
        <div className="stat"><b>{today.length}</b><span>Sesiones</span></div>
      </div>
      <div className="small muted" style={{ padding: '0 8px' }}>
        {isNative
          ? 'Al iniciar, Kody activa No Molestar y bloquea tus apps distractoras (configúralo en Ajustes → Teléfono).'
          : 'En la app Android, el enfoque activa No Molestar y bloquea tus apps distractoras. En el navegador no es posible.'}
      </div>
    </main>
  )
}
