import { useId, type CSSProperties } from 'react'
import { approvedChibiArt } from './approvedArt'
import type { FigureProps } from './chibiPose'
import { PIVOT } from './chibiArt'
import brideDress from '../../assets/chibi/approved/bride-dress-layer.webp'
import brideVeil from '../../assets/chibi/approved/bride-veil-layer.webp'
import { brideDressPlacement, brideVeilPlacement, neckPlacement } from './approvedRigLayout'
import { faceArt } from './faceArt'
import { SeamlessArms } from './SeamlessArms'
import styles from './Chibi.module.css'

const origin = ([x, y]: readonly [number, number]): CSSProperties => ({ transformOrigin: `${x}px ${y}px` })

/** Separate joints share one source illustration; scene timelines keep their original rig. */
export function ApprovedChibiFigure({ who, held, hand, pose }: Pick<FigureProps, 'who' | 'held' | 'hand' | 'pose'>) {
  const id = useId().replace(/:/g, '')
  const groom = who === 'groom'
  const source = approvedChibiArt(who)
  const shapes: Record<string, string> = groom ? {
    torso: 'M53 100H67L79 106L80 150Q60 154 40 150L41 106Z',
    legL: 'M41 150H61V200H35V180L41 173Z', legR: 'M61 150H79L79 173L85 180V200H61Z',
  } : {
    torso: 'M0 90H120V130H0Z',
    skirt: 'M0 120H120V200H0Z',
    veil: 'M0 0H120V200H0Z',
  }
  const part = (name: string) => !groom && (name === 'torso' || name === 'skirt' || name === 'veil')
    ? <image href={name === 'veil' ? brideVeil : brideDress} {...(name === 'veil' ? brideVeilPlacement : brideDressPlacement)}
      preserveAspectRatio="none" opacity={name === 'veil' ? .55 : 1} clipPath={`url(#${id}-${name})`} data-art-layer={name} mask={name === 'torso' ? `url(#${id}-bodice-blend)` : undefined} />
    : name === 'torso' ? <g data-art-layer="clean-coat">
      {/* The standing portrait contains shadows from its original lowered arms. */}
      <path d={shapes.torso} fill={`url(#${id}-coat-base)`} />
      <image href={source} width="120" height="200" clipPath={`url(#${id}-${name})`} mask={`url(#${id}-coat-clean)`} />
    </g> : <image href={source} width="120" height="200" clipPath={`url(#${id}-${name})`} />
  const face = faceArt[who]
  const expression = (state: 'open' | 'closed' | 'happy', marked = true) => <image href={face[state]}
    x={face.x} y={face.y} width={face.width} height={face.height} preserveAspectRatio="none"
    className={state === 'open' ? styles.openFace : state === 'closed' ? styles.closedFace : styles.happyFace}
    data-part={marked ? `eyes-${state}` : undefined} />
  return <g className={styles.approvedRig} data-chibi-style="approved" data-articulated="true">
    <defs>
      <linearGradient id={`${id}-coat-base`}><stop stopColor="#967a6b" /><stop offset=".5" stopColor="#9d8172" /><stop offset="1" stopColor="#977b6d" /></linearGradient>
      <linearGradient id={`${id}-coat-left`} gradientUnits="userSpaceOnUse" x1="41" x2="45"><stop stopColor="black" /><stop offset=".35" stopColor="black" /><stop offset="1" stopColor="white" /></linearGradient>
      <linearGradient id={`${id}-coat-right`} gradientUnits="userSpaceOnUse" x1="75" x2="79"><stop stopColor="white" /><stop offset=".65" stopColor="black" /><stop offset="1" stopColor="black" /></linearGradient>
      <linearGradient id={`${id}-coat-window`} gradientUnits="userSpaceOnUse" x1="0" x2="0" y1="112" y2="151"><stop stopColor="black" /><stop offset=".18" stopColor="white" /><stop offset=".8" stopColor="white" /><stop offset="1" stopColor="black" /></linearGradient>
      <mask id={`${id}-coat-side-window`} maskUnits="userSpaceOnUse" x="30" y="95" width="60" height="65"><rect x="30" y="95" width="60" height="65" fill={`url(#${id}-coat-window)`} /></mask>
      <mask id={`${id}-coat-clean`} maskUnits="userSpaceOnUse" x="30" y="95" width="60" height="65">
        <rect x="30" y="95" width="60" height="65" fill="white" />
        <g mask={`url(#${id}-coat-side-window)`}><rect x="30" y="110" width="15" height="43" fill={`url(#${id}-coat-left)`} /><rect x="75" y="110" width="15" height="43" fill={`url(#${id}-coat-right)`} /></g>
      </mask>
      <linearGradient id={`${id}-bodice-fade`} x1="0" y1="0" x2="0" y2="1"><stop offset=".78" stopColor="white" /><stop offset="1" stopColor="black" /></linearGradient>
      <mask id={`${id}-bodice-blend`}><rect x="0" y="90" width="120" height="40" fill={`url(#${id}-bodice-fade)`} /></mask>
      <clipPath id={`${id}-face`}><rect x="0" y={groom ? 21 : 0} width="120" height="120" /></clipPath>
      <clipPath id={`${id}-face-tuft`}><rect x="0" y="0" width="120" height="21" /></clipPath>
      {Object.entries(shapes).map(([name, d]) => <clipPath id={`${id}-${name}`} key={name}><path d={d} /></clipPath>)}
    </defs>
    <g className={styles.body} data-part="body">
      {!groom && <g className={styles.veil} style={origin(PIVOT.veil)} data-part="veil">{part('veil')}</g>}
      {groom ? <>
        <g className={styles.legL} style={origin(PIVOT.hipL)} data-part="leg-l">{part('legL')}</g>
        <g className={styles.legR} style={origin(PIVOT.hipR)} data-part="leg-r">{part('legR')}</g>
      </> : <g className={styles.skirt} style={origin([60, 125])} data-part="skirt">{part('skirt')}</g>}
      <g className={styles.upper} style={origin(groom ? PIVOT.upper : [60, 125])} data-part="upper">
        {!groom && <path d="M46 102Q47 98 55 98H65Q72 98 73 102L69.5 107H49.5Z" fill="#ffe2ce" data-part="shoulders" />}
        <rect {...neckPlacement} rx="4" fill="#ffe2ce" data-part="neck" />
        <SeamlessArms who={who} pose={pose} held={held} hand={hand}>
        {part('torso')}
        <g className={styles.head} style={origin(groom ? PIVOT.head : [60, 99])} data-part="head">
          <g className={styles.portraitGaze}><g clipPath={`url(#${id}-face)`}>{expression('open')}{expression('closed')}{expression('happy')}</g>{groom && <g className={styles.tuft} style={origin([74, 21])} data-part="tuft"><g clipPath={`url(#${id}-face-tuft)`}>{expression('open', false)}{expression('closed', false)}{expression('happy', false)}</g></g>}</g>
        </g>
        </SeamlessArms>
      </g>
    </g>
  </g>
}
