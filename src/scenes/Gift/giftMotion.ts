import { DUR, drawDivider, growSprigs, gsap, revealLines, riseIn, washIn } from '../../lib/gsap'

const one = (root: Element, name: string) => root.querySelector(`[data-anim="${name}"]`)

/**
 * Scene 5 — Ánh nến. Lá thư hiện theo dòng như đang được viết, chữ ký "viết" từ trái sang,
 * thẻ quà nâng nhẹ (QR chỉ hiện một lần, không còn transform sau đó), dấu sáp đóng lại ở cuối.
 */
export function giftMotion(root: HTMLElement) {
  washIn(root, root)
  growSprigs(root, root)
  const eyebrow = one(root, 'letter-eyebrow')
  if (eyebrow) riseIn(eyebrow, eyebrow, { y: 12 })
  const title = one(root, 'letter-title')
  if (title) revealLines(title)

  for (const paragraph of root.querySelectorAll('[data-anim="letter-line"]')) {
    revealLines(paragraph, { stagger: 0.12, start: 'top 88%' })
  }

  const signature = one(root, 'signature')
  if (signature) {
    gsap.fromTo(
      signature,
      { clipPath: 'inset(-20% 100% -20% 0%)' },
      {
        clipPath: 'inset(-20% 0% -20% 0%)',
        duration: DUR.xl,
        ease: 'silk',
        clearProps: 'clipPath',
        scrollTrigger: { trigger: signature, start: 'top 90%', once: true },
      },
    )
  }

  const divider = one(root, 'divider')
  if (divider) drawDivider(divider)

  const gifts = one(root, 'gifts')
  if (gifts) riseIn(gifts.children, gifts, { stagger: 0.15 })

  // Bookend: dấu sáp "đóng" xuống — rơi từ trên, nảy nhẹ, bóng ngắn lại.
  const seal = one(root, 'closing-seal')
  if (seal) {
    gsap
      .timeline({ scrollTrigger: { trigger: seal, start: 'top 85%', once: true } })
      .from(seal, { autoAlpha: 0, scale: 1.25, y: -24, rotate: -10, duration: 0.8, ease: 'back.out(1.6)' })
      .from(
        one(root, 'closing-text')?.children ?? [],
        { autoAlpha: 0, y: 12, duration: DUR.md, stagger: 0.12, ease: 'paper' },
        0.5,
      )
  }
}
