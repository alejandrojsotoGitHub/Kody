import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { useKody, type Mood } from './store'
import { usePrefs } from '../db/settings'
import { resolveTheme } from '../theme/themes'

type EyeStyle = 'round' | 'slit' | 'angry' | 'digit'

interface Skin {
  label: string
  head: [string, string, string]
  body: [string, string]
  visor: [string, string]
  eye: string
  core: string
  ring: string
  mouth?: string
  ears: 'braces' | 'plain'
  earColor?: string
  eyeStyle: EyeStyle
  antenna: boolean
  chest?: 'four'
}

export const SKINS: Record<string, Skin> = {
  classic: {
    label: 'Kody clásico',
    head: ['color-mix(in srgb, var(--a1) 55%, #1a2040)', '#262c4a', 'color-mix(in srgb, var(--a2) 50%, #1a2040)'],
    body: ['#4b5578', '#1a1f38'], visor: ['#050913', '#050913'], eye: 'var(--a1)', core: 'var(--a1)', ring: 'var(--a1)',
    ears: 'braces', eyeStyle: 'round', antenna: true,
  },
  stark: {
    label: 'Armadura Iron Man',
    head: ['#e0303d', '#a30f1c', '#6e0a14'], body: ['#c1121f', '#5e0912'], visor: ['#ffe28a', '#d49a1a'],
    eye: '#eaffff', core: '#d6fbff', ring: '#ffc53d', mouth: '#7a4b00', ears: 'plain', earColor: '#ffc53d', eyeStyle: 'slit', antenna: false,
  },
  doom: {
    label: 'Doctor Doom',
    head: ['#c3cad3', '#8a94a1', '#4d5662'], body: ['#2c7a46', '#17512b'], visor: ['#2a323c', '#171c22'],
    eye: '#c6ff3d', core: '#c6ff3d', ring: '#b7c2cc', mouth: '#2a323c', ears: 'plain', earColor: '#5a6572', eyeStyle: 'angry', antenna: false,
  },
  reed: {
    label: 'Mr. Fantástico',
    head: ['#4a8dff', '#1747c4', '#0b2a7a'], body: ['#2f7bff', '#0b2a7a'], visor: ['#0c1d47', '#071230'],
    eye: '#eaf4ff', core: '#ffffff', ring: '#cfe6ff', ears: 'plain', earColor: '#1747c4', eyeStyle: 'round', antenna: false, chest: 'four',
  },
  matrix: {
    label: 'Neo / Matrix',
    head: ['#26322a', '#0e140f', '#050805'], body: ['#1b241d', '#050805'], visor: ['#02100a', '#000000'],
    eye: '#2bff7a', core: '#2bff7a', ring: '#2bff7a', ears: 'braces', eyeStyle: 'digit', antenna: true,
  },
  google: {
    label: 'Google',
    head: ['#ffffff', '#eef1f5', '#cfd6df'], body: ['#ffffff', '#cfd6df'], visor: ['#1a1f2b', '#0f131b'],
    eye: '#8ab4f8', core: '#4285f4', ring: '#ea4335', ears: 'plain', earColor: '#fbbc05', eyeStyle: 'round', antenna: true,
  },
  meta: {
    label: 'Meta',
    head: ['#4d97ff', '#0866ff', '#0a3fb3'], body: ['#2d8cff', '#0a3fb3'], visor: ['#071433', '#050d22'],
    eye: '#ffffff', core: '#7cc4ff', ring: '#ffffff', ears: 'plain', earColor: '#0a3fb3', eyeStyle: 'round', antenna: false,
  },
  apple: {
    label: 'Apple',
    head: ['#fbfbfd', '#d9d9de', '#a9a9b0'], body: ['#f2f2f5', '#a9a9b0'], visor: ['#0b0b0e', '#000000'],
    eye: '#ffffff', core: '#0a84ff', ring: '#8e8e93', ears: 'plain', earColor: '#c7c7cc', eyeStyle: 'round', antenna: true,
  },
  anthropic: {
    label: 'Anthropic',
    head: ['#ee9a78', '#d97757', '#a8502f'], body: ['#d97757', '#8f4a2e'], visor: ['#2a1810', '#1a0f0a'],
    eye: '#f7e7d3', core: '#f7e7d3', ring: '#f7e7d3', ears: 'plain', earColor: '#a8502f', eyeStyle: 'round', antenna: false,
  },
}

const QUIPS: Record<string, string[]> = {
  stark: ['A veces hay que correr antes de caminar.', 'Reactor al 100%, jefe.', 'Jarvis, ¿tenemos pendientes? — Sí.'],
  doom: ['Latveria no se gobierna sola.', 'Inclínate ante tu agenda.', 'Mi destino: cero tareas vencidas.'],
  reed: ['Calculé 4 formas de terminar esto.', '¡Estírate un poco, hay tiempo!', 'La ciencia dice: ¡enfócate!'],
  matrix: ['Despierta, Neo. Tienes tareas.', 'No hay cuchara. Solo código.', 'Sigue al conejo blanco… del calendario.'],
  default: ['Sistemas en línea. ¿Qué construimos hoy?', 'console.log("¡a por todas!")', 'Un commit a la vez. 💾', 'Compilando motivación… 100%', 'Tu racha me alimenta el reactor.'],
}

export default function Mascot({ size = 180, bubble = true }: { size?: number; bubble?: boolean }) {
  const uid = useId().replace(/:/g, '')
  const prefs = usePrefs()
  const { mood: storeMood, bubble: text, react } = useKody()
  const eyes = useRef<SVGGElement>(null)
  const [spin, setSpin] = useState(false)

  const skinId = prefs.mascotSkin === 'auto' ? resolveTheme(prefs).skin : prefs.mascotSkin
  const sk = SKINS[skinId] ?? SKINS.classic
  const hour = new Date().getHours()
  const mood: Mood = storeMood === 'idle' && (hour >= 23 || hour < 5) ? 'sleep' : storeMood

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const g = eyes.current
      if (!g) return
      const r = g.ownerSVGElement!.getBoundingClientRect()
      const dx = (e.clientX - (r.left + r.width / 2)) / window.innerWidth
      const dy = (e.clientY - (r.top + r.height / 2)) / window.innerHeight
      g.style.transform = `translate(${dx * 9}px, ${dy * 7}px)`
    }
    window.addEventListener('pointermove', move)
    return () => window.removeEventListener('pointermove', move)
  }, [])

  const tap = () => {
    const list = QUIPS[skinId] ?? QUIPS.default
    react('happy', list[Math.floor(Math.random() * list.length)], 2800)
  }
  const dbl = () => { setSpin(true); setTimeout(() => setSpin(false), 900); react('happy', '¡Wheee! 🌀', 1800) }

  const cls = mood === 'alert' ? 'k-eye alert' : 'k-eye'
  const big = mood === 'alert' || mood === 'listening'
  const eyeShape = (): ReactNode => {
    if (mood === 'happy') return <><path d="M66 108 q13 -18 26 0" className="k-stroke" /><path d="M108 108 q13 -18 26 0" className="k-stroke" /></>
    if (mood === 'sleep') return <><path d="M66 108 h26" className="k-stroke" /><path d="M108 108 h26" className="k-stroke" /></>
    switch (sk.eyeStyle) {
      case 'slit':
        return <g className={cls}><path d="M65 111 L92 105 L92 117 L67 118Z" /><path d="M135 111 L108 105 L108 117 L133 118Z" /></g>
      case 'angry':
        return <g className={cls}><path d="M65 103 L92 112 L92 121 L66 114Z" /><path d="M135 103 L108 112 L108 121 L134 114Z" /></g>
      case 'digit':
        return <g className={cls}><text x="79" y="120" textAnchor="middle" className="k-digit">0</text><text x="121" y="120" textAnchor="middle" className="k-digit">1</text></g>
      default: {
        const h = big ? 32 : 26
        return <g className={cls}><rect x="68" y={108 - h / 2} width="22" height={h} rx="11" /><rect x="110" y={108 - h / 2} width="22" height={h} rx="11" /></g>
      }
    }
  }

  const ms = sk.mouth ? { stroke: sk.mouth } : undefined
  const mf = sk.mouth ? { fill: sk.mouth, filter: 'none' } : undefined
  const mouth = (): ReactNode => {
    if (mood === 'talking') return <ellipse cx="100" cy="132" rx="9" ry="5" className="k-fill k-talk" style={mf} />
    if (mood === 'happy') return <path d="M88 126 q12 16 24 0 z" className="k-fill" style={mf} />
    if (skinId === 'stark') return <g className="k-stroke thin" style={{ ...ms, filter: 'none' }}><path d="M90 128 h20" /><path d="M93 133 h14" /></g>
    if (mood === 'sleep') return <path d="M94 131 h12" className="k-stroke thin" style={ms} />
    if (mood === 'alert') return <path d="M92 133 q8 -5 16 0" className="k-stroke thin" style={ms} />
    return <path d="M91 128 q9 7 18 0" className="k-stroke thin" style={ms} />
  }

  // Elementos que van DETRÁS de la cabeza / el cuerpo
  const behind = (): ReactNode => {
    if (skinId === 'doom') return <>
      <path d="M58 166 L30 218 Q100 232 170 218 L142 166Z" fill="#17512b" />
      <path d="M20 152 Q14 48 100 32 Q186 48 180 152 Q172 176 148 170 L52 170 Q28 176 20 152Z" fill="#1f6b3a" />
      <path d="M44 80 Q100 20 156 80" fill="none" stroke="#154a29" strokeWidth="6" />
    </>
    if (skinId === 'reed') return <>
      <g className="k-armL"><path d="M76 176 L44 200" className="k-arm" /><circle cx="42" cy="202" r="8" fill="#eaf4ff" className="k-hand" /></g>
      <g className="k-armR"><path d="M124 176 L156 200" className="k-arm" /><circle cx="158" cy="202" r="8" fill="#eaf4ff" className="k-hand" /></g>
    </>
    return null
  }

  // Detalles delante de cabeza/visor
  const front = (): ReactNode => {
    switch (skinId) {
      case 'stark': return <>
        <rect x="50" y="76" width="100" height="62" rx="26" fill="none" stroke="#8a5a00" strokeWidth="2" />
        <path d="M100 76 v12" stroke="#8a5a00" strokeWidth="2" /><path d="M56 62 q44 -16 88 0" fill="none" stroke="#ffc53d" strokeWidth="3" strokeLinecap="round" />
      </>
      case 'doom': return <>
        <path d="M52 82 L100 96 L148 82" fill="none" stroke="#0d1115" strokeWidth="3" strokeLinecap="round" />
        <path d="M100 112 v16" stroke="#0d1115" strokeWidth="2.5" strokeLinecap="round" />
        {[[56, 146], [144, 146], [56, 70], [144, 70]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="3.2" fill="#e3e8ee" stroke="#4d5662" />)}
      </>
      case 'reed': return <>
        <path d="M38 86 q-3 -20 18 -28 l6 20z" fill="#d6dde8" /><path d="M162 86 q3 -20 -18 -28 l-6 20z" fill="#d6dde8" />
      </>
      case 'matrix': return (
        <g className="k-rain" clipPath={`url(#c${uid})`}>
          {[[62, '1 0 1 1 0'], [100, '0 1 0 0 1'], [138, '1 1 0 1 0']].map(([x, d], i) => (
            <text key={i} x={x as number} y="88" textAnchor="middle" style={{ animationDelay: `${i * 0.6}s` }}>{(d as string).split(' ').map((c, j) => <tspan key={j} x={x as number} dy="12">{c}</tspan>)}</text>
          ))}
        </g>
      )
      case 'google': return <>
        {[['#4285f4', 76], ['#ea4335', 92], ['#fbbc05', 108], ['#34a853', 124]].map(([c, x]) => <circle key={c as string} cx={x as number} cy="66" r="4.5" fill={c as string} />)}
      </>
      case 'meta': return <text x="100" y="72" textAnchor="middle" className="k-sym">∞</text>
      case 'anthropic': return (
        <g stroke="#f7e7d3" strokeWidth="2.6" strokeLinecap="round">
          {[0, 45, 90, 135].map((a) => <line key={a} x1="100" y1="58" x2="100" y2="74" transform={`rotate(${a} 100 66)`} />)}
        </g>
      )
      default: return null
    }
  }

  const showTag = skinId === 'classic' || skinId === 'matrix'

  return (
    <div className="kody-wrap" style={{ width: size }}>
      {bubble && text && <div className="kody-bubble">{text}</div>}
      <svg
        viewBox="0 0 200 230" width={size} height={size * 1.15}
        className={`kody k-${mood} ${spin ? 'k-spin' : ''}`}
        style={{ '--ke': sk.eye, '--kc': sk.core } as React.CSSProperties}
        onClick={tap} onDoubleClick={dbl} role="img" aria-label="Kody, tu asistente"
      >
        <defs>
          <linearGradient id={`h${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" style={{ stopColor: sk.head[0] }} /><stop offset="0.5" style={{ stopColor: sk.head[1] }} /><stop offset="1" style={{ stopColor: sk.head[2] }} />
          </linearGradient>
          <linearGradient id={`m${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: sk.body[0] }} /><stop offset="1" style={{ stopColor: sk.body[1] }} />
          </linearGradient>
          <linearGradient id={`v${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: sk.visor[0] }} /><stop offset="1" style={{ stopColor: sk.visor[1] }} />
          </linearGradient>
          <radialGradient id={`g${uid}`}>
            <stop offset="0" style={{ stopColor: 'var(--a1)', stopOpacity: 0.9 }} /><stop offset="1" style={{ stopColor: 'var(--a1)', stopOpacity: 0 }} />
          </radialGradient>
          <clipPath id={`c${uid}`}><rect x="50" y="76" width="100" height="62" rx="26" /></clipPath>
        </defs>

        {mood === 'listening' && [0, 1, 2].map((i) => (
          <circle key={i} cx="100" cy="105" r="60" className="k-ripple" style={{ animationDelay: `${i * 0.5}s` }} />
        ))}

        <g className="k-float">
          <ellipse cx="100" cy="224" rx="42" ry="6" className="k-shadow" />
          {behind()}
          {sk.antenna && <>
            <line x1="100" y1="34" x2="100" y2="56" className="k-stroke thin" />
            {skinId === 'apple'
              ? <path d="M100 30 q10 -16 24 -11 q-2 15 -24 11z" fill="#30d158" />
              : <><circle cx="100" cy="28" r="9" fill={`url(#g${uid})`} className="k-tipglow" /><circle cx="100" cy="28" r="5" className={mood === 'alert' ? 'k-tip alert' : 'k-tip'} /></>}
          </>}
          {/* orejas */}
          <rect x="18" y="92" width="26" height="46" rx="12" fill={sk.ears === 'braces' ? `url(#m${uid})` : sk.earColor} />
          <rect x="156" y="92" width="26" height="46" rx="12" fill={sk.ears === 'braces' ? `url(#m${uid})` : sk.earColor} />
          {sk.ears === 'braces' && <>
            <text x="31" y="123" textAnchor="middle" className="k-code">{'{'}</text>
            <text x="169" y="123" textAnchor="middle" className="k-code">{'}'}</text>
          </>}
          {/* cabeza */}
          <rect x="34" y="54" width="132" height="108" rx="40" fill={`url(#h${uid})`} />
          <rect x="36" y="56" width="128" height="104" rx="38" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
          <path d="M52 66 q40 -14 96 0" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2" strokeLinecap="round" />
          <rect x="50" y="76" width="100" height="62" rx="26" fill={`url(#v${uid})`} />
          {showTag && <text x="100" y="72" textAnchor="middle" className="k-tag">{'</>'}</text>}
          {front()}
          <g ref={eyes} className="k-eyes">{eyeShape()}</g>
          {mouth()}
          {mood === 'thinking' && <g className="k-think"><circle cx="150" cy="52" r="3" /><circle cx="162" cy="44" r="4" /><circle cx="176" cy="34" r="5" /></g>}
          {mood === 'sleep' && <g className="k-zzz"><text x="150" y="64">z</text><text x="164" y="50" fontSize="16">Z</text></g>}
          {/* cuerpo */}
          <path d="M72 164 h56 l9 36 a12 12 0 0 1 -12 14 h-50 a12 12 0 0 1 -12 -14 z" fill={`url(#m${uid})`} />
          {skinId === 'stark' && <path d="M78 170 h44 l-4 10 h-36z" fill="#ffc53d" opacity="0.9" />}
          {sk.chest === 'four' ? <>
            <circle cx="100" cy="190" r="15" fill="#eaf4ff" stroke="#0b2a7a" strokeWidth="2" />
            <text x="100" y="197" textAnchor="middle" className="k-four">4</text>
          </> : <>
            <circle cx="100" cy="188" r="14" fill="#050913" stroke={sk.ring} strokeWidth="1.8" />
            <circle cx="100" cy="188" r="10" fill="none" stroke={sk.ring} strokeWidth="1.5" strokeDasharray="4 5" className="k-ring" />
            <circle cx="100" cy="188" r="5" className="k-core" />
          </>}
        </g>
      </svg>
    </div>
  )
}
