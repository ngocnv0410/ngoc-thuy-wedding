import { sealMarkup, sealSvg } from '../src/components/sealArt.ts'
/**
 * Sinh ảnh xem trước khi chia sẻ link (public/og.jpg, 1200×630) theo đúng phong cách tờ thiệp:
 * nền loang cẩm thạch + gân nhũ vàng, lụa satin ở hai góc (dùng chung dữ liệu với trang),
 * dấu sáp, tên nhũ vàng, ngày. Chữ được chuyển thành đường vẽ (opentype.js) từ chính font của
 * trang, nên dấu tiếng Việt đúng mà không cần cài font trên máy build.
 */
import { mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
// opentype.js là CommonJS: Node chỉ cho import mặc định.
import opentype, { type Font } from 'opentype.js'
import sharp from 'sharp'
import { W as MARBLE_W, frame, frameSoftSvg, frameCrispSvg } from '../src/components/decor/marble.ts'
import { SATIN_ASSETS, type DrapeCorner } from '../src/components/decor/satin.ts'
import { share, shareImageVersion, versionedShareImage } from './share.ts'

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
const NAMES = [font('alex-brush', 'alex-brush-latin-400-normal.woff'), font('alex-brush', 'alex-brush-vietnamese-400-normal.woff')]

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

// Share the marble renderer and satin assets with the live invitation.
const marbleHeight = H * MARBLE_W / W
const marble = frame(5, marbleHeight)
const soft = await sharp(Buffer.from(frameSoftSvg(marble, 5, marbleHeight, 'light'))).resize(W, H).png().toBuffer()
const crisp = await sharp(Buffer.from(frameCrispSvg(marble, marbleHeight, 'light'))).resize(W, H).png().toBuffer()
const background = `<rect width="${W}" height="${H}" fill="#f8f4ec"/>
  <g opacity="0.38">
    <image width="${W}" height="${H}" href="data:image/png;base64,${soft.toString('base64')}"/>
    <image width="${W}" height="${H}" href="data:image/png;base64,${crisp.toString('base64')}"/>
  </g>`

async function satinCorner(corner: DrapeCorner) {
  const asset = SATIN_ASSETS[corner]
  // Use the same desktop scale and high-resolution source as SatinCorner.
  const image = await sharp(join(root, `public/images/decor/${asset.name}-6x.webp`))
    .resize({ width: Math.round(asset.width * 1.35) }).png().toBuffer({ resolveWithObject: true })
  const top = corner === 'top-left'
  const width = image.info.width
  const height = image.info.height
  const id = top ? 'satinTop' : 'satinBottom'
  const stops = (fade: number) => top
    ? `<stop offset="0" stop-color="white"/><stop offset="${1 - fade}" stop-color="white"/><stop offset="1" stop-color="black"/>`
    : `<stop offset="0" stop-color="black"/><stop offset="${fade}" stop-color="white"/><stop offset="1" stop-color="white"/>`
  return `<svg x="${top ? 0 : W - width}" y="${top ? 0 : H - height}" width="${width}" height="${height}">
    <defs>
      <linearGradient id="${id}X" x1="0" y1="0" x2="1" y2="0">${stops((top ? 28 : 32) / width)}</linearGradient>
      <linearGradient id="${id}Y" x1="0" y1="0" x2="0" y2="1">${stops(32 / height)}</linearGradient>
      <mask id="${id}MaskX"><rect width="100%" height="100%" fill="url(#${id}X)"/></mask>
      <mask id="${id}MaskY"><rect width="100%" height="100%" fill="url(#${id}Y)"/></mask>
    </defs>
    <g mask="url(#${id}MaskX)"><image width="100%" height="100%" mask="url(#${id}MaskY)" href="data:image/png;base64,${image.data.toString('base64')}"/></g>
  </svg>`
}
const drapes = (await Promise.all([satinCorner('top-left'), satinCorner('bottom-right')])).join('')

// ── Tên và "&" nhũ vàng (Alex Brush như bìa) ──
const nameSize = 116
const firstRun = run(NAMES, share.first, nameSize)
const secondRun = run(NAMES, share.second, nameSize)
const ampRun = run(NAMES, '&', 82)
const gap = 18
const namesWidth = firstRun.width + ampRun.width + secondRun.width + gap * 2
let x = (W - namesWidth) / 2
const namesBaseline = 352
const namesLeft = x
const names = [
  `<path transform="translate(${x.toFixed(1)} ${namesBaseline})" d="${firstRun.d}" fill="url(#gold)"/>`,
  `<path transform="translate(${(x += firstRun.width + gap).toFixed(1)} ${namesBaseline})" d="${ampRun.d}" fill="url(#gold)"/>`,
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
    <linearGradient id="gold" gradientUnits="userSpaceOnUse" x1="${namesLeft}" y1="0" x2="${namesLeft + namesWidth}" y2="0">
      <stop offset="0" stop-color="#795929"/>
      <stop offset="0.3" stop-color="#ac8245"/>
      <stop offset="0.48" stop-color="#bd975d"/>
      <stop offset="0.66" stop-color="#96703b"/>
      <stop offset="1" stop-color="#795929"/>
    </linearGradient>
    <radialGradient id="wax" cx="38%" cy="32%" r="75%">
      <stop offset="0" stop-color="#d9bf8c"/>
      <stop offset="0.55" stop-color="#c6a66b"/>
      <stop offset="1" stop-color="#9c7e45"/>
    </radialGradient>
  </defs>
  ${background}
  ${drapes}
  ${seal}
  ${centered(eyebrow, 218, '#6e5a4b')}
  ${names}
  <path d="M${W / 2 - 70} 400 H${W / 2 - 12} M${W / 2 + 12} 400 H${W / 2 + 70}" stroke="#c6a66b" stroke-width="1.2"/>
  <path d="M${W / 2} 394 L${W / 2 + 6} 400 L${W / 2} 406 L${W / 2 - 6} 400 Z" fill="#c6a66b" fill-opacity="0.6"/>
  ${centered(date, 462, '#302720')}
  ${share.tagline ? centered(tagline, 514, '#6e5a4b') : ''}
</svg>`

const jpeg = await sharp(Buffer.from(svg)).jpeg({ quality: 88, mozjpeg: true }).toBuffer()
// Retain the previous image URL for already-shared links, and publish a fresh cache key.
writeFileSync(join(root, 'public', 'og.jpg'), jpeg)
const socialDirectory = join(root, 'public', 'social')
mkdirSync(socialDirectory, { recursive: true })
for (const file of readdirSync(socialDirectory)) {
  if (/^wedding-[a-f0-9]{12}\.jpg$/.test(file)) unlinkSync(join(socialDirectory, file))
}
writeFileSync(join(root, 'public', versionedShareImage(shareImageVersion(jpeg))), jpeg)
console.log(`OG ${W}×${H}: ${share.title}`)
