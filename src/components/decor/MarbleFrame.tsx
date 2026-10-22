import { useId, useMemo } from 'react'
import styles from './MarbleFrame.module.css'
import { circlePath, seeded } from './random'

/** Khung vẽ dọc (gần tỉ lệ màn hình điện thoại), kéo giãn theo section. */
const W = 1000
const H = 1600

interface Frame {
  smudges: Array<{ cx: number; cy: number; rx: number; ry: number; shade: number }>
  veins: Array<{ d: string; weight: number }>
  flecks: string
}

/**
 * Gân nhũ vàng kiểu "mép mực loang" của mẫu 3: đường đi ngẫu nhiên gồm nhiều đoạn ngắn, đổi
 * hướng liên tục (gãy khúc, ngoằn ngoèo), có nhánh rẽ; dọc gân rải hạt nhũ li ti.
 */
function vein(
  rand: ReturnType<typeof seeded>,
  start: [number, number],
  heading: number,
  steps: number,
  flecks: string[],
  drift = 0,
): string {
  let [x, y] = start
  let angle = heading
  let d = `M${x.toFixed(1)} ${y.toFixed(1)}`
  for (let i = 0; i < steps; i++) {
    angle += rand.range(-0.55, 0.55) + drift
    angle = heading + Math.max(-1.1, Math.min(1.1, angle - heading))
    const length = rand.range(6, 18)
    x += Math.cos(angle) * length
    y += Math.sin(angle) * length
    d += `L${x.toFixed(1)} ${y.toFixed(1)}`
    if (rand.next() < 0.55) {
      flecks.push(circlePath(x + rand.range(-12, 12), y + rand.range(-12, 12), rand.range(0.6, 2.1)))
    }
  }
  return d
}

function frame(seed: number): Frame {
  const rand = seeded(seed)
  const flecks: string[] = []
  const veins: Frame['veins'] = []

  // Vệt mực đậm/nhạt sát mép (giữa để sáng cho chữ).
  const smudges: Frame['smudges'] = [
    { cx: 120, cy: 160, rx: 260, ry: 300, shade: 0 },
    { cx: 40, cy: 760, rx: 180, ry: 420, shade: 1 },
    { cx: 960, cy: 520, rx: 190, ry: 360, shade: 0 },
    { cx: 930, cy: 1300, rx: 240, ry: 360, shade: 1 },
    { cx: 120, cy: 1450, rx: 260, ry: 260, shade: 2 },
    { cx: 760, cy: 40, rx: 300, ry: 160, shade: 2 },
  ].map((s) => ({ ...s, cx: s.cx + rand.range(-30, 30), cy: s.cy + rand.range(-40, 40) }))

  // Gân trên trái: từ mép trên chạy chéo xuống trái, có nhánh.
  veins.push({ d: vein(rand, [rand.range(250, 300), -10], Math.PI * 0.62, 34, flecks, 0.004), weight: 2 })
  veins.push({ d: vein(rand, [rand.range(120, 170), 120], Math.PI * 0.5, 20, flecks), weight: 1 })
  veins.push({ d: vein(rand, [rand.range(30, 80), 300], Math.PI * 0.45, 14, flecks), weight: 0 })
  // Gân dài dọc mép phải: từ giữa xuống đáy, uốn vào trong rồi ra ngoài.
  veins.push({ d: vein(rand, [rand.range(900, 940), 520], Math.PI * 0.56, 70, flecks), weight: 2 })
  veins.push({ d: vein(rand, [rand.range(860, 900), 860], Math.PI * 0.6, 34, flecks), weight: 1 })
  veins.push({ d: vein(rand, [rand.range(700, 760), 1400], Math.PI * 0.62, 16, flecks), weight: 0 })

  // Hạt nhũ rải rác thêm ở các vùng mép.
  for (let i = 0; i < 90; i++) {
    const nearLeft = rand.next() < 0.45
    const x = nearLeft ? rand.range(0, 320) : rand.range(680, W)
    const y = nearLeft ? rand.range(0, 520) : rand.range(420, H)
    flecks.push(circlePath(x, y, rand.range(0.5, 1.5)))
  }

  return { smudges, veins, flecks: flecks.join('') }
}

interface MarbleFrameProps {
  seed?: number
  tone?: 'light' | 'dark'
  className?: string
}

/**
 * Nền theo mẫu tham khảo 3, vẽ lại bằng SVG: be-xám loang dạng mây (nhiễu fractal tần số thấp),
 * giữa sáng kem mờ dần không viền, vệt mực sát mép, gân nhũ vàng gãy khúc lấm tấm.
 * Đặt làm lớp đầu tiên của section (`position: absolute; inset: 0`).
 */
export function MarbleFrame({ seed = 5, tone = 'light', className }: MarbleFrameProps) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const data = useMemo(() => frame(seed), [seed])

  return (
    <svg
      className={[styles.frame, className].filter(Boolean).join(' ')}
      data-tone={tone}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        {/* Mây loang: nhiễu fractal → chỉ giữ kênh alpha nhạt để phủ vệt sáng/tối mềm. */}
        <filter id={`${id}-clouds`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.0035 0.0028" numOctaves="4" seed={seed} />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.42  0 0 0 0 0.36  0 0 0 0 0.30  0 0 0 -1.1 0.62"
          />
        </filter>
        <filter id={`${id}-mottle`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.009" numOctaves="3" seed={seed + 7} />
          <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 0.98  0 0 0 0 0.95  0 0 0 1.4 -0.62" />
        </filter>
        <filter id={`${id}-blur`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="60" />
        </filter>
        {/* Gân nhũ: làm sần + đứt quãng nhẹ cho giống lá vàng vỡ. */}
        <filter id={`${id}-leaf`} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.35" numOctaves="1" seed={seed + 3} result="grain" />
          <feDisplacementMap in="SourceGraphic" in2="grain" scale="5" />
        </filter>
        <linearGradient id={`${id}-foil`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a8854a" />
          <stop offset="0.25" stopColor="#e2cb9c" />
          <stop offset="0.5" stopColor="#b9965c" />
          <stop offset="0.75" stopColor="#ecd8ad" />
          <stop offset="1" stopColor="#a8854a" />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="50%" cy="48%" r="50%">
          <stop offset="0" className={styles.glowInner} />
          <stop offset="0.65" className={styles.glowMid} />
          <stop offset="1" className={styles.glowOuter} />
        </radialGradient>
      </defs>

      <rect width={W} height={H} className={styles.base} />
      <rect width={W} height={H} filter={`url(#${id}-clouds)`} className={styles.clouds} data-anim="wash" />
      <g filter={`url(#${id}-blur)`} data-anim="wash">
        {data.smudges.map((s, index) => (
          <ellipse key={index} cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} className={styles.smudge} data-shade={s.shade} />
        ))}
      </g>
      {/* Vùng giữa sáng kem, mờ dần ra mép — không có đường viền. */}
      <rect width={W} height={H} fill={`url(#${id}-glow)`} />
      <rect width={W} height={H} filter={`url(#${id}-mottle)`} className={styles.mottle} />

      <g filter={`url(#${id}-leaf)`} stroke={`url(#${id}-foil)`} className={styles.veins}>
        {data.veins.map((v, index) => (
          <path key={index} d={v.d} data-anim="vein" data-weight={v.weight} />
        ))}
      </g>
      <path d={data.flecks} fill={`url(#${id}-foil)`} className={styles.flecks} data-anim="specks" />
    </svg>
  )
}
