import { useState } from 'react'
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, startOfMonth, startOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { LoadBar, Sheet } from '../components/ui'
import { setPref, usePrefs } from '../db/settings'
import { capacityFor, loadFor } from '../lib/tasks'
import { EventForm, TaskForm } from '../components/forms'
import { RoutineCard, TaskRow } from '../components/rows'
import { db } from '../db/schema'
import { useData } from '../lib/hooks'
import { parseYmd, ymd } from '../lib/dates'

export default function Calendar() {
  const d = useData()
  const prefs = usePrefs()
  const [month, setMonth] = useState(new Date())
  const [sel, setSel] = useState(ymd())
  const [open, setOpen] = useState<'' | 'evento' | 'tarea'>('')

  const days = eachDayOfInterval({ start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }) })
  const counts = (k: string) => (d.events.some((e) => e.date === k) ? 1 : 0) + (d.tasks.some((t) => !t.done && t.dueDate === k) ? 1 : 0)
  const selDate = parseYmd(sel)
  const events = d.events.filter((e) => e.date === sel).sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''))
  const tasks = d.tasks.filter((t) => t.dueDate === sel)
  const routines = d.routines.filter((r) => r.days.includes(selDate.getDay()))
  const pj = (id?: string) => d.projects.find((p) => p.id === id)

  return (
    <main className="page">
      <h1>Calendario</h1>
      <div className="glass card" style={{ marginTop: 14 }}>
        <div className="row" style={{ marginBottom: 10 }}>
          <button className="icon-btn" onClick={() => setMonth(addMonths(month, -1))}><ChevronLeft size={18} /></button>
          <h3 className="grow" style={{ textAlign: 'center', textTransform: 'capitalize' }}>{format(month, 'MMMM yyyy', { locale: es })}</h3>
          <button className="icon-btn" onClick={() => setMonth(addMonths(month, 1))}><ChevronRight size={18} /></button>
        </div>
        <div className="cal">
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((x) => <div key={x} className="dn">{x}</div>)}
          {days.map((day) => {
            const k = ymd(day)
            return (
              <button key={k} className={`${isSameMonth(day, month) ? '' : 'out'} ${k === ymd() ? 'today' : ''} ${k === sel ? 'sel' : ''}`} onClick={() => setSel(k)}>
                {day.getDate()}
                <span className="dots">{Array.from({ length: counts(k) }, (_, i) => <i key={i} />)}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="row" style={{ margin: '4px 6px 10px' }}>
        <h2 className="grow" style={{ margin: 0 }}>{format(selDate, "EEEE d 'de' MMMM", { locale: es })}</h2>
        <button className="btn sm" onClick={() => setOpen('tarea')}>+ Tarea</button>
        <button className="btn sm primary" onClick={() => setOpen('evento')}>+ Evento</button>
      </div>

      <div className="glass card stack">
        <LoadBar load={loadFor(d.tasks, sel, sel === ymd())} cap={capacityFor(prefs, sel)} />
        <div className="row small muted">
          <span className="grow">Tiempo disponible este día (min)</span>
          <input className="input" type="number" min={0} step={30} style={{ width: 90, padding: '6px 10px' }} value={capacityFor(prefs, sel)}
            onChange={(e) => setPref('capacityOverrides', { ...prefs.capacityOverrides, [sel]: Math.max(0, Number(e.target.value)) })} />
        </div>
      </div>
      <div className="glass card">
        {events.length + tasks.length === 0 && <div className="empty">Día libre.</div>}
        {events.map((e) => (
          <div key={e.id} className="item">
            <span className="mono" style={{ color: 'var(--a1)', width: 48 }}>{e.time ?? '·····'}</span>
            <div className="grow">{e.title}{pj(e.projectId) && <span className="chip" style={{ marginLeft: 8, color: pj(e.projectId)!.color }}>{pj(e.projectId)!.name}</span>}</div>
            <button className="icon-btn" onClick={() => db.events.delete(e.id)}><Trash2 size={14} /></button>
          </div>
        ))}
        {tasks.map((t) => <TaskRow key={t.id} t={t} project={pj(t.projectId)} />)}
      </div>
      {routines.length > 0 && <>
        <h2 style={{ marginLeft: 6 }}>Rutinas de este día</h2>
        {routines.map((r) => <RoutineCard key={r.id} r={r} logs={d.routineLogs} project={pj(r.projectId)} date={sel} />)}
      </>}

      <Sheet open={open === 'evento'} onClose={() => setOpen('')} title="Nuevo evento"><EventForm date={sel} onDone={() => setOpen('')} /></Sheet>
      <Sheet open={open === 'tarea'} onClose={() => setOpen('')} title="Nueva tarea"><TaskForm date={sel} onDone={() => setOpen('')} /></Sheet>
      <button className="fab" onClick={() => setOpen('evento')} aria-label="Nuevo evento"><Plus size={26} /></button>
    </main>
  )
}
