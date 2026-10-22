import { useId, useMemo } from 'react'
import styles from './MarbleWash.module.css'
import { circlePath, seeded } from './random'

export type Edge = 'left' | 'right' | 'top' | 'bottom'

/** Chiều dài theo mép (L) và độ sâu vào trong (D) của khung vẽ. */
const L = 1000
const D = 400

interface Wash {
  outer: string
  inner: string
  highlight: string
  veins: string[]
  specks: string
}

/** Đường cong mượt qua các điểm (Catmull-Rom → Bézier bậc ba). */
function smooth(points: Array<[number, number]>): string {
  let d = `M${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[Math.max(0, i - 1)]
    const [x1, y1] = points[i]
    const [x2, y2] = points[i + 1]
    const [x3, y3] = points[Math.min(points.length - 1, i + 2)]
    const c1x = x1 + (x2 - x0) / 6
    const c1y = y1 + (y2 - y0) / 6
    const c2x = x2 - (x3 - x1) / 6
    const c2y = y2 - (y3 - y1) / 6
    d += `C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`
  }
  return d
}

/**
 * Mảng loang kiểu mực/cẩm thạch dọc theo một mép (theo mẫu 2 & 3): lớp be-xám mờ, vệt taupe
 * đậm hơn, dải kem sáng, và gân nhũ vàng chạy theo mép loang. Vẽ ở hệ (t = dọc mép, d = sâu
 * vào trong) rồi đổi sang toạ độ thật theo mép cần đặt.
 */
function wash(seed: number, edge: Edge): Wash {
  const rand = seeded(seed)
  const phase = [rand.range(0, 6), rand.range(0, 6), rand.range(0, 6)]
  const depth = (t: number, base: number, amp: number, k = 0) =>
    base + amp * Math.sin(t / 170 + phase[k]) + amp * 0.55 * Math.sin(t / 61 + phase[(k + 1) % 3])

  const toXY = (t: number, d: number): [number, number] => {
    switch (edge) {
      case 'left':
        return [d, t]
      case 'right':
        return [D - d, t]
      case 'top':
        return [t, d]
      default:
        return [t, D - d]
    }
  }

  const curve = (base: number, amp: number, k = 0) => {
    const points: Array<[number, number]> = []
    for (let t = -20; t <= L + 20; t += 25) points.push(toXY(t, Math.max(4, depth(t, base, amp, k))))
    return points
  }
  // Vùng kín: từ mép (d = 0) tới đường cong.
  const region = (points: Array<[number, number]>) => {
    const start = toXY(-20, 0)
    const end = toXY(L + 20, 0)
    return `${smooth(points)}L${end[0]} ${end[1]}L${start[0]} ${start[1]}Z`
  }

  const outerCurve = curve(150, 55, 0)
  const innerCurve = curve(78, 34, 1)
  const highlightCurve = curve(112, 22, 2)

  // Hạt nhũ vàng rải dọc gân chính.
  const specks: string[] = []
  for (let i = 0; i < 70; i++) {
    const t = rand.range(0, L)
    const d = depth(t, 150, 55, 0) + rand.range(-10, 14)
    const [x, y] = toXY(t, d)
    specks.push(circlePath(x, y, rand.range(0.5, 1.6)))
  }

  return {
    outer: region(outerCurve),
    inner: region(innerCurve),
    highlight: smooth(highlightCurve),
    veins: [smooth(outerCurve), smooth(innerCurve), smooth(curve(150 + 8, 50, 0))],
    specks: specks.join(''),
  }
}

interface MarbleWashProps {
  edge: Edge
  seed?: number
  tone?: 'light' | 'dark'
  className?: string
}

export function MarbleWash({ edge, seed = 3, tone = 'light', className }: MarbleWashProps) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const data = useMemo(() => wash(seed, edge), [seed, edge])
  const vertical = edge === 'left' || edge === 'right'

  return (
    <svg
      className={[styles.wash, className].filter(Boolean).join(' ')}
      data-edge={edge}
      data-tone={tone}
      viewBox={vertical ? `0 0 ${D} ${L}` : `0 0 ${L} ${D}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        {/* Mép loang hữu cơ: nhiễu + dịch chuyển + làm mềm. */}
        <filter id={`${id}-ink`} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.011" numOctaves="3" seed={seed} result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="38" />
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <linearGradient id={`${id}-foil`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#9a7637" />
          <stop offset="0.35" stopColor="#d9bd84" />
          <stop offset="0.6" stopColor="#b48d4a" />
          <stop offset="1" stopColor="#e2c88f" />
        </linearGradient>
      </defs>
      <g filter={`url(#${id}-ink)`} data-anim="wash">
        <path d={data.outer} className={styles.outer} />
        <path d={data.inner} className={styles.inner} />
        <path d={data.highlight} className={styles.highlight} />
      </g>
      <g stroke={`url(#${id}-foil)`} className={styles.veins}>
        {data.veins.map((d, index) => (
          <path key={index} d={d} data-anim="vein" data-weight={index} />
        ))}
      </g>
      <path d={data.specks} fill={`url(#${id}-foil)`} className={styles.specks} data-anim="specks" />
    </svg>
  )
}
