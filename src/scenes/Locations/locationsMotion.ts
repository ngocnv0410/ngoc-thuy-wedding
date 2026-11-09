import { growDrapes, riseIn, washIn } from '../../lib/gsap'
import { animateSceneHeading } from '../../lib/sceneHeading'

export function locationsMotion(root: HTMLElement) {
  animateSceneHeading(root)
  washIn(root, root)
  growDrapes(root, root)
  for (const card of root.querySelectorAll<HTMLElement>('[data-anim="location"]')) {
    // Characters own their own story timeline; address/actions reveal together.
    riseIn(card, card, { y: 20, start: 'top 95%', stagger: 0 })
  }
}
