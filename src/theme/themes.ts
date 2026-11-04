import type { Prefs } from '../db/settings'

export type Pattern = 'dots' | 'hex' | 'diag' | 'grid' | 'none'

export interface ThemeDef {
  id: string
  name: string
  hint?: string
  mode: 'dark' | 'light'
  bg0: string
  bg1: string
  a1: string
  a2: string
  blobs: [string, string, string]
  pattern: Pattern
  skin: string // mascota que acompaña al tema
  text?: string
}

export const THEMES: ThemeDef[] = [
  { id: 'aurora', name: 'Aurora', hint: 'Celeste y morado', mode: 'dark', bg0: '#060818', bg1: '#121047', a1: '#5eead4', a2: '#a78bfa', blobs: ['#38bdf8', '#8b5cf6', '#22d3ee'], pattern: 'dots', skin: 'classic' },
  { id: 'jarvis', name: 'Jarvis', hint: 'Holograma azul', mode: 'dark', bg0: '#030a14', bg1: '#06223a', a1: '#3fd0ff', a2: '#1a7bff', blobs: ['#00b8ff', '#0a4dff', '#00e5ff'], pattern: 'grid', skin: 'classic' },
  { id: 'stark', name: 'Iron Man', hint: 'Armadura Stark', mode: 'dark', bg0: '#0b0304', bg1: '#2a0709', a1: '#ff4b3e', a2: '#ffc53d', blobs: ['#ff3d2e', '#ffb81f', '#8f0f1a'], pattern: 'hex', skin: 'stark' },
  { id: 'doom', name: 'Doctor Doom', hint: 'Latveria', mode: 'dark', bg0: '#040806', bg1: '#0d2416', a1: '#46d36b', a2: '#b7c2cc', blobs: ['#1f9d55', '#4a5a68', '#7bd88f'], pattern: 'diag', skin: 'doom' },
  { id: 'reedr', name: 'Reed Richards', hint: 'Los 4 Fantásticos', mode: 'dark', bg0: '#030a1c', bg1: '#0a2a6b', a1: '#2f7bff', a2: '#cfe6ff', blobs: ['#1c64f2', '#7cc4ff', '#0b3fbf'], pattern: 'grid', skin: 'reed' },
  { id: 'matrix', name: 'Matrix', hint: 'Código verde', mode: 'dark', bg0: '#010a04', bg1: '#04210e', a1: '#2bff7a', a2: '#0fb36b', blobs: ['#00ff66', '#0b8f4a', '#00c853'], pattern: 'dots', skin: 'matrix' },
  { id: 'meta', name: 'Zuckerberg', hint: 'Meta', mode: 'dark', bg0: '#04070f', bg1: '#0a1c44', a1: '#2d8cff', a2: '#00d1ff', blobs: ['#0866ff', '#00b2ff', '#7c4dff'], pattern: 'dots', skin: 'meta' },
  { id: 'google', name: 'Google', hint: 'Cuatro colores', mode: 'light', bg0: '#eef2f8', bg1: '#ffffff', a1: '#4285f4', a2: '#34a853', blobs: ['#4285f4', '#ea4335', '#fbbc05'], pattern: 'dots', skin: 'google' },
  { id: 'apple', name: 'Apple', hint: 'Claro y limpio', mode: 'light', bg0: '#ececf2', bg1: '#fafafc', a1: '#0a84ff', a2: '#bf5af2', blobs: ['#0a84ff', '#ff375f', '#bf5af2'], pattern: 'none', skin: 'apple' },
  { id: 'anthropic', name: 'Anthropic', hint: 'Terracota', mode: 'dark', bg0: '#171513', bg1: '#2b231d', a1: '#e0845f', a2: '#f0c29a', blobs: ['#d97757', '#e8b48a', '#8f4a2e'], pattern: 'dots', skin: 'anthropic', text: '#f7f0e6' },
]

export function resolveTheme(p: Pick<Prefs, 'theme' | 'customA' | 'customB' | 'customMode' | 'overrideA' | 'overrideB'>): ThemeDef {
  let t: ThemeDef
  if (p.theme === 'custom') {
    const dark = p.customMode === 'dark'
    t = {
      id: 'custom', name: 'Personalizado', mode: p.customMode, pattern: 'dots', skin: 'classic',
      bg0: dark ? '#07070d' : '#eef0f6', bg1: dark ? '#14122b' : '#ffffff',
      a1: p.customA, a2: p.customB, blobs: [p.customA, p.customB, p.customA],
    }
  } else t = THEMES.find((x) => x.id === p.theme) ?? THEMES[0]
  if (p.overrideA || p.overrideB) {
    const a1 = p.overrideA || t.a1, a2 = p.overrideB || t.a2
    t = { ...t, a1, a2, blobs: [a1, a2, a1] }
  }
  return t
}

const FONTS = {
  tech: "'Space Grotesk Variable', 'Inter Variable', system-ui, sans-serif",
  clean: "'Inter Variable', -apple-system, system-ui, sans-serif",
  mono: "'JetBrains Mono Variable', ui-monospace, monospace",
}
const LIGHT = {
  tl: ['0% 0%', '150deg'], tr: ['100% 0%', '210deg'], bl: ['0% 100%', '30deg'], br: ['100% 100%', '330deg'],
} as const

export function applyTheme(t: ThemeDef, p: Prefs) {
  const r = document.documentElement
  const dark = t.mode === 'dark'
  const set = (k: string, v: string) => r.style.setProperty(k, v)
  r.dataset.mode = t.mode
  r.dataset.pattern = t.pattern
  r.dataset.tabs = p.tabs
  r.dataset.density = p.density
  set('--bg0', t.bg0); set('--bg1', t.bg1)
  set('--a1', t.a1); set('--a2', t.a2)
  set('--b1', t.blobs[0]); set('--b2', t.blobs[1]); set('--b3', t.blobs[2])
  set('--text', t.text ?? (dark ? '#f4f6ff' : '#0d1226'))
  set('--muted', dark ? 'rgba(235,240,255,0.58)' : 'rgba(13,18,38,0.56)')
  set('--blur', `${p.blur}px`)
  set('--glass', String(p.glass))
  set('--angle', `${p.angle}deg`)
  set('--radius', `${p.radius}px`)
  set('--display', FONTS[p.font])
  set('--lpos', LIGHT[p.light][0])
  set('--lang', LIGHT[p.light][1])
  set('--glow', String(p.glow))
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', t.bg0)
}
