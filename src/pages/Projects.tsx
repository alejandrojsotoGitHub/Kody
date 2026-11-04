import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Sheet } from '../components/ui'
import { addProject } from '../db/actions'
import { useData } from '../lib/hooks'

const AREAS = [
  { name: 'Universidad', color: '#38bdf8', tpl: true },
  { name: 'Iglesia', color: '#fbbf24', tpl: true },
  { name: 'Emprendimiento', color: '#34d399', tpl: true },
  { name: 'Personal', color: '#c084fc', tpl: false },
]
const COLORS = ['#38bdf8', '#fbbf24', '#34d399', '#c084fc', '#fb7185', '#f97316', '#2dd4bf', '#818cf8']

export default function Projects() {
  const d = useData()
  const nav = useNavigate()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [area, setArea] = useState(AREAS[0].name)
  const [color, setColor] = useState(AREAS[0].color)
  const [tpl, setTpl] = useState(true)

  const create = async () => {
    if (!name.trim()) return
    const a = AREAS.find((x) => x.name === area)
    const p = await addProject(name.trim(), area, color, tpl && a?.tpl ? area : '')
    setOpen(false); setName('')
    nav(`/proyectos/${p.id}`)
  }

  return (
    <main className="page">
      <h1>Proyectos</h1>
      <p className="sub">Cada proyecto tiene sus propias tareas, rutinas, hábitos y agenda.</p>
      {d.projects.length === 0 && <div className="glass card empty">Crea tu primer proyecto con el botón +. Universidad, Iglesia y Emprendimiento traen una plantilla lista.</div>}
      {d.projects.map((p) => {
        const pt = d.tasks.filter((t) => t.projectId === p.id)
        const pct = pt.length ? Math.round((pt.filter((t) => t.done).length / pt.length) * 100) : 0
        const mins = d.sessions.filter((s) => s.projectId === p.id).reduce((n, s) => n + s.minutes, 0)
        return (
          <button key={p.id} className="glass card" onClick={() => nav(`/proyectos/${p.id}`)} style={{ display: 'block', width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer', color: 'inherit' }}>
            <div className="row">
              <span className="dot" style={{ background: p.color, boxShadow: `0 0 12px ${p.color}`, width: 12, height: 12 }} />
              <div className="grow"><h3>{p.name}</h3><div className="small muted">{p.area}</div></div>
              <span className="mono" style={{ fontSize: 20 }}>{pct}%</span>
            </div>
            <div className="pbar" style={{ margin: '14px 0 10px' }}><div style={{ width: `${pct}%`, background: p.color }} /></div>
            <div className="row small muted wrap" style={{ gap: 12 }}>
              <span>{pt.filter((t) => !t.done).length} tareas</span>
              <span>{d.routines.filter((r) => r.projectId === p.id).length} rutinas</span>
              <span>{d.habits.filter((h) => h.projectId === p.id).length} hábitos</span>
              <span>{mins} min enfoque</span>
            </div>
          </button>
        )
      })}
      <button className="fab" onClick={() => setOpen(true)} aria-label="Nuevo proyecto"><Plus size={26} /></button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Nuevo proyecto">
        <div className="stack">
          <input className="input" autoFocus placeholder="Nombre del proyecto" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="row wrap">
            {AREAS.map((a) => (
              <button key={a.name} className={`chip btn-like ${area === a.name ? 'active' : ''}`} onClick={() => { setArea(a.name); setColor(a.color) }}>{a.name}</button>
            ))}
          </div>
          <div className="row wrap">
            {COLORS.map((c) => <button key={c} onClick={() => setColor(c)} aria-label={c} style={{ width: 34, height: 34, borderRadius: '50%', border: color === c ? '3px solid var(--text)' : '3px solid transparent', background: c, cursor: 'pointer' }} />)}
          </div>
          {AREAS.find((a) => a.name === area)?.tpl && (
            <label className="row small"><input type="checkbox" checked={tpl} onChange={(e) => setTpl(e.target.checked)} /> Incluir plantilla (rutina, hábito y tarea iniciales)</label>
          )}
          <button className="btn primary full" onClick={create}>Crear proyecto</button>
        </div>
      </Sheet>
    </main>
  )
}
