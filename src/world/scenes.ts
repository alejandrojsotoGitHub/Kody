import type { O } from './props'

export type Item = [name: string, x: number, y: number, scale?: number, opts?: O]

export interface SceneStage {
  title: string
  out?: boolean // exterior (suelo a y=158) o interior (suelo a y=150)
  wall: [string, string]
  floor: string
  rain?: boolean
  items: Item[]
}

const NAVY: [string, string] = ['#12182e', '#0b1020']

// ───────────── Iron Man: garaje → Torre Stark ─────────────
const GARAGE: SceneStage[] = [
  { title: 'Garaje pequeño', wall: ['#2a2a30', '#1b1b20'], floor: '#30303a', items: [['crate', 62, 150], ['crate', 92, 150, 0.8], ['bench', 305, 150], ['lamp', 30, 150]] },
  { title: 'Taller', wall: ['#26272e', '#191a20'], floor: '#2e2f38', items: [['shelf', 45, 150], ['crate', 100, 150, 0.8], ['bench', 305, 150], ['monitor', 305, 118, 0.8], ['lamp', 250, 150]] },
  { title: 'Garaje con autos', wall: ['#23252f', '#15171f'], floor: '#2b2e3a', items: [['car', 72, 150, 1.1], ['shelf', 330, 150], ['bench', 270, 150, 0.9], ['monitor', 270, 120, 0.7], ['lamp', 30, 150]] },
  { title: 'Hangar', wall: ['#1a2033', '#10141f'], floor: '#252b3d', items: [['hangar', 180, 150, 1.25, { w: 150, h: 80 }], ['car', 48, 150, 0.9], ['car', 118, 150, 0.7, { c: '#d9a520' }], ['arm', 300, 150], ['rack', 338, 150, 0.9]] },
  { title: 'Laboratorio', wall: ['#0d1730', '#080e1f'], floor: '#16203a', items: [['screens', 180, 120, 1.4, { w: 140, h: 60 }], ['holo', 40, 150], ['tube', 80, 150, 0.9], ['arm', 296, 150], ['rack', 336, 150, 0.9]] },
  { title: 'Torre Stark', wall: ['#0a1228', '#060a18'], floor: '#121a33', items: [['cityview', 180, 132, 1, { w: 240, h: 104 }], ['suit', 38, 150, 1.1], ['suit', 72, 150, 1.1, { c: '#d9a520' }], ['holo', 304, 150, 1.2], ['arm', 340, 150, 0.8]] },
]

// ───────────── Doom: choza → castillo de Latveria ─────────────
const CASTLE: SceneStage[] = [
  { title: 'Choza de Latveria', wall: ['#1a1a16', '#100f0c'], floor: '#25221b', items: [['rock', 60, 150], ['rock', 92, 150, 0.7], ['fire', 300, 150, 1.2], ['torch', 30, 150]] },
  { title: 'Forja', wall: ['#191a16', '#0f100d'], floor: '#24231d', items: [['torch', 30, 150], ['rock', 70, 150, 0.8], ['anvil', 285, 150, 1.2], ['fire', 332, 150]] },
  { title: 'Salón de hierro', wall: ['#16201a', '#0d130f'], floor: '#202a22', items: [['pillar', 40, 150, 0.9], ['pillar', 320, 150, 0.9], ['banner', 92, 150], ['banner', 252, 150], ['torch', 130, 150, 0.9]] },
  { title: 'Torre del castillo', out: true, wall: ['#0c1a14', '#16301f'], floor: '#0f1a14', items: [['stars', 0, 0, 1, { w: 360, h: 110 }], ['castle', 180, 158, 1.15], ['torch', 55, 158], ['torch', 305, 158]] },
  { title: 'Sala del trono', wall: ['#122018', '#0a130e'], floor: '#1d2b22', items: [['throne', 180, 150, 0.95], ['pillar', 38, 150], ['pillar', 322, 150], ['banner', 98, 150], ['banner', 244, 150], ['torch', 70, 150, 0.9], ['torch', 290, 150, 0.9]] },
  { title: 'Castillo de Latveria', out: true, wall: ['#06120c', '#10281a'], floor: '#0c1610', items: [['stars', 0, 0, 1, { w: 360, h: 110 }], ['planet', 310, 46, 0.6, { c: '#c6ff3d' }], ['castle', 180, 160, 1.3], ['bot', 52, 158], ['bot', 100, 158, 0.9], ['bot', 262, 158, 0.9], ['bot', 312, 158]] },
]

// ───────────── Reed Richards: laboratorio → Edificio Baxter ─────────────
const LAB_WALL: [string, string] = ['#0d1d3d', '#08122a']
const LAB: SceneStage[] = [
  { title: 'Laboratorio universitario', wall: LAB_WALL, floor: '#13264d', items: [['desk', 62, 150], ['monitor', 62, 124, 0.8], ['tube', 112, 150, 0.9], ['board', 300, 112, 1.1], ['plant', 340, 150, 0.8]] },
  { title: 'Laboratorio propio', wall: LAB_WALL, floor: '#13264d', items: [['desk', 55, 150], ['monitor', 55, 124, 0.8], ['tube', 100, 150], ['tube', 120, 150, 0.8], ['shelf', 296, 150], ['board', 250, 118, 0.7], ['plant', 340, 150, 0.8]] },
  { title: 'Centro de investigación', wall: LAB_WALL, floor: '#13264d', items: [['screens', 180, 118, 1.3, { w: 130, h: 56 }], ['rack', 30, 150], ['tube', 66, 150], ['holo', 310, 150], ['plant', 345, 150, 0.7]] },
  { title: 'Centro espacial', wall: ['#0a1838', '#060e24'], floor: '#12234a', items: [['window', 180, 124, 1, { w: 150, h: 84, c: '#070d24' }], ['stars', 105, 40, 1, { w: 150, h: 60 }], ['rocket', 316, 150, 1.1], ['rocket', 44, 150, 0.75], ['tube', 80, 150, 0.8], ['holo', 262, 150, 0.9]] },
  { title: 'Planta del Baxter', wall: ['#0a1a40', '#060f28'], floor: '#12275a', items: [['cityview', 180, 134, 1, { w: 240, h: 108 }], ['logo', 52, 72, 1, { t: 'four', c: '#cfe6ff' }], ['holo', 40, 150], ['rocket', 322, 150, 0.9]] },
  { title: 'Edificio Baxter', out: true, wall: ['#0a1a4a', '#1c3f8f'], floor: '#0b1633', items: [['stars', 0, 0, 1, { w: 360, h: 110 }], ['building', 90, 158, 1, { w: 44, h: 80, c: '#0f2154' }], ['building', 270, 158, 1, { w: 44, h: 96, c: '#0f2154' }], ['building', 180, 158, 1, { w: 74, h: 142, c: '#122a6b' }], ['logo', 180, 84, 1.4, { t: 'four', c: '#cfe6ff' }], ['drone', 48, 60], ['drone', 312, 52], ['portal', 330, 158, 0.9, { w: 56 }]] },
]

// ───────────── Matrix: cuarto oscuro → Zion ─────────────
const MX_WALL: [string, string] = ['#03100a', '#020a06']
const MATRIX: SceneStage[] = [
  { title: 'Cuarto oscuro', wall: MX_WALL, floor: '#06180e', rain: true, items: [['desk', 300, 150], ['terminal', 300, 124], ['chair', 258, 150]] },
  { title: 'Mesa de hacker', wall: MX_WALL, floor: '#06180e', rain: true, items: [['desk', 306, 150], ['terminal', 316, 124, 0.9], ['terminal', 288, 124, 0.75], ['chair', 250, 150], ['lamp', 40, 150]] },
  { title: 'Sótano de servidores', wall: MX_WALL, floor: '#06180e', rain: true, items: [['rack', 36, 150], ['rack', 68, 150], ['rack', 340, 150], ['screens', 180, 116, 1.2, { w: 120, h: 50, c: '#2bff7a' }], ['desk', 290, 150], ['terminal', 290, 124, 0.85]] },
  { title: 'Nebuchadnezzar', wall: ['#050e0a', '#030906'], floor: '#0a1d12', rain: true, items: [['screens', 180, 122, 1.5, { w: 170, h: 60, c: '#2bff7a' }], ['chair', 62, 150, 1.2, { c: '#1d2b22' }], ['chair', 104, 150, 1.2, { c: '#1d2b22' }], ['chair', 262, 150, 1.2, { c: '#1d2b22' }], ['chair', 304, 150, 1.2, { c: '#1d2b22' }]] },
  { title: 'Dojo', wall: ['#080d0a', '#050806'], floor: '#0f1a14', items: [['portal', 180, 150, 1.5, { w: 90 }], ['pillar', 50, 150], ['pillar', 310, 150], ['torch', 100, 150, 0.9], ['torch', 262, 150, 0.9]] },
  { title: 'Zion', out: true, rain: true, wall: ['#020805', '#06210f'], floor: '#041009', items: [['building', 52, 158, 1, { w: 50, h: 100, c: '#0b1c12' }], ['building', 118, 158, 1, { w: 40, h: 66, c: '#0b1c12' }], ['building', 252, 158, 1, { w: 44, h: 78, c: '#0b1c12' }], ['building', 314, 158, 1, { w: 52, h: 116, c: '#0b1c12' }], ['portal', 180, 158, 1.1, { w: 70 }], ['drone', 150, 50], ['drone', 220, 40]] },
]

// ───────────── Oficinas (Meta, Google, Apple, Anthropic) ─────────────
function office(brand: string, titles: string[], wall: [string, string] = NAVY, floor = '#1b2340'): SceneStage[] {
  const lg = (x: number, y: number, s = 1): Item => ['logo', x, y, s, { t: brand }]
  return [
    { title: titles[0], wall, floor, items: [['desk', 70, 150], ['monitor', 70, 124, 0.9], ['crate', 112, 150, 0.7], ['window', 296, 112, 1, { w: 60, h: 44 }], ['plant', 338, 150, 0.8]] },
    { title: titles[1], wall, floor, items: [['desk', 55, 150], ['monitor', 55, 124, 0.85], ['desk', 305, 150], ['monitor', 305, 124, 0.85], ['board', 250, 104], ['plant', 24, 150, 0.8], lg(74, 78, 0.8)] },
    { title: titles[2], wall, floor, items: [['desk', 42, 150, 0.9], ['monitor', 42, 124, 0.75], ['desk', 106, 150, 0.9], ['monitor', 106, 124, 0.75], ['desk', 300, 150, 0.9], ['monitor', 300, 124, 0.75], ['board', 244, 100, 0.9], ['plant', 342, 150, 0.8], lg(74, 74, 0.9)] },
    { title: titles[3], wall, floor, items: [['cityview', 180, 134, 1, { w: 230, h: 104 }], ['table', 304, 150, 0.8], ['plant', 28, 150], ['plant', 340, 150, 0.9], lg(62, 66, 1)] },
    { title: titles[4], out: true, wall: ['#16245a', '#2a4fb0'], floor: '#1c2a3f', items: [['building', 52, 160, 1, { w: 50, h: 100 }], ['building', 120, 160, 1, { w: 44, h: 72 }], ['building', 252, 160, 1, { w: 50, h: 108 }], ['building', 316, 160, 1, { w: 44, h: 80 }], ['plant', 150, 160, 1.5], ['plant', 214, 160, 1.5], lg(180, 42, 1.2)] },
    { title: titles[5], out: true, wall: ['#0b1038', '#3a2a8a'], floor: '#161b3d', items: [['stars', 0, 0, 1, { w: 360, h: 110 }], ['dome', 180, 160, 1, { w: 160 }], ['tower', 56, 160, 1, { w: 34, h: 120 }], ['tower', 306, 160, 1, { w: 38, h: 140 }], ['drone', 104, 62], ['drone', 262, 52], lg(180, 36, 1.3)] },
  ]
}

// ───────────── Genérico (Aurora, Jarvis, personalizado) ─────────────
const SP_WALL: [string, string] = ['#10142e', '#0a0d20']
const SPACE: SceneStage[] = [
  { title: 'Cuarto', wall: SP_WALL, floor: '#161b3d', items: [['desk', 70, 150], ['monitor', 70, 124, 0.9], ['window', 292, 112, 1, { w: 64, h: 50 }], ['plant', 338, 150, 0.8]] },
  { title: 'Estudio', wall: SP_WALL, floor: '#161b3d', items: [['desk', 60, 150], ['monitor', 60, 124, 0.9], ['shelf', 308, 150], ['board', 240, 102, 0.9], ['plant', 24, 150, 0.8]] },
  { title: 'Azotea', out: true, wall: ['#0a1030', '#2a2a7a'], floor: '#141a3a', items: [['stars', 0, 0, 1, { w: 360, h: 110 }], ['planet', 60, 50, 0.45], ['building', 40, 160, 1, { w: 44, h: 90 }], ['building', 100, 160, 1, { w: 40, h: 60 }], ['building', 280, 160, 1, { w: 50, h: 110 }], ['drone', 250, 70]] },
  { title: 'Laboratorio orbital', wall: ['#0c1230', '#070a1c'], floor: '#121a3a', items: [['stars', 0, 0, 1, { w: 360, h: 140 }], ['planet', 292, 64, 1.1], ['screens', 70, 128, 0.9, { w: 100, h: 46 }], ['rack', 28, 150], ['holo', 332, 150]] },
  { title: 'Estación espacial', wall: ['#080b22', '#04061a'], floor: '#0f1634', items: [['stars', 0, 0, 1, { w: 360, h: 140 }], ['planet', 244, 74, 1.7], ['rack', 28, 150], ['rack', 60, 150], ['drone', 118, 52], ['holo', 332, 150]] },
  { title: 'Nave de comando', wall: ['#060820', '#03040f'], floor: '#0c1230', items: [['stars', 0, 0, 1, { w: 360, h: 140 }], ['planet', 84, 70, 1.8, { c: '#7a5cff' }], ['drone', 60, 36], ['drone', 306, 50], ['holo', 300, 150, 1.2], ['rack', 342, 150, 0.9]] },
]

const SCENES: Record<string, SceneStage[]> = {
  stark: GARAGE,
  doom: CASTLE,
  reedr: LAB,
  matrix: MATRIX,
  meta: office('meta', ['Cuarto de residencia', 'Startup', 'Equipo en crecimiento', 'Gran oficina', 'Campus', 'Sede futurista']),
  google: office('google', ['Garaje', 'Oficina pequeña', 'Equipo', 'Gran oficina', 'Googleplex', 'Sede futurista'], ['#dfe6f2', '#c3cde2'], '#aab6cf'),
  apple: office('apple', ['Garaje', 'Taller', 'Tienda', 'Oficinas', 'Campus', 'Apple Park'], ['#e6e6ee', '#cfd0dc'], '#b9bacb'),
  anthropic: office('anthropic', ['Idea', 'Laboratorio', 'Equipo de investigación', 'Oficinas', 'Campus', 'Centro de IA'], ['#2b231d', '#1c1613'], '#3a2e26'),
  jarvis: SPACE,
  aurora: SPACE,
  custom: SPACE,
}

export const sceneFor = (themeId: string, stage: number): SceneStage => {
  const list = SCENES[themeId] ?? SPACE
  return list[Math.min(Math.max(stage, 0), list.length - 1)]
}
export const sceneTitles = (themeId: string) => (SCENES[themeId] ?? SPACE).map((s) => s.title)
