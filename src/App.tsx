import { useEffect } from 'react'
import { NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, BarChart3, CalendarDays, Flame, FolderKanban, Grid2x2, ListChecks, MessageCircle, Repeat, Settings as Cog, Sun, Timer } from 'lucide-react'
import '@fontsource-variable/inter'
import '@fontsource-variable/space-grotesk'
import '@fontsource-variable/jetbrains-mono'
import { setPref, usePrefs } from './db/settings'
import { applyTheme, resolveTheme } from './theme/themes'
import { useFocus } from './lib/focusStore'
import { checkReminders } from './lib/reminders'
import { startWake, voiceProblem } from './voice/speech'
import { useKody } from './mascot/store'
import Today from './pages/Today'
import Tasks from './pages/Tasks'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import TaskDetail from './pages/TaskDetail'
import Routines from './pages/Routines'
import Habits from './pages/Habits'
import Calendar from './pages/Calendar'
import Focus from './pages/Focus'
import Analytics from './pages/Analytics'
import Chat from './pages/Chat'
import Settings from './pages/Settings'
import Lab from './pages/Lab'
import EvolutionOverlay from './components/EvolutionOverlay'
import { evaluateDays, initEvolution } from './lib/evolution'
import { checkAchievements } from './lib/achievements'
import { useLiveQuery } from 'dexie-react-hooks'
import { syncNativeReminders } from './native/notifications'
import { db, uid } from './db/schema'
import { askKody } from './ai/gemini'
import { speak } from './voice/speech'

const TABS = [
  { to: '/', label: 'Hoy', icon: Sun },
  { to: '/tareas', label: 'Tareas', icon: ListChecks },
  { to: '/kody', label: 'Kody', icon: MessageCircle },
  { to: '/proyectos', label: 'Proyectos', icon: FolderKanban },
  { to: '/mas', label: 'Más', icon: Grid2x2 },
]

export default function App() {
  const prefs = usePrefs()
  const loc = useLocation()
  const nav = useNavigate()
  const ROOTS = ['/', '/tareas', '/kody', '/proyectos', '/mas']
  const isSub = !ROOTS.includes(loc.pathname)
  const goBack = () => (window.history.state?.idx > 0 ? nav(-1) : nav(loc.pathname.startsWith('/tareas') ? '/tareas' : loc.pathname.startsWith('/proyectos') ? '/proyectos' : '/mas'))

  useEffect(() => {
    applyTheme(resolveTheme(prefs), prefs)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify({ ...prefs, xp: 0, geminiKey: '', userName: '', capacity: 0, capacityOverrides: 0 })])

  // Recordatorios del calendario como notificaciones del sistema (solo app Android)
  const allEvents = useLiveQuery(() => db.events.toArray(), [])
  useEffect(() => { if (allEvents) void syncNativeReminders(allEvents) }, [allEvents])

  // Evolución de Kody: migra el XP existente y cierra los días pasados (deterioro)
  useEffect(() => {
    const run = () => initEvolution().then(evaluateDays).then(checkAchievements)
    run()
    const i = setInterval(run, 60_000)
    const vis = () => document.visibilityState === 'visible' && run()
    document.addEventListener('visibilitychange', vis)
    return () => { clearInterval(i); document.removeEventListener('visibilitychange', vis) }
  }, [])

  // Reloj de la app: enfoque + recordatorios
  useEffect(() => {
    const i = setInterval(() => { useFocus.getState().tick(); checkReminders() }, 1000 * 5)
    checkReminders()
    return () => clearInterval(i)
  }, [])

  // Escucha continua de "Kody" (opcional, con la app abierta)
  useEffect(() => {
    if (!prefs.wake) return
    const problem = voiceProblem()
    if (problem) { useKody.getState().react('alert', problem, 7000); return }
    const stop = startWake(async (cmd) => {
      const k = useKody.getState()
      k.setBase('thinking')
      await db.chatMessages.add({ id: uid(), role: 'user', text: cmd, createdAt: Date.now() })
      try {
        const history = (await db.chatMessages.orderBy('createdAt').toArray()).map((m) => ({ role: m.role, text: m.text }))
        const ans = await askKody(history, prefs)
        await db.chatMessages.add({ id: uid(), role: 'model', text: ans, createdAt: Date.now() })
        k.setBase('idle'); k.react('talking', ans.slice(0, 90), 5000); speak(ans)
      } catch (e) { k.setBase('idle'); k.react('alert', (e as Error).message, 5000) }
    }, (armed) => useKody.getState().setBase(armed ? 'listening' : 'idle'), (m) => useKody.getState().react('alert', m, 6000))
    return stop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefs.wake])

  return (
    <>
      <div className={`bg ${prefs.animatedBg ? 'animated' : ''}`}><i /><i /><i /></div>
      <div className={`app ${isSub ? 'with-back' : ''}`}>
        {isSub && <div className="topbar"><button className="back glass" onClick={goBack} aria-label="Atrás"><ArrowLeft size={20} /></button></div>}
        <Routes>
          <Route path="/" element={<Today />} />
          <Route path="/tareas" element={<Tasks />} />
          <Route path="/tareas/:id" element={<TaskDetail />} />
          <Route path="/proyectos" element={<Projects />} />
          <Route path="/proyectos/:id" element={<ProjectDetail />} />
          <Route path="/kody" element={<Chat />} />
          <Route path="/mas" element={<More />} />
          <Route path="/rutinas" element={<Routines />} />
          <Route path="/habitos" element={<Habits />} />
          <Route path="/calendario" element={<Calendar />} />
          <Route path="/enfoque" element={<Focus />} />
          <Route path="/analiticas" element={<Analytics />} />
          <Route path="/ajustes" element={<Settings />} />
          <Route path="/lab" element={<Lab />} />
        </Routes>
        <EvolutionOverlay />
        <nav className="tabbar glass">
          {TABS.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `tab ${isActive || (to === '/mas' && isSub && !/^\/(tareas|proyectos)/.test(loc.pathname)) ? 'active' : ''}`}>
              <Icon size={21} />{label}
            </NavLink>
          ))}
        </nav>
      </div>
    </>
  )
}

function More() {
  const prefs = usePrefs()
  const items = [
    { to: '/calendario', label: 'Calendario', sub: 'Eventos y recordatorios', icon: CalendarDays },
    { to: '/rutinas', label: 'Rutinas', sub: 'Tu día a día', icon: Repeat },
    { to: '/habitos', label: 'Hábitos', sub: 'Rachas y constancia', icon: Flame },
    { to: '/enfoque', label: 'Enfoque', sub: 'Pomodoro por tarea', icon: Timer },
    { to: '/analiticas', label: 'Analíticas', sub: 'Tu rendimiento', icon: BarChart3 },
    { to: '/ajustes', label: 'Ajustes', sub: 'Temas y respaldo', icon: Cog },
  ]
  return (
    <main className="page">
      <h1>Más</h1>
      <p className="sub">Todo Kody, conectado.</p>
      <div className="grid2">
        {items.map(({ to, label, sub, icon: Icon }) => (
          <NavLink key={to} to={to} className="glass card" style={{ textDecoration: 'none', color: 'inherit', margin: 0 }}>
            <Icon size={26} style={{ color: 'var(--a1)', marginBottom: 14 }} />
            <h3>{label}</h3><div className="small muted">{sub}</div>
          </NavLink>
        ))}
      </div>
      <label className="glass card row" style={{ marginTop: 14 }}>
        <div className="grow"><h3>Escuchar "Kody"</h3><div className="small muted">Di "Kody, …" con la app abierta</div></div>
        <input type="checkbox" checked={prefs.wake} onChange={(e) => setPref('wake', e.target.checked)} />
      </label>
    </main>
  )
}
