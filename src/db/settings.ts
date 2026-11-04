import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './schema'

export interface Prefs {
  userName: string
  theme: string
  customA: string
  customB: string
  customMode: 'dark' | 'light'
  overrideA: string // '' = usar los colores del tema
  overrideB: string
  angle: number // dirección del degradado de acento
  light: 'tl' | 'tr' | 'bl' | 'br' // de dónde viene la luz del cristal
  radius: number
  font: 'tech' | 'clean' | 'mono'
  tabs: 'bottom' | 'top'
  density: 'comfy' | 'compact'
  glow: number // intensidad de luces de fondo
  blur: number
  glass: number
  animatedBg: boolean
  mascotSkin: string // 'auto' sigue al tema
  geminiKey: string
  geminiModel: string
  backendUrl: string
  tone: 'amigable' | 'formal' | 'jarvis'
  speak: boolean
  wake: boolean
  xp: number
  capacity: number[] // minutos disponibles por día de semana (0=domingo)
  capacityOverrides: Record<string, number> // por fecha yyyy-MM-dd
}

export const DEFAULT_PREFS: Prefs = {
  userName: '',
  theme: 'aurora',
  customA: '#ff5fa2',
  customB: '#ffb86b',
  customMode: 'dark',
  overrideA: '',
  overrideB: '',
  angle: 135,
  light: 'tl',
  radius: 26,
  font: 'tech',
  tabs: 'bottom',
  density: 'comfy',
  glow: 0.5,
  blur: 28,
  glass: 0.1,
  animatedBg: true,
  mascotSkin: 'auto',
  geminiKey: '',
  geminiModel: 'gemini-3.5-flash',
  backendUrl: '',
  tone: 'jarvis',
  speak: false,
  wake: false,
  xp: 0,
  capacity: [240, 180, 180, 180, 180, 180, 240],
  capacityOverrides: {},
}

export async function setPref<K extends keyof Prefs>(key: K, value: Prefs[K]) {
  await db.settings.put({ key, value })
}

export function usePrefs(): Prefs {
  const rows = useLiveQuery(() => db.settings.toArray(), [])
  const prefs = { ...DEFAULT_PREFS } as Record<string, unknown>
  for (const r of rows ?? []) if (r.key in DEFAULT_PREFS) prefs[r.key] = r.value
  return prefs as unknown as Prefs
}
