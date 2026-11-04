/* eslint-disable @typescript-eslint/no-explicit-any */
import { getPrefs, type Prefs } from '../db/settings'
import { useKody } from '../mascot/store'
import { geminiSpeak, stopGeminiAudio } from './geminiTts'
import { device, isNative } from '../native/device'
const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
export const speechSupported = !!SR

/** Motivo por el que la voz no puede funcionar aquí (o null si todo bien). */
export function voiceProblem(): string | null {
  if (isNative) return null // en la app Android se usa el reconocedor nativo
  if (!window.isSecureContext)
    return 'El micrófono solo funciona con HTTPS. Abre Kody desde su dirección https:// (no desde http://IP).'
  if (!SR) return 'Este navegador no soporta dictado por voz. Usa Chrome en Android.'
  return null
}

/** Pide permiso de micrófono de forma explícita. Devuelve un mensaje si falla. */
export async function ensureMic(): Promise<string | null> {
  if (isNative) return null // el plugin pide el permiso al empezar
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    stream.getTracks().forEach((t) => t.stop())
    return null
  } catch (e) {
    return (e as Error).name === 'NotAllowedError'
      ? 'Permiso de micrófono denegado. Actívalo en los ajustes del sitio (candado junto a la dirección).'
      : 'No se pudo acceder al micrófono.'
  }
}

const ERRORS: Record<string, string> = {
  'not-allowed': 'Permiso de micrófono denegado.',
  'service-not-allowed': 'El navegador bloqueó el reconocimiento de voz.',
  'no-speech': 'No te escuché. Intenta de nuevo.',
  network: 'Sin conexión: el reconocimiento de voz de Chrome necesita internet.',
  'audio-capture': 'No encuentro un micrófono.',
}

interface OnceHandlers {
  onInterim?: (t: string) => void
  onFinal: (t: string) => void
  onError?: (msg: string) => void
  onEnd?: () => void
}

/** Dictado de una sola frase con texto parcial. Devuelve función para cancelar. */
export function listenOnce(h: OnceHandlers): () => void {
  if (isNative) return listenNative(h)
  const r = new SR()
  r.lang = 'es-MX'
  r.interimResults = true
  r.maxAlternatives = 1
  let finalText = ''
  r.onresult = (e: any) => {
    let interim = ''
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const t = e.results[i][0].transcript
      if (e.results[i].isFinal) finalText += t
      else interim += t
    }
    if (interim) h.onInterim?.(finalText + interim)
  }
  r.onerror = (e: any) => { if (e.error !== 'aborted') h.onError?.(ERRORS[e.error] ?? `Error de voz (${e.error})`) }
  r.onend = () => { if (finalText.trim()) h.onFinal(finalText.trim()); h.onEnd?.() }
  try { r.start() } catch { h.onEnd?.() }
  return () => { try { r.stop() } catch { /* nada */ } }
}

/** Escucha continua: al oír "Kody" captura la orden (misma frase o la siguiente). */
export function startWake(onCommand: (t: string) => void, onArmed: (armed: boolean) => void, onError?: (msg: string) => void): () => void {
  if (isNative) {
    onError?.('La escucha continua de "Kody" solo funciona en el navegador. En la app usa el botón del micrófono.')
    return () => {}
  }
  let active = true
  let armed = false
  let r: any
  const boot = () => {
    if (!active) return
    r = new SR()
    r.lang = 'es-MX'
    r.continuous = true
    r.interimResults = false
    r.onresult = (e: any) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (!e.results[i].isFinal) continue
        const text: string = e.results[i][0].transcript.trim()
        const m = text.toLowerCase().match(/\b(kody|cody|kodi|codi|koddy|cogi)\b[\s,.:]*/)
        if (m) {
          const cmd = text.slice((m.index ?? 0) + m[0].length).trim()
          if (cmd) { armed = false; onArmed(false); onCommand(cmd) } else { armed = true; onArmed(true) }
        } else if (armed) { armed = false; onArmed(false); onCommand(text) }
      }
    }
    r.onerror = (e: any) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { active = false; onError?.(ERRORS[e.error]) }
      else if (e.error === 'network' || e.error === 'audio-capture') onError?.(ERRORS[e.error])
    }
    r.onend = () => { if (active) setTimeout(boot, 400) } // Chrome corta la escucha continua cada ~1 min
    try { r.start() } catch { /* ya iniciado */ }
  }
  boot()
  return () => { active = false; try { r?.abort() } catch { /* nada */ } }
}

/** Voces en español del dispositivo (las de red de Google suenan mucho mejor que las locales). */
export function listDeviceVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) return resolve([])
    const pick = () => speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('es'))
    const now = pick()
    if (now.length) return resolve(now)
    const done = () => resolve(pick())
    speechSynthesis.addEventListener('voiceschanged', done, { once: true })
    setTimeout(done, 1500)
  })
}

function bestVoice(voices: SpeechSynthesisVoice[], wanted: string) {
  return (
    voices.find((v) => v.voiceURI === wanted) ??
    voices.find((v) => /google/i.test(v.name) && /es-(mx|us)/i.test(v.lang)) ??
    voices.find((v) => /google/i.test(v.name)) ??
    voices.find((v) => !v.localService) ??
    voices.find((v) => /es-(mx|us)/i.test(v.lang)) ??
    voices[0]
  )
}

async function deviceSpeak(text: string, prefs: Pick<Prefs, 'voiceName' | 'voiceRate' | 'voicePitch'>): Promise<void> {
  if (!('speechSynthesis' in window)) return
  const voices = await listDeviceVoices()
  speechSynthesis.cancel()
  await new Promise<void>((resolve) => {
    const u = new SpeechSynthesisUtterance(text)
    const v = bestVoice(voices, prefs.voiceName)
    if (v) { u.voice = v; u.lang = v.lang } else u.lang = 'es-MX'
    u.rate = prefs.voiceRate
    u.pitch = prefs.voicePitch
    u.onend = () => resolve()
    u.onerror = () => resolve()
    speechSynthesis.speak(u)
  })
}

export function stopSpeaking() {
  stopGeminiAudio()
  if ('speechSynthesis' in window) speechSynthesis.cancel()
}

const clean = (t: string) => t.replace(/[*_`#>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 500)

/** Hace hablar a Kody con la voz elegida en Ajustes. Si la de Gemini falla, usa la del dispositivo. */
export async function speak(text: string, override?: Partial<Prefs>): Promise<void> {
  const prefs = { ...(await getPrefs()), ...override }
  const t = clean(text)
  if (!t) return
  stopSpeaking()
  const kody = useKody.getState()
  kody.setBase('talking')
  try {
    if (prefs.voiceEngine === 'gemini' && prefs.geminiKey) {
      try { await geminiSpeak(t, prefs); return } catch { /* respaldo: voz del dispositivo */ }
    }
    await deviceSpeak(t, prefs)
  } finally {
    kody.setBase('idle')
  }
}

/** Para el botón "Escuchar muestra": informa del error en vez de ocultarlo. */
export async function previewVoice(prefs: Prefs): Promise<void> {
  const t = 'Hola, soy Kody. Hoy vamos a lograr mucho juntos.'
  stopSpeaking()
  if (prefs.voiceEngine === 'gemini') return geminiSpeak(t, prefs)
  await deviceSpeak(t, prefs)
}

/** Dictado con el reconocedor de voz de Android (el WebView no trae Web Speech API). */
function listenNative(h: OnceHandlers): () => void {
  let finalText = ''
  let done = false
  const handles: { remove: () => Promise<void> }[] = []
  const finish = () => {
    if (done) return
    done = true
    handles.forEach((x) => x.remove())
    if (finalText.trim()) h.onFinal(finalText.trim())
    h.onEnd?.()
  }
  const NATIVE_ERRORS: Record<string, string> = {
    'no-speech': 'No te escuché. Intenta de nuevo.',
    network: 'Sin conexión para reconocer la voz.',
    'audio-capture': 'No encuentro un micrófono.',
    'not-allowed': 'Permiso de micrófono denegado. Actívalo en los ajustes de Android.',
    busy: 'El reconocedor de voz está ocupado. Intenta otra vez.',
  }
  ;(async () => {
    handles.push((await device.on('speechPartial', (d) => d.text && h.onInterim?.(d.text)))!)
    handles.push((await device.on('speechResult', (d) => { finalText = d.text ?? ''; finish() }))!)
    handles.push((await device.on('speechError', (d) => { h.onError?.(NATIVE_ERRORS[d.error ?? ''] ?? `Error de voz (${d.error})`); finish() }))!)
    try {
      await device.startListening('es-MX')
    } catch (e) {
      const m = (e as Error).message
      h.onError?.(m === 'NO_PERMISSION' ? NATIVE_ERRORS['not-allowed'] : m === 'NO_RECOGNIZER' ? 'Este teléfono no tiene un servicio de reconocimiento de voz (instala o activa "Google").' : m)
      finish()
    }
  })()
  return () => { void device.stopListening() }
}
