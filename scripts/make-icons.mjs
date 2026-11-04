// Genera los íconos PNG de la app desde un SVG de Kody. Uso: node scripts/make-icons.mjs
import sharp from 'sharp'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'

const svg = (pad, bg = true) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#121047"/><stop offset="1" stop-color="#060818"/></linearGradient>
    <linearGradient id="h" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5eead4"/><stop offset=".5" stop-color="#2b3460"/><stop offset="1" stop-color="#a78bfa"/></linearGradient>
    <radialGradient id="glow"><stop offset="0" stop-color="#5eead4" stop-opacity=".35"/><stop offset="1" stop-color="#5eead4" stop-opacity="0"/></radialGradient>
  </defs>
  ${bg ? '<rect width="512" height="512" fill="url(#bg)"/><circle cx="256" cy="256" r="230" fill="url(#glow)"/>' : ''}
  <g transform="translate(${pad} ${pad}) scale(${(512 - pad * 2) / 512})">
    <line x1="256" y1="84" x2="256" y2="132" stroke="#5eead4" stroke-width="10" stroke-linecap="round"/>
    <circle cx="256" cy="72" r="16" fill="#5eead4"/>
    <rect x="52" y="224" width="52" height="118" rx="26" fill="#2b3460"/>
    <rect x="408" y="224" width="52" height="118" rx="26" fill="#2b3460"/>
    <text x="78" y="304" text-anchor="middle" font-family="monospace" font-size="58" font-weight="700" fill="#5eead4">{</text>
    <text x="434" y="304" text-anchor="middle" font-family="monospace" font-size="58" font-weight="700" fill="#5eead4">}</text>
    <rect x="86" y="132" width="340" height="276" rx="100" fill="url(#h)"/>
    <rect x="124" y="176" width="264" height="168" rx="66" fill="#050913"/>
    <rect x="178" y="232" width="52" height="66" rx="26" fill="#5eead4"/>
    <rect x="282" y="232" width="52" height="66" rx="26" fill="#5eead4"/>
    <path d="M226 330 q30 20 60 0" fill="none" stroke="#5eead4" stroke-width="10" stroke-linecap="round"/>
  </g>
</svg>`

mkdirSync('public/icons', { recursive: true })
const out = async (name, size, pad) => {
  const buf = await sharp(Buffer.from(svg(pad))).resize(size, size).png().toBuffer()
  writeFileSync(`public/icons/${name}`, buf)
}
await out('icon-192.png', 192, 0)
await out('icon-512.png', 512, 0)
await out('maskable-512.png', 512, 70) // zona segura para íconos adaptativos de Android
await out('apple-touch-icon.png', 180, 0)
writeFileSync('public/favicon.svg', svg(0))
console.log('Íconos generados en public/icons')

// Íconos de la app Android (si ya existe el proyecto android/)
const RES = 'android/app/src/main/res'
if (existsSync(RES)) {
  const dens = { mdpi: [48, 108], hdpi: [72, 162], xhdpi: [96, 216], xxhdpi: [144, 324], xxxhdpi: [192, 432] }
  for (const [d, [launcher, fg]] of Object.entries(dens)) {
    const dir = `${RES}/mipmap-${d}`
    mkdirSync(dir, { recursive: true })
    const square = await sharp(Buffer.from(svg(0))).resize(launcher, launcher).png().toBuffer()
    writeFileSync(`${dir}/ic_launcher.png`, square)
    const round = await sharp(square)
      .composite([{ input: Buffer.from(`<svg><circle cx="${launcher / 2}" cy="${launcher / 2}" r="${launcher / 2}"/></svg>`), blend: 'dest-in' }])
      .png().toBuffer()
    writeFileSync(`${dir}/ic_launcher_round.png`, round)
    // primer plano adaptable: la mascota ocupa ~60 % central (zona segura), fondo transparente
    writeFileSync(`${dir}/ic_launcher_foreground.png`, await sharp(Buffer.from(svg(96, false))).resize(fg, fg).png().toBuffer())
  }
  writeFileSync(`${RES}/values/ic_launcher_background.xml`, `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#060818</color>
</resources>
`)
  console.log('Íconos Android generados')
}
