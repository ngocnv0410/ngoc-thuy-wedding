import type { CSSProperties, ReactNode } from 'react'
import { BRIDE, EYE_X, EYE_Y, GROOM, HAND_L, HAND_R, HEAD_VIEWBOX, MIRROR_X, PIVOT, SHARED, VIEW_H, VIEW_W, eye } from './chibiArt'
import styles from './Chibi.module.css'
import { type ChibiLook, type ChibiPose, type ChibiSize, type FigureProps, type Side, chibiVars } from './chibiPose'

export type { ChibiPose } from './chibiPose'

const origin = ([x, y]: readonly [number, number]): CSSProperties => ({ transformOrigin: `${x}px ${y}px` })
const MIRROR = `matrix(-1 0 0 1 ${MIRROR_X} 0)`

/** Rig một nhân vật (các `<g>` lồng nhau), dùng trong `<Chibi>` hoặc lồng thẳng vào SVG khác. */
export function ChibiFigure({ who, held, hand }: Pick<FigureProps, 'who' | 'held' | 'hand'>) {
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
    <g className={styles.figure}>
      <ellipse {...SHARED.shadow} className={styles.shadow} />
      <g className={styles.body}>
        {!groom && (
          <g className={styles.veil} style={origin(PIVOT.veil)}>
            <path d={BRIDE.veilL} className={styles.veilFill} />
            <path d={BRIDE.veilR} className={styles.veilFill} />
          </g>
        )}

        {groom ? (
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

          <g className={styles.armL} style={origin(PIVOT.shoulderL)}>
            {arm}
            {holder('l')}
          </g>
          <g className={styles.armR} style={origin(PIVOT.shoulderR)}>
            <g transform={MIRROR}>{arm}</g>
            {holder('r')}
          </g>
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
                <path d={BRIDE.strands} className={styles.strand} />
                <path d={BRIDE.lock} className={styles.hairBride} />
                <path d={BRIDE.lock} className={styles.hairBride} transform={MIRROR} />
                {BRIDE.flowers.map(([cx, cy]) => (
                  <g key={cx}>
                    {[0, 72, 144, 216, 288].map((angle) => (
                      <ellipse key={angle} cx={cx} cy={cy - 2.6} rx="1.6" ry="2.6" transform={`rotate(${angle} ${cx} ${cy})`} className={styles.flower} />
                    ))}
                    <circle cx={cx} cy={cy} r={1.4} className={styles.accent} />
                  </g>
                ))}
              </>
            )}
          </g>
        </g>
      </g>
    </g>
  )
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
  className?: string
  anim?: string
}

/**
 * Một nhân vật chibi — trang trí thuần tuý: `aria-hidden`, không nhận chuột/chạm, không có thông
 * tin nào chỉ nằm trong hình.
 */
export function Chibi({ size = 'md', headOnly = false, className, anim, ...figure }: ChibiProps) {
  const classes = [styles.chibi, headOnly ? styles.headOnly : styles[size], className].filter(Boolean).join(' ')
  return (
    <span className={classes} style={chibiVars(figure)} data-chibi={figure.who} data-anim={anim} aria-hidden="true">
      <svg viewBox={headOnly ? HEAD_VIEWBOX : `0 0 ${VIEW_W} ${VIEW_H}`} focusable="false">
        <ChibiFigure who={figure.who} held={figure.held} hand={figure.hand} />
      </svg>
    </span>
  )
}

interface CoupleProps {
  pose?: ChibiPose
  size?: ChibiSize
  lean?: boolean
  look?: ChibiLook
  className?: string
  anim?: string
  children?: ReactNode
}

/** Chú rể bên trái, cô dâu bên phải (thứ tự "groom-first"); tư thế "hold" thì nắm tay nhau ở giữa. */
export function ChibiCouple({ pose = 'hold', size = 'md', lean = false, look, className, anim, children }: CoupleProps) {
  return (
    <span
      className={[styles.couple, styles[size], className].filter(Boolean).join(' ')}
      data-pose={pose}
      data-anim={anim}
      aria-hidden="true"
    >
      <Chibi who="groom" pose={pose} size={size} look={look ?? (lean ? 'right' : 'front')} anim="chibi-groom" />
      <Chibi who="bride" pose={pose} size={size} lean={lean} look={look ?? (lean ? 'left' : 'front')} anim="chibi-bride" />
      {children}
    </span>
  )
}
