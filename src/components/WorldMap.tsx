import { useState } from 'react'
import { Lock } from 'lucide-react'
import World from '../world/World'
import { sceneTitles } from '../world/scenes'
import { THRESHOLDS, stageNames, useEvolution } from '../lib/evolution'

/** Mapa del mundo de Kody: la escena actual y el camino de 6 etapas. */
export default function WorldMap() {
  const e = useEvolution()
  const [sel, setSel] = useState<number | null>(null)
  const view = sel ?? e.stage
  const locked = view > e.maxStage
  const names = stageNames(e.themeId)
  const titles = sceneTitles(e.themeId)

  return (
    <div className="stack">
      <div style={{ position: 'relative' }}>
        <World themeId={e.themeId} stage={view} health={view === e.stage ? e.health : 100} locked={locked} />
        {locked && (
          <div className="world-lock"><Lock size={26} /><b>Bloqueado</b><span className="small">Faltan {THRESHOLDS[view] - e.growth} puntos de crecimiento</span></div>
        )}
      </div>
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <div className="grow">
          <div className="kicker">Etapa {view + 1} de 6{view === e.stage ? ' · actual' : ''}</div>
          <h3>{names[view]}</h3>
          <div className="small muted">{titles[view]}</div>
        </div>
        {sel !== null && sel !== e.stage && <button className="btn sm" onClick={() => setSel(null)}>Volver a la actual</button>}
      </div>

      <div className="path">
        {names.map((n, i) => {
          const open = i <= e.maxStage
          return (
            <button key={n} className={`node ${open ? 'open' : ''} ${i === e.stage ? 'cur' : ''} ${i === view ? 'sel' : ''}`} onClick={() => setSel(i === e.stage ? null : i)} aria-label={`Etapa ${i + 1}: ${n}`}>
              <span className="bubble">{open ? i + 1 : <Lock size={12} />}</span>
              <span className="lbl">{titles[i]}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
