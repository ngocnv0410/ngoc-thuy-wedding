/*
 * Sinh hoạ tiết hoa baby khô (thuần dữ liệu, không React/CSS): dùng cho component BabysBreath
 * và script sinh ảnh chia sẻ (scripts/generate-og.ts) — import có đuôi .ts để Node chạy thẳng.
 */
import { circlePath, seeded } from './random.ts'

export type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
/** spray: chùm dày hình vòm toả từ góc; sprig: vài cành cao vươn dọc mép. */
export type Variant = 'spray' | 'sprig'

export interface Bouquet {
  width: number
  height: number
  /** Mỗi cành chính một path (thân + nhánh con) để animation vẽ cành lần lượt. */
  stems: string[]
  twigs: string
  shadow: string
  /** Lớp sau (mờ như ngoài độ sâu ảnh chụp) và lớp trước, mỗi lớp tách theo màu. */
  back: Layer
  front: Layer
}

export interface Layer {
  base: string
  petals: string
  dried: string
  driedPetals: string
  light: string
  centers: string
}

export const SHAPE: Record<Variant, { width: number; height: number }> = {
  spray: { width: 400, height: 400 },
  sprig: { width: 240, height: 560 },
}

const f = (n: number) => n.toFixed(1)

/**
 * Bó hoa baby khô vẽ thủ tục, theo cấu trúc thật của cây: cành chính cong, dọc cành mọc chùm
 * hoa; mỗi chùm phân nhánh đôi nhiều tầng nên các bông dồn thành vòm xốp. Mỗi bông gồm thân
 * màu tan, 5 cánh kem, điểm sáng phía nguồn sáng và nhuỵ nâu; bóng đổ mềm xuống giấy.
 * Gốc toạ độ ở góc dưới trái, cành vươn lên phía trên phải; góc khác dùng lật hình — (sx, sy)
 * là dấu của phép lật để điểm sáng/bóng đổ luôn theo nguồn sáng trên trái của màn hình.
 */
export function bouquet(seed: number, variant: Variant, sx: number, sy: number): Bouquet {
  const rand = seeded(seed)
  const { width, height } = SHAPE[variant]
  const stems: string[] = []
  const twigs: string[] = []
  const shadow: string[] = []
  const layers = { back: emptyLayer(), front: emptyLayer() }

  const floret = (x: number, y: number, r: number, back: boolean) => {
    const layer = back ? layers.back : layers.front
    const dried = rand.next() < 0.2
    if (!back) shadow.push(circlePath(x + 0.5 * r * sx, y + 0.7 * r * sy, r * 0.95))
    ;(dried ? layer.dried : layer.base).push(circlePath(x, y, r * 0.8))
    // Cánh xù: 5–6 cánh lệch cỡ; cánh hướng về nguồn sáng (trên trái màn hình) sáng hơn.
    const count = rand.int(5, 6)
    const turn = rand.range(0, Math.PI * 2)
    for (let p = 0; p < count; p++) {
      const a = turn + (p * Math.PI * 2) / count
      const px = Math.cos(a)
      const py = Math.sin(a)
      const lit = -(px * sx + py * sy) > -0.2
      const petals = dried ? layer.driedPetals : lit ? layer.light : layer.petals
      const reach = r * rand.range(0.5, 0.68)
      petals.push(circlePath(x + px * reach, y + py * reach, r * rand.range(0.36, 0.5)))
    }
    layer.centers.push(circlePath(x + rand.range(-0.15, 0.15) * r, y + rand.range(-0.15, 0.15) * r, r * rand.range(0.2, 0.32)))
  }

  /** Chùm hoa: phân nhánh đôi từ (x, y) theo hướng angle; đầu nhánh cuối là bông. */
  const panicle = (x: number, y: number, angle: number, length: number, depth: number, out: string[], scale: number) => {
    const bend = rand.range(-0.25, 0.25)
    const ex = x + Math.cos(angle + bend) * length
    const ey = y + Math.sin(angle + bend) * length
    out.push(`M${f(x)} ${f(y)}L${f(ex)} ${f(ey)}`)
    if (depth === 0 || length < 3) {
      floret(ex, ey, rand.range(5, 7.6) * scale, rand.next() < 0.28)
      return
    }
    const children = rand.next() < 0.25 ? 3 : 2
    const spread = rand.range(0.4, 0.8)
    for (let c = 0; c < children; c++) {
      const offset = children === 2 ? (c === 0 ? -spread : spread) : (c - 1) * spread
      panicle(ex, ey, angle + offset + rand.range(-0.15, 0.15), length * rand.range(0.6, 0.78), depth - 1, out, scale)
    }
    // Vài bông nhú ngay ở chạc cho chùm đầy.
    if (rand.next() < 0.35) floret(ex + rand.range(-4, 4), ey + rand.range(-4, 4), rand.range(4.2, 6) * scale, true)
  }

  const mainStem = (x0: number, y0: number, angle: number, length: number, scale: number) => {
    const sway = rand.range(-0.22, 0.22)
    const x2 = x0 + Math.cos(angle) * length
    const y2 = y0 + Math.sin(angle) * length
    const cx = (x0 + x2) / 2 + Math.cos(angle + Math.PI / 2) * length * sway
    const cy = (y0 + y2) / 2 + Math.sin(angle + Math.PI / 2) * length * sway
    const point = (t: number): [number, number] => [
      (1 - t) ** 2 * x0 + 2 * (1 - t) * t * cx + t ** 2 * x2,
      (1 - t) ** 2 * y0 + 2 * (1 - t) * t * cy + t ** 2 * y2,
    ]
    const tangent = (t: number) => Math.atan2(2 * (1 - t) * (cy - y0) + 2 * t * (y2 - cy), 2 * (1 - t) * (cx - x0) + 2 * t * (x2 - cx))

    const path: string[] = [`M${f(x0)} ${f(y0)}Q${f(cx)} ${f(cy)} ${f(x2)} ${f(y2)}`]
    const fine: string[] = []
    // Chùm ở ngọn.
    panicle(x2, y2, angle + rand.range(-0.2, 0.2), rand.range(20, 28) * scale, 3, fine, scale)
    // Chùm dọc thân, dày dần về phía ngọn.
    const count = variant === 'spray' ? rand.int(3, 4) : rand.int(6, 8)
    for (let i = 0; i < count; i++) {
      const t = rand.range(variant === 'spray' ? 0.4 : 0.25, 0.92)
      const [bx, by] = point(t)
      const side = rand.next() > 0.5 ? 1 : -1
      const a = tangent(t) + side * rand.range(0.45, 1)
      const reach = rand.range(16, 26) * scale * (0.6 + t * 0.5)
      panicle(bx, by, a, reach, t > 0.6 ? 3 : 2, fine, scale)
    }
    stems.push(path.join(''))
    twigs.push(fine.join(''))
  }

  if (variant === 'spray') {
    // Toả quạt từ một điểm sát mép (như mẫu: cành đi ngang, chéo, tới thẳng xuống).
    const count = rand.int(9, 11)
    for (let s = 0; s < count; s++) {
      const angle = 0.3 - ((s + rand.range(0.1, 0.9)) / count) * 1.95
      mainStem(rand.range(-6, 6), height - 70 + rand.range(-8, 8), angle, rand.range(130, 250), rand.range(0.9, 1.1))
    }
  } else {
    const count = rand.int(4, 5)
    for (let s = 0; s < count; s++) {
      const angle = -Math.PI / 2 + rand.range(0.02, 0.32)
      mainStem(rand.range(4, 60), height + 4, angle, rand.range(330, 540), rand.range(1.15, 1.35))
    }
  }

  return {
    width,
    height,
    stems,
    twigs: twigs.join(''),
    shadow: shadow.join(''),
    back: joinLayer(layers.back),
    front: joinLayer(layers.front),
  }
}

function emptyLayer() {
  return { base: [], petals: [], dried: [], driedPetals: [], light: [], centers: [] } as Record<keyof Layer, string[]>
}

function joinLayer(layer: Record<keyof Layer, string[]>): Layer {
  return Object.fromEntries(Object.entries(layer).map(([key, parts]) => [key, parts.join('')])) as unknown as Layer
}

export function flip(corner: Corner, width: number, height: number): { transform: string; sx: number; sy: number } {
  switch (corner) {
    case 'bottom-right':
      return { transform: `translate(${width} 0) scale(-1 1)`, sx: -1, sy: 1 }
    case 'top-left':
      return { transform: `translate(0 ${height}) scale(1 -1)`, sx: 1, sy: -1 }
    case 'top-right':
      return { transform: `translate(${width} ${height}) scale(-1 -1)`, sx: -1, sy: -1 }
    default:
      return { transform: '', sx: 1, sy: 1 }
  }
}

export type Tone = 'light' | 'dark'

/** [màu, độ đậm] — tách riêng độ đậm để mọi trình vẽ SVG (cả librsvg của script build) hiểu. */
type Paint = readonly [string, number]

interface Palette {
  stem: Paint
  twig: Paint
  shadow: Paint
  base: Paint
  petals: Paint
  dried: Paint
  driedPetals: Paint
  light: Paint
  center: Paint
}

/** Hoa baby sấy: cành nâu mảnh, bông kem ngà, xen bông khô ngả nâu; nền ánh nến: cành vàng nhạt, hoa kem sáng. */
const LIGHT: Palette = {
  stem: ['#ab9271', 1],
  twig: ['#b59d7c', 1],
  shadow: ['#6e563c', 0.2],
  base: ['#bf9f76', 1],
  petals: ['#dcc6a6', 1],
  dried: ['#a88d6d', 1],
  driedPetals: ['#c9ae86', 1],
  light: ['#f3e9d9', 1],
  center: ['#b08f66', 1],
}

export const BOUQUET_TONES: Record<Tone, Palette> = {
  light: LIGHT,
  dark: { ...LIGHT, stem: ['#c6a66b', 0.7], twig: ['#c6a66b', 0.7], shadow: ['#000000', 0.35], petals: ['#f3ead9', 1], center: ['#c6a66b', 1] },
}

const fill = ([color, alpha]: Paint) => `fill="${color}"${alpha < 1 ? ` fill-opacity="${alpha}"` : ''}`
const stroke = ([color, alpha]: Paint, width: number) =>
  `fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round"${alpha < 1 ? ` stroke-opacity="${alpha}"` : ''}`

/**
 * Bó hoa dạng chuỗi SVG (filter + các lớp, chưa có thẻ <svg> ngoài), màu ghi thẳng vào thuộc
 * tính. `id` làm tiền tố cho filter để nhúng nhiều bó vào một SVG (ảnh chia sẻ).
 */
export function bouquetMarkup(seed: number, variant: Variant, corner: Corner, tone: Tone, id = 'b'): string {
  const { width, height } = SHAPE[variant]
  const { transform, sx, sy } = flip(corner, width, height)
  const data = bouquet(seed, variant, sx, sy)
  const c = BOUQUET_TONES[tone]
  const layer = (l: Layer) =>
    `<path d="${l.base}" ${fill(c.base)}/><path d="${l.dried}" ${fill(c.dried)}/><path d="${l.petals}" ${fill(c.petals)}/>` +
    `<path d="${l.driedPetals}" ${fill(c.driedPetals)}/><path d="${l.light}" ${fill(c.light)}/><path d="${l.centers}" ${fill(c.center)}/>`
  return (
    `<filter id="${id}-soft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="2.2"/></filter>` +
    `<filter id="${id}-depth" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="0.9"/></filter>` +
    `<g transform="${transform}">` +
    data.stems.map((d) => `<path d="${d}" ${stroke(c.stem, 1)}/>`).join('') +
    `<path d="${data.twigs}" ${stroke(c.twig, 0.6)}/>` +
    `<path d="${data.shadow}" ${fill(c.shadow)} filter="url(#${id}-soft)"/>` +
    `<g filter="url(#${id}-depth)" opacity="0.82">${layer(data.back)}</g>` +
    layer(data.front) +
    `</g>`
  )
}

/** Bó hoa thành một tệp SVG độc lập — hiển thị như ảnh (rasterize một lần, cuộn không vẽ lại). */
export function bouquetSvg(seed: number, variant: Variant, corner: Corner, tone: Tone): string {
  const { width, height } = SHAPE[variant]
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" overflow="visible">` +
    bouquetMarkup(seed, variant, corner, tone) +
    `</svg>`
  )
}
