import { gsap } from './gsap'

/** Animate only the gold rule: headings remain readable even during a quick scroll. */
export function accentSectionTitle(title: Element) {
  gsap.fromTo(title, { '--title-rule-scale': 0.35 }, {
    '--title-rule-scale': 1,
    duration: 0.7,
    ease: 'sine.out',
    scrollTrigger: { trigger: title, start: 'top 95%', once: true },
  })
}

export function animateSceneHeading(root: HTMLElement) {
  const title = root.querySelector('[data-anim="title"]')
  if (title) accentSectionTitle(title)
}
