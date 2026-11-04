import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Play, Plus, Trash2 } from 'lucide-react'
import { db, uid } from '../db/schema'
import { logProgress, toggleSection, toggleTask } from '../db/actions'
import { CheckCircle, ProjectSelect, Ring } from '../components/ui'
import { fmtMin, remainingMin, taskProgress } from '../lib/tasks'
import { useData } from '../lib/hooks'

const ESTIMATES = [15, 30, 45, 60, 90, 120, 180]
const UNITS = ['páginas', 'capítulos', 'lecciones', 'ejercicios', '%']

export default function TaskDetail() {
  const { id = '' } = useParams()
  const nav = useNavigate()
  const t = useLiveQuery(() => db.tasks.get(id), [id])
  const d = useData()
  const [newSec, setNewSec] = useState('')
  const [amount, setAmount] = useState(10)
  const [unit, setUnit] = useState('páginas')
  const [total, setTotal] = useState(100)

  if (!t) return <main className="page"><div className="empty">Tarea no encontrada.</div></main>
  const project = d.projects.find((p) => p.id === t.projectId)
  const pct = taskProgress(t)
  const spent = d.sessions.filter((s) => s.taskId === t.id).reduce((n, s) => n + s.minutes, 0)
  const upd = (patch: Partial<typeof t>) => db.tasks.update(t.id, patch)

  const addSection = async () => {
    if (!newSec.trim()) return
    await upd({ subtasks: [...t.subtasks, { id: uid(), title: newSec.trim(), done: false }], done: false })
    setNewSec('')
  }

  // historial de avance agrupado por día
  const byDay = new Map<string, number>()
  ;(t.progressLog ?? []).forEach((l) => byDay.set(l.date, (byDay.get(l.date) ?? 0) + l.amount))
  const history = [...byDay.entries()].sort((a, b) => b[0].localeCompare(a[0])).slice(0, 7)

  return (
    <main className="page">
      <div className="row">
        <CheckCircle on={t.done} onClick={() => toggleTask(t)} color={project?.color} />
        <input className="input grow" style={{ fontSize: 20, fontWeight: 700, background: 'transparent', boxShadow: 'none', padding: '8px 4px' }} value={t.title} onChange={(e) => upd({ title: e.target.value })} />
      </div>

      <div className="glass card row" style={{ gap: 16, marginTop: 10 }}>
        <Ring pct={pct} size={92} />
        <div className="grow small muted" style={{ lineHeight: 1.8 }}>
          {t.estimateMin ? <div>⏱ Estimado: <b style={{ color: 'var(--text)' }}>{fmtMin(t.estimateMin)}</b> · faltan {fmtMin(remainingMin(t))}</div> : <div>Sin tiempo estimado</div>}
          <div>🎯 Invertido en enfoque: <b style={{ color: 'var(--text)' }}>{fmtMin(spent)}</b></div>
          {t.progress && <div>📈 {t.progress.current} / {t.progress.total} {t.progress.unit}</div>}
        </div>
      </div>
      {!t.done && <button className="btn primary full" style={{ marginBottom: 14 }} onClick={() => nav(`/enfoque?task=${t.id}`)}><Play size={16} style={{ verticalAlign: -3 }} /> Iniciar enfoque en esta tarea</button>}

      <div className="glass card stack">
        <h2>Detalles</h2>
        <ProjectSelect value={t.projectId ?? ''} onChange={(v) => upd({ projectId: v || undefined })} />
        <div className="seg">
          {([1, 2, 3] as const).map((p) => <button key={p} className={t.priority === p ? 'on' : ''} onClick={() => upd({ priority: p })}>{['Alta', 'Media', 'Baja'][p - 1]}</button>)}
        </div>
        <div className="row wrap" style={{ gap: 6 }}>
          {ESTIMATES.map((m) => <button key={m} className={`chip btn-like ${t.estimateMin === m ? 'active' : ''}`} onClick={() => upd({ estimateMin: t.estimateMin === m ? undefined : m })}>{m >= 60 ? `${m / 60} h` : `${m} m`}</button>)}
          <input className="input" type="number" min={0} placeholder="min" style={{ width: 84, padding: '7px 10px' }} value={t.estimateMin ?? ''} onChange={(e) => upd({ estimateMin: Number(e.target.value) || undefined })} />
        </div>
        <input className="input" type="date" value={t.dueDate ?? ''} onChange={(e) => upd({ dueDate: e.target.value || undefined })} />
        <textarea className="input" rows={3} placeholder="Notas…" value={t.notes ?? ''} onChange={(e) => upd({ notes: e.target.value })} />
      </div>

      <div className="glass card">
        <h2>Secciones</h2>
        {t.subtasks.length === 0 && <div className="empty">Divide esta tarea en partes para medir tu avance.</div>}
        {t.subtasks.map((s) => (
          <div key={s.id} className="item">
            <CheckCircle on={s.done} onClick={() => toggleSection(t, s.id)} color={project?.color} />
            <span className={`grow ${s.done ? 'done-text' : ''}`}>{s.title}</span>
            <button className="icon-btn" onClick={() => upd({ subtasks: t.subtasks.filter((x) => x.id !== s.id) })}><Trash2 size={14} /></button>
          </div>
        ))}
        <div className="row" style={{ marginTop: 10 }}>
          <input className="input" placeholder="Nueva sección…" value={newSec} onChange={(e) => setNewSec(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addSection()} />
          <button className="btn primary" onClick={addSection}><Plus size={18} /></button>
        </div>
      </div>

      {t.subtasks.length === 0 && (
        <div className="glass card stack">
          <h2>Progreso por días</h2>
          {t.progress ? <>
            <div className="pbar"><div style={{ width: `${pct}%` }} /></div>
            <div className="row wrap" style={{ gap: 6 }}>
              {[1, 5, 10, 25].map((n) => <button key={n} className="chip btn-like" onClick={() => logProgress(t, n)}>+{n}</button>)}
              <input className="input" type="number" style={{ width: 90, padding: '7px 10px' }} value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
              <button className="btn primary sm" onClick={() => logProgress(t, amount)}>Registrar {t.progress.unit}</button>
            </div>
            {history.length > 0 && <div className="small muted">{history.map(([day, n]) => <div key={day} className="row"><span className="grow">{day}</span><span className="mono">+{n} {t.progress!.unit}</span></div>)}</div>}
            <button className="btn sm danger" onClick={() => upd({ progress: undefined, progressLog: [] })}>Quitar seguimiento</button>
          </> : <>
            <div className="small muted">Para tareas de varios días (leer un libro, un curso…).</div>
            <div className="row">
              <input className="input" type="number" min={1} value={total} onChange={(e) => setTotal(Number(e.target.value))} />
              <select className="input" value={unit} onChange={(e) => setUnit(e.target.value)}>{UNITS.map((u) => <option key={u}>{u}</option>)}</select>
            </div>
            <button className="btn full" onClick={() => upd({ progress: { unit, total, current: 0 } })}>Activar seguimiento</button>
          </>}
        </div>
      )}

      <button className="btn danger full" onClick={async () => { await db.tasks.delete(t.id); nav(-1) }}><Trash2 size={16} style={{ verticalAlign: -3 }} /> Eliminar tarea</button>
    </main>
  )
}
