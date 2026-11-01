import { useRef, type CSSProperties, type ReactNode } from 'react'
import type { DanceId } from '../../content/types'
import { useChibiDance } from './useChibiDance'
import { BRIDE, EYE_X, EYE_Y, GROOM, HAND_L, HAND_R, HEAD_VIEWBOX, MIRROR_X, PIVOT, SHARED, VIEW_H, VIEW_W, eye } from './chibiArt'
import styles from './Chibi.module.css'
import { type ChibiLook, type ChibiPose, type ChibiSize, type FigureProps, type Side, chibiVars } from './chibiPose'

export type { ChibiPose } from './chibiPose'

const origin = ([x, y]: readonly [number, number]): CSSProperties => ({ transformOrigin: `${x}px ${y}px` })
const MIRROR = `matrix(-1 0 0 1 ${MIRROR_X} 0)`

/** Rig một nhân vật (các `<g>` lồng nhau), dùng trong `<Chibi>` hoặc lồng thẳng vào SVG khác. */
export function ChibiFigure({ who, held, hand, articulated = false }: Pick<FigureProps, 'who' | 'held' | 'hand'> & { articulated?: boolean }) {
  const groom = who === 'groom'
  const side = hand ?? (groom ? 'r' : 'l')
  const holder = (at: Side) =>
    held && side === at ? (
      <g className={at === 'l' ? styles.heldL : styles.heldR} style={origin(at === 'l' ? HAND_L : HAND_R)}>
        {/* Giơ cao hơn bàn tay một chút như đang cầm khoe. */}
        <g transform={`translate(${(at === 'l' ? HAND_L : HAND_R)[0]} ${(at === 'l' ? HAND_L : HAND_R)[1] - 12})`}>{held}</g>
      </g>
    ) : null
  const arm = groom ? (
    <>
      <path d={GROOM.sleeve} className={styles.suit} />
      <path d={GROOM.cuff} className={styles.cloth} />
      <ellipse {...GROOM.hand} className={styles.skin} />
    </>
  ) : (
    <>
      <path d={BRIDE.arm} className={styles.skin} />
      <ellipse {...BRIDE.hand} className={styles.skin} />
    </>
  )

  return (
    <g className={styles.figure} data-articulated={articulated}>
      <ellipse {...SHARED.shadow} className={styles.shadow} />
      <g className={styles.body}>
        {!groom && <g className={styles.upper} style={origin(PIVOT.upper)}>
          <g className={styles.head} style={origin(PIVOT.head)}>
            <g className={styles.veil} style={origin(PIVOT.veil)}>
              <path d={BRIDE.veil} className={styles.bridalVeil} />
              <path d={BRIDE.veilInner} className={styles.veilInner} />
              <path d={BRIDE.veilEdge} className={styles.veilEdge} />
              <path d={BRIDE.veilFolds} className={styles.veilFolds} />
            </g>
          </g>
        </g>}



        {articulated ? <>
          <DanceLeg side="l" groom={groom} />
          <DanceLeg side="r" groom={groom} />
          {!groom && <g className={styles.skirt} style={origin(PIVOT.skirt)}>
            <path d={BRIDE.skirt} className={styles.cloth} />
            <path d={BRIDE.folds} className={styles.fold} />
          </g>}
        </> : groom ? (
          <>
            <g className={styles.legL} style={origin(PIVOT.hipL)}>
              <path d={GROOM.leg} className={styles.suit} />
              <path d={GROOM.shoe} className={styles.shoe} />
            </g>
            <g className={styles.legR} style={origin(PIVOT.hipR)}>
              <g transform={MIRROR}>
                <path d={GROOM.leg} className={styles.suit} />
                <path d={GROOM.shoe} className={styles.shoe} />
              </g>
            </g>
          </>
        ) : (
          <g className={styles.skirt} style={origin(PIVOT.skirt)}>
            <path d={BRIDE.skirt} className={styles.cloth} />
            <path d={BRIDE.folds} className={styles.fold} />
          </g>
        )}

        <g className={styles.upper} style={origin(PIVOT.upper)}>
          {!groom && (
            <g className={styles.head} style={origin(PIVOT.head)}>
              <path d={BRIDE.hairBack} className={styles.hairBride} />
              <path d={BRIDE.bun} className={styles.hairBride} />
              <path d={BRIDE.bunStrands} className={styles.bridalStrands} />
            </g>
          )}
          <path d={SHARED.neck} className={styles.skin} />
          {groom ? (
            <>
              <path d={GROOM.jacket} className={styles.suit} />
              <path d={GROOM.shirt} className={styles.cloth} />
              <path d={GROOM.tie} className={styles.cloth} />
              <path d={GROOM.lapels} className={styles.line} />
              {GROOM.buttons.map(([cx, cy]) => (
                <circle key={cy} cx={cx} cy={cy} r={1.3} className={styles.accent} />
              ))}
              <path d="M71 124Q66 121 69 118Q73 119 71 124" fill="#778568" stroke="none" />
              <circle cx="72" cy="120" r="2.5" className={styles.flower} />
            </>
          ) : (
            <>
              <path d={BRIDE.shoulders} className={styles.skin} />
              <path d={BRIDE.bodice} className={styles.cloth} />
              <path d={BRIDE.straps} className={styles.line} />
              <path d={BRIDE.waist} className={styles.line} />
            </>
          )}

          {!articulated && <>
          <g className={styles.armL} style={origin(PIVOT.shoulderL)}>
            {arm}
            {holder('l')}
          </g>
          <g className={styles.armR} style={origin(PIVOT.shoulderR)}>
            <g transform={MIRROR}>{arm}</g>
            {holder('r')}
          </g>
          </>}
          <path d={SHARED.chestHeart} className={styles.chestHeart} />

          <g className={styles.head} style={origin(PIVOT.head)}>
            {groom && (
              <>
                <ellipse {...GROOM.earL} className={styles.skin} />
                <ellipse {...GROOM.earR} className={styles.skin} />
              </>
            )}
            <ellipse {...SHARED.face} className={styles.skin} />
            <g className={styles.face}>
              <Eyes bride={!groom} />
              <ellipse {...SHARED.cheekL} className={styles.cheek} />
              <ellipse {...SHARED.cheekR} className={styles.cheek} />
              <path d={SHARED.nose} className={styles.feature} />
              <path d={SHARED.mouth} className={styles.feature} />
            </g>
            {groom ? (
              <>
                <path d={GROOM.hair} className={styles.hairGroom} />
                <path d={GROOM.strands} className={styles.strand} />
                <g className={styles.tuft} style={origin(PIVOT.tuft)}>
                  <path d={GROOM.tuft} className={styles.hairGroom} />
                </g>
              </>
            ) : (
              <>
                <path d={BRIDE.hair} className={styles.hairBride} />
                <path d={BRIDE.hairLight} className={styles.hairLight} />
                <path d={BRIDE.strands} className={styles.bridalStrands} />
                <path d={BRIDE.lockL} className={styles.hairBride} />
                <path d={BRIDE.lockR} className={styles.hairBride} />
                <BridalHeadpiece />
              </>
            )}
          </g>
          {articulated && <><DanceArm side="l" groom={groom} /><DanceArm side="r" groom={groom} /></>}
        </g>
      </g>
    </g>
  )
}

/** A small pearl-and-blossom pin lies against the hair, without floating sprigs. */
function BridalHeadpiece() {
  return <g className={styles.headpiece}>
    <path d="M25 49C26 41 32 32 42 29" className={styles.headpieceStem} />
    {[[28, 43, .88], [34, 35, .65], [41, 30, .45]].map(([x, y, scale]) => (
      <g key={x} transform={`translate(${x} ${y}) scale(${scale})`}>
        {[0, 72, 144, 216, 288].map((angle) => (
          <path key={angle} d="M0 0C-3-1-3.3-4.5-1.4-5.1C.8-5.8 2.8-3.5 0 0Z" transform={`rotate(${angle})`} className={styles.headpiecePetal} />
        ))}
        <circle r="1.2" className={styles.headpieceGold} />
      </g>
    ))}
    {[[25, 49, 1.15], [32, 38, 1.25], [41, 31, 1.3]].map(([cx, cy, r]) => (
      <g key={cx}>
        <circle cx={cx} cy={cy} r={r} className={styles.headpiecePearl} />
        <circle cx={cx - r * .3} cy={cy - r * .3} r={r * .3} className={styles.headpieceGlint} />
      </g>
    ))}
  </g>
}

/** Each child starts exactly at its parent's endpoint; rounded overlaps close the joints. */
function DanceArm({ side, groom }: { side: Side; groom: boolean }) {
  const x = side === 'l' ? 45 : 75
  return <g transform={`translate(${x} 114)`} data-limb={`arm-${side}`} data-costume={groom ? 'suit' : 'bridal'}>
    <g className={side === 'l' ? styles.danceArmL : styles.danceArmR}>
      <path data-shape="upper" data-limb-outline d="M-4 0Q0-4 4 0L3 17Q0 20-3 17Z" className={groom ? styles.suit : styles.skin} />
      <path d="M0 0L0 17" className={groom ? styles.suit : styles.skin} strokeWidth={groom ? 11 : 8} data-bone="upper-arm" />
      <g transform="translate(0 17)" data-joint="elbow">
        <g className={side === 'l' ? styles.elbowL : styles.elbowR}>
          <path d="M0 0L0 13" className={groom ? styles.suit : styles.skin} strokeWidth={groom ? 10 : 7} data-bone="forearm" />
          {groom && <path d="M-3.5 11L3.5 11L3.5 14L-3.5 14Z" className={styles.cloth} data-cuff /> }
          <g data-hand transform="translate(0 17)">
            <path d="M-3-3Q-4-1-3.3 2.5Q-2.5 5 0 5Q3 5 3.3 2L3.2-1Q5-3 3.8-4Q2.6-5 1.7-2L1-3Z" className={styles.skin} />
            <path d="M-1.5 1Q0 2 1.5 1" className={styles.palmLine} />
          </g>
        </g>
      </g>
    </g>
  </g>
}

function DanceLeg({ side, groom }: { side: Side; groom: boolean }) {
  const x = side === 'l' ? 53 : 67
  return <g transform={`translate(${x} 150)`} data-limb={`leg-${side}`} data-costume={groom ? 'suit' : 'bridal'}>
    <g className={side === 'l' ? styles.danceLegL : styles.danceLegR}>
      <path data-shape="upper" data-limb-outline d="M-5 0Q0-4 5 0L4 20Q0 23-4 20Z" className={groom ? styles.suit : styles.skin} />
      <path d="M0 0L0 20" className={groom ? styles.suit : styles.skin} strokeWidth="11" data-bone="thigh" />
      <g transform="translate(0 20)" data-joint="knee">
        <g className={side === 'l' ? styles.kneeL : styles.kneeR}>
          <path d="M0 0L0 19" className={groom ? styles.suit : styles.skin} strokeWidth="10" data-bone="shin" />
          <path data-foot d="M-4 17Q-7 23 0 23L6 23L5 17Z" className={groom ? styles.shoe : styles.cloth} />
        </g>
      </g>
    </g>
  </g>
}

function Eyes({ bride }: { bride: boolean }) {
  return (
    <>
      <g className={styles.eyesOpen}>
        {EYE_X.map((cx) => (
          <g key={cx}>
            <ellipse cx={cx} cy={EYE_Y} rx={7.5} ry={9} className={styles.iris} />
            <ellipse cx={cx} cy={EYE_Y + 2} rx={4.2} ry={5.5} className={styles.pupil} />
            <circle cx={cx - 2.6} cy={EYE_Y - 3.5} r={2.6} className={styles.shine} />
            <circle cx={cx + 2.6} cy={EYE_Y + 4.5} r={1.2} className={styles.shine} />
            <path d={eye.lash(cx)} className={styles.lash} />
            {bride && <path d={`M${cx + (cx < 60 ? -8.5 : 8.5)} 71l${cx < 60 ? -2.5 : 2.5}-2.4`} className={styles.lash} />}
          </g>
        ))}
      </g>
      <g className={styles.eyesClosed}>
        {EYE_X.map((cx) => (
          <path key={cx} d={eye.closed(cx)} className={styles.lash} />
        ))}
      </g>
      <g className={styles.eyesHappy}>
        {EYE_X.map((cx) => (
          <path key={cx} d={eye.happy(cx)} className={styles.lash} />
        ))}
      </g>
      {EYE_X.map((cx) => (
        <path key={cx} d={eye.brow(cx)} className={styles.feature} />
      ))}
    </>
  )
}

interface ChibiProps extends FigureProps {
  size?: ChibiSize
  /** Chỉ hiện phần đầu (ló ra sau cánh cửa). */
  headOnly?: boolean
  dance?: DanceId
  className?: string
  anim?: string
}

/**
 * Một nhân vật chibi — trang trí thuần tuý: `aria-hidden`, không nhận chuột/chạm, không có thông
 * tin nào chỉ nằm trong hình.
 */
export function Chibi({ size = 'md', headOnly = false, dance, className, anim, ...figure }: ChibiProps) {
  const danceRef = useRef<SVGSVGElement>(null)
  useChibiDance(danceRef, dance)
  const classes = [styles.chibi, headOnly ? styles.headOnly : styles[size], className].filter(Boolean).join(' ')
  return (
    <span className={classes} style={chibiVars(figure)} data-chibi={figure.who} data-anim={anim} aria-hidden="true">
      <svg ref={danceRef} viewBox={headOnly ? HEAD_VIEWBOX : `0 0 ${VIEW_W} ${VIEW_H}`} focusable="false">
        <ChibiFigure articulated={Boolean(dance)} who={figure.who} held={figure.held} hand={figure.hand} />
      </svg>
    </span>
  )
}

interface CoupleProps {
  dance?: DanceId
  pose?: ChibiPose
  size?: ChibiSize
  lean?: boolean
  look?: ChibiLook
  className?: string
  anim?: string
  children?: ReactNode
}

/** Chú rể bên trái, cô dâu bên phải (thứ tự "groom-first"); tư thế "hold" thì nắm tay nhau ở giữa. */
export function ChibiCouple({ dance, pose = 'hold', size = 'md', lean = false, look, className, anim, children }: CoupleProps) {
  return (
    <span
      className={[styles.couple, styles[size], className].filter(Boolean).join(' ')}
      data-pose={pose}
      data-anim={anim}
      aria-hidden="true"
    >
      <Chibi dance={dance} who="groom" pose={pose} size={size} look={look ?? (lean ? 'right' : 'front')} anim="chibi-groom" />
      <Chibi dance={dance} who="bride" pose={pose} size={size} lean={lean} look={look ?? (lean ? 'left' : 'front')} anim="chibi-bride" />
      {children}
    </span>
  )
}
