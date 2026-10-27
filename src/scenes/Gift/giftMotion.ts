import { DUR, drawDivider, growDrapes, gsap, revealLines, riseIn, washIn } from '../../lib/gsap'
import { floatUp } from '../../motion/chibi'
import { closingMotion } from './closingMotion'

const one = (root: Element, name: string) => root.querySelector(`[data-anim="${name}"]`)

let celebrating = false

/**
 * Khách vừa lưu QR / sao chép STK: phong thư bật khỏi khe hộp thư, nắp mở, một trái tim bay lên.
 * Đang chạy thì bỏ qua lần bấm tiếp theo. Không đụng tới thẻ quà hay QR.
 */
export function giftCelebrate(mail: HTMLElement) {
  const envelope = one(mail, 'mail-envelope')
  const heart = one(mail, 'mail-heart')
  if (celebrating || !envelope || !heart) return
  celebrating = true
  // Phong thư có thể còn đang bay vào hộp (khách bấm rất sớm): dừng hẳn trước khi bật ra.
  gsap.killTweensOf(envelope)
  return gsap
    .timeline({ onComplete: () => void (celebrating = false) })
    .fromTo(
      envelope,
      { autoAlpha: 0, x: 0, y: 0, rotate: 0, scale: 0.6, '--flap': '1' },
      { autoAlpha: 1, y: -26, scale: 1, duration: 0.3, ease: 'back.out(1.6)' },
    )
    .to(envelope, { '--flap': '-1', duration: 0.25, ease: 'power2.out' })
    .add(floatUp([heart], { rise: 50 }), '-=0.05')
    .to(envelope, { autoAlpha: 0, y: -10, scale: 0.8, duration: 0.35, ease: 'power1.in' }, '-=1.2')
}

/**
 * Giấy champagne: lá thư hiện theo dòng, chữ ký được viết, thẻ quà nâng nhẹ;
 * cảnh chibi cuối thiệp lặp lời chào khi khách còn xem.
 */
export function giftMotion(root: HTMLElement) {
  washIn(root, root)
  growDrapes(root, root)
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

  // Phong thư bay theo đường cong vào khe hộp thư, cờ hộp thư bật lên.
  const mail = one(root, 'mail')
  const envelope = mail && one(mail, 'mail-envelope')
  if (mail && envelope) {
    gsap
      .timeline({ delay: 0.4, scrollTrigger: { trigger: mail, start: 'top 85%', once: true } })
      .fromTo(envelope, { autoAlpha: 1, x: -120, rotate: -10, scale: 1 }, { x: 0, rotate: 0, duration: 0.9, ease: 'silk' }, 0)
      .fromTo(envelope, { y: 0 }, { y: -30, duration: 0.45, ease: 'power1.out' }, 0)
      .to(envelope, { y: 0, duration: 0.45, ease: 'power1.in' }, 0.45)
      .to(envelope, { scale: 0.6, autoAlpha: 0, duration: 0.25, ease: 'power1.in' }, 0.9)
      .fromTo(one(mail, 'mailbox'), { '--flag': '90deg' }, { '--flag': '0deg', duration: 0.5, ease: 'back.out(2)' }, 1.0)
  }

  closingMotion(root)
}
