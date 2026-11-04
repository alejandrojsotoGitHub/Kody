/* eslint-disable @typescript-eslint/no-explicit-any */
const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
export const speechSupported = !!SR

/** Motivo por el que la voz no puede funcionar aquí (o null si todo bien). */
export function voiceProblem(): string | null {
  if (!window.isSecureContext)
    return 'El micrófono solo funciona con HTTPS. Abre Kody desde su dirección https:// (no desde http://IP).'
  if (!SR) return 'Este navegador no soporta dictado por voz. Usa Chrome en Android.'
  return null
}

/** Pide permiso de micrófono de forma explícita. Devuelve un mensaje si falla. */
export async function ensureMic(): Promise<string | null> {
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

export function speak(text: string) {
  if (!('speechSynthesis' in window)) return
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'es-MX'
  u.rate = 1.02
  speechSynthesis.speak(u)
}
