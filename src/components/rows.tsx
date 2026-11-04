import { useNavigate } from 'react-router-dom'
import { Flame, Play, Trash2 } from 'lucide-react'
import { db, type Habit, type HabitLog, type Project, type Routine, type RoutineLog, type Task } from '../db/schema'
import { deleteHabit, deleteRoutine, toggleHabit, toggleStep, toggleTask } from '../db/actions'
import { habitStreak } from '../lib/stats'
import { ymd } from '../lib/dates'
import { fmtMin, hasProgress, taskProgress } from '../lib/tasks'
import { CheckCircle, ProjectDot } from './ui'

export function TaskRow({ t, project, showProject = true }: { t: Task; project?: Project; showProject?: boolean }) {
  const nav = useNavigate()
  const overdue = !t.done && t.dueDate && t.dueDate < ymd()
  const pct = taskProgress(t)
  return (
    <div className="item">
      <CheckCircle on={t.done} onClick={() => toggleTask(t)} color={project?.color} />
      <div className="grow" onClick={() => nav(`/tareas/${t.id}`)} style={{ cursor: 'pointer' }}>
        <div className={t.done ? 'done-text' : ''}>{t.title}</div>
        <div className="row wrap small muted" style={{ gap: 6, marginTop: 3 }}>
          <span className={`p${t.priority}`}>●</span>
          {t.estimateMin ? <span>⏱ {fmtMin(t.estimateMin)}</span> : null}
          {t.dueDate && <span style={overdue ? { color: 'var(--danger)' } : undefined}>{overdue ? 'Vencida · ' : ''}{t.dueDate}</span>}
          {showProject && <ProjectDot project={project} />}
          {t.source === 'ia' && <span className="chip">✦ Kody</span>}
        </div>
        {hasProgress(t) && !t.done && (
          <div className="row" style={{ gap: 8, marginTop: 6 }}>
            <div className="pbar grow" style={{ height: 5 }}><div style={{ width: `${pct}%` }} /></div>
            <span className="mono small muted">{pct}%</span>
          </div>
        )}
      </div>
      {!t.done && <button className="icon-btn" onClick={() => nav(`/enfoque?task=${t.id}`)} aria-label="Enfocar"><Play size={14} /></button>}
      <button className="icon-btn" onClick={() => db.tasks.delete(t.id)} aria-label="Eliminar"><Trash2 size={14} /></button>
    </div>
  )
}

export function HabitRow({ h, logs, project, date = ymd(), onDelete }: { h: Habit; logs: HabitLog[]; project?: Project; date?: string; onDelete?: () => void }) {
  const done = logs.some((l) => l.habitId === h.id && l.date === date)
  const streak = habitStreak(h, logs)
  return (
    <div className="item">
      <CheckCircle on={done} onClick={() => toggleHabit(h.id, date)} color={h.color} />
      <span style={{ fontSize: 22 }}>{h.icon}</span>
      <div className="grow">
        <div className={done ? 'done-text' : ''}>{h.name}</div>
        <div className="row small muted" style={{ gap: 6, marginTop: 3 }}>
          <ProjectDot project={project} />
        </div>
      </div>
      {streak > 0 && <span className="chip" style={{ color: 'var(--warn)' }}><Flame size={12} />{streak}</span>}
      {onDelete && <button className="icon-btn" onClick={onDelete} aria-label="Eliminar"><Trash2 size={14} /></button>}
    </div>
  )
}

export function RoutineCard({ r, logs, project, manage = false, date = ymd() }: { r: Routine; logs: RoutineLog[]; project?: Project; manage?: boolean; date?: string }) {
  const log = logs.find((l) => l.routineId === r.id && l.date === date)
  const doneN = r.steps.filter((s) => log?.doneSteps.includes(s.id)).length
  const pct = r.steps.length ? Math.round((doneN / r.steps.length) * 100) : 0
  return (
    <div className="glass card">
      <div className="row" style={{ marginBottom: 6 }}>
        <div className="grow">
          <h3>{r.name}</h3>
          <div className="row wrap small muted" style={{ gap: 6, marginTop: 4 }}>
            <span className="chip">{r.slot}</span><ProjectDot project={project} />
          </div>
        </div>
        <span className="mono" style={{ color: pct === 100 ? 'var(--ok)' : 'var(--muted)' }}>{doneN}/{r.steps.length}</span>
        {manage && <button className="icon-btn" onClick={() => confirm('¿Borrar rutina?') && deleteRoutine(r.id)}><Trash2 size={14} /></button>}
      </div>
      <div className="pbar" style={{ marginBottom: 6 }}><div style={{ width: `${pct}%` }} /></div>
      {r.steps.map((s) => {
        const on = !!log?.doneSteps.includes(s.id)
        return (
          <div className="item" key={s.id}>
            <CheckCircle on={on} onClick={() => toggleStep(r, s.id, date)} color={project?.color} />
            <span className={on ? 'done-text' : ''}>{s.title}</span>
          </div>
        )
      })}
    </div>
  )
}

export function HabitManageRow({ h, logs, project }: { h: Habit; logs: HabitLog[]; project?: Project }) {
  return <HabitRow h={h} logs={logs} project={project} onDelete={() => confirm('¿Borrar hábito?') && deleteHabit(h)} />
}
