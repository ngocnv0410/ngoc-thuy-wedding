/**
 * Sinh ảnh xem trước khi chia sẻ link (public/og.jpg, 1200×630) — bìa typography giống trang:
 * khung chỉ vàng đôi, dấu sáp, tên, ngày. Chữ được chuyển thành đường vẽ (opentype.js) từ chính
 * font của trang, nên dấu tiếng Việt đúng mà không cần cài font trên máy build.
 * Khi có ảnh bìa, có thể đổi sang ảnh chụp.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
// opentype.js là CommonJS: Node chỉ cho import mặc định.
import opentype, { type Font } from 'opentype.js'
import sharp from 'sharp'
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
const SCRIPT = [font('great-vibes', 'great-vibes-latin-400-normal.woff')]

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

// ── Tên: [first] & [second] trên một dòng ──
const nameSize = 128
const firstRun = run(SERIF, share.first, nameSize)
const secondRun = run(SERIF, share.second, nameSize)
const ampRun = run(SCRIPT, '&', 92)
const gap = 30
const namesWidth = firstRun.width + ampRun.width + secondRun.width + gap * 2
let x = (W - namesWidth) / 2
const namesBaseline = 382
const names = [
  `<path transform="translate(${x.toFixed(1)} ${namesBaseline})" d="${firstRun.d}" fill="#302720"/>`,
  `<path transform="translate(${(x += firstRun.width + gap).toFixed(1)} ${namesBaseline - 6})" d="${ampRun.d}" fill="#c6a66b"/>`,
  `<path transform="translate(${(x += ampRun.width + gap).toFixed(1)} ${namesBaseline})" d="${secondRun.d}" fill="#302720"/>`,
].join('')

// ── Dấu sáp nhỏ ──
const [mLeft, mRight] = share.monogram.split('&').map((part) => part.trim())
const sealCx = W / 2
const sealCy = 150
const sealLetters = run(SERIF, `${mLeft ?? ''}   ${mRight ?? ''}`, 30, 0)
const sealAmp = run(SCRIPT, '&', 26)
const seal = `
  <circle cx="${sealCx}" cy="${sealCy + 4}" r="47" fill="rgba(48,39,32,0.18)" filter="url(#soft)"/>
  <circle cx="${sealCx}" cy="${sealCy}" r="46" fill="url(#wax)"/>
  <circle cx="${sealCx}" cy="${sealCy}" r="33" fill="none" stroke="rgba(243,230,200,0.6)" stroke-width="1.2"/>
  <path transform="translate(${(sealCx - sealLetters.width / 2).toFixed(1)} ${sealCy + 10})" d="${sealLetters.d}" fill="#5a4523" fill-opacity="0.85"/>
  <path transform="translate(${(sealCx - sealAmp.width / 2).toFixed(1)} ${sealCy + 9})" d="${sealAmp.d}" fill="#5a4523" fill-opacity="0.85"/>`

const eyebrow = run(SANS, `THIỆP MỜI CƯỚI · ${share.year}`, 20, 5)
const date = run(SERIF, share.dateLine, 38, 2)
const tagline = run(SERIF_ITALIC, share.tagline, 30)

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="light" cx="18%" cy="8%" r="80%">
      <stop offset="0" stop-color="#fffaf0"/>
      <stop offset="0.7" stop-color="#f8f4ec" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="wax" cx="38%" cy="32%" r="75%">
      <stop offset="0" stop-color="#d9bf8c"/>
      <stop offset="0.55" stop-color="#c6a66b"/>
      <stop offset="1" stop-color="#9c7e45"/>
    </radialGradient>
    <filter id="soft"><feGaussianBlur stdDeviation="4"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="#f8f4ec"/>
  <rect width="${W}" height="${H}" fill="url(#light)"/>
  <rect x="36" y="36" width="${W - 72}" height="${H - 72}" fill="none" stroke="#c6a66b" stroke-opacity="0.7" stroke-width="1.5"/>
  <rect x="48" y="48" width="${W - 96}" height="${H - 96}" fill="none" stroke="#c6a66b" stroke-opacity="0.35" stroke-width="1.5"/>
  ${seal}
  ${centered(eyebrow, 252, '#6b5d50')}
  ${names}
  <path d="M${W / 2 - 60} 420 H${W / 2 - 10} M${W / 2 + 10} 420 H${W / 2 + 60}" stroke="#c6a66b" stroke-width="1.2"/>
  <path d="M${W / 2} 415 L${W / 2 + 5} 420 L${W / 2} 425 L${W / 2 - 5} 420 Z" fill="#c6a66b" fill-opacity="0.5"/>
  ${centered(date, 478, '#302720')}
  ${share.tagline ? centered(tagline, 530, '#6b5d50') : ''}
</svg>`

await sharp(Buffer.from(svg)).jpeg({ quality: 88, mozjpeg: true }).toFile(join(root, 'public', 'og.jpg'))
console.log(`OG ${W}×${H}: ${share.title}`)
