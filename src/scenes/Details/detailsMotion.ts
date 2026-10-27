import { DUR, drawDivider, gsap, growDrapes, riseIn, washIn } from '../../lib/gsap'
import { animateSceneHeading } from '../../lib/sceneHeading'

const all = (root: Element, name: string) => root.querySelectorAll(`[data-anim="${name}"]`)
const one = (root: Element, name: string) => root.querySelector(`[data-anim="${name}"]`)

/**
 * Thông tin lễ: hai họ, lời mời và ngày lễ hiện lần lượt trên nền giấy nhẹ.
 */
export function detailsMotion(root: HTMLElement) {
  animateSceneHeading(root)
  washIn(root, root)
  growDrapes(root, root)

  const families = one(root, 'families')
  if (families) riseIn(all(families, 'family'), families, { stagger: 0.15 })
  const rule = one(root, 'family-rule')
  if (rule && families) gsap.from(rule, { scaleY: 0, scaleX: 0, duration: DUR.lg, ease: 'silk', scrollTrigger: { trigger: families, start: 'top 85%', once: true } })

  const announce = one(root, 'announce')
  if (announce) riseIn(announce.children, announce, { stagger: 0.12 })

  const divider = one(root, 'divider')
  if (divider) drawDivider(divider)

  for (const day of all(root, 'day')) {
    const tl = gsap.timeline({ defaults: { ease: 'paper' }, scrollTrigger: { trigger: day, start: 'top 80%', once: true } })
    // Tên lễ viết tay: lộ dần từ trái sang như nét bút.
    tl.fromTo(
      all(day, 'day-title'),
      { clipPath: 'inset(-30% 100% -30% -10%)' },
      { clipPath: 'inset(-30% -10% -30% -10%)', duration: 1.1, ease: 'power2.inOut', clearProps: 'clipPath' },
    )
      .from(all(day, 'date-block'), { autoAlpha: 0, y: 18, duration: DUR.lg, clearProps: 'transform' }, 0.5)
      .from(all(day, 'event'), { autoAlpha: 0, y: 12, duration: DUR.md, stagger: 0.1, clearProps: 'transform' }, 0.9)
  }
}
