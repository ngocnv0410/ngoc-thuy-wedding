/** Soft tapered silhouettes follow the same endpoints as the hidden rig bones. */
function segment(length: number, start: number, end: number) {
  return `M${-start} 0Q${-start} ${-start * .7} 0 ${-start * .7}Q${start} ${-start * .7} ${start} 0Q${(start + end) / 2} ${length / 2} ${end} ${length}Q0 ${length + end * .65} ${-end} ${length}Q${-(start + end) / 2} ${length / 2} ${-start} 0Z`
}

export function bindDanceLimbs(svg: SVGSVGElement) {
  const limbs = ['arm-l', 'arm-r', 'leg-l', 'leg-r'].flatMap((name) => {
    const root = svg.querySelector(`[data-limb="${name}"]`)
    if (!root) return []
    const arm = name.startsWith('arm')
    const [kind, side] = name.split('-')
    return [{ kind, side, arm, bridal: root.getAttribute('data-costume') === 'bridal',
      upper: root.querySelector(arm ? '[data-bone="upper-arm"]' : '[data-bone="thigh"]')!,
      lower: root.querySelector(arm ? '[data-bone="forearm"]' : '[data-bone="shin"]')!,
      upperShape: root.querySelector('[data-shape="upper"]')!,
      lowerShape: root.querySelector('[data-shape="lower"]')!,
      joint: root.querySelector('[data-joint]')!, cuff: root.querySelector('[data-cuff]'),
      hand: root.querySelector('[data-hand]'), foot: root.querySelector('[data-foot]'),
    }]
  })
  const apply = (pose?: Record<string, string>) => {
    for (const limb of limbs) {
      const upper = parseFloat(pose?.[`--${limb.kind}-upper-${limb.side}-length`] ?? '') || (limb.arm ? 17 : 20)
      const lower = parseFloat(pose?.[`--${limb.kind}-lower-${limb.side}-length`] ?? '') || (limb.arm ? 17 : 19)
      const width = limb.bridal ? (limb.arm ? 3.2 : 3.5) : (limb.arm ? 5 : 5.6)
      const wrist = width * (limb.arm ? .72 : .8)
      const end = limb.arm ? Math.max(0, lower - 3) : lower
      limb.upper.setAttribute('d', `M0 0L0 ${upper}`)
      limb.lower.setAttribute('d', `M0 0L0 ${end}`)
      limb.upperShape.setAttribute('d', segment(upper, width, width * .88))
      limb.lowerShape.setAttribute('d', segment(end, width * .88, wrist))
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
