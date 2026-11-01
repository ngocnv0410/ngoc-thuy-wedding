import { useId, useLayoutEffect, useRef, type ReactNode } from 'react'
import { armGeometry, clamp01, heartPlacement, smooth } from './armGeometry'
import { chibiVars, type FigureProps, type Side } from './chibiPose'
import { paintedArmJoints } from './approvedRigLayout'

const SIDES = ['l', 'r'] as const
const HEART = 'M0 4C-2 2-7-1-7-5C-7-9-2-10 0-6C2-10 7-9 7-5C7-1 2 2 0 4Z'

/** The limb is one deforming silhouette, including the bride's wrist and hand. */
export function SeamlessArms({ who, pose, held, hand, children }: Pick<FigureProps, 'who' | 'pose' | 'held' | 'hand'> & { children: ReactNode }) {
  const id = useId().replace(/:/g, '')
  const ref = useRef<SVGGElement>(null)
  const groom = who === 'groom'
  const heldSide = hand ?? (groom ? 'r' : 'l')
  const defaults = chibiVars({ who, pose, hand }) as Record<string, string>
  const createInitial = (side: Side) => armGeometry({ who, side, angle: parseFloat(defaults[`--pose-arm-${side}`]), heart: parseFloat(defaults['--pose-heart']), holding: pose === 'hold' && heldSide === side, carrying: !!held && heldSide === side })
  const initial = { l: createInitial('l'), r: createInitial('r') }
  const placement = heartPlacement(who)

  useLayoutEffect(() => {
    const figure = ref.current
    const host = figure?.closest<HTMLElement | SVGElement>('[data-chibi]')
    if (!figure || !host) return
    const read = (key: string) => parseFloat(host.style.getPropertyValue(`--${key}`) || host.style.getPropertyValue(`--pose-${key}`) || defaults[`--pose-${key}`] || '0') || 0
    const arms = SIDES.map(side => ({ side,
      group: figure.querySelector<SVGGElement>(`[data-part="arm-${side}"]`)!,
      sleeve: [...figure.querySelectorAll<SVGPathElement>(`[data-arm="${side}"][data-surface="sleeve"]`)],
      skin: [...figure.querySelectorAll<SVGPathElement>(`[data-arm="${side}"][data-surface="skin"]`)],
      cuff: figure.querySelector<SVGPathElement>(`[data-arm="${side}"][data-surface="cuff"]`),
      light: [...figure.querySelectorAll<SVGPathElement>(`[data-arm="${side}"][data-surface="light"]`)],
      prop: figure.querySelector<SVGGElement>(`[data-held="${side}"]`),
    }))
    const heart = figure.querySelector<SVGGElement>('[data-part="heart"]')!
    const core = figure.querySelector<SVGGElement>('[data-heart-core]')!
    const particles = [...figure.querySelectorAll<SVGGElement>('[data-heart-particle]')]
    let previous = ''
    let previousPose = ''
    const draw = () => {
      const values = [read('arm-l'), read('arm-r'), read('heart'), read('heart-pulse'), read('heart-bloom')]
      const signature = values.join(',')
      if (signature === previous) return
      previous = signature
      const poseSignature = values.slice(0, 3).join(',')
      if (poseSignature !== previousPose) for (const [index, arm] of arms.entries()) {
        const geometry = armGeometry({ who, side: arm.side, angle: values[index], heart: values[2], holding: pose === 'hold' && arm.side === heldSide, carrying: !!held && arm.side === heldSide })
        arm.sleeve.forEach(path => path.setAttribute('d', geometry.sleevePath))
        arm.skin.forEach(path => path.setAttribute('d', geometry.skinPath))
        arm.cuff?.setAttribute('d', geometry.cuffPath)
        arm.light.forEach(path => path.setAttribute('d', geometry.highlight))
        arm.prop?.setAttribute('transform', geometry.heldTransform)
        arm.group.dataset.elbow = geometry.elbow.join(',')
        arm.group.dataset.wrist = geometry.wrist.join(',')
      }
      previousPose = poseSignature
      const reveal = smooth((values[2] - .6) / .4)
      heart.setAttribute('opacity', String(reveal))
      core.setAttribute('transform', `scale(${placement.scale * .58 * (.94 + values[3] * .07)})`)
      for (const [i, particle] of particles.entries()) {
        const t = clamp01(values[4] - i * .16)
        particle.setAttribute('opacity', String(Math.sin(t * Math.PI) * reveal * .7))
        particle.setAttribute('transform', `translate(${(i - 1) * (4 + 9 * t)} ${-7 - 24 * (1 - (1 - t) ** 2)}) scale(${.22 + .13 * Math.sin(Math.PI * t)})`)
      }
    }
    draw()
    // GSAP writes these host variables. One batched observer callback updates geometry
    // before paint, without a second animation loop or per-frame React renders.
    const observer = new MutationObserver(draw)
    observer.observe(host, { attributes: true, attributeFilter: ['style'] })
    return () => observer.disconnect()
  }, [who, pose, held, heldSide]) // Defaults are derived solely from these props.

  const heartArt = <g transform={`translate(${placement.center.join(' ')})`} data-part="heart" opacity={pose === 'heart' ? 1 : 0}>
    <g data-heart-core transform={`scale(${placement.scale * .58})`}>
      <path d={HEART} fill={`url(#${id}-rose)`} stroke="#be766d" strokeWidth=".25" />
      <path d="M-4-5Q-4-7-2.5-7" fill="none" stroke="#fff5ed" strokeWidth="1" strokeLinecap="round" opacity=".65" />
    </g>
    {[0, 1, 2].map(i => <g key={i} data-heart-particle opacity="0"><path d={HEART} fill={i === 1 ? '#dfa185' : '#d99393'} /></g>)}
  </g>

  const surface = (side: Side, front: boolean) => {
    const g = initial[side]
    return <g key={side} data-part={front ? `arm-${side}` : undefined} data-elbow={g.elbow.join(',')} data-wrist={g.wrist.join(',')} mask={front ? `url(#${id}-root-${side})` : undefined}>
      {groom && <>
        <path data-arm={side} data-surface="sleeve" d={g.sleevePath} fill={`url(#${id}-suit)`} />
        <path data-arm={side} data-surface="sleeve" d={g.sleevePath} fill={`url(#${id}-weave)`} />
      </>}
      {!groom && <path data-arm={side} data-surface="skin" d={g.skinPath} fill={`url(#${id}-skin)`} />}
      <path data-arm={side} data-surface="light" d={g.highlight} fill="none" stroke={groom ? '#f4dfc6' : '#fff8ec'} strokeWidth={groom ? '.8' : '1.2'} opacity={groom ? '.12' : '.28'} strokeLinecap="round" />
    </g>
  }

  return <g ref={ref} data-seamless-arms>
    <defs>
      <linearGradient id={`${id}-skin`} x1="0" y1="0" x2="1" y2=".15"><stop stopColor="#edc0a7" /><stop offset=".4" stopColor="#ffe7d4" /><stop offset=".7" stopColor="#ffe8d8" /><stop offset="1" stopColor="#efc5ad" /></linearGradient>
      <linearGradient id={`${id}-suit`}><stop stopColor="#81604f" /><stop offset=".33" stopColor="#9d7b67" /><stop offset=".65" stopColor="#9b7966" /><stop offset="1" stopColor="#805e4d" /></linearGradient>
      <radialGradient id={`${id}-rose`} cx="35%" cy="25%"><stop stopColor="#f6c0b6" /><stop offset=".7" stopColor="#df958e" /><stop offset="1" stopColor="#ce7d7b" /></radialGradient>
      <pattern id={`${id}-weave`} width="2.8" height="2.8" patternUnits="userSpaceOnUse"><path d="M0 .5L1.4 1.1M2 2L2.8 2.5" fill="none" stroke="#503629" strokeWidth=".18" opacity=".08" /></pattern>
      {SIDES.map(side => <g key={side}>
        <radialGradient id={`${id}-root-fade-${side}`} gradientUnits="userSpaceOnUse" cx={paintedArmJoints[who][side].shoulder[0]} cy={paintedArmJoints[who][side].shoulder[1]} r={groom ? 7 : 5}><stop offset=".15" stopColor="black" /><stop offset="1" stopColor="white" /></radialGradient>
        <mask id={`${id}-root-${side}`} maskUnits="userSpaceOnUse" x="-20" y="75" width="160" height="125"><rect x="-20" y="75" width="160" height="125" fill={`url(#${id}-root-fade-${side})`} /></mask>
      </g>)}
    </defs>
    {/* Sleeves go beneath the jacket/bodice; the shoulder has no exposed end cap. */}
    {SIDES.map(side => surface(side, false))}
    {children}
    {heartArt}
    {SIDES.map(side => surface(side, true))}
    {/* Groom palms sit above the cuffs; bridal hands are part of the arm contour. */}
    {groom && SIDES.map(side => {
      const g = initial[side]
      return <g key={side}>
        <path data-arm={side} data-surface="skin" d={g.skinPath} fill={`url(#${id}-skin)`} />
        <path data-arm={side} data-surface="cuff" d={g.cuffPath} fill="#fff8ec" stroke="#d9c5b1" strokeWidth=".3" />
      </g>
    })}
    {held && <g data-held={heldSide} transform={initial[heldSide].heldTransform}>{held}</g>}
  </g>
}
