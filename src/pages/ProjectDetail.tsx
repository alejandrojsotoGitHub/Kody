import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { db } from '../db/schema'
import { fmtMin, remainingMin } from '../lib/tasks'
import { Ring, Sheet } from '../components/ui'
import { EventForm, HabitForm, RoutineForm, TaskForm } from '../components/forms'
import { HabitManageRow, RoutineCard, TaskRow } from '../components/rows'
import { deleteProject } from '../db/actions'
import { useData } from '../lib/hooks'

type Tab = 'tareas' | 'rutinas' | 'habitos' | 'agenda' | 'contexto'

export default function ProjectDetail() {
  const { id = '' } = useParams()
  const nav = useNavigate()
  const d = useData()
  const [tab, setTab] = useState<Tab>('tareas')
  const [open, setOpen] = useState(false)
  const p = d.projects.find((x) => x.id === id)
  if (!p) return <main className="page"><button className="btn" onClick={() => nav('/proyectos')}>Volver</button><div className="empty">Proyecto no encontrado.</div></main>

  const tasks = d.tasks.filter((t) => t.projectId === id)
  const pct = tasks.length ? Math.round((tasks.filter((t) => t.done).length / tasks.length) * 100) : 0
  const mins = d.sessions.filter((s) => s.projectId === id).reduce((n, s) => n + s.minutes, 0)
  const routines = d.routines.filter((r) => r.projectId === id)
  const habits = d.habits.filter((h) => h.projectId === id)
  const events = d.events.filter((e) => e.projectId === id).sort((a, b) => a.date.localeCompare(b.date))
  const done = () => setOpen(false)

  return (
    <main className="page">
      <div className="row" style={{ marginBottom: 8 }}>
        <div className="grow" />
        <button className="icon-btn" onClick={async () => { if (confirm(`¿Borrar "${p.name}" con todas sus tareas, rutinas y hábitos?`)) { await deleteProject(id); nav('/proyectos') } }}><Trash2 size={16} /></button>
      </div>
      <div className="kicker" style={{ color: p.color }}>{p.area}</div>
      <h1>{p.name}</h1>

      <div className="glass card row" style={{ gap: 16, marginTop: 14 }}>
        <Ring pct={pct} size={92} />
        <div className="grid2 grow" style={{ gap: 6 }}>
          <div className="stat"><b>{tasks.filter((t) => !t.done).length}</b><span>Pendientes</span></div>
          <div className="stat"><b>{mins}</b><span>Min enfoque</span></div>
          <div className="stat" style={{ gridColumn: '1 / -1' }}><b style={{ fontSize: 18 }}>{fmtMin(tasks.reduce((n, t) => n + remainingMin(t), 0))}</b><span>Trabajo estimado restante</span></div>
        </div>
      </div>

      <div className="seg" style={{ marginBottom: 14 }}>
        {([['tareas', 'Tareas'], ['rutinas', 'Rutinas'], ['habitos', 'Hábitos'], ['agenda', 'Agenda'], ['contexto', 'Contexto']] as const).map(([k, l]) => (
          <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === 'tareas' && <div className="glass card">
        {tasks.length === 0 && <div className="empty">Sin tareas todavía.</div>}
        {[...tasks].sort((a, b) => Number(a.done) - Number(b.done)).map((t) => <TaskRow key={t.id} t={t} project={p} showProject={false} />)}
      </div>}
      {tab === 'rutinas' && (routines.length ? routines.map((r) => <RoutineCard key={r.id} r={r} logs={d.routineLogs} project={p} manage />) : <div className="glass card empty">Sin rutinas. Crea una con +.</div>)}
      {tab === 'habitos' && <div className="glass card">
        {habits.length === 0 && <div className="empty">Sin hábitos.</div>}
        {habits.map((h) => <HabitManageRow key={h.id} h={h} logs={d.habitLogs} project={p} />)}
      </div>}
      {tab === 'agenda' && <div className="glass card">
        {events.length === 0 && <div className="empty">Sin eventos.</div>}
        {events.map((e) => <div key={e.id} className="item"><span className="mono small" style={{ color: p.color }}>{e.date.slice(5)} {e.time}</span><span className="grow">{e.title}</span></div>)}
      </div>}

      {tab === 'contexto' && <div className="glass card stack">
        <h2>Contexto del proyecto</h2>
        <div className="small muted">Qué es, metas, fechas clave, personas, reglas… Kody lo lee para ayudarte mejor con este proyecto.</div>
        <textarea className="input" rows={12} placeholder={'Ej: Estoy en 5º semestre de Ingeniería. Materias: Cálculo, Física. Parcial el 20 de noviembre…'} value={p.context ?? ''} onChange={(e) => db.projects.update(p.id, { context: e.target.value })} />
      </div>}

      {tab !== 'contexto' && <button className="fab" onClick={() => setOpen(true)} aria-label="Agregar"><Plus size={26} /></button>}
      <Sheet open={open} onClose={() => setOpen(false)} title={{ tareas: 'Nueva tarea', rutinas: 'Nueva rutina', habitos: 'Nuevo hábito', agenda: 'Nuevo evento', contexto: '' }[tab]}>
        {tab === 'tareas' && <TaskForm projectId={id} onDone={done} />}
        {tab === 'rutinas' && <RoutineForm projectId={id} onDone={done} />}
        {tab === 'habitos' && <HabitForm projectId={id} onDone={done} />}
        {tab === 'agenda' && <EventForm projectId={id} onDone={done} />}
      </Sheet>
    </main>
  )
}
