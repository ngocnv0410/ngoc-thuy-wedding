import { type RefObject, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import styles from './MarbleFrame.module.css'
import { circlePath, seeded } from './random'

/** Bề ngang khung vẽ; chiều cao theo tỉ lệ thật của section để hạt nhũ không bị kéo méo. */
const W = 1000
/** Chiều cao một "trang" hoạ tiết (tỉ lệ màn hình điện thoại); section cao hơn lặp hoạ tiết. */
const PAGE = 1700

interface Frame {
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

function frame(seed: number, height: number): Frame {
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
const WASH_TONES = {
  light: [
    ['#d0c1b0', 0.6],
    ['#c8b7a4', 0.5],
  ],
  dark: [
    ['#5e4c3e', 0.6],
    ['#5e4c3e', 0.5],
  ],
} as const

/**
 * Mảng loang dựng thành ảnh SVG riêng (data URL): filter nhiễu + dịch chuyển rất nặng, để trong
 * SVG sống thì mỗi lần trang vẽ lại (vd. animation nhỏ ở nút cuộn) lại phải tính lại. Ảnh thì
 * trình duyệt rasterize một lần rồi dùng lại.
 */
function washImage(washes: Frame['washes'], height: number, seed: number, tone: 'light' | 'dark'): string {
  const shapes = washes
    .map((s) => {
      const [color, alpha] = WASH_TONES[tone][s.shade]
      return `<ellipse cx="${s.cx.toFixed(0)}" cy="${s.cy.toFixed(0)}" rx="${s.rx.toFixed(0)}" ry="${s.ry.toFixed(0)}" fill="${color}" fill-opacity="${alpha}"/>`
    })
    .join('')
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${height}" width="${W}" height="${height}" preserveAspectRatio="none">` +
    `<filter id="i" x="-30%" y="-30%" width="160%" height="160%">` +
    `<feTurbulence type="fractalNoise" baseFrequency="0.006" numOctaves="3" seed="${seed + 1}" result="n"/>` +
    `<feDisplacementMap in="SourceGraphic" in2="n" scale="150" xChannelSelector="R" yChannelSelector="G"/>` +
    `<feGaussianBlur stdDeviation="22"/></filter>` +
    `<g filter="url(#i)">${shapes}</g></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

/** Chiều cao khung vẽ theo tỉ lệ thật của phần tử (làm tròn, chỉ đổi khi lệch nhiều). */
function useFrameHeight(ref: RefObject<SVGSVGElement | null>) {
  const [height, setHeight] = useState(() => Math.round((W * window.innerHeight) / Math.max(1, window.innerWidth) / 50) * 50)
  useLayoutEffect(() => {
    const node = ref.current
    if (!node) return
    const update = () => {
      const { width, height: h } = node.getBoundingClientRect()
      if (!width || !h) return
      const next = Math.round((W * h) / width / 50) * 50
      setHeight((current) => (Math.abs(next - current) / current > 0.15 ? next : current))
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(node)
    return () => observer.disconnect()
  }, [ref])
  return height
}

interface MarbleFrameProps {
  seed?: number
  tone?: 'light' | 'dark'
  className?: string
}

/**
 * Nền theo mẫu tham khảo 3, vẽ lại bằng SVG: giấy kem sáng, mảng loang be-xám mép hữu cơ (nhiễu
 * dịch chuyển + làm mềm) ôm các mép, giữa sáng mờ dần, gân nhũ vàng mảnh gãy khúc lấm tấm.
 * Đặt làm lớp đầu tiên của section (`position: absolute; inset: 0`).
 */
export function MarbleFrame({ seed = 5, tone = 'light', className }: MarbleFrameProps) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const ref = useRef<SVGSVGElement>(null)
  const H = useFrameHeight(ref)
  const data = useMemo(() => frame(seed, H), [seed, H])
  const wash = useMemo(() => washImage(data.washes, H, seed, tone), [data, H, seed, tone])

  return (
    <svg
      ref={ref}
      className={[styles.frame, className].filter(Boolean).join(' ')}
      data-tone={tone}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        {/* Vân mây nhạt phủ toàn nền: nhiễu fractal tần số thấp, chỉ giữ kênh alpha. */}
        <filter id={`${id}-clouds`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.004 0.003" numOctaves="4" seed={seed} />
          <feColorMatrix type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.39  0 0 0 0 0.33  0 0 0 -1.2 0.62" />
        </filter>
        <filter id={`${id}-mottle`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.014 0.011" numOctaves="3" seed={seed + 7} />
          <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 0.98  0 0 0 0 0.95  0 0 0 1.4 -0.62" />
        </filter>
        {/* Gân nhũ: làm sần + đứt quãng nhẹ cho giống lá vàng vỡ. */}
        <filter id={`${id}-leaf`} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.4" numOctaves="1" seed={seed + 3} result="grain" />
          <feDisplacementMap in="SourceGraphic" in2="grain" scale="4" />
        </filter>
        <linearGradient id={`${id}-foil`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#b08d55" />
          <stop offset="0.3" stopColor="#e6d0a3" />
          <stop offset="0.55" stopColor="#bf9d63" />
          <stop offset="0.8" stopColor="#efdcb4" />
          <stop offset="1" stopColor="#b08d55" />
        </linearGradient>
        <pattern id={`${id}-foilTile`} width="160" height="160" patternUnits="userSpaceOnUse">
          <rect width="160" height="160" fill={`url(#${id}-foil)`} />
        </pattern>
        <linearGradient id={`${id}-glow`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0.06" className={styles.glowOuter} />
          <stop offset="0.26" className={styles.glowMid} />
          <stop offset="0.5" className={styles.glowInner} />
          <stop offset="0.74" className={styles.glowMid} />
          <stop offset="0.94" className={styles.glowOuter} />
        </linearGradient>
      </defs>

      <rect width={W} height={H} className={styles.base} />
      <rect width={W} height={H} filter={`url(#${id}-clouds)`} className={styles.clouds} data-anim="wash" />
      {/* Mảng loang: elip bị nhiễu đẩy lệch thành vệt màu nước rồi làm mềm (xem washImage). */}
      <image href={wash} width={W} height={H} preserveAspectRatio="none" data-anim="wash" />
      {/* Dải giữa sáng kem cho chữ, mờ dần ra hai mép — không có đường viền. */}
      <rect width={W} height={H} fill={`url(#${id}-glow)`} />
      <rect width={W} height={H} filter={`url(#${id}-mottle)`} className={styles.mottle} />

      <g filter={`url(#${id}-leaf)`} stroke={`url(#${id}-foilTile)`} className={styles.veins}>
        {data.veins.map((v, index) => (
          <path key={index} d={v.d} data-anim="vein" data-weight={v.weight} />
        ))}
      </g>
      <g data-anim="specks">
        <path d={data.grit} className={styles.grit} />
        <path d={data.specks} fill={`url(#${id}-foilTile)`} className={styles.specks} />
        <path d={data.glitter} fill={`url(#${id}-foilTile)`} className={styles.glitter} />
      </g>
    </svg>
  )
}
