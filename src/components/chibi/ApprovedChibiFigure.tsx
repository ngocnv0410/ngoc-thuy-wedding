import { useId, type CSSProperties } from 'react'
import { approvedChibiArt } from './approvedArt'
import type { FigureProps, Side } from './chibiPose'
import { HAND_L, HAND_R, PIVOT } from './chibiArt'
import styles from './Chibi.module.css'

const origin = ([x, y]: readonly [number, number]): CSSProperties => ({ transformOrigin: `${x}px ${y}px` })

/** Separate joints share one source illustration; scene timelines keep their original rig. */
export function ApprovedChibiFigure({ who, held, hand }: Pick<FigureProps, 'who' | 'held' | 'hand'>) {
  const id = useId().replace(/:/g, '')
  const groom = who === 'groom'
  const source = approvedChibiArt(who)
  const shapes: Record<string, string> = groom ? {
    head: 'M0 22H120V105H0Z', tuft: 'M0 0H120V22H0Z',
    torso: 'M43 103H77L82 156Q60 160 38 156Z',
    left: 'M0 107H43L39 130L40 161H0Z',
    right: 'M77 107H120V161H80L81 130Z',
    legL: 'M0 154H61V200H0Z', legR: 'M61 154H120V200H61Z',
  } : {
    head: 'M0 0H120V101H0Z',
    torso: 'M49 100H72L74 125H46Z',
    left: 'M48 102L49 113L35 144L31 149L26 146L29 137L39 111L42 102Z',
    right: 'M72 102L78 102L83 114L94 140L94 147L89 149L84 143L71 114Z',
    skirt: 'M47 123H73L120 200H0Z',
    veil: 'M31 86L48 96L42 111L27 143L24 151L8 145L7 130ZM85 85L92 99L111 129L120 146L99 154L88 134L75 104Z',
  }
  const part = (name: string) => <image href={source} width="120" height="200" clipPath={`url(#${id}-${name})`} />
  const side = hand ?? (groom ? 'r' : 'l')
  const arm = (at: Side) => <g className={at === 'l' ? styles.armL : styles.armR}
    style={origin(at === 'l' ? PIVOT.shoulderL : PIVOT.shoulderR)} data-part={`arm-${at}`}>
    {part(at === 'l' ? 'left' : 'right')}
    {held && side === at && <g className={at === 'l' ? styles.heldL : styles.heldR}
      style={origin(at === 'l' ? HAND_L : HAND_R)}>
      <g transform={`translate(${(at === 'l' ? HAND_L : HAND_R)[0]} ${(at === 'l' ? HAND_L : HAND_R)[1] - 12})`}>{held}</g>
    </g>}
  </g>
  const eyes = groom ? [[46, 81], [77, 81]] : [[46, 74], [74, 74]]
  const expression = (happy: boolean) => <g className={happy ? styles.eyesHappy : styles.eyesClosed} data-part={happy ? 'eyes-happy' : 'eyes-closed'}>
    {eyes.map(([x, y]) => <g key={x}>
      <ellipse cx={x} cy={y} rx="10" ry="11" fill={`url(#${id}-skin)`} />
      <path d={happy ? `M${x - 6} ${y + 2}Q${x} ${y - 6} ${x + 6} ${y + 2}` : `M${x - 6} ${y + 1}Q${x} ${y + 5} ${x + 6} ${y + 1}`}
        fill="none" stroke="#744d38" strokeWidth="1.25" strokeLinecap="round" />
    </g>)}
  </g>
  return <g className={styles.approvedRig} data-chibi-style="approved" data-articulated="true">
    <defs>
      {Object.entries(shapes).map(([name, d]) => <clipPath id={`${id}-${name}`} key={name}><path d={d} /></clipPath>)}
      <radialGradient id={`${id}-skin`}><stop stopColor="#ffe9d8" /><stop offset="1" stopColor="#ffe2ce" /></radialGradient>
    </defs>
    <g className={styles.body} data-part="body">
      {!groom && <g className={styles.veil} style={origin(PIVOT.veil)} data-part="veil">{part('veil')}</g>}
      {groom ? <>
        <g className={styles.legL} style={origin(PIVOT.hipL)} data-part="leg-l">{part('legL')}</g>
        <g className={styles.legR} style={origin(PIVOT.hipR)} data-part="leg-r">{part('legR')}</g>
      </> : <g className={styles.skirt} style={origin(PIVOT.skirt)} data-part="skirt">{part('skirt')}</g>}
      <g className={styles.upper} style={origin(PIVOT.upper)} data-part="upper">
        {/* Joint fills stay behind the source artwork when an arm is raised. */}
        <ellipse cx="45" cy="113" rx="4" ry="5" fill={groom ? '#a18a79' : '#ffe2ce'} />
        <ellipse cx="75" cy="113" rx="4" ry="5" fill={groom ? '#a18a79' : '#ffe2ce'} />
        {part('torso')}{arm('l')}{arm('r')}
        <g className={styles.head} style={origin(PIVOT.head)} data-part="head">
          <g className={styles.portraitGaze}>{part('head')}{groom && <g className={styles.tuft} style={origin(PIVOT.tuft)} data-part="tuft">{part('tuft')}</g>}{expression(false)}{expression(true)}</g>
        </g>
        <path d="M60 149C54 144 53 140 56 138C58 137 60 139 60 140C62 136 66 137 66 141C66 144 63 147 60 149Z"
          fill="#ddad9c" className={styles.chestHeart} data-part="heart" />
      </g>
    </g>
  </g>
}
