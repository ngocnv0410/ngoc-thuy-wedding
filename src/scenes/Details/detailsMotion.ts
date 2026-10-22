import { DUR, drawDivider, drawIn, gsap, growSprigs, riseIn, washIn } from '../../lib/gsap'
import { animateSceneHeading } from '../../lib/sceneHeading'

const all = (root: Element, name: string) => root.querySelectorAll(`[data-anim="${name}"]`)
const one = (root: Element, name: string) => root.querySelector(`[data-anim="${name}"]`)

/**
 * Scene 2 — Thông tin lễ. Nhịp của tờ thiệp in: nền loang và hoa baby hiện ở mép, hai họ hiện
 * song song, tên lễ "được viết" từ trái sang, khối ngày nâng lên, vòng khoanh tay quanh ngày cưới.
 */
export function detailsMotion(root: HTMLElement) {
  animateSceneHeading(root)
  washIn(root, root)
  growSprigs(root, root)

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

  const calendar = one(root, 'calendar')
  if (calendar) {
    riseIn(calendar, calendar, { y: 16 })
    drawIn(all(calendar, 'hand-circle'), calendar, { duration: 1.2, delay: 0.5, start: 'top 75%' })
    gsap.from(all(calendar, 'mark-dot'), {
      scale: 0,
      duration: DUR.sm,
      delay: 0.9,
      ease: 'back.out(3)',
      scrollTrigger: { trigger: calendar, start: 'top 75%', once: true },
    })
  }

  const actions = one(root, 'actions')
  if (actions) riseIn(actions.children, actions)
}
