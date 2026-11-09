import { DUR, type MotionConditions, growDrapes, gsap, washIn } from '../../lib/gsap'
import { animateSceneHeading } from '../../lib/sceneHeading'

/** A plain album: each photo fades in, with no pinned chapter or horizontal film track. */
export function galleryMotion(_conditions: MotionConditions, root: HTMLElement) {
  animateSceneHeading(root)
  washIn(root, root)
  growDrapes(root, root)
  for (const photo of root.querySelectorAll('[data-anim="album-photo"]')) {
    gsap.from(photo, {
      autoAlpha: 0,
      duration: DUR.md,
      ease: 'sine.out',
      scrollTrigger: { trigger: photo, start: 'top 95%', once: true },
    })
  }
}
