import { useEffect } from 'react'
import Mascot from '../mascot/Mascot'
import { useKody } from '../mascot/store'
import { usePrefs, setPref } from '../db/settings'
import { resolveTheme } from '../theme/themes'
import { stageNames } from '../lib/evolution'
import { sceneTitles } from '../world/scenes'

/** Celebración a pantalla completa cuando Kody evoluciona. */
export default function EvolutionOverlay() {
  const stage = useKody((s) => s.evolved)
  const dismiss = useKody((s) => s.dismissEvolved)
  const prefs = usePrefs()
  const theme = resolveTheme(prefs)

  useEffect(() => {
    if (stage !== null) navigator.vibrate?.([120, 60, 120, 60, 240])
  }, [stage])

  if (stage === null) return null
  const close = () => { setPref('evolveSeen', stage); dismiss() }
  return (
    <div className="evo-bg" onClick={close}>
      <div className="evo-card glass" onClick={(e) => e.stopPropagation()}>
        <div className="kicker">¡Kody evolucionó!</div>
        <div style={{ display: 'flex', justifyContent: 'center', margin: '34px 0 4px' }}><Mascot size={170} bubble={false} stage={stage} health={100} skin={theme.skin} /></div>
        <h1 className="grad-text" style={{ fontSize: 28 }}>{stageNames(theme.id)[stage]}</h1>
        <p className="sub" style={{ marginBottom: 18 }}>Nuevo entorno desbloqueado: {sceneTitles(theme.id)[stage]}</p>
        <button className="btn primary full" onClick={close}>¡Genial!</button>
      </div>
    </div>
  )
}
