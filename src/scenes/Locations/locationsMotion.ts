import { DUR, drawIn, growSprigs, gsap, riseIn, washIn } from '../../lib/gsap'
import { animateSceneHeading } from '../../lib/sceneHeading'
import { chibisIn, idle } from '../../motion/chibi'
import { WALK_DY } from './StylizedMap'

/**
 * Hai bạn chibi đi song song phía dưới tuyến nét đứt, cùng nhịp với nét đang được vẽ (DUR.xl, trễ
 * 0.6s), tới ghim cuối thì tim bật lên, chú rể mở bản đồ, cô dâu chỉ sang thẻ địa chỉ. Toạ độ lấy
 * từ chính path tuyến đường — không cần MotionPathPlugin. Markup đã ở vị trí cuối.
 */
function walkAlongRoute(map: Element) {
  const walkers = map.querySelector<SVGGElement>('[data-anim="walkers"]')
  const route = map.querySelector<SVGPathElement>('[data-anim="route"]')
  if (!walkers || !route) return
  const [groom, bride] = chibisIn(walkers)
  const heart = walkers.querySelector('[data-anim="walk-heart"]')
  const length = route.getTotalLength()
  const end = route.getPointAtLength(length)
  // Chỉ một ghim: đi vào từ mép trái khung bản đồ.
  const startX = length < 1 ? 0 : undefined
  const walk = { p: 0 }
  const place = () => {
    if (startX !== undefined) {
      gsap.set(walkers, { x: startX + (end.x - startX) * walk.p, y: end.y + WALK_DY })
      return
    }
    const point = route.getPointAtLength(length * walk.p)
    gsap.set(walkers, { x: point.x, y: point.y + WALK_DY })
  }
  place()

  const steps = 10
  gsap
    .timeline({ delay: 0.6, scrollTrigger: { trigger: map, start: 'top 85%', once: true } })
    .to(walk, { p: 1, duration: DUR.xl, ease: 'silk', onUpdate: place }, 0)
    .fromTo(
      [groom, bride],
      { '--leg-l': '-18deg', '--leg-r': '18deg', '--skirt': '-4deg', '--body-y': '0px' },
      { '--leg-l': '18deg', '--leg-r': '-18deg', '--skirt': '4deg', '--body-y': '-6px', duration: DUR.xl / steps, repeat: steps - 1, yoyo: true, ease: 'sine.inOut' },
      0,
    )
    .to([groom, bride], { '--leg-l': '0deg', '--leg-r': '0deg', '--skirt': '0deg', '--body-y': '0px', duration: 0.15 })
    // Tới nơi: nảy nhẹ, tim bật lên trên đầu.
    .to([groom, bride], { '--body-y': '-10px', duration: 0.18, ease: 'power2.out', yoyo: true, repeat: 1 })
    .fromTo(heart, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, '<')
    .to(heart, { autoAlpha: 0, duration: 0.4 }, '+=0.9')
    .from(groom, { '--arm-l': '6deg', duration: 0.4, ease: 'back.out(1.4)' }, DUR.xl + 0.3)
    .from(walkers.querySelector('[data-anim="held-map"]') ?? [], { scaleX: 0, transformOrigin: '50% 50%', duration: 0.4 }, DUR.xl + 0.4)
    .from(bride, { '--arm-r': '6deg', '--eo': '1', '--eh': '0', duration: 0.4, ease: 'back.out(1.4)' }, DUR.xl + 0.5)
  idle([groom, bride], map, { bob: false })
}

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

  if (map) walkAlongRoute(map)

  for (const card of root.querySelectorAll('[data-anim="location"]')) {
    riseIn(card, card, { y: 24, start: 'top 95%', stagger: 0 })
  }
}
