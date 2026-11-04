import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import Mascot from '../mascot/Mascot'
import World from '../world/World'
import { sceneTitles } from '../world/scenes'
import { stageNames } from '../lib/evolution'
import { DEFAULT_PREFS } from '../db/settings'
import { THEMES, applyTheme, resolveTheme } from '../theme/themes'

/** Pantalla interna de revisión visual: todas las etapas de un tema (/#/lab?theme=stark). */
export default function Lab() {
  const [params] = useSearchParams()
  const id = params.get('theme') ?? 'aurora'
  const t = resolveTheme({ ...DEFAULT_PREFS, theme: id })

  // La app aplica el tema guardado; aquí lo forzamos periódicamente solo para revisar.
  useEffect(() => {
    const i = setInterval(() => applyTheme(t, DEFAULT_PREFS), 250)
    return () => clearInterval(i)
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const only = params.get('only')
  const stages = only ? [Number(only)] : [0, 1, 2, 3, 4, 5]
  return (
    <main className="page" style={{ maxWidth: 720 }}>
      <h1>{t.name}</h1>
      <p className="sub">{THEMES.length} temas · etapas de Kody y su entorno</p>
      <div className="grid2" style={{ gap: 8, marginBottom: 14 }}>
        {stages.map((s) => (
          <div key={s} className="glass card" style={{ margin: 0, padding: 8, textAlign: 'center' }}>
            <Mascot size={96} bubble={false} stage={s} health={100} skin={t.skin} />
            <div className="small">{s + 1}. {stageNames(t.id)[s]}</div>
          </div>
        ))}
      </div>
      <h2>Deterioro (etapa 4)</h2>
      <div className="grid2" style={{ gap: 8, marginBottom: 14 }}>
        {[100, 55, 30, 10].map((h) => (
          <div key={h} className="glass card" style={{ margin: 0, padding: 8, textAlign: 'center' }}>
            <Mascot size={96} bubble={false} stage={3} health={h} skin={t.skin} />
            <div className="small">salud {h}%</div>
          </div>
        ))}
      </div>
      <h2>Entornos</h2>
      {stages.map((s) => (
        <div key={s} style={{ marginBottom: 14 }}>
          <div className="small muted" style={{ marginBottom: 4 }}>{s + 1}. {sceneTitles(t.id)[s]}</div>
          <World themeId={t.id} stage={s} skin={t.skin} />
        </div>
      ))}
    </main>
  )
}
