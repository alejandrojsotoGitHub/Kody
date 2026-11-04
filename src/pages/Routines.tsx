import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Sheet } from '../components/ui'
import { RoutineForm } from '../components/forms'
import { RoutineCard } from '../components/rows'
import { useData } from '../lib/hooks'
import { DAY_LABELS } from '../lib/dates'

export default function Routines() {
  const d = useData()
  const [open, setOpen] = useState(false)
  const slots = ['mañana', 'día', 'tarde', 'noche'] as const
  return (
    <main className="page">
      <h1>Rutinas</h1>
      <p className="sub">Se activan solas según el día y aparecen en Hoy.</p>
      {d.routines.length === 0 && <div className="glass card empty">Crea rutinas como "Ir al trabajo" o "Antes de dormir". También puedes pedírselas a Kody en el chat.</div>}
      {slots.map((s) => {
        const list = d.routines.filter((r) => r.slot === s)
        if (!list.length) return null
        return (
          <section key={s}>
            <h2 style={{ marginLeft: 6 }}>{s}</h2>
            {list.map((r) => (
              <div key={r.id}>
                <RoutineCard r={r} logs={d.routineLogs} project={d.projects.find((p) => p.id === r.projectId)} manage />
                <div className="small muted" style={{ margin: '-6px 8px 14px' }}>Días: {r.days.map((x) => DAY_LABELS[x]).join(' ')}</div>
              </div>
            ))}
          </section>
        )
      })}
      <button className="fab" onClick={() => setOpen(true)} aria-label="Nueva rutina"><Plus size={26} /></button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Nueva rutina"><RoutineForm onDone={() => setOpen(false)} /></Sheet>
    </main>
  )
}
