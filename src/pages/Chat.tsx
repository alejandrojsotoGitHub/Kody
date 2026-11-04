import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Mic, Send, Volume2, VolumeX } from 'lucide-react'
import Mascot from '../mascot/Mascot'
import { useKody } from '../mascot/store'
import { db, uid } from '../db/schema'
import { setPref, usePrefs } from '../db/settings'
import { askKody } from '../ai/gemini'
import { ensureMic, listenOnce, speak, voiceProblem } from '../voice/speech'

export default function Chat() {
  const prefs = usePrefs()
  const msgs = useLiveQuery(() => db.chatMessages.orderBy('createdAt').toArray(), [], [])
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [mic, setMic] = useState(false)
  const bottom = useRef<HTMLDivElement>(null)
  const stopRef = useRef<() => void>(undefined)
  const busyRef = useRef(false)
  const [note, setNote] = useState('')
  const flash = (m: string) => { setNote(m); setTimeout(() => setNote(''), 4500) }
  const { setBase, react } = useKody()

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs.length, busy])
  useEffect(() => () => setBase('idle'), [setBase])

  const send = async (raw: string) => {
    const t = raw.trim()
    if (!t || busy) return
    setText('')
    await db.chatMessages.add({ id: uid(), role: 'user', text: t, createdAt: Date.now() })
    setBusy(true); busyRef.current = true; setBase('thinking')
    try {
      const history = (await db.chatMessages.orderBy('createdAt').toArray()).map((m) => ({ role: m.role, text: m.text }))
      const answer = await askKody(history, prefs)
      await db.chatMessages.add({ id: uid(), role: 'model', text: answer, createdAt: Date.now() })
      setBase('idle')
      if (prefs.speak) speak(answer)
      else react('talking', '', Math.min(4000, 800 + answer.length * 30))
    } catch (e) {
      await db.chatMessages.add({ id: uid(), role: 'model', text: `⚠️ ${(e as Error).message}`, createdAt: Date.now() })
      setBase('idle'); react('alert', '', 2500)
    }
    setBusy(false); busyRef.current = false
  }

  const dictate = async () => {
    if (mic) { stopRef.current?.(); return }
    const prob = voiceProblem()
    if (prob) return flash(prob)
    const micErr = await ensureMic()
    if (micErr) return flash(micErr)
    setMic(true); setBase('listening')
    stopRef.current = listenOnce({
      onInterim: (t) => setText(t),
      onFinal: (t) => { setText(''); send(t) },
      onError: flash,
      onEnd: () => { setMic(false); if (!busyRef.current) setBase('idle') },
    })
  }

  return (
    <main className="page" style={{ paddingBottom: 190 }}>
      {note && <div className="toast glass">{note}</div>}
      <div className="row">
        <div className="grow"><h1>Kody</h1><p className="sub" style={{ margin: 0 }}>Pídeme lo que sea. Yo lo creo por ti.</p></div>
        <button className="icon-btn" onClick={() => setPref('speak', !prefs.speak)} aria-label="Voz">{prefs.speak ? <Volume2 size={16} /> : <VolumeX size={16} />}</button>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', margin: '30px 0 14px' }}><Mascot size={120} /></div>
      <div className="msgs">
        {msgs.length === 0 && (
          <div className="glass card empty">
            Prueba: "Crea una tarea para estudiar cálculo mañana" · "Hazme una rutina de noche" · "¿Qué tengo pendiente?"
            {!prefs.geminiKey && <><br /><br />Primero pega tu API key de Gemini en Ajustes.</>}
          </div>
        )}
        {msgs.map((m) => <div key={m.id} className={`msg glass ${m.role}`}>{m.text}</div>)}
        {busy && <div className="msg glass model muted">Kody está pensando…</div>}
        <div ref={bottom} />
      </div>
      <div className="composer glass">
        <input className="input" placeholder="Escribe a Kody…" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send(text)} />
        <button className={`icon-btn ${mic ? 'mic-on' : ''}`} style={{ width: 42, height: 42 }} onClick={dictate} aria-label="Dictar"><Mic size={18} /></button>
        <button className="icon-btn" style={{ width: 42, height: 42, background: 'var(--grad)', color: '#060818' }} onClick={() => send(text)} aria-label="Enviar"><Send size={18} /></button>
      </div>
    </main>
  )
}
