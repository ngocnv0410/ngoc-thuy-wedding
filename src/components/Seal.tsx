import { useId } from 'react'
import styles from './Seal.module.css'

/** Viền dấu sáp lượn không đều, tính một lần. */
const EDGE_PATH = (() => {
  const points: string[] = []
  const steps = 96
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2
    const r = 47 + 2.2 * Math.sin(9 * t) + 1.1 * Math.sin(17 * t + 1.3) + 0.6 * Math.sin(29 * t + 0.4)
    points.push(`${(50 + r * Math.cos(t)).toFixed(2)},${(50 + r * Math.sin(t)).toFixed(2)}`)
  }
  return `M${points.join('L')}Z`
})()

interface SealProps {
  /** Ví dụ "N & T". Ký tự "&" được vẽ bằng font script. */
  monogram: string
  size?: number
  className?: string
}

/** Dấu sáp monogram — motif mở đầu (Scene 0) và khép lại (Scene 5). */
export function Seal({ monogram, size = 96, className }: SealProps) {
  const id = useId()
  const [left, right] = monogram.split('&').map((part) => part.trim())

  return (
    <svg
      className={[styles.seal, className].filter(Boolean).join(' ')}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={`Dấu sáp ${monogram}`}
    >
      <defs>
        <radialGradient id={`${id}-wax`} cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor="#d9bf8c" />
          <stop offset="55%" stopColor="#c6a66b" />
          <stop offset="100%" stopColor="#9c7e45" />
        </radialGradient>
        <radialGradient id={`${id}-press`} cx="50%" cy="50%" r="50%">
          <stop offset="70%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#5a4523" stopOpacity="0.35" />
        </radialGradient>
      </defs>
      <path d={EDGE_PATH} fill={`url(#${id}-wax)`} />
      <circle cx="50" cy="50" r="34" fill={`url(#${id}-press)`} />
      <circle cx="50" cy="50" r="34" fill="none" stroke="#f3e6c8" strokeOpacity="0.55" strokeWidth="0.8" />
      <circle cx="50" cy="50" r="30.5" fill="none" stroke="#7d6232" strokeOpacity="0.35" strokeWidth="0.5" />
      <text x="50" y="57" textAnchor="middle" className={styles.monogram}>
        {right === undefined ? (
          monogram
        ) : (
          <>
            <tspan>{left}</tspan>
            <tspan className={styles.amp} dx="2">
              &amp;
            </tspan>
            <tspan dx="2">{right}</tspan>
          </>
        )}
      </text>
    </svg>
  )
}
