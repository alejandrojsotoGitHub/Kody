import { useState } from 'react'
import { db, uid } from '../db/schema'
import { addTask } from '../db/actions'
import { ALL_DAYS, ymd } from '../lib/dates'
import { DaysPicker, ProjectSelect } from './ui'

interface FormProps { projectId?: string; date?: string; onDone: () => void }

const ESTIMATES = [15, 30, 45, 60, 90, 120, 180]
const UNITS = ['páginas', 'capítulos', 'lecciones', 'ejercicios', '%']

export function TaskForm({ projectId = '', date, onDone }: FormProps) {
  const [title, setTitle] = useState('')
  const [project, setProject] = useState(projectId)
  const [priority, setPriority] = useState<1 | 2 | 3>(2)
  const [due, setDue] = useState(date ?? '')
  const [estimate, setEstimate] = useState(0)
  const [sections, setSections] = useState('')
  const [multi, setMulti] = useState(false)
  const [unit, setUnit] = useState('páginas')
  const [total, setTotal] = useState(100)
  const save = async () => {
    if (!title.trim()) return
    const subtasks = sections.split('\n').map((s) => s.trim()).filter(Boolean).map((t) => ({ id: uid(), title: t, done: false }))
    await addTask({
      title: title.trim(), projectId: project || undefined, priority, dueDate: due || undefined,
      estimateMin: estimate || undefined, subtasks,
      progress: multi && !subtasks.length && total > 0 ? { unit, total, current: 0 } : undefined,
    })
    onDone()
  }
  return (
    <div className="stack">
      <input className="input" autoFocus placeholder="¿Qué hay que hacer?" value={title} onChange={(e) => setTitle(e.target.value)} />
      <ProjectSelect value={project} onChange={setProject} />
      <div>
        <div className="kicker" style={{ marginBottom: 6 }}>Prioridad</div>
        <div className="seg">
          {([1, 2, 3] as const).map((p) => <button key={p} className={priority === p ? 'on' : ''} onClick={() => setPriority(p)}>{['Alta', 'Media', 'Baja'][p - 1]}</button>)}
        </div>
      </div>
      <div>
        <div className="kicker" style={{ marginBottom: 6 }}>Tiempo estimado</div>
        <div className="row wrap" style={{ gap: 6 }}>
          {ESTIMATES.map((m) => <button key={m} className={`chip btn-like ${estimate === m ? 'active' : ''}`} onClick={() => setEstimate(estimate === m ? 0 : m)}>{m >= 60 ? `${m / 60} h` : `${m} m`}</button>)}
          <input className="input" type="number" min={0} placeholder="min" style={{ width: 84, padding: '7px 10px' }} value={estimate || ''} onChange={(e) => setEstimate(Number(e.target.value))} />
        </div>
      </div>
      <input className="input" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
      <div>
        <div className="kicker" style={{ marginBottom: 6 }}>Secciones (opcional)</div>
        <textarea className="input" rows={3} placeholder={'Una por línea:\nCapítulo 1\nCapítulo 2'} value={sections} onChange={(e) => setSections(e.target.value)} />
      </div>
      {!sections.trim() && (
        <div>
          <label className="row small"><input type="checkbox" checked={multi} onChange={(e) => setMulti(e.target.checked)} /> Tarea de varios días (medir progreso)</label>
          {multi && (
            <div className="row" style={{ marginTop: 8 }}>
              <input className="input" type="number" min={1} value={total} onChange={(e) => setTotal(Number(e.target.value))} />
              <select className="input" value={unit} onChange={(e) => setUnit(e.target.value)}>{UNITS.map((u) => <option key={u}>{u}</option>)}</select>
            </div>
          )}
        </div>
      )}
      <button className="btn primary full" onClick={save}>Agregar tarea</button>
    </div>
  )
}

export function RoutineForm({ projectId = '', onDone }: FormProps) {
  const [name, setName] = useState('')
  const [slot, setSlot] = useState<'mañana' | 'día' | 'tarde' | 'noche'>('mañana')
  const [days, setDays] = useState<number[]>(ALL_DAYS)
  const [steps, setSteps] = useState('')
  const [project, setProject] = useState(projectId)
  const save = async () => {
    const list = steps.split('\n').map((s) => s.trim()).filter(Boolean)
    if (!name.trim() || !list.length) return
    await db.routines.add({ id: uid(), name: name.trim(), slot, days, projectId: project || undefined, steps: list.map((title) => ({ id: uid(), title })), createdAt: Date.now() })
    onDone()
  }
  return (
    <div className="stack">
      <input className="input" autoFocus placeholder="Nombre (ej. Ir al trabajo)" value={name} onChange={(e) => setName(e.target.value)} />
      <div className="seg">
        {(['mañana', 'día', 'tarde', 'noche'] as const).map((s) => <button key={s} className={slot === s ? 'on' : ''} onClick={() => setSlot(s)}>{s}</button>)}
      </div>
      <DaysPicker value={days} onChange={setDays} />
      <textarea className="input" rows={4} placeholder={'Un paso por línea:\nPreparar mochila\nSalir a las 7:00'} value={steps} onChange={(e) => setSteps(e.target.value)} />
      <ProjectSelect value={project} onChange={setProject} />
      <button className="btn primary full" onClick={save}>Crear rutina</button>
    </div>
  )
}

export function HabitForm({ projectId = '', onDone }: FormProps) {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('✨')
  const [days, setDays] = useState<number[]>(ALL_DAYS)
  const [project, setProject] = useState(projectId)
  const save = async () => {
    if (!name.trim()) return
    const color = (await db.projects.get(project))?.color ?? '#5eead4'
    await db.habits.add({ id: uid(), name: name.trim(), icon, color, days, projectId: project || undefined, createdAt: Date.now() })
    onDone()
  }
  return (
    <div className="stack">
      <div className="row">
        <input className="input" style={{ width: 70, textAlign: 'center', fontSize: 22 }} value={icon} onChange={(e) => setIcon(e.target.value.slice(-2))} />
        <input className="input" autoFocus placeholder="Nombre del hábito" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <DaysPicker value={days} onChange={setDays} />
      <ProjectSelect value={project} onChange={setProject} />
      <button className="btn primary full" onClick={save}>Crear hábito</button>
    </div>
  )
}

export function EventForm({ projectId = '', date, onDone }: FormProps) {
  const [title, setTitle] = useState('')
  const [d, setD] = useState(date ?? ymd())
  const [time, setTime] = useState('')
  const [remind, setRemind] = useState(10)
  const [project, setProject] = useState(projectId)
  const save = async () => {
    if (!title.trim()) return
    if (time && 'Notification' in window && Notification.permission === 'default') Notification.requestPermission()
    await db.events.add({ id: uid(), title: title.trim(), date: d, time: time || undefined, remindMinutes: remind, projectId: project || undefined, createdAt: Date.now() })
    onDone()
  }
  return (
    <div className="stack">
      <input className="input" autoFocus placeholder="Evento o recordatorio" value={title} onChange={(e) => setTitle(e.target.value)} />
      <div className="row"><input className="input" type="date" value={d} onChange={(e) => setD(e.target.value)} /><input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} /></div>
      <select className="input" value={remind} onChange={(e) => setRemind(Number(e.target.value))}>
        <option value={0}>Avisar a la hora</option><option value={10}>10 min antes</option><option value={30}>30 min antes</option><option value={60}>1 hora antes</option>
      </select>
      <ProjectSelect value={project} onChange={setProject} />
      <button className="btn primary full" onClick={save}>Guardar evento</button>
    </div>
  )
}
