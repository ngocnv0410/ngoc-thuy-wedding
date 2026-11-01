import { limbOutline } from './limbOutline'

export function bindDanceLimbs(svg: SVGSVGElement) {
  const waist = svg.querySelector('[data-waist-bridge]')
  const limbs = ['arm-l', 'arm-r', 'leg-l', 'leg-r'].flatMap((name) => {
    const root = svg.querySelector(`[data-limb="${name}"]`)
    if (!root) return []
    const arm = name.startsWith('arm')
    const [kind, side] = name.split('-')
    return [{ kind, side, arm, bridal: root.getAttribute('data-costume') === 'bridal',
      upper: root.querySelector(arm ? '[data-bone="upper-arm"]' : '[data-bone="thigh"]')!,
      lower: root.querySelector(arm ? '[data-bone="forearm"]' : '[data-bone="shin"]')!,
      upperShape: root.querySelector('[data-shape="upper"]')!,
      joint: root.querySelector('[data-joint]')!, cuff: root.querySelector('[data-cuff]'),
      hand: root.querySelector('[data-hand]'), foot: root.querySelector('[data-foot]'),
    }]
  })
  const apply = (pose?: Record<string, string>) => {
    if (waist) {
      const angle = (parseFloat(pose?.['--upper-r'] ?? '') || 0) * Math.PI / 180
      const dx = 14 * Math.cos(angle), dy = 14 * Math.sin(angle)
      waist.setAttribute('d', `M${60 - dx} ${140 - dy}L${60 + dx} ${140 + dy}L74 146L46 146Z`)
    }
    for (const limb of limbs) {
      const upper = parseFloat(pose?.[`--${limb.kind}-upper-${limb.side}-length`] ?? '') || (limb.arm ? 17 : 20)
      const lower = parseFloat(pose?.[`--${limb.kind}-lower-${limb.side}-length`] ?? '') || (limb.arm ? 17 : 19)
      const width = limb.bridal ? (limb.arm ? 3.2 : 3.5) : (limb.arm ? 5 : 5.6)
      const wrist = width * (limb.arm ? .72 : .8)
      const end = limb.arm ? Math.max(0, lower - 3) : lower
      limb.upper.setAttribute('d', `M0 0L0 ${upper}`)
      limb.lower.setAttribute('d', `M0 0L0 ${end}`)
      const bend = parseFloat(pose?.[`--${limb.arm ? 'elbow' : 'knee'}-${limb.side}`] ?? '') || 0
      limb.upperShape.setAttribute('d', limbOutline(upper, end, bend, width, wrist))
      limb.joint.setAttribute('transform', `translate(0 ${upper})`)
      const cuffStart = Math.max(0, lower - 6), cuffEnd = Math.max(0, lower - 3)
      limb.cuff?.setAttribute('d', `M${-wrist} ${cuffStart}L${wrist} ${cuffStart}L${wrist} ${cuffEnd}Q0 ${cuffEnd + .7} ${-wrist} ${cuffEnd}Z`)
      limb.hand?.setAttribute('transform', `translate(0 ${lower})`)
      limb.foot?.setAttribute('transform', `translate(0 ${lower - 19})`)
    }
  }
  apply()
  return { apply, reset: () => apply() }
}
