import { holdPaint } from '../../components/decor/paint'
import { gsap, guard } from '../../lib/gsap'
import { blink, bow, lookAround, run, wave } from '../../motion/chibi'

const one = (root: Element, selector: string) => root.querySelector<HTMLElement>(selector)
const all = (root: Element, selector: string) => [...root.querySelectorAll<HTMLElement>(selector)]
const anim = (name: string) => `[data-anim="${name}"]`

let intro: gsap.core.Timeline | undefined
let breathing: gsap.core.Tween | undefined
let peekLoop: gsap.core.Timeline | undefined

/** Hướng nhìn về nút "Mở thiệp" (đáy giữa): chú rể ló ở mép trái, cô dâu ở mép phải. */
const towardCta = { '--face-x': (index: number) => (index === 0 ? '4px' : '-4px'), '--face-y': '2.5px' }

/**
 * Cửa xuất hiện: hai cánh lùi nhẹ về vị trí, dấu sáp đặt xuống khe cửa; CTA hiện sau cùng, dấu sáp
 * "thở" chờ chạm. Chỉ animate transform/opacity của các lớp riêng — không đụng vào bên trong SVG
 * hoa văn (vẽ lại cả cánh cửa mỗi khung hình là giật trên điện thoại).
 */
export function introDoors(root: HTMLElement): () => void {
  const seal = one(root, anim('seal'))
  holdPaint(2200)

  intro = gsap.timeline({ defaults: { ease: 'paper' } })
  intro.from(all(root, '[data-door]'), { scale: 1.04, duration: 1.6, ease: 'silk' }, 0)
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
  // Hai cái đầu chibi ló ra từ hai mép, nhìn quanh, chớp mắt rồi nhìn về nút "Mở thiệp".
  const peeks = all(root, '[data-anim^="peek-"]')
  if (peeks.length) {
    intro
      .set(peeks, { '--face-x': '0px', '--face-y': '0px' }, 0)
      .from(peeks, { xPercent: (index: number) => (index === 0 ? -80 : 80), duration: 0.6 }, 1.6)
      .add(lookAround(peeks), 2.3)
      .add(blink(peeks), 3.6)
      .to(peeks, { ...towardCta, duration: 0.4, ease: 'silk' }, 3.9)
      // Lặp chậm (~6s một vòng) cho tới khi khách bấm mở.
      .call(() => {
        peekLoop = gsap
          .timeline({ repeat: -1, repeatDelay: 2.4, delay: 1.5 })
          .add(blink(peeks))
          .to(peeks, { '--face-x': '0px', '--face-y': '0px', duration: 0.3, ease: 'silk' }, 0.6)
          .add(lookAround(peeks))
          .to(peeks, { ...towardCta, duration: 0.4, ease: 'silk' })
          .add(blink(peeks), '+=0.8')
      })
  }
  const cancelGuard = guard(intro)

  return () => {
    cancelGuard()
    intro?.kill()
    breathing?.kill()
    peekLoop?.kill()
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
  holdPaint(2800)

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

  tl.add(chibiOpen(root), 0)
    .to(all(root, anim('cta')), { autoAlpha: 0, y: 12, duration: 0.4 }, 0.2)
    .call(onReveal, [], 1.05)
    .to(root, { autoAlpha: 0, duration: 0.5, ease: 'power1.out' }, 2.0)

  guard(tl)

  return {
    fastForward: () => void tl.timeScale(3),
    finish: () => void tl.progress(1),
  }
}

/**
 * Hai bạn chibi mở cửa, khớp nhịp openDoors (dùng cho cả bản 2.5D lẫn 3D): đầu thụt vào → chạy từ
 * hai mép vào khe cửa → đẩy hai cánh ra đúng lúc cửa bắt đầu xoay (0.6s) → quay ra cúi chào / vẫy
 * tay. Overlay tan ở 2.0s mang theo cả hai.
 */
function chibiOpen(root: HTMLElement) {
  intro?.progress(1)
  peekLoop?.kill()
  const tl = gsap.timeline({ defaults: { ease: 'paper' } })
  const peeks = all(root, '[data-anim^="peek-"]')
  if (peeks.length) tl.to(peeks, { xPercent: (index: number) => (index === 0 ? -110 : 110), duration: 0.25, ease: 'power2.in' }, 0)

  const groom = one(root, anim('run-groom'))
  const bride = one(root, anim('run-bride'))
  if (!groom || !bride) return tl
  const runIn = root.clientWidth * 0.6

  return tl
    .set([groom, bride], { autoAlpha: 1 }, 0.1)
    .add(run(groom, -runIn), 0.1)
    .add(run(bride, runIn), 0.1)
    .to(groom, { '--arm-l': '95deg', '--arm-r': '-55deg', '--upper-r': '-10deg', duration: 0.3 }, 0.6)
    .to(bride, { '--arm-r': '95deg', '--arm-l': '-55deg', '--upper-r': '10deg', duration: 0.3 }, 0.6)
    .to([groom, bride], { '--arm-l': '6deg', '--arm-r': '6deg', '--upper-r': '0deg', duration: 0.3, ease: 'silk' }, 1.15)
    .add(bow(groom), 1.4)
    .add(wave(bride, 1), 1.35)
}

/** Bản 3D: cửa do Doors3D mở, chibi chạy timeline riêng — vẫn có lưới an toàn và tua nhanh. */
export function openChibis(root: HTMLElement) {
  const tl = chibiOpen(root)
  guard(tl)
  return {
    fastForward: () => void tl.timeScale(3),
    finish: () => void tl.progress(1),
  }
}
