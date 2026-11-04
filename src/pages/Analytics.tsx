import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, AreaChart, Area } from 'recharts'
import { format, subDays } from 'date-fns'
import WorldMap from '../components/WorldMap'
import UsageCard from '../components/UsageCard'
import Achievements from '../components/Achievements'
import { Minus, Plus } from 'lucide-react'
import { setPref, usePrefs } from '../db/settings'
import { fmtMin, remainingMin } from '../lib/tasks'
import { DAY_LABELS } from '../lib/dates'
import { useData } from '../lib/hooks'
import { cssVar, habitStreak } from '../lib/stats'
import { ymd } from '../lib/dates'

export default function Analytics() {
  const prefs = usePrefs()
  const d = useData()
  const a1 = cssVar('--a1'), a2 = cssVar('--a2'), muted = cssVar('--muted')
  const days = Array.from({ length: 14 }, (_, i) => subDays(new Date(), 13 - i))

  const series = days.map((day) => {
    const k = ymd(day)
    return {
      d: format(day, 'd'),
      tareas: d.tasks.filter((t) => t.doneAt && ymd(new Date(t.doneAt)) === k).length,
      enfoque: d.sessions.filter((s) => ymd(new Date(s.startedAt)) === k).reduce((n, s) => n + s.minutes, 0),
      habitos: d.habitLogs.filter((l) => l.date === k).length,
    }
  })

  const byProject = d.projects.map((p) => {
    const t = d.tasks.filter((x) => x.projectId === p.id)
    return { name: p.name, color: p.color, pct: t.length ? Math.round((t.filter((x) => x.done).length / t.length) * 100) : 0, mins: d.sessions.filter((s) => s.projectId === p.id).reduce((n, s) => n + s.minutes, 0), rem: t.reduce((n, x) => n + remainingMin(x), 0) }
  })

  const totalRemaining = d.tasks.reduce((n, t) => n + remainingMin(t), 0)
  const noEstimate = d.tasks.filter((t) => !t.done && !t.estimateMin).length
  const weekCap = prefs.capacity.reduce((a, b) => a + b, 0)
  const daysNeeded = weekCap ? Math.ceil((totalRemaining / weekCap) * 7) : 0

  const hours = Array(24).fill(0)
  d.tasks.forEach((t) => t.doneAt && hours[new Date(t.doneAt).getHours()]++)
  d.sessions.forEach((s) => hours[new Date(s.startedAt).getHours()] += 1)
  const best = hours.indexOf(Math.max(...hours))

  const totalTasks = d.tasks.filter((t) => t.done).length
  const bestStreak = Math.max(0, ...d.habits.map((h) => habitStreak(h, d.habitLogs)))
  const tip = { background: 'rgba(10,12,30,0.92)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 12 }

  return (
    <main className="page">
      <h1>Analíticas</h1>
      <p className="sub">Tu rendimiento, cruzando tareas, hábitos, rutinas y enfoque.</p>

      <div className="glass card">
        <h2>Mundo de Kody</h2>
        <WorldMap />
      </div>

      <UsageCard />

      <div className="glass card">
        <h2>Logros</h2>
        <Achievements />
      </div>

      <div className="glass card stack">
        <h2>Planificación de tiempo</h2>
        <div className="grid2" style={{ gap: 8 }}>
          <div className="stat"><b className="grad-text">{fmtMin(totalRemaining)}</b><span>Trabajo pendiente</span></div>
          <div className="stat"><b className="grad-text">{weekCap ? `${daysNeeded} d` : '—'}</b><span>Para terminarlo todo</span></div>
        </div>
        <div className="small muted">Suma el tiempo estimado restante de todas las tareas de todos tus proyectos{noEstimate ? ` (${noEstimate} tareas aún sin estimar)` : ''}. Capacidad semanal: {fmtMin(weekCap)}.</div>
        <h2 style={{ margin: '8px 0 0' }}>Tiempo disponible por día</h2>
        {[1, 2, 3, 4, 5, 6, 0].map((i) => (
          <div key={i} className="row">
            <span className="mono" style={{ width: 24 }}>{DAY_LABELS[i]}</span>
            <div className="pbar grow"><div style={{ width: `${Math.min(100, (prefs.capacity[i] / 480) * 100)}%` }} /></div>
            <div className="stepper">
              <button className="icon-btn" onClick={() => setPref('capacity', prefs.capacity.map((c, j) => (j === i ? Math.max(0, c - 30) : c)))}><Minus size={14} /></button>
              <b>{fmtMin(prefs.capacity[i])}</b>
              <button className="icon-btn" onClick={() => setPref('capacity', prefs.capacity.map((c, j) => (j === i ? Math.min(960, c + 30) : c)))}><Plus size={14} /></button>
            </div>
          </div>
        ))}
        {byProject.some((p) => p.rem > 0) && <>
          <h2 style={{ margin: '8px 0 0' }}>Trabajo pendiente por proyecto</h2>
          {byProject.filter((p) => p.rem > 0).map((p) => (
            <div key={p.name} className="row small"><span className="dot" style={{ background: p.color }} /><span className="grow">{p.name}</span><span className="mono">{fmtMin(p.rem)}</span></div>
          ))}
        </>}
      </div>

      <div className="grid2" style={{ marginBottom: 14 }}>
        {[[totalTasks, 'Tareas hechas'], [d.sessions.reduce((n, s) => n + s.minutes, 0), 'Min de enfoque'], [bestStreak, 'Mejor racha'], [hours[best] ? `${best}:00` : '—', 'Tu mejor hora']].map(([v, l]) => (
          <div key={String(l)} className="glass card stat" style={{ margin: 0 }}><b className="grad-text">{v}</b><span>{l}</span></div>
        ))}
      </div>

      <div className="glass card">
        <h2>Tareas completadas · 14 días</h2>
        <ResponsiveContainer width="100%" height={170}>
          <BarChart data={series}><CartesianGrid vertical={false} stroke={muted} strokeOpacity={0.15} /><XAxis dataKey="d" tick={{ fill: muted, fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} width={24} tick={{ fill: muted, fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={tip} cursor={{ fill: 'rgba(255,255,255,0.06)' }} /><Bar dataKey="tareas" fill={a1} radius={[6, 6, 0, 0]} /></BarChart>
        </ResponsiveContainer>
      </div>

      <div className="glass card">
        <h2>Minutos de enfoque</h2>
        <ResponsiveContainer width="100%" height={150}>
          <AreaChart data={series}><defs><linearGradient id="fa" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={a2} stopOpacity={0.6} /><stop offset="1" stopColor={a2} stopOpacity={0} /></linearGradient></defs><XAxis dataKey="d" tick={{ fill: muted, fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={tip} /><Area type="monotone" dataKey="enfoque" stroke={a2} strokeWidth={2.5} fill="url(#fa)" /></AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="glass card">
        <h2>Hábitos registrados</h2>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={series}><XAxis dataKey="d" tick={{ fill: muted, fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={tip} cursor={{ fill: 'rgba(255,255,255,0.06)' }} /><Bar dataKey="habitos" fill={a2} radius={[6, 6, 0, 0]} /></BarChart>
        </ResponsiveContainer>
      </div>

      <div className="glass card">
        <h2>Por proyecto</h2>
        {byProject.length === 0 && <div className="empty">Sin proyectos aún.</div>}
        {byProject.map((p) => (
          <div key={p.name} style={{ marginBottom: 14 }}>
            <div className="row small" style={{ marginBottom: 6 }}><span className="dot" style={{ background: p.color }} /><span className="grow">{p.name}</span><span className="mono muted">{p.mins} min · {p.pct}%</span></div>
            <div className="pbar"><div style={{ width: `${p.pct}%`, background: p.color }} /></div>
          </div>
        ))}
      </div>
    </main>
  )
}
