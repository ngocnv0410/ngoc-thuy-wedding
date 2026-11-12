import { gsap } from './gsap'

/** Animate only the botanical ornament: headings remain readable even during a quick scroll. */
export function accentSectionTitle(title: Element) {
  gsap.fromTo(title, { '--title-ornament-scale': 0.85 }, {
    '--title-ornament-scale': 1,
    duration: 0.7,
    ease: 'sine.out',
    scrollTrigger: { trigger: title, start: 'top 95%', once: true },
  })
}

export function animateSceneHeading(root: HTMLElement) {
  const title = root.querySelector('[data-anim="title"]')
  if (title) accentSectionTitle(title)
}
