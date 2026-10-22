import { revealLines, riseIn } from './gsap'

/** Motif chung cho tiêu đề scene 2–4: nhãn hiện lên, tiêu đề hiện theo dòng trong mask. */
export function animateSceneHeading(root: HTMLElement) {
  const eyebrow = root.querySelector('[data-anim="eyebrow"]')
  const title = root.querySelector('[data-anim="title"]')
  if (eyebrow) riseIn(eyebrow, eyebrow, { y: 12 })
  if (title) revealLines(title, { delay: 0.1 })
}
