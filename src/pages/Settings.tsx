import { useEffect, useRef, useState } from 'react'
import { Download, Trash2, Upload } from 'lucide-react'
import { exportToFile, importFromFile, wipeAll } from '../db/backup'
import { setPref, usePrefs } from '../db/settings'
import { THEMES } from '../theme/themes'
import { listDeviceVoices, previewVoice, stopSpeaking, voiceProblem } from '../voice/speech'
import { GEMINI_VOICES } from '../voice/geminiTts'
import { GEMINI_MODELS, testGemini } from '../ai/gemini'
import Mascot, { SKINS } from '../mascot/Mascot'
import PhoneSettings from '../components/PhoneSettings'

export default function Settings() {
  const prefs = usePrefs()
  const fileRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<'fusionar' | 'reemplazar'>('fusionar')
  const [withSecrets, setWithSecrets] = useState(false)
  const [msg, setMsg] = useState('')
  const [devVoices, setDevVoices] = useState<SpeechSynthesisVoice[]>([])
  useEffect(() => { listDeviceVoices().then(setDevVoices) }, [])
  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3500) }

  const onImport = async (f?: File) => {
    if (!f) return
    if (mode === 'reemplazar' && !confirm('Esto reemplazará TODOS tus datos actuales. ¿Continuar?')) return
    try {
      const c = await importFromFile(f, mode)
      flash(`Importado: ${Object.values(c).reduce((a, b) => a + b, 0)} registros`)
    } catch (e) { flash((e as Error).message) }
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <main className="page">
      {msg && <div className="toast glass">{msg}</div>}
      <h1>Ajustes</h1>
      <p className="sub">Haz que Kody se vea y se comporte como tú quieres.</p>

      <div className="glass card">
        <h2>Tema</h2>
        <div className="theme-grid">
          {THEMES.map((t) => (
            <button key={t.id} className={`theme-card ${prefs.theme === t.id ? 'on' : ''}`} onClick={() => setPref('theme', t.id)}>
              <div className="sw" style={{ background: `radial-gradient(90% 120% at 15% 0%, ${t.blobs[0]}, transparent 60%), radial-gradient(90% 120% at 100% 100%, ${t.blobs[1]}, transparent 60%), ${t.bg1}` }} />
              <div className="nm">{t.name}</div>
            </button>
          ))}
          <button className={`theme-card ${prefs.theme === 'custom' ? 'on' : ''}`} onClick={() => setPref('theme', 'custom')}>
            <div className="sw" style={{ background: `linear-gradient(135deg, ${prefs.customA}, ${prefs.customB})` }} />
            <div className="nm">Personalizado</div>
          </button>
        </div>
        {prefs.theme === 'custom' && (
          <div className="stack" style={{ marginTop: 14 }}>
            <div className="row">
              <span className="grow small muted">Color 1</span><input type="color" value={prefs.customA} onChange={(e) => setPref('customA', e.target.value)} />
              <span className="grow small muted" style={{ textAlign: 'right' }}>Color 2</span><input type="color" value={prefs.customB} onChange={(e) => setPref('customB', e.target.value)} />
            </div>
            <div className="seg">
              <button className={prefs.customMode === 'dark' ? 'on' : ''} onClick={() => setPref('customMode', 'dark')}>Oscuro</button>
              <button className={prefs.customMode === 'light' ? 'on' : ''} onClick={() => setPref('customMode', 'light')}>Claro</button>
            </div>
          </div>
        )}
      </div>

      <div className="glass card stack">
        <h2>Colores y orientación</h2>
        <div className="row">
          <span className="grow small muted">Cambiar colores del tema actual</span>
          <input type="color" value={prefs.overrideA || '#5eead4'} onChange={(e) => setPref('overrideA', e.target.value)} />
          <input type="color" value={prefs.overrideB || '#a78bfa'} onChange={(e) => setPref('overrideB', e.target.value)} />
          {(prefs.overrideA || prefs.overrideB) && <button className="btn sm" onClick={() => { setPref('overrideA', ''); setPref('overrideB', '') }}>Restablecer</button>}
        </div>
        <div><div className="row small muted"><span className="grow">Dirección del degradado</span>{prefs.angle}°</div>
          <input type="range" min={0} max={360} value={prefs.angle} onChange={(e) => setPref('angle', Number(e.target.value))} style={{ width: '100%' }} />
          <div style={{ height: 10, borderRadius: 10, background: 'var(--grad)', marginTop: 6 }} /></div>
        <div>
          <div className="small muted" style={{ marginBottom: 6 }}>De dónde viene la luz del cristal</div>
          <div className="seg">
            {([['tl', '↖ Arriba izq.'], ['tr', '↗ Arriba der.'], ['bl', '↙ Abajo izq.'], ['br', '↘ Abajo der.']] as const).map(([k, l]) => <button key={k} className={prefs.light === k ? 'on' : ''} onClick={() => setPref('light', k)}>{l}</button>)}
          </div>
        </div>
        <div>
          <div className="small muted" style={{ marginBottom: 6 }}>Barra de navegación</div>
          <div className="seg">
            <button className={prefs.tabs === 'bottom' ? 'on' : ''} onClick={() => setPref('tabs', 'bottom')}>Abajo</button>
            <button className={prefs.tabs === 'top' ? 'on' : ''} onClick={() => setPref('tabs', 'top')}>Arriba</button>
          </div>
        </div>
      </div>

      <div className="glass card stack">
        <h2>Cristal y forma</h2>
        <div><div className="row small muted"><span className="grow">Desenfoque</span>{prefs.blur}px</div>
          <input type="range" min={0} max={60} value={prefs.blur} onChange={(e) => setPref('blur', Number(e.target.value))} style={{ width: '100%' }} /></div>
        <div><div className="row small muted"><span className="grow">Opacidad</span>{Math.round(prefs.glass * 100)}%</div>
          <input type="range" min={3} max={30} value={Math.round(prefs.glass * 100)} onChange={(e) => setPref('glass', Number(e.target.value) / 100)} style={{ width: '100%' }} /></div>
        <div><div className="row small muted"><span className="grow">Redondez</span>{prefs.radius}px</div>
          <input type="range" min={8} max={40} value={prefs.radius} onChange={(e) => setPref('radius', Number(e.target.value))} style={{ width: '100%' }} /></div>
        <div><div className="row small muted"><span className="grow">Intensidad de luces</span>{Math.round(prefs.glow * 100)}%</div>
          <input type="range" min={5} max={90} value={Math.round(prefs.glow * 100)} onChange={(e) => setPref('glow', Number(e.target.value) / 100)} style={{ width: '100%' }} /></div>
        <div className="seg">
          {([['tech', 'Tecnológica'], ['clean', 'Limpia'], ['mono', 'Código']] as const).map(([k, l]) => <button key={k} className={prefs.font === k ? 'on' : ''} onClick={() => setPref('font', k)}>{l}</button>)}
        </div>
        <div className="seg">
          <button className={prefs.density === 'comfy' ? 'on' : ''} onClick={() => setPref('density', 'comfy')}>Cómodo</button>
          <button className={prefs.density === 'compact' ? 'on' : ''} onClick={() => setPref('density', 'compact')}>Compacto</button>
        </div>
        <label className="row small"><input type="checkbox" checked={prefs.animatedBg} onChange={(e) => setPref('animatedBg', e.target.checked)} /> Fondo animado</label>
      </div>

      <div className="glass card stack">
        <h2>Aspecto de Kody</h2>
        <div style={{ display: 'flex', justifyContent: 'center', margin: '24px 0 4px' }}><Mascot size={130} bubble={false} /></div>
        <div className="row wrap" style={{ gap: 6 }}>
          <button className={`chip btn-like ${prefs.mascotSkin === 'auto' ? 'active' : ''}`} onClick={() => setPref('mascotSkin', 'auto')}>Según el tema</button>
          {Object.entries(SKINS).map(([id, sk]) => <button key={id} className={`chip btn-like ${prefs.mascotSkin === id ? 'active' : ''}`} onClick={() => setPref('mascotSkin', id)}>{sk.label}</button>)}
        </div>
      </div>

      <div className="glass card stack">
        <h2>Perfil y Kody</h2>
        <input className="input" placeholder="Tu nombre" value={prefs.userName} onChange={(e) => setPref('userName', e.target.value)} />
        <div className="seg">
          {(['amigable', 'formal', 'jarvis'] as const).map((t) => <button key={t} className={prefs.tone === t ? 'on' : ''} onClick={() => setPref('tone', t)}>{t === 'jarvis' ? 'Jarvis' : t[0].toUpperCase() + t.slice(1)}</button>)}
        </div>
        <label className="row small"><input type="checkbox" checked={prefs.speak} onChange={(e) => setPref('speak', e.target.checked)} /> Kody responde en voz alta</label>
        <div className="small muted">{voiceProblem() ?? 'Dictado por micrófono disponible en el chat.'}</div>
      </div>

      <div className="glass card stack">
        <h2>Voz de Kody</h2>
        <div className="seg">
          <button className={prefs.voiceEngine === 'gemini' ? 'on' : ''} onClick={() => setPref('voiceEngine', 'gemini')}>Natural (Gemini)</button>
          <button className={prefs.voiceEngine === 'dispositivo' ? 'on' : ''} onClick={() => setPref('voiceEngine', 'dispositivo')}>Del teléfono</button>
        </div>
        {prefs.voiceEngine === 'gemini' ? <>
          <select className="input" value={prefs.geminiVoice} onChange={(e) => setPref('geminiVoice', e.target.value)}>
            {GEMINI_VOICES.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select>
          <div className="small muted">Voces muy naturales. Necesitan internet y usan tu cuota gratuita de Gemini; si fallan, Kody usa la voz del teléfono.</div>
        </> : <>
          <select className="input" value={prefs.voiceName} onChange={(e) => setPref('voiceName', e.target.value)}>
            <option value="">Automática (la mejor disponible)</option>
            {devVoices.map((v) => <option key={v.voiceURI} value={v.voiceURI}>{v.name} · {v.lang}{v.localService ? '' : ' · red'}</option>)}
          </select>
          <div><div className="row small muted"><span className="grow">Velocidad</span>{prefs.voiceRate.toFixed(2)}x</div>
            <input type="range" min={60} max={140} value={Math.round(prefs.voiceRate * 100)} onChange={(e) => setPref('voiceRate', Number(e.target.value) / 100)} style={{ width: '100%' }} /></div>
          <div><div className="row small muted"><span className="grow">Tono</span>{prefs.voicePitch.toFixed(2)}</div>
            <input type="range" min={60} max={140} value={Math.round(prefs.voicePitch * 100)} onChange={(e) => setPref('voicePitch', Number(e.target.value) / 100)} style={{ width: '100%' }} /></div>
          {devVoices.length === 0 && <div className="small muted">Este dispositivo no expone voces en español; se usará la predeterminada.</div>}
        </>}
        <div className="row">
          <button className="btn grow" onClick={async () => { flash('Reproduciendo…'); try { await previewVoice(prefs); setMsg('') } catch (e) { flash(`⚠️ ${(e as Error).message}`) } }}>▶ Escuchar muestra</button>
          <button className="btn" onClick={stopSpeaking}>■</button>
        </div>
      </div>

      <PhoneSettings />

      <div className="glass card stack">
        <h2>IA · Gemini</h2>
        <input className="input" type="password" placeholder="API key de Google AI Studio" value={prefs.geminiKey} onChange={(e) => setPref('geminiKey', e.target.value.trim())} />
        <select className="input" value={prefs.geminiModel} onChange={(e) => setPref('geminiModel', e.target.value)}>
          {[...new Set([prefs.geminiModel, ...GEMINI_MODELS])].map((m) => <option key={m}>{m}</option>)}
        </select>
        <button className="btn full" onClick={async () => { flash('Probando…'); try { flash(`✅ Conectado con ${await testGemini(prefs)}`) } catch (e) { flash(`⚠️ ${(e as Error).message}`) } }}>Probar conexión</button>
        <div className="small muted">Gratis en aistudio.google.com. La key se guarda solo en este dispositivo.</div>
      </div>

      <div className="glass card">
        <h2>Datos · respaldo</h2>
        <p className="muted small" style={{ marginTop: 0 }}>Tus datos viven solo en este dispositivo. Exporta un respaldo para cambiar de teléfono sin perder nada.</p>
        <label className="row small" style={{ marginBottom: 12 }}><input type="checkbox" checked={withSecrets} onChange={(e) => setWithSecrets(e.target.checked)} /> Incluir API key en el respaldo</label>
        <button className="btn primary full" style={{ marginBottom: 14 }} onClick={() => exportToFile(withSecrets)}><Download size={16} style={{ verticalAlign: -3 }} /> Exportar datos</button>
        <select className="input" style={{ marginBottom: 10 }} value={mode} onChange={(e) => setMode(e.target.value as typeof mode)}>
          <option value="fusionar">Fusionar con lo actual</option><option value="reemplazar">Reemplazar todo</option>
        </select>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => onImport(e.target.files?.[0])} />
        <button className="btn full" onClick={() => fileRef.current?.click()}><Upload size={16} style={{ verticalAlign: -3 }} /> Importar respaldo</button>
      </div>

      <div className="glass card">
        <h2>Zona de peligro</h2>
        <button className="btn danger" onClick={async () => { if (confirm('¿Borrar TODOS los datos de Kody?')) { await wipeAll(); flash('Datos borrados') } }}><Trash2 size={16} style={{ verticalAlign: -3 }} /> Borrar todo</button>
      </div>
    </main>
  )
}
