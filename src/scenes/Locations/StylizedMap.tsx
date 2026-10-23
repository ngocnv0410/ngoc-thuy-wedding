import { type CSSProperties, useId } from 'react'
import { ChibiFigure } from '../../components/chibi/Chibi'
import { chibiVars } from '../../components/chibi/chibiPose'
import { PropArt } from '../../components/chibi/ChibiProp'
import type { Location } from '../../content/types'
import styles from './StylizedMap.module.css'

/** Hai bạn chibi đi song song phía dưới tuyến nét đứt, cách bấy nhiêu đơn vị (không đè nhãn ghim). */
export const WALK_DY = 50
const WALKER_H = 34
const WALKER_W = (WALKER_H * 3) / 5
/** Nét đậm hơn để vẫn thấy được khi chỉ cao ~34 đơn vị. */
const TINY = { '--chibi-stroke': '4' } as CSSProperties
const HELD_MAP = (
  <g data-anim="held-map">
    <PropArt kind="map" />
  </g>
)

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
  const [endX, endY] = points[shown.length - 1] ?? points[0]

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
        {/* Chibi tí hon: đi dọc tuyến tới ghim cuối, chú rể mở bản đồ, cô dâu chỉ sang thẻ địa chỉ. */}
        {shown.length > 0 && (
          <g data-anim="walkers" transform={`translate(${endX} ${endY + WALK_DY})`}>
            <svg x={-WALKER_W - 1} y={-WALKER_H} width={WALKER_W} height={WALKER_H} viewBox="0 0 120 200" overflow="visible">
              <g data-chibi="groom" style={{ ...chibiVars({ who: 'groom', pose: 'carry', hand: 'l', look: 'right' }), ...TINY }}>
                <ChibiFigure who="groom" hand="l" held={HELD_MAP} />
              </g>
            </svg>
            <svg x={1} y={-WALKER_H} width={WALKER_W} height={WALKER_H} viewBox="0 0 120 200" overflow="visible">
              <g data-chibi="bride" style={{ ...chibiVars({ who: 'bride', pose: 'point', hand: 'r', eyes: 'happy' }), ...TINY }}>
                <ChibiFigure who="bride" hand="r" />
              </g>
            </svg>
            <g data-anim="walk-heart" opacity="0" transform={`translate(0 ${-WALKER_H - 6}) scale(0.7)`}>
              <PropArt kind="heart" />
            </g>
          </g>
        )}
      </svg>
      <figcaption className={styles.caption}>Bản đồ minh hoạ — bấm “Chỉ đường” để mở Google Maps</figcaption>
    </figure>
  )
}
