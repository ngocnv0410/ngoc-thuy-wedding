import { type RefObject, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import styles from './MarbleFrame.module.css'
import { FOIL_STOPS, type Tone, W, frame, washImage } from './marble.ts'

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
  tone?: Tone
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
          {FOIL_STOPS.map(([offset, color]) => (
            <stop key={offset} offset={offset} stopColor={color} />
          ))}
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
