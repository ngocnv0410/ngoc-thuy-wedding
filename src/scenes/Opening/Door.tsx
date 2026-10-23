import { useId } from 'react'
import { ART_H, ART_W, RELIEF, RING, mirrorX } from './doorArt'
import styles from './Opening.module.css'

interface DoorProps {
  side: 'left' | 'right'
}

/**
 * Một cánh cửa 2.5D. Hoa văn nổi = ba lớp của cùng một hình: bóng đổ (lệch xuống phải, mờ),
 * viền sáng (lệch lên trái) và mặt hoa văn — ánh sáng luôn từ góc trên trái cho cả hai cánh.
 * Vòng nắm mạ vàng vẽ riêng (không soi gương). Hai bạn chibi đứng phía trước cửa (Opening.tsx).
 */
export function Door({ side }: DoorProps) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const art = `${id}-art`
  const flip = side === 'right'
  const x = (value: number) => (flip ? mirrorX(value) : value)

  return (
    <div className={styles.door} data-door={side}>
      <svg className={styles.art} viewBox={`0 0 ${ART_W} ${ART_H}`} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <defs>
          <g id={art} transform={flip ? `translate(${ART_W} 0) scale(-1 1)` : undefined}>
            {RELIEF.map((relief, index) =>
              relief.stroke ? (
                <path key={index} d={relief.d} fill="none" stroke="currentColor" strokeWidth={relief.stroke} strokeLinecap="round" />
              ) : (
                <path key={index} d={relief.d} fill="currentColor" />
              ),
            )}
          </g>
          <filter id={`${id}-soft`} x="-5%" y="-5%" width="110%" height="110%">
            <feGaussianBlur stdDeviation="1.6" />
          </filter>
          <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#a8823f" />
            <stop offset="0.35" stopColor="#e8d3a2" />
            <stop offset="0.6" stopColor="#b8955a" />
            <stop offset="1" stopColor="#d9bd84" />
          </linearGradient>
        </defs>

        <use href={`#${art}`} x="2.4" y="3" className={styles.reliefShadow} filter={`url(#${id}-soft)`} />
        <use href={`#${art}`} x="-1.6" y="-1.6" className={styles.reliefLight} />
        <use href={`#${art}`} className={styles.reliefFace} />

        <g className={styles.ring}>
          <circle cx={x(RING.x) + 1.5} cy={RING.y + RING.r + 2} r={RING.r} className={styles.ringShadow} filter={`url(#${id}-soft)`} />
          <circle cx={x(RING.x)} cy={RING.y - RING.r + 4} r={RING.plate} fill={`url(#${id}-gold)`} />
          <circle cx={x(RING.x)} cy={RING.y + RING.r * 0.6} r={RING.r} fill="none" stroke={`url(#${id}-gold)`} strokeWidth="4.5" />
          <circle cx={x(RING.x) - 0.8} cy={RING.y + RING.r * 0.6 - 0.8} r={RING.r} fill="none" className={styles.ringGlint} />
        </g>
      </svg>

      <span className={styles.doorShade} data-shade={side} />
    </div>
  )
}
