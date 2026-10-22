import { useId } from 'react'
import type { Location } from '../../content/types'
import styles from './StylizedMap.module.css'

/** Vị trí ghim cố định theo số lượng địa điểm — bản đồ minh hoạ, không đúng tỉ lệ thật. */
const LAYOUTS: Record<number, Array<[number, number]>> = {
  1: [[200, 160]],
  2: [
    [110, 210],
    [290, 110],
  ],
  3: [
    [90, 230],
    [300, 200],
    [200, 80],
  ],
}

interface StylizedMapProps {
  locations: Location[]
  activeId?: string
}

export function StylizedMap({ locations, activeId }: StylizedMapProps) {
  const points = LAYOUTS[Math.min(locations.length, 3)] ?? LAYOUTS[3]
  const shown = locations.slice(0, points.length)
  const maskId = useId()
  const route = points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x},${y}`).join(' ')

  return (
    <figure className={styles.map} data-anim="map">
      <svg viewBox="0 0 400 320" aria-hidden="true">
        {/* Hoạ tiết nền: đường phố cách điệu và dòng sông. */}
        <g className={styles.streets}>
          <path data-anim="street" d="M0,60 C120,80 260,40 400,70" />
          <path data-anim="street" d="M0,170 C140,150 250,190 400,160" />
          <path data-anim="street" d="M0,280 C110,260 300,300 400,270" />
          <path data-anim="street" d="M70,0 C90,110 50,210 80,320" />
          <path data-anim="street" d="M240,0 C220,120 270,220 250,320" />
        </g>
        <path className={styles.river} d="M-10,120 C80,140 140,100 210,130 S330,200 410,180" />
        {/* Tuyến nét đứt được "vẽ" qua mask nét liền (DrawSVG không giữ được nét đứt). */}
        <mask id={maskId} maskUnits="userSpaceOnUse">
          <path d={route} className={styles.routeMask} data-anim="route" />
        </mask>
        <path className={styles.route} d={route} mask={`url(#${maskId})`} />
        {shown.map((location, index) => {
          const [x, y] = points[index]
          const active = location.id === activeId
          return (
            <g key={location.id} transform={`translate(${x} ${y})`} className={styles.pin} data-active={active} data-anim="pin">
              <circle r={active ? 14 : 10} className={styles.halo} />
              <circle r="4.5" className={styles.dot} />
              <text y="-22" textAnchor="middle" className={styles.label}>
                {location.label}
              </text>
            </g>
          )
        })}
      </svg>
      <figcaption className={styles.caption}>Bản đồ minh hoạ — bấm “Chỉ đường” để mở Google Maps</figcaption>
    </figure>
  )
}
