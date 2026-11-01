/** Projected bone lengths change when a hand points toward the camera.
 * Move the path endpoint and its child joint together so limbs cannot detach.
 * Cache nodes once; no React renders or DOM searches inside the frame loop.
 */
export function bindDanceLimbs(svg: SVGSVGElement) {
  const limbs = ['arm-l', 'arm-r', 'leg-l', 'leg-r'].flatMap((name) => {
    const root = svg.querySelector(`[data-limb="${name}"]`)
    if (!root) return []
    const arm = name.startsWith('arm')
    const [kind, side] = name.split('-')
    return [{ kind, side, arm,
      upper: root.querySelector(arm ? '[data-bone="upper-arm"]' : '[data-bone="thigh"]')!,
      lower: root.querySelector(arm ? '[data-bone="forearm"]' : '[data-bone="shin"]')!,
      joint: root.querySelector('[data-joint]')!,
      cuff: root.querySelector('[data-bone="cuff"]'),
      hand: root.querySelector('[data-hand]'), foot: root.querySelector('[data-foot]'),
    }]
  })
  const apply = (pose?: Record<string, string>) => {
    for (const limb of limbs) {
      const upper = parseFloat(pose?.[`--${limb.kind}-upper-${limb.side}-length`] ?? '') || (limb.arm ? 17 : 20)
      const lower = parseFloat(pose?.[`--${limb.kind}-lower-${limb.side}-length`] ?? '') || (limb.arm ? 17 : 19)
      limb.upper.setAttribute('d', `M0 0L0 ${upper}`)
      limb.lower.setAttribute('d', `M0 0L0 ${limb.arm ? Math.max(0, lower - 4) : lower}`)
      limb.joint.setAttribute('transform', `translate(0 ${upper})`)
      limb.cuff?.setAttribute('d', `M0 ${Math.max(0, lower - 6)}L0 ${Math.max(0, lower - 3)}`)
      limb.hand?.setAttribute('cy', `${lower}`)
      limb.foot?.setAttribute('transform', `translate(0 ${lower - 19})`)
    }
  }
  return { apply, reset: () => apply() }
}
