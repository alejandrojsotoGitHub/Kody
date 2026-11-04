import { useEffect, useId, useRef, useState } from 'react'
import Mascot from '../mascot/Mascot'
import { PROPS } from './props'
import { sceneFor } from './scenes'

interface Props {
  themeId: string
  stage: number
  health?: number
  skin?: string
  compact?: boolean
  showKody?: boolean
  locked?: boolean
}

export default function World({ themeId, stage, health, skin, compact = false, showKody = true, locked = false }: Props) {
  const uid = useId().replace(/:/g, '')
  const box = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(340)
  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(() => setW(el.clientWidth))
    ro.observe(el)
    setW(el.clientWidth)
    return () => ro.disconnect()
  }, [])
  const sc = sceneFor(themeId, stage)
  const gy = sc.out ? 158 : 150

  return (
    <div className="world" ref={box} style={locked ? { filter: 'grayscale(0.9) brightness(0.5)' } : undefined}>
      <svg viewBox="0 0 360 200" preserveAspectRatio="xMidYMax slice" role="img" aria-label={sc.title}>
        <defs>
          <linearGradient id={`w${uid}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={sc.wall[0]} /><stop offset="1" stopColor={sc.wall[1]} /></linearGradient>
          <linearGradient id={`f${uid}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={sc.floor} /><stop offset="1" stopColor="#000" stopOpacity={0.35} /></linearGradient>
        </defs>
        <rect width="360" height="200" fill={`url(#w${uid})`} />
        {sc.rain && (
          <g className="w-rain">
            {Array.from({ length: 14 }, (_, i) => (
              <text key={i} x={12 + i * 26} y={20} style={{ animationDelay: `${(i % 5) * 0.7}s`, animationDuration: `${3 + (i % 4)}s` }}>
                {['1', '0', '1', '1', '0', '0', '1'].map((d, j) => <tspan key={j} x={12 + i * 26} dy="14">{d}</tspan>)}
              </text>
            ))}
          </g>
        )}
        <rect x="0" y={gy} width="360" height={200 - gy} fill={`url(#f${uid})`} />
        <path d={`M0 ${gy}H360`} stroke="rgba(255,255,255,0.14)" />
        {sc.items.map(([name, x, y, s = 1, o = {}], i) => {
          const draw = PROPS[name]
          return draw ? <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>{draw(o)}</g> : null
        })}
      </svg>
      {showKody && (
        <div className="world-kody" style={{ bottom: compact ? '1%' : '3%' }}>
          <Mascot size={Math.round(w * (compact ? 0.22 : 0.31))} bubble={!compact} stage={stage} health={health} skin={skin} />
        </div>
      )}
      <div className="world-title">{sc.title}</div>
    </div>
  )
}
