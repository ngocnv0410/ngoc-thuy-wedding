import { sealMarkup, sealSvg } from '../src/components/sealArt.ts'
/**
 * Sinh ảnh xem trước khi chia sẻ link (public/og.jpg, 1200×630) theo đúng phong cách tờ thiệp:
 * nền loang cẩm thạch + gân nhũ vàng, hoa baby khô ở hai góc (cùng bộ sinh hoạ tiết với trang),
 * dấu sáp, tên nhũ vàng, ngày. Chữ được chuyển thành đường vẽ (opentype.js) từ chính font của
 * trang, nên dấu tiếng Việt đúng mà không cần cài font trên máy build.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
// opentype.js là CommonJS: Node chỉ cho import mặc định.
import opentype, { type Font } from 'opentype.js'
import sharp from 'sharp'
import { type Corner, SHAPE, type Variant, bouquetMarkup } from '../src/components/decor/bouquet.ts'
import { FOIL_STOPS, MARBLE_COLORS, W as MARBLE_W, frame, washLayer } from '../src/components/decor/marble.ts'
import { share } from './share.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const W = share.imageWidth
const H = share.imageHeight

function font(pkg: string, file: string): Font {
  const buffer = readFileSync(join(root, 'node_modules', '@fontsource', pkg, 'files', file))
  return opentype.parse(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength))
}

/** Mỗi kiểu chữ = danh sách subset; ký tự nào không có ở subset đầu thì tìm ở subset sau. */
const SERIF = [font('cormorant-garamond', 'cormorant-garamond-latin-500-normal.woff'), font('cormorant-garamond', 'cormorant-garamond-vietnamese-500-normal.woff')]
const SERIF_ITALIC = [font('cormorant-garamond', 'cormorant-garamond-latin-500-italic.woff'), font('cormorant-garamond', 'cormorant-garamond-vietnamese-500-italic.woff')]
const SANS = [font('be-vietnam-pro', 'be-vietnam-pro-latin-500-normal.woff'), font('be-vietnam-pro', 'be-vietnam-pro-vietnamese-500-normal.woff')]
const NAMES = [font('pinyon-script', 'pinyon-script-latin-400-normal.woff'), font('pinyon-script', 'pinyon-script-vietnamese-400-normal.woff')]

interface Run {
  d: string
  width: number
}

interface Command {
  type: 'M' | 'L' | 'Q' | 'C' | 'Z'
  x?: number
  y?: number
  x1?: number
  y1?: number
  x2?: number
  y2?: number
}

/**
 * Lệnh vẽ glyph (đơn vị font, trục y hướng lên) → path SVG tại vị trí x, cỡ chữ `size`.
 * Tự dựng chuỗi thay vì dùng `Path.toPathData()` của opentype.js 2.0: hàm đó sinh "NaN" cho một
 * số toạ độ (ví dụ chữ "y" sau "ủ"), làm hỏng cả phần chữ phía sau.
 */
function glyphPath(commands: Command[], x: number, scale: number): string {
  const px = (value = 0) => (x + value * scale).toFixed(2)
  const py = (value = 0) => (-value * scale).toFixed(2)
  const d = commands
    .map((c) => {
      switch (c.type) {
        case 'M':
        case 'L':
          return `${c.type}${px(c.x)} ${py(c.y)}`
        case 'Q':
          return `Q${px(c.x1)} ${py(c.y1)} ${px(c.x)} ${py(c.y)}`
        case 'C':
          return `C${px(c.x1)} ${py(c.y1)} ${px(c.x2)} ${py(c.y2)} ${px(c.x)} ${py(c.y)}`
        default:
          return 'Z'
      }
    })
    .join('')
  if (d.includes('NaN')) throw new Error('Toạ độ glyph không hợp lệ (NaN) — ảnh OG sẽ hỏng')
  return d
}

/** Chuỗi chữ → path SVG tại gốc (0, baseline 0), có giãn chữ. */
function run(fonts: Font[], text: string, size: number, tracking = 0): Run {
  let x = 0
  const parts: string[] = []
  for (const char of text) {
    const face = fonts.find((candidate) => candidate.charToGlyphIndex(char) > 0) ?? fonts[0]
    const glyph = face.charToGlyph(char)
    const scale = size / face.unitsPerEm
    const commands = (glyph.path as unknown as { commands: Command[] }).commands
    parts.push(glyphPath(commands, x, scale))
    x += (glyph.advanceWidth ?? 0) * scale + tracking
  }
  return { d: parts.join(''), width: Math.max(0, x - tracking) }
}

function centered(r: Run, baseline: number, fill: string) {
  return `<path transform="translate(${((W - r.width) / 2).toFixed(1)} ${baseline})" d="${r.d}" fill="${fill}"/>`
}

// ── Nền: cùng bộ sinh với MarbleFrame (khung 1000 đơn vị, co lên bề ngang ảnh) ──
const marbleScale = W / MARBLE_W
const marble = frame(5, H / marbleScale)
const foil = FOIL_STOPS.map(([offset, color]) => `<stop offset="${offset}" stop-color="${color}"/>`).join('')
const background = `
  <rect width="${W}" height="${H}" fill="${MARBLE_COLORS.base}"/>
  <g transform="scale(${marbleScale})">
    <rect width="${MARBLE_W}" height="${H / marbleScale}" filter="url(#clouds)" opacity="0.18"/>
    ${washLayer(marble.washes, 5, 'light', 'ink')}
  </g>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <g transform="scale(${marbleScale})">
    <g fill="none" stroke="url(#foilTile)" stroke-linecap="round" stroke-linejoin="round" filter="url(#leaf)">
      ${marble.veins.map((v) => `<path d="${v.d}" stroke-width="${v.weight ? 1.4 : 0.9}" opacity="${v.weight ? 0.9 : 0.75}"/>`).join('')}
    </g>
    <path d="${marble.grit}" fill="${MARBLE_COLORS.grit}" opacity="0.35"/>
    <path d="${marble.specks}" fill="url(#foilTile)" opacity="0.95"/>
    <path d="${marble.glitter}" fill="url(#foilTile)" opacity="0.75"/>
  </g>`

// ── Hoa baby ở góc trên phải và dưới trái, như bìa ──
function sprig(corner: Corner, variant: Variant, seed: number, width: number, x: number, y: number) {
  const scale = width / SHAPE[variant].width
  return `<g transform="translate(${x} ${y}) scale(${scale})">${bouquetMarkup(seed, variant, corner, 'light', `f${seed}`)}</g>`
}
const sprayW = 380
const sprigH = 420
const sprigW = (sprigH * SHAPE.sprig.width) / SHAPE.sprig.height
const flowers = sprig('top-right', 'spray', 11, sprayW, W - sprayW, 0) + sprig('bottom-left', 'sprig', 23, sprigW, 0, H - sprigH)

// ── Tên nhũ vàng (Pinyon Script như bìa), "&" serif nghiêng ──
const nameSize = 116
const firstRun = run(NAMES, share.first, nameSize)
const secondRun = run(NAMES, share.second, nameSize)
const ampRun = run(SERIF_ITALIC, '&', 64)
const gap = 26
const namesWidth = firstRun.width + ampRun.width + secondRun.width + gap * 2
let x = (W - namesWidth) / 2
const namesBaseline = 352
const namesLeft = x
const names = [
  `<path transform="translate(${x.toFixed(1)} ${namesBaseline})" d="${firstRun.d}" fill="url(#gold)"/>`,
  `<path transform="translate(${(x += firstRun.width + gap).toFixed(1)} ${namesBaseline - 8})" d="${ampRun.d}" fill="#6e5a4b"/>`,
  `<path transform="translate(${(x += ampRun.width + gap).toFixed(1)} ${namesBaseline})" d="${secondRun.d}" fill="url(#gold)"/>`,
].join('')

// Shared vector monogram, also exported as the browser icon.
const seal = `<g transform="translate(${W / 2 - 48} 70) scale(0.96)">${sealMarkup('og', share.monogram)}</g>`
writeFileSync(join(root, 'public', 'favicon.svg'), sealSvg('favicon', share.monogram))

const eyebrow = run(SANS, 'LỄ THÀNH HÔN', 20, 5)
const date = run(SERIF, share.dateLine, 38, 2)
const tagline = run(SERIF_ITALIC, share.tagline, 30)

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <filter id="clouds" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.004 0.003" numOctaves="4" seed="5"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.39  0 0 0 0 0.33  0 0 0 -1.2 0.62"/>
    </filter>
    <filter id="leaf" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.4" numOctaves="1" seed="8" result="grain"/>
      <feDisplacementMap in="SourceGraphic" in2="grain" scale="4"/>
    </filter>
    <filter id="soft"><feGaussianBlur stdDeviation="4"/></filter>
    <linearGradient id="foil" x1="0" y1="0" x2="1" y2="1">${foil}</linearGradient>
    <pattern id="foilTile" width="160" height="160" patternUnits="userSpaceOnUse">
      <rect width="160" height="160" fill="url(#foil)"/>
    </pattern>
    <radialGradient id="glow" cx="50%" cy="52%" r="42%" gradientTransform="translate(0.5 0.52) scale(1 1.25) translate(-0.5 -0.52)">
      <stop offset="0" stop-color="${MARBLE_COLORS.glow}" stop-opacity="0.95"/>
      <stop offset="0.6" stop-color="${MARBLE_COLORS.glow}" stop-opacity="0.6"/>
      <stop offset="1" stop-color="${MARBLE_COLORS.glow}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="gold" gradientUnits="userSpaceOnUse" x1="${namesLeft}" y1="0" x2="${namesLeft + namesWidth}" y2="0">
      <stop offset="0" stop-color="#9a7637"/>
      <stop offset="0.3" stop-color="#c9a462"/>
      <stop offset="0.48" stop-color="#e2c88f"/>
      <stop offset="0.66" stop-color="#b48d4a"/>
      <stop offset="1" stop-color="#9a7637"/>
    </linearGradient>
    <radialGradient id="wax" cx="38%" cy="32%" r="75%">
      <stop offset="0" stop-color="#d9bf8c"/>
      <stop offset="0.55" stop-color="#c6a66b"/>
      <stop offset="1" stop-color="#9c7e45"/>
    </radialGradient>
  </defs>
  ${background}
  ${flowers}
  ${seal}
  ${centered(eyebrow, 218, '#6e5a4b')}
  ${names}
  <path d="M${W / 2 - 70} 400 H${W / 2 - 12} M${W / 2 + 12} 400 H${W / 2 + 70}" stroke="#c6a66b" stroke-width="1.2"/>
  <path d="M${W / 2} 394 L${W / 2 + 6} 400 L${W / 2} 406 L${W / 2 - 6} 400 Z" fill="#c6a66b" fill-opacity="0.6"/>
  ${centered(date, 462, '#302720')}
  ${share.tagline ? centered(tagline, 514, '#6e5a4b') : ''}
</svg>`

await sharp(Buffer.from(svg)).jpeg({ quality: 88, mozjpeg: true }).toFile(join(root, 'public', 'og.jpg'))
console.log(`OG ${W}×${H}: ${share.title}`)
