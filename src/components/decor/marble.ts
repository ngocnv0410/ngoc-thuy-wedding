/*
 * Sinh nền loang cẩm thạch + gân nhũ (thuần dữ liệu, không React/CSS): dùng cho MarbleFrame và
 * script sinh ảnh chia sẻ (scripts/generate-og.ts) — import có đuôi .ts để Node chạy thẳng.
 */
import { circlePath, seeded } from './random.ts'

/** Bề ngang khung vẽ; chiều cao theo tỉ lệ thật của section để hạt nhũ không bị kéo méo. */
export const W = 1000
/** Chiều cao một "trang" hoạ tiết (tỉ lệ màn hình điện thoại); section cao hơn lặp hoạ tiết. */
const PAGE = 1700

export interface Frame {
  washes: Array<{ cx: number; cy: number; rx: number; ry: number; shade: number }>
  veins: Array<{ d: string; weight: number }>
  specks: string
  glitter: string
  grit: string
}

interface Specks {
  specks: string[]
  glitter: string[]
  grit: string[]
}

type Point = [number, number]
type Rand = ReturnType<typeof seeded>

/**
 * Gân nhũ kiểu "mép mực loang" của mẫu 3: đi lần qua các điểm mốc, hướng đi có quán tính nên
 * uốn lượn mềm nhưng vẫn run gãy từng đoạn ngắn; thỉnh thoảng rẽ nhánh nhỏ. Dọc gân rắc dày
 * hạt nhũ to nhỏ thành một dải lấp lánh, quanh gân rải hạt sạn nâu như giấy vân đá.
 */
function vein(rand: Rand, waypoints: Point[], out: Specks, density: number): string[] {
  const paths: string[] = []
  let [x, y] = waypoints[0]
  let heading = Math.atan2(waypoints[1][1] - y, waypoints[1][0] - x)
  let d = `M${x.toFixed(1)} ${y.toFixed(1)}`
  for (const [tx, ty] of waypoints.slice(1)) {
    for (let guard = 0; guard < 400 && Math.hypot(tx - x, ty - y) > 14; guard++) {
      let turn = Math.atan2(ty - y, tx - x) - heading
      turn = Math.atan2(Math.sin(turn), Math.cos(turn))
      heading += turn * 0.3 + rand.range(-0.45, 0.45)
      const length = rand.range(6, 12)
      x += Math.cos(heading) * length
      y += Math.sin(heading) * length
      d += `L${x.toFixed(1)} ${y.toFixed(1)}`
      // Dải nhũ: hạt dồn sát gân theo phương vuông góc, thỉnh thoảng một hạt to.
      const nx = -Math.sin(heading)
      const ny = Math.cos(heading)
      for (let i = rand.int(density, density * 2); i > 0; i--) {
        const off = rand.range(-1, 1) ** 3 * 14
        const big = rand.next() < 0.08
        out.specks.push(circlePath(x + nx * off + rand.range(-4, 4), y + ny * off + rand.range(-4, 4), big ? rand.range(2.6, 4.2) : rand.range(1, 2.4)))
      }
      if (rand.next() < 0.5) out.glitter.push(circlePath(x + rand.range(-40, 40), y + rand.range(-40, 40), rand.range(0.9, 2)))
      for (let i = rand.int(0, 2); i > 0; i--) out.grit.push(circlePath(x + rand.range(-60, 60), y + rand.range(-60, 60), rand.range(0.8, 1.9)))
      // Nhánh rẽ ngắn như vết nứt của lá vàng.
      if (rand.next() < 0.05) {
        let [bx, by] = [x, y]
        let branchHeading = heading + (rand.next() < 0.5 ? -1 : 1) * rand.range(0.7, 1.3)
        let branch = `M${bx.toFixed(1)} ${by.toFixed(1)}`
        for (let s = rand.int(3, 7); s > 0; s--) {
          branchHeading += rand.range(-0.5, 0.5)
          bx += Math.cos(branchHeading) * rand.range(6, 12)
          by += Math.sin(branchHeading) * rand.range(6, 12)
          branch += `L${bx.toFixed(1)} ${by.toFixed(1)}`
          out.specks.push(circlePath(bx + rand.range(-4, 4), by + rand.range(-4, 4), rand.range(0.9, 2)))
        }
        paths.push(branch)
      }
    }
  }
  return [d, ...paths]
}

export function frame(seed: number, height: number): Frame {
  const rand = seeded(seed)
  const out: Specks = { specks: [], glitter: [], grit: [] }
  const veins: Frame['veins'] = []
  const washes: Frame['washes'] = []

  // Section cao chia thành nhiều "trang", trang lẻ lật ngang cho hoạ tiết không lặp đều.
  const pages = Math.max(1, Math.round(height / PAGE))
  const pageH = height / pages
  for (let page = 0; page < pages; page++) {
    const mirror = page % 2 === 1
    const at = (fx: number, fy: number): Point => [
      (mirror ? 1 - fx : fx) * W + rand.range(-12, 12),
      (page + fy) * pageH + rand.range(-12, 12),
    ]
    const wash = (fx: number, fy: number, rx: number, ry: number, shade: number) => {
      const [cx, cy] = at(fx, fy)
      washes.push({ cx, cy, rx: rx * rand.range(0.85, 1.15), ry: ry * rand.range(0.85, 1.15), shade })
    }

    // Mảng loang be-xám ôm mép trên trái, mép phải và góc dưới trái; giữa để sáng cho chữ.
    wash(0.04, 0.05, 300, 240, 0)
    wash(0.0, 0.28, 120, 220, 1)
    wash(1.0, 0.5, 140, 240, 0)
    wash(1.0, 0.72, 160, 260, 1)
    wash(0.98, 0.95, 230, 220, 0)
    wash(0.02, 0.98, 220, 170, 1)

    // Gân trên trái: từ mép trên chạy chéo xuống mép trái.
    for (const d of vein(rand, [at(0.3, -0.01), at(0.22, 0.07), at(0.12, 0.14), at(0.05, 0.2), at(-0.01, 0.27)], out, 3)) {
      veins.push({ d, weight: veins.length % 2 ? 0 : 1 })
    }
    for (const d of vein(rand, [at(0.15, -0.01), at(0.08, 0.05), at(-0.01, 0.11)], out, 2)) {
      veins.push({ d, weight: 0 })
    }
    // Gân dài dọc mép phải: từ giữa trang uốn lượn xuống đáy, có nhánh tách ra mép.
    for (const d of vein(rand, [at(0.95, 0.38), at(0.9, 0.5), at(0.92, 0.6), at(0.85, 0.72), at(0.84, 0.86), at(0.76, 1.01)], out, 3)) {
      veins.push({ d, weight: 1 })
    }
    for (const d of vein(rand, [at(0.91, 0.58), at(0.96, 0.68), at(1.01, 0.75)], out, 2)) {
      veins.push({ d, weight: 0 })
    }
  }

  return { washes, veins, specks: out.specks.join(''), glitter: out.glitter.join(''), grit: out.grit.join('') }
}

/** Màu mảng loang theo tông: [màu, độ đậm] cho shade 0 và 1. */
export const WASH_TONES = {
  light: [
    ['#d0c1b0', 0.6],
    ['#c8b7a4', 0.5],
  ],
  dark: [
    ['#5e4c3e', 0.6],
    ['#5e4c3e', 0.5],
  ],
} as const

export type Tone = 'light' | 'dark'

/**
 * Lớp mảng loang dạng chuỗi SVG (filter + nhóm elip): elip bị nhiễu đẩy lệch thành vệt màu nước
 * rồi làm mềm. Dùng cho ảnh của MarbleFrame và nhúng thẳng vào ảnh chia sẻ.
 */
export function washLayer(washes: Frame['washes'], seed: number, tone: Tone, filterId = 'i'): string {
  const shapes = washes
    .map((s) => {
      const [color, alpha] = WASH_TONES[tone][s.shade]
      return `<ellipse cx="${s.cx.toFixed(0)}" cy="${s.cy.toFixed(0)}" rx="${s.rx.toFixed(0)}" ry="${s.ry.toFixed(0)}" fill="${color}" fill-opacity="${alpha}"/>`
    })
    .join('')
  return (
    `<filter id="${filterId}" x="-30%" y="-30%" width="160%" height="160%">` +
    `<feTurbulence type="fractalNoise" baseFrequency="0.006" numOctaves="3" seed="${seed + 1}" result="n"/>` +
    `<feDisplacementMap in="SourceGraphic" in2="n" scale="150" xChannelSelector="R" yChannelSelector="G"/>` +
    `<feGaussianBlur stdDeviation="22"/></filter>` +
    `<g filter="url(#${filterId})">${shapes}</g>`
  )
}

/** Nhũ vàng của gân và hạt nhũ (stop của gradient chéo). */
export const FOIL_STOPS: Array<[number, string]> = [
  [0, '#b08d55'],
  [0.3, '#e6d0a3'],
  [0.55, '#bf9d63'],
  [0.8, '#efdcb4'],
  [1, '#b08d55'],
]

interface MarblePalette {
  base: string
  clouds: number
  glow: [string, string, string]
  mottle: number
  grit: string
}

/** Giấy kem ấm (mẫu 3); biến thể ánh nến: mép mocha, giữa espresso, nhũ vàng sáng. */
export const MARBLE_TONES: Record<Tone, MarblePalette> = {
  light: { base: '#ebe3da', clouds: 0.18, glow: ['#f6f2ec', '#f1ebe3', '#ebe5dc'], mottle: 0.3, grit: '#9c8669' },
  dark: { base: '#3a2f27', clouds: 0.35, glow: ['#2e251f', '#332a23', '#3a2f27'], mottle: 0.08, grit: '#9c8669' },
}

export const MARBLE_COLORS = { base: MARBLE_TONES.light.base, glow: MARBLE_TONES.light.glow[0], grit: MARBLE_TONES.light.grit } as const

/**
 * Lớp mềm của nền (giấy, vân mây, mảng loang, dải sáng giữa, lốm đốm sáng) thành SVG độc lập
 * khung W × height — vẽ vào canvas độ phân giải thấp (vốn đã mờ, không thấy khác).
 */
export function frameSoftSvg(data: Frame, seed: number, height: number, tone: Tone): string {
  const c = MARBLE_TONES[tone]
  const [inner, mid, outer] = c.glow
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${height}" width="${W}" height="${height}" preserveAspectRatio="none">` +
    `<defs>` +
    `<filter id="clouds" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.004 0.003" numOctaves="4" seed="${seed}"/>` +
    `<feColorMatrix type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.39  0 0 0 0 0.33  0 0 0 -1.2 0.62"/></filter>` +
    `<filter id="mottle" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.014 0.011" numOctaves="3" seed="${seed + 7}"/>` +
    `<feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 0.98  0 0 0 0 0.95  0 0 0 1.4 -0.62"/></filter>` +
    `<linearGradient id="glow" x1="0" y1="0" x2="1" y2="0">` +
    `<stop offset="0.06" stop-color="${outer}" stop-opacity="0"/><stop offset="0.26" stop-color="${mid}" stop-opacity="0.6"/>` +
    `<stop offset="0.5" stop-color="${inner}" stop-opacity="0.9"/><stop offset="0.74" stop-color="${mid}" stop-opacity="0.6"/>` +
    `<stop offset="0.94" stop-color="${outer}" stop-opacity="0"/></linearGradient>` +
    `</defs>` +
    `<rect width="${W}" height="${height}" fill="${c.base}"/>` +
    `<rect width="${W}" height="${height}" filter="url(#clouds)" opacity="${c.clouds}"/>` +
    washLayer(data.washes, seed, tone, 'ink') +
    // Dải giữa sáng kem cho chữ, mờ dần ra hai mép — không có đường viền.
    `<rect width="${W}" height="${height}" fill="url(#glow)"/>` +
    `<rect width="${W}" height="${height}" filter="url(#mottle)" opacity="${c.mottle}" style="mix-blend-mode:screen"/>` +
    `</svg>`
  )
}

/**
 * Lớp sắc nét (gân nhũ, hạt nhũ, hạt sạn) — không filter nào, nên hiển thị thẳng như ảnh SVG mà
 * cuộn vẫn nhẹ, và giữ nét ở mọi độ phân giải.
 */
export function frameCrispSvg(data: Frame, height: number, tone: Tone): string {
  const c = MARBLE_TONES[tone]
  const foil = FOIL_STOPS.map(([offset, color]) => `<stop offset="${offset}" stop-color="${color}"/>`).join('')
  const veins = data.veins
    .map((v) => `<path d="${v.d}" stroke-width="${v.weight ? 1.4 : 0.9}" opacity="${v.weight ? 0.9 : 0.75}" vector-effect="non-scaling-stroke"/>`)
    .join('')
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${height}" width="${W}" height="${height}" preserveAspectRatio="none">` +
    `<defs><linearGradient id="foil" x1="0" y1="0" x2="1" y2="1">${foil}</linearGradient>` +
    `<pattern id="foilTile" width="160" height="160" patternUnits="userSpaceOnUse"><rect width="160" height="160" fill="url(#foil)"/></pattern></defs>` +
    `<g fill="none" stroke="url(#foilTile)" stroke-linecap="round" stroke-linejoin="round">${veins}</g>` +
    `<path d="${data.grit}" fill="${c.grit}" opacity="0.35"/>` +
    `<path d="${data.specks}" fill="url(#foilTile)" opacity="0.95"/>` +
    `<path d="${data.glitter}" fill="url(#foilTile)" opacity="0.75"/>` +
    `</svg>`
  )
}
