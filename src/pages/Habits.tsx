import { useState } from 'react'
import { Plus } from 'lucide-react'
import { subDays } from 'date-fns'
import { Sheet } from '../components/ui'
import { HabitForm } from '../components/forms'
import { HabitManageRow } from '../components/rows'
import { useData } from '../lib/hooks'
import { ymd } from '../lib/dates'

export default function Habits() {
  const d = useData()
  const [open, setOpen] = useState(false)
  const dow = new Date().getDay()
  const days = Array.from({ length: 84 }, (_, i) => ymd(subDays(new Date(), 83 - i)))

  return (
    <main className="page">
      <h1>Hábitos</h1>
      <p className="sub">Constancia diaria. Cada uno cuenta para tu progreso y tu racha.</p>
      <div className="glass card">
        <h2>Hoy</h2>
        {d.habits.length === 0 && <div className="empty">Aún no tienes hábitos.</div>}
        {d.habits.filter((h) => h.days.includes(dow)).map((h) => <HabitManageRow key={h.id} h={h} logs={d.habitLogs} project={d.projects.find((p) => p.id === h.projectId)} />)}
      </div>
      {d.habits.map((h) => {
        const set = new Set(d.habitLogs.filter((l) => l.habitId === h.id).map((l) => l.date))
        return (
          <div key={h.id} className="glass card">
            <div className="row" style={{ marginBottom: 10 }}><span style={{ fontSize: 20 }}>{h.icon}</span><h3 className="grow">{h.name}</h3><span className="mono small muted">{set.size} días</span></div>
            <div className="heat">{days.map((x) => <i key={x} className={set.has(x) ? 'on' : ''} title={x} />)}</div>
          </div>
        )
      })}
      <button className="fab" onClick={() => setOpen(true)} aria-label="Nuevo hábito"><Plus size={26} /></button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Nuevo hábito"><HabitForm onDone={() => setOpen(false)} /></Sheet>
    </main>
  )
}
