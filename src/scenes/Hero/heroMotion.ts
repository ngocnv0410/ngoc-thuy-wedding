import { DUR, gsap } from '../../lib/gsap'

const q = (root: Element, name: string) => root.querySelectorAll(`[data-anim="${name}"]`)

/** A short reveal: portrait, names, date, then invitation. Playback waits for the doors. */
export function heroMotion(root: HTMLElement) {
  const tl = gsap.timeline({ defaults: { ease: 'paper' }, delay: 0.1 })
  const portrait = root.querySelector('[data-anim="portrait"]')
  const photo = root.querySelector('[data-anim="photo"]')
  const bouquets = q(root, 'bouquet')
  const washes = q(root, 'wash')
  if (photo) tl.fromTo(photo, { scale: 1 }, { scale: 1.04, duration: 8, ease: 'none' }, 0)
  if (portrait) tl.from(portrait, { autoAlpha: 0, y: 20, scale: 0.96, duration: 1.2 }, 0)
  if (washes.length) tl.from(washes, { autoAlpha: 0, duration: 1.2 }, 0)
  if (bouquets.length) tl.from(bouquets, { autoAlpha: 0, scale: 0.94, duration: 1.2, stagger: 0.15 }, 0.1)
  tl.from(q(root, 'masthead'), { autoAlpha: 0, y: 10, duration: DUR.md }, 0.2)

  const names = [...q(root, 'name')]
  names.forEach((name, index) => {
    if (index === 1) {
      tl.from(name, { autoAlpha: 0, scale: 0.9, duration: DUR.md }, 0.7)
    } else {
      tl.fromTo(name,
        { clipPath: 'inset(-30% 100% -30% -15%)' },
        { clipPath: 'inset(-30% -15% -30% -15%)', duration: 1, ease: 'power2.inOut', clearProps: 'clipPath' },
        0.35 + (index === 0 ? 0 : 0.35),
      )
    }
  })

  const rules = q(root, 'rule')
  if (rules.length) {
    tl.from(rules, { drawSVG: 0, duration: 0.8, ease: 'silk' }, 0.9)
      .from(q(root, 'leaf'), { scale: 0, transformOrigin: '0% 50%', duration: 0.3, stagger: 0.02 }, 1)
      .from(q(root, 'diamond'), { scale: 0, rotate: 45, transformOrigin: '50% 50%', duration: 0.5 }, 1.2)
  }
  tl.from(q(root, 'date-block'), { autoAlpha: 0, y: 12, duration: 0.7 }, 1.1)
    .from(q(root, 'meta'), { autoAlpha: 0, y: 10, duration: DUR.md, stagger: 0.12 }, 1.2)
    .from(q(root, 'cue'), { autoAlpha: 0, duration: DUR.md }, 1.7)

  // Subtle depth on desktop; keep phone scrolling directly under the guest's finger.
  if (window.matchMedia('(min-width: 900px)').matches) {
    const scrollTrigger = { trigger: root, start: 'top top', end: 'bottom top', scrub: 0.6 }
    const media = root.querySelector('[data-anim="media"]')
    if (media) gsap.to(media, { yPercent: 10, ease: 'none', scrollTrigger })
    if (portrait) gsap.to(portrait, { yPercent: 6, ease: 'none', scrollTrigger })
  }
  return tl
}
