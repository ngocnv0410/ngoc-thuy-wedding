import { DUR, drawIn, growSprigs, gsap, riseIn, washIn } from '../../lib/gsap'
import { animateSceneHeading } from '../../lib/sceneHeading'

/**
 * Scene 3 — Địa điểm. Bản đồ minh hoạ "được vẽ ra": phố xá nhạt dần hiện, tuyến đường nối
 * các ghim vẽ nét. Thẻ địa điểm chỉ nâng nhẹ và hiện sớm (10% vào khung) — địa chỉ và nút
 * "Chỉ đường" không bao giờ bị che hay trễ.
 */
export function locationsMotion(root: HTMLElement) {
  animateSceneHeading(root)
  washIn(root, root)
  growSprigs(root, root)

  const map = root.querySelector('[data-anim="map"]')
  if (map) {
    drawIn(map.querySelectorAll('[data-anim="street"]'), map, { duration: DUR.xl, stagger: 0.12 })
    drawIn(map.querySelectorAll('[data-anim="route"]'), map, { duration: DUR.xl, delay: 0.6 })
    gsap.from(map.querySelectorAll('[data-anim="pin"]'), {
      scale: 0,
      transformOrigin: '50% 50%',
      duration: DUR.md,
      ease: 'back.out(2)',
      stagger: 0.25,
      delay: 0.9,
      scrollTrigger: { trigger: map, start: 'top 85%', once: true },
    })
  }

  for (const card of root.querySelectorAll('[data-anim="location"]')) {
    riseIn(card, card, { y: 24, start: 'top 95%', stagger: 0 })
  }
}
