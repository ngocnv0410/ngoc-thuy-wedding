import { gsap, guard } from '../../lib/gsap'

const one = (root: Element, selector: string) => root.querySelector<HTMLElement>(selector)
const all = (root: Element, selector: string) => [...root.querySelectorAll<HTMLElement>(selector)]
const anim = (name: string) => `[data-anim="${name}"]`

let intro: gsap.core.Timeline | undefined
let breathing: gsap.core.Tween | undefined

/**
 * Cửa xuất hiện: hoa văn "nổi" dần lên mặt giấy (bóng và viền sáng hiện sau mặt hoa văn), tên ép
 * kim ánh lên từ trái sang, dấu sáp đặt xuống khe cửa; CTA hiện sau cùng, dấu sáp "thở" chờ chạm.
 */
export function introDoors(root: HTMLElement): () => void {
  const seal = one(root, anim('seal'))

  intro = gsap.timeline({ defaults: { ease: 'paper' } })
  intro
    .from(all(root, '[data-door]'), { scale: 1.04, duration: 1.6, ease: 'silk' }, 0)
    .from(all(root, anim('relief')), { autoAlpha: 0, duration: 1.4 }, 0.2)
    .fromTo(
      all(root, anim('foil')),
      { autoAlpha: 0, clipPath: 'inset(0% 100% 0% 0%)' },
      { autoAlpha: 1, clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'silk', clearProps: 'clipPath' },
      0.6,
    )
  if (seal) {
    intro.fromTo(
      seal,
      { autoAlpha: 0, scale: 1.3, y: -16 },
      { autoAlpha: 1, scale: 1, y: 0, duration: 0.7, ease: 'back.out(1.6)' },
      1.0,
    )
  }
  intro.from(all(root, anim('cta')), { autoAlpha: 0, y: 12, duration: 0.6 }, 1.3)

  // "Thở" chỉ bắt đầu khi dấu sáp đã đặt xong — hai tween cùng scale không chồng nhau.
  if (seal) {
    intro.call(() => {
      breathing = gsap.to(seal, { scale: 1.02, duration: 1.2, ease: 'sine.inOut', yoyo: true, repeat: -1 })
    })
  }
  const cancelGuard = guard(intro)

  return () => {
    cancelGuard()
    intro?.kill()
    breathing?.kill()
  }
}

interface OpenCallbacks {
  /** Thời điểm bìa thật phía sau bắt đầu phát (cửa vừa hé đủ rộng). */
  onReveal: () => void
  onDone: () => void
}

/**
 * Mở cửa: dấu sáp nén rồi tách đôi → khe sáng loé lên → hai cánh quay vào trong quanh bản lề,
 * tối dần khi quay đi, khung hình tiến qua khung cửa → overlay tan, bìa thật hiện ra.
 * Chạm lần nữa để tua nhanh (×3).
 */
export function openDoors(root: HTMLElement, { onReveal, onDone }: OpenCallbacks) {
  intro?.progress(1)
  breathing?.kill()

  const seal = one(root, anim('seal'))
  const doors = one(root, '[data-door]')?.parentElement
  const left = one(root, '[data-door="left"]')
  const right = one(root, '[data-door="right"]')
  const seam = one(root, '[data-seam]')

  const tl = gsap.timeline({ defaults: { ease: 'paper' }, onComplete: onDone })
  // Từ đây cửa che kín màn hình; bỏ nền giấy của overlay để phía sau là thiệp thật.
  tl.set(root, { backgroundColor: 'transparent' }, 0)

  if (seal) tl.to(seal, { scale: 0.92, duration: 0.15, ease: 'power2.in' }, 0)
  tl.to(all(root, anim('seal-left')), { x: -22, y: -6, rotate: -18, autoAlpha: 0, duration: 0.6 }, 0.15).to(
    all(root, anim('seal-right')),
    { x: 22, y: -6, rotate: 18, autoAlpha: 0, duration: 0.6 },
    0.15,
  )

  if (seam) {
    tl.to(seam, { autoAlpha: 1, scaleX: 1, duration: 0.6, ease: 'power2.out' }, 0.45).to(
      seam,
      { autoAlpha: 0, scaleX: 2.4, duration: 0.9, ease: 'power1.in' },
      1.1,
    )
  }

  const swing = { duration: 1.7, ease: 'silk' }
  if (left) tl.to(left, { rotateY: 96, ...swing }, 0.6)
  if (right) tl.to(right, { rotateY: -96, ...swing }, 0.6)
  tl.to(all(root, '[data-shade]'), { opacity: 0.55, ...swing }, 0.6)
  if (doors) tl.to(doors, { scale: 1.14, duration: 2, ease: 'power2.inOut' }, 0.5)

  tl.to(all(root, anim('cta')), { autoAlpha: 0, y: 12, duration: 0.4 }, 0.2)
    .call(onReveal, [], 1.05)
    .to(root, { autoAlpha: 0, duration: 0.5, ease: 'power1.out' }, 2.0)

  guard(tl)

  return {
    fastForward: () => void tl.timeScale(3),
    finish: () => void tl.progress(1),
  }
}
