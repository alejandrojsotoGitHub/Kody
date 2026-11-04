import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/schema'
import { ACHIEVEMENTS, buildCtx } from '../lib/achievements'

export default function Achievements() {
  const have = useLiveQuery(async () => ((await db.settings.get('achievements'))?.value ?? {}) as Record<string, number>, [], {} as Record<string, number>)
  const ctx = useLiveQuery(() => buildCtx(), [])
  const total = Object.keys(have).length

  return (
    <div>
      <div className="small muted" style={{ marginBottom: 10 }}>{total} de {ACHIEVEMENTS.length} desbloqueados</div>
      <div className="badges">
        {ACHIEVEMENTS.map((a) => {
          const got = !!have[a.id]
          const pr = !got && ctx && a.progress ? a.progress(ctx) : null
          return (
            <div key={a.id} className={`badge ${got ? 'got' : ''}`} title={a.desc}>
              <div className="ico">{got ? a.icon : '🔒'}</div>
              <b>{a.name}</b>
              <span className="small muted">{a.desc}</span>
              {pr && <div className="pbar" style={{ height: 4, marginTop: 6 }}><div style={{ width: `${(pr[0] / pr[1]) * 100}%` }} /></div>}
              {got && <span className="mono small" style={{ color: 'var(--a1)' }}>+{a.xp} XP</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
