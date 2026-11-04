import type { Prefs } from '../db/settings'

export const GEMINI_VOICES: [string, string][] = [
  ['Kore', 'Kore · firme'],
  ['Puck', 'Puck · alegre'],
  ['Charon', 'Charon · informativa'],
  ['Aoede', 'Aoede · ligera'],
  ['Fenrir', 'Fenrir · enérgica'],
  ['Zephyr', 'Zephyr · brillante'],
]
const TTS_MODELS = ['gemini-3.8-flash-tts', 'gemini-2.5-flash-preview-tts']

const cache = new Map<string, Blob>()
let current: HTMLAudioElement | null = null

export function stopGeminiAudio() {
  current?.pause()
  current = null
}

/** Envuelve PCM 16-bit mono en una cabecera WAV para poder reproducirlo con <audio>. */
function pcmToWav(pcm: Uint8Array, rate: number): Blob {
  const head = new ArrayBuffer(44)
  const v = new DataView(head)
  const w = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)))
  w(0, 'RIFF'); v.setUint32(4, 36 + pcm.length, true); w(8, 'WAVE'); w(12, 'fmt ')
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true)
  v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true)
  w(36, 'data'); v.setUint32(40, pcm.length, true)
  return new Blob([head, pcm as BlobPart], { type: 'audio/wav' })
}

function b64ToBytes(b64: string) {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

async function synth(text: string, voice: string, key: string): Promise<Blob> {
  let lastErr = 'No se pudo generar la voz.'
  for (const model of TTS_MODELS) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{ parts: [{ text }] }],
        generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } },
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      lastErr = err?.error?.message ?? `Error ${res.status}`
      continue
    }
    const data = await res.json()
    const inline = data.candidates?.[0]?.content?.parts?.find((p: { inlineData?: unknown }) => p.inlineData)?.inlineData as { mimeType: string; data: string } | undefined
    if (!inline) { lastErr = 'Gemini no devolvió audio.'; continue }
    const bytes = b64ToBytes(inline.data)
    const mime = inline.mimeType.toLowerCase()
    if (mime.includes('wav') || mime.includes('mpeg') || mime.includes('mp3') || mime.includes('ogg')) return new Blob([bytes as BlobPart], { type: inline.mimeType })
    const rate = Number(/rate=(\d+)/.exec(mime)?.[1] ?? 24000)
    return pcmToWav(bytes, rate)
  }
  throw new Error(lastErr)
}

/** Habla con una voz de Gemini. Lanza error si falla (el llamador decide el respaldo). */
export async function geminiSpeak(text: string, prefs: Pick<Prefs, 'geminiKey' | 'geminiVoice'>): Promise<void> {
  if (!prefs.geminiKey) throw new Error('Falta la API key de Gemini.')
  const id = `${prefs.geminiVoice}|${text}`
  let blob = cache.get(id)
  if (!blob) {
    blob = await synth(text, prefs.geminiVoice, prefs.geminiKey)
    if (cache.size > 30) cache.delete(cache.keys().next().value!)
    cache.set(id, blob)
  }
  stopGeminiAudio()
  const url = URL.createObjectURL(blob)
  const audio = new Audio(url)
  current = audio
  try {
    await new Promise<void>((resolve, reject) => {
      audio.onended = () => resolve()
      audio.onerror = () => reject(new Error('No se pudo reproducir el audio.'))
      audio.play().catch(reject)
    })
  } finally {
    URL.revokeObjectURL(url)
  }
}
