import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Play, Sparkles } from 'lucide-react'
import Mascot from '../mascot/Mascot'
import { LoadBar, Ring } from '../components/ui'
import { capacityFor, loadFor } from '../lib/tasks'
import { HabitRow, RoutineCard, TaskRow } from '../components/rows'
import { usePrefs } from '../db/settings'
import { useData } from '../lib/hooks'
import { ymd } from '../lib/dates'
import { levelOf } from '../lib/stats'

export default function Today() {
  const prefs = usePrefs()
  const nav = useNavigate()
  const d = useData()
  const today = ymd()
  const dow = new Date().getDay()
  const pj = (id?: string) => d.projects.find((p) => p.id === id)

  const dayTasks = d.tasks.filter((t) => (!t.done ? !t.dueDate || t.dueDate <= today : t.doneAt && ymd(new Date(t.doneAt)) === today))
  const routines = d.routines.filter((r) => r.days.includes(dow))
  const habits = d.habits.filter((h) => h.days.includes(dow))
  const events = d.events.filter((e) => e.date === today).sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''))

  // Progreso unificado: tareas + pasos de rutinas + hábitos
  const stepTotal = routines.reduce((n, r) => n + r.steps.length, 0)
  const stepDone = routines.reduce((n, r) => n + (d.routineLogs.find((l) => l.routineId === r.id && l.date === today)?.doneSteps.filter((s) => r.steps.some((x) => x.id === s)).length ?? 0), 0)
  const habitDone = habits.filter((h) => d.habitLogs.some((l) => l.habitId === h.id && l.date === today)).length
  const taskDone = dayTasks.filter((t) => t.done).length
  const total = dayTasks.length + stepTotal + habits.length
  const done = taskDone + stepDone + habitDone
  const pct = total ? Math.round((done / total) * 100) : 0

  const next = [...dayTasks].filter((t) => !t.done).sort((a, b) => a.priority - b.priority)[0]
  const { level, into } = levelOf(prefs.xp)
  const h = new Date().getHours()
  const greet = h < 5 ? 'Aún despierto' : h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <main className="page">
      <div className="kicker">{format(new Date(), "EEEE d 'de' MMMM", { locale: es })}</div>
      <h1>{greet}{prefs.userName && <>, <span className="grad-text">{prefs.userName}</span></>}</h1>

      <div style={{ display: 'flex', justifyContent: 'center', margin: '38px 0 6px' }}>
        <Mascot size={170} />
      </div>
      <div className="glass card" style={{ padding: '12px 16px' }}>
        <div className="row small">
          <span className="mono">NIVEL {level}</span>
          <div className="pbar grow"><div style={{ width: `${into}%` }} /></div>
          <span className="mono muted">{into}/100 XP</span>
        </div>
      </div>

      <div className="glass card row" style={{ gap: 18 }}>
        <Ring pct={pct} size={104} />
        <div className="grow">
          <h3>Progreso de hoy</h3>
          <div className="small muted" style={{ marginTop: 4, lineHeight: 1.7 }}>
            {taskDone}/{dayTasks.length} tareas · {stepDone}/{stepTotal} pasos de rutina · {habitDone}/{habits.length} hábitos
          </div>
        </div>
      </div>

      <div className="glass card" onClick={() => nav('/analiticas')} style={{ cursor: 'pointer' }}>
        <h2>Tiempo de hoy</h2>
        <LoadBar load={loadFor(d.tasks, today, true)} cap={capacityFor(prefs, today)} />
      </div>

      {next && (
        <div className="glass card row">
          <Sparkles size={20} style={{ color: 'var(--a1)' }} />
          <div className="grow">
            <div className="kicker">Kody sugiere</div>
            <div style={{ fontWeight: 600 }}>{next.title}</div>
          </div>
          <button className="btn primary sm" onClick={() => nav(`/enfoque?task=${next.id}`)}><Play size={13} style={{ verticalAlign: -2 }} /> Enfocar</button>
        </div>
      )}

      {events.length > 0 && (
        <div className="glass card">
          <h2>Agenda</h2>
          {events.map((e) => (
            <div key={e.id} className="item">
              <span className="mono" style={{ color: 'var(--a1)', width: 48 }}>{e.time ?? '·····'}</span>
              <span className="grow">{e.title}</span>
              {pj(e.projectId) && <span className="dot" style={{ background: pj(e.projectId)!.color }} />}
            </div>
          ))}
        </div>
      )}

      {routines.map((r) => <RoutineCard key={r.id} r={r} logs={d.routineLogs} project={pj(r.projectId)} />)}

      <div className="glass card">
        <h2>Tareas</h2>
        {dayTasks.length === 0 && <div className="empty">Nada pendiente para hoy. ✨</div>}
        {dayTasks.map((t) => <TaskRow key={t.id} t={t} project={pj(t.projectId)} />)}
      </div>

      {habits.length > 0 && (
        <div className="glass card">
          <h2>Hábitos</h2>
          {habits.map((hb) => <HabitRow key={hb.id} h={hb} logs={d.habitLogs} project={pj(hb.projectId)} />)}
        </div>
      )}
    </main>
  )
}
