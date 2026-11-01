import { useId, type CSSProperties } from 'react'
import { approvedChibiArt } from './approvedArt'
import type { FigureProps, Side } from './chibiPose'
import { HAND_L, HAND_R, PIVOT } from './chibiArt'
import { faceArt } from './faceArt'
import brideArms from '../../assets/chibi/approved/bride-arm-paths.json'
import styles from './Chibi.module.css'

const origin = ([x, y]: readonly [number, number]): CSSProperties => ({ transformOrigin: `${x}px ${y}px` })

/** Separate joints share one source illustration; scene timelines keep their original rig. */
export function ApprovedChibiFigure({ who, held, hand }: Pick<FigureProps, 'who' | 'held' | 'hand'>) {
  const id = useId().replace(/:/g, '')
  const groom = who === 'groom'
  const source = approvedChibiArt(who)
  const shapes: Record<string, string> = groom ? {
    torso: 'M43 103H77L82 156Q60 160 38 156Z',
    left: 'M0 107H43L39 130L40 161H0Z',
    right: 'M77 107H120V161H80L81 130Z',
    legL: 'M0 154H61V200H0Z', legR: 'M61 154H120V200H61Z',
  } : {
    torso: 'M49 100H72L74 125H46Z',
    left: brideArms.left,
    right: brideArms.right,
    skirt: 'M47 123H73L120 200H0Z',
    veil: 'M31 86L48 96L42 111L27 143L24 151L8 145L7 130ZM85 85L92 99L111 129L120 146L99 154L88 134L75 104Z',
  }
  const part = (name: string) => <image href={source} width="120" height="200" clipPath={`url(#${id}-${name})`} />
  const side = hand ?? (groom ? 'r' : 'l')
  const shoulder = (at: Side): readonly [number, number] => groom ? (at === 'l' ? PIVOT.shoulderL : PIVOT.shoulderR) : (at === 'l' ? [45.5, 102] : [73.5, 102])
  const palm = (at: Side): readonly [number, number] => groom ? (at === 'l' ? HAND_L : HAND_R) : (at === 'l' ? [30, 138] : [88, 139])
  const arm = (at: Side) => <g className={[at === 'l' ? styles.armL : styles.armR, !groom && styles.brideArm].filter(Boolean).join(' ')}
    style={{ ...origin(shoulder(at)), '--bride-angle': `var(--arm-${at}, var(--pose-arm-${at}))`, '--arm-sign': at === 'l' ? 1 : -1 } as CSSProperties} data-part={`arm-${at}`}>
    {part(at === 'l' ? 'left' : 'right')}
    {held && side === at && <g className={at === 'l' ? styles.heldL : styles.heldR} style={origin(palm(at))}>
      <g transform={`translate(${palm(at)[0]} ${palm(at)[1] - 12})`}>{held}</g>
    </g>}
  </g>
  const face = faceArt[who]
  const expression = (state: 'open' | 'closed' | 'happy', marked = true) => <image href={face[state]}
    x={face.x} y={face.y} width={face.width} height={face.height} preserveAspectRatio="none"
    className={state === 'open' ? styles.openFace : state === 'closed' ? styles.closedFace : styles.happyFace}
    data-part={marked ? `eyes-${state}` : undefined} />
  return <g className={styles.approvedRig} data-chibi-style="approved" data-articulated="true">
    <defs>
      <clipPath id={`${id}-face`}><rect x="0" y={groom ? 21 : 0} width="120" height="120" /></clipPath>
      <clipPath id={`${id}-face-tuft`}><rect x="0" y="0" width="120" height="21" /></clipPath>
      {Object.entries(shapes).map(([name, d]) => <clipPath id={`${id}-${name}`} key={name}><path d={d} /></clipPath>)}
    </defs>
    <g className={styles.body} data-part="body">
      {!groom && <g className={styles.veil} style={origin(PIVOT.veil)} data-part="veil">{part('veil')}</g>}
      {groom ? <>
        <g className={styles.legL} style={origin(PIVOT.hipL)} data-part="leg-l">{part('legL')}</g>
        <g className={styles.legR} style={origin(PIVOT.hipR)} data-part="leg-r">{part('legR')}</g>
      </> : <g className={styles.skirt} style={origin(PIVOT.skirt)} data-part="skirt">{part('skirt')}</g>}
      <g className={styles.upper} style={origin(PIVOT.upper)} data-part="upper">
        {/* Joint fills stay behind the source artwork when an arm is raised. */}
        <ellipse cx={groom ? 45 : 45.5} cy={groom ? 113 : 102} rx={groom ? 4 : 3.2} ry={groom ? 5 : 3.5} fill={groom ? '#a18a79' : '#ffe2ce'} />
        <ellipse cx={groom ? 75 : 73.5} cy={groom ? 113 : 102} rx={groom ? 4 : 3.2} ry={groom ? 5 : 3.5} fill={groom ? '#a18a79' : '#ffe2ce'} />
        {part('torso')}
        <g className={styles.head} style={origin(PIVOT.head)} data-part="head">
          <g className={styles.portraitGaze}><g clipPath={`url(#${id}-face)`}>{expression('open')}{expression('closed')}{expression('happy')}</g>{groom && <g className={styles.tuft} style={origin([74, 21])} data-part="tuft"><g clipPath={`url(#${id}-face-tuft)`}>{expression('open', false)}{expression('closed', false)}{expression('happy', false)}</g></g>}</g>
        </g>
        {arm('l')}{arm('r')}
        <path transform={groom ? undefined : 'translate(0 -7)'} d="M60 149C54 144 53 140 56 138C58 137 60 139 60 140C62 136 66 137 66 141C66 144 63 147 60 149Z"
          fill="#ddad9c" className={styles.chestHeart} data-part="heart" />
      </g>
    </g>
  </g>
}
