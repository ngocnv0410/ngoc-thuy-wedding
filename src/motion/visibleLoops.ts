import { gsap } from '../lib/gsap'

/** One visibility owner for all loops in a stage, including opening/replay gating. */
export function visibleLoops(stage: Element, loops: gsap.core.Animation[]) {
  let visible = false
  const sync = () => {
    const active = visible && !document.hidden && document.documentElement.dataset.opening !== 'on'
    loops.forEach((loop) => active ? loop.play() : loop.pause())
  }
  const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync() })
  observer.observe(stage)
  const opening = new MutationObserver(sync)
  opening.observe(document.documentElement, { attributes: true, attributeFilter: ['data-opening'] })
  document.addEventListener('visibilitychange', sync)
  const dispose = () => {
    observer.disconnect()
    opening.disconnect()
    document.removeEventListener('visibilitychange', sync)
    loops.forEach((loop) => loop.kill())
  }
  // Register disposal with the owning GSAP matchMedia context.
  gsap.context(() => dispose)
  return dispose
}
