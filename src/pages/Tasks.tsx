import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Sheet } from '../components/ui'
import { TaskForm } from '../components/forms'
import { TaskRow } from '../components/rows'
import { useData } from '../lib/hooks'

export default function Tasks() {
  const { tasks, projects } = useData()
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState('')
  const [q, setQ] = useState('')

  const list = tasks
    .filter((t) => (!filter || (filter === '_none' ? !t.projectId : t.projectId === filter)) && t.title.toLowerCase().includes(q.toLowerCase()))
  const pending = list.filter((t) => !t.done).sort((a, b) => a.priority - b.priority || (a.dueDate ?? '9').localeCompare(b.dueDate ?? '9'))
  const done = list.filter((t) => t.done)

  return (
    <main className="page">
      <h1>Tareas</h1>
      <p className="sub">{tasks.filter((t) => !t.done).length} pendientes · reúne todo lo de tus proyectos</p>
      <input className="input" placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} style={{ marginBottom: 12 }} />
      <div className="row wrap" style={{ marginBottom: 14 }}>
        <button className={`chip btn-like ${!filter ? 'active' : ''}`} onClick={() => setFilter('')}>Todas</button>
        {projects.map((p) => (
          <button key={p.id} className={`chip btn-like ${filter === p.id ? 'active' : ''}`} onClick={() => setFilter(p.id)}>
            <span className="dot" style={{ background: p.color }} />{p.name}
          </button>
        ))}
        <button className={`chip btn-like ${filter === '_none' ? 'active' : ''}`} onClick={() => setFilter('_none')}>Sueltas</button>
      </div>
      <div className="glass card">
        <h2>Pendientes</h2>
        {pending.length === 0 && <div className="empty">Todo al día. Buen trabajo.</div>}
        {pending.map((t) => <TaskRow key={t.id} t={t} project={projects.find((p) => p.id === t.projectId)} />)}
      </div>
      {done.length > 0 && (
        <div className="glass card">
          <h2>Completadas</h2>
          {done.map((t) => <TaskRow key={t.id} t={t} project={projects.find((p) => p.id === t.projectId)} />)}
        </div>
      )}
      <button className="fab" onClick={() => setOpen(true)} aria-label="Nueva tarea"><Plus size={26} /></button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Nueva tarea">
        <TaskForm projectId={filter && filter !== '_none' ? filter : ''} onDone={() => setOpen(false)} />
      </Sheet>
    </main>
  )
}
