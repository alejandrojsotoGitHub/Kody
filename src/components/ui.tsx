import { useState, type ReactNode } from 'react'
import { Check, X } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Project } from '../db/schema'
import { DAY_LABELS } from '../lib/dates'

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null
  return (
    <div className="sheet-bg" onClick={onClose}>
      <div className="sheet glass" onClick={(e) => e.stopPropagation()}>
        <div className="row" style={{ marginBottom: 14 }}>
          <b className="grow" style={{ fontSize: 18 }}>{title}</b>
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function CheckCircle({ on, onClick, color }: { on: boolean; onClick: () => void; color?: string }) {
  return (
    <button className={`check ${on ? 'on' : ''}`} onClick={onClick} style={on && color ? { background: color, borderColor: color } : undefined} aria-label="Completar">
      {on && <Check size={14} strokeWidth={3} />}
    </button>
  )
}

export function ProjectSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const projects = useLiveQuery(() => db.projects.toArray(), [], [] as Project[])
  return (
    <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Sin proyecto</option>
      {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
    </select>
  )
}

export function DaysPicker({ value, onChange }: { value: number[]; onChange: (v: number[]) => void }) {
  return (
    <div className="days">
      {DAY_LABELS.map((l, i) => (
        <button key={i} type="button" className={value.includes(i) ? 'on' : ''}
          onClick={() => onChange(value.includes(i) ? value.filter((d) => d !== i) : [...value, i])}>{l}</button>
      ))}
    </div>
  )
}

export function ProjectDot({ project }: { project?: Project }) {
  if (!project) return null
  return <span className="chip" style={{ color: project.color }}><span className="dot" style={{ background: project.color }} />{project.name}</span>
}

export function Ring({ pct, size = 96, label }: { pct: number; size?: number; label?: string }) {
  const r = size / 2 - 9, c = 2 * Math.PI * r
  const id = `rg${size}`
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="var(--a1)" /><stop offset="1" stopColor="var(--a2)" /></linearGradient></defs>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--track)" strokeWidth="9" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#${id})`} strokeWidth="9" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(pct, 100) / 100)} transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset .7s cubic-bezier(.2,.8,.2,1)' }} />
      <text x="50%" y="50%" dy=".35em" textAnchor="middle" style={{ fill: 'var(--text)', fontWeight: 700, fontSize: size * 0.22, fontFamily: 'var(--display)' }}>{label ?? `${pct}%`}</text>
    </svg>
  )
}

export function useToggle(initial = false) {
  const [v, setV] = useState(initial)
  return [v, () => setV((x) => !x), setV] as const
}

export function LoadBar({ load, cap }: { load: number; cap: number }) {
  const over = load > cap
  const pct = cap > 0 ? Math.min(100, Math.round((load / cap) * 100)) : load > 0 ? 100 : 0
  const fmt = (m: number) => (m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} m` : ''}` : `${m} min`)
  return (
    <div>
      <div className={`load ${over ? 'over' : ''}`}><div style={{ width: `${pct}%` }} /></div>
      <div className="row small" style={{ marginTop: 6 }}>
        <span className="grow muted">{fmt(load)} de trabajo · {fmt(cap)} disponibles</span>
        <span style={{ color: over ? 'var(--danger)' : 'var(--ok)', fontWeight: 600 }}>{over ? `+${fmt(load - cap)} de más` : `${fmt(cap - load)} libres`}</span>
      </div>
    </div>
  )
}
