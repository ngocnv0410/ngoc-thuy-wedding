import { gsap } from '../../lib/gsap'

/** A single quiet reveal; the clock needs no repeating decorative animation. */
export function countdownMotion(root: HTMLElement) {
  gsap.from(root, {
    y: 12, autoAlpha: 0, duration: 0.7, ease: 'power2.out',
    scrollTrigger: { trigger: root, start: 'top 90%', once: true },
  })
}
