import { gsap, guard } from '../../lib/gsap'

const one = (root: Element, name: string) => root.querySelector<HTMLElement>(`[data-anim="${name}"]`)
const all = (root: Element, name: string) => [...root.querySelectorAll<HTMLElement>(`[data-anim="${name}"]`)]

let intro: gsap.core.Timeline | undefined
let breathing: gsap.core.Tween | undefined

/**
 * Phong bì xuất hiện: nâng lên từ dưới, nghiêng dần về tư thế nằm trên bàn, bóng đổ sắc lại;
 * tên ép chìm co khoảng chữ; CTA hiện sau cùng, dấu sáp "thở" nhẹ chờ được chạm.
 */
export function introEnvelope(root: HTMLElement): () => void {
  const stage = one(root, 'stage')
  const seal = one(root, 'seal')

  intro = gsap.timeline({ defaults: { ease: 'paper' } })
  if (stage) {
    intro.fromTo(
      stage,
      { autoAlpha: 0, y: 40, rotateX: 14, transformPerspective: 1400, transformOrigin: '50% 100%' },
      { autoAlpha: 1, y: 0, rotateX: 4, duration: 1.2 },
      0.6,
    )
  }
  intro
    .from(all(root, 'shadow'), { autoAlpha: 0, scaleX: 0.7, duration: 1.2 }, 0.6)
    .from(all(root, 'names'), { autoAlpha: 0, letterSpacing: '0.3em', duration: 1.2 }, 0.9)
    .from(all(root, 'cta'), { autoAlpha: 0, y: 12, duration: 0.6 }, 1.4)

  if (seal) {
    breathing = gsap.to(seal, { scale: 1.015, duration: 1.2, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.8 })
  }
  const cancelGuard = guard(intro)

  return () => {
    cancelGuard()
    intro?.kill()
    breathing?.kill()
  }
}

interface OpenCallbacks {
  /** Thời điểm bìa thật phía dưới bắt đầu hiện (thẻ đã bay tới khung bìa). */
  onReveal: () => void
  onDone: () => void
}

/**
 * Mở thiệp: dấu sáp tách đôi → nắp lật quanh mép trên → thẻ trượt lên khỏi túi → phong bì rơi
 * và nhoè khỏi khung, thẻ bay tới đúng vị trí khung bìa → overlay tan, bìa thật hiện ra.
 * Chạm lần nữa để tua nhanh (×3).
 */
export function openEnvelope(root: HTMLElement, { onReveal, onDone }: OpenCallbacks) {
  intro?.progress(1)
  breathing?.kill()

  const seal = one(root, 'seal')
  const flap = one(root, 'flap')
  const card = one(root, 'card')
  const target = document.querySelector('#bia [data-anim="frame"], #bia [data-anim="media"]')

  // Vị trí/kích thước để thẻ "khớp" vào khung bìa, tính tại đúng thời điểm bắt đầu bay.
  const fit = () => {
    if (!card || !target) return { x: 0, y: 0, scale: 1 }
    const from = card.getBoundingClientRect()
    const to = target.getBoundingClientRect()
    return {
      x: to.left + to.width / 2 - (from.left + from.width / 2),
      y: to.top + to.height / 2 - (from.top + from.height / 2),
      scale: Math.min(to.width / from.width, 3),
    }
  }
  let fitted = { x: 0, y: 0, scale: 1 }

  const tl = gsap.timeline({ defaults: { ease: 'paper' }, onComplete: onDone })

  if (seal) tl.to(seal, { scale: 0.94, duration: 0.15, ease: 'power2.in' }, 0)
  tl.to(all(root, 'seal-left'), { x: -18, y: -8, rotate: -16, autoAlpha: 0, duration: 0.55 }, 0.15).to(
    all(root, 'seal-right'),
    { x: 18, y: -8, rotate: 16, autoAlpha: 0, duration: 0.55 },
    0.15,
  )

  if (flap) {
    tl.to(flap, { rotateX: 172, transformPerspective: 1400, transformOrigin: '50% 0%', duration: 0.8, ease: 'silk' }, 0.4)
    tl.call(() => void (flap.dataset.open = 'true'), [], 0.78)
  }

  if (card) {
    tl.to(card, { yPercent: -58, duration: 0.9 }, 1.0)
      .set(card, { zIndex: 6 }, 1.9)
      .call(() => void (fitted = fit()), [], 1.9)
      .to(
        card,
        { x: () => fitted.x, y: () => fitted.y, scale: () => fitted.scale, duration: 0.85, ease: 'silk', immediateRender: false },
        1.9,
      )
      // Thẻ tan ngay khi chạm khung bìa, trước khi chữ của bìa thật hiện lên — tránh hai lớp chữ
      // khác cỡ chồng lên nhau.
      .to(card, { autoAlpha: 0, duration: 0.35, ease: 'power1.in' }, 2.45)
  }

  tl.to(
    [...all(root, 'env-part'), ...all(root, 'shadow'), ...(flap ? [flap] : [])],
    { y: 70, autoAlpha: 0, filter: 'blur(6px)', duration: 0.8, ease: 'silk' },
    1.9,
  )
    .to(all(root, 'cta'), { autoAlpha: 0, y: 12, duration: 0.4 }, 0.2)
    .call(onReveal, [], 2.55)
    .to(root, { autoAlpha: 0, duration: 0.5, ease: 'power1.out' }, 2.6)

  guard(tl)

  return {
    fastForward: () => void tl.timeScale(3),
    finish: () => void tl.progress(1),
  }
}
