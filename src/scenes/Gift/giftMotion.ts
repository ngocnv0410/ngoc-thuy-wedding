import { DUR, drawDivider, growSprigs, gsap, revealLines, riseIn, washIn } from '../../lib/gsap'
import { bow, floatUp, idle, rig, wave } from '../../motion/chibi'

const one = (root: Element, name: string) => root.querySelector(`[data-anim="${name}"]`)

/** Tư thế đứng trước khi chào (markup ở tư thế cuối: tay tim, mắt cười). */
const STANDING = { '--arm-l': '6deg', '--arm-r': '6deg', '--eo': '1', '--eh': '0', '--heart': '0' }
const HEART = { '--arm-l': '-30deg', '--arm-r': '-30deg', '--eo': '0', '--eh': '1', '--heart': '1' }

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

  // Hai bạn chibi: hiện lên → cúi chào → giơ tay tạo trái tim → cô dâu vẫy tay một lần.
  const groom = one(root, 'bye-groom')
  const bride = one(root, 'bye-bride')
  if (seal && groom && bride) {
    rig([groom, bride])
    gsap.set([groom, bride], STANDING)
    gsap
      .timeline({ delay: 0.5, scrollTrigger: { trigger: seal, start: 'top 85%', once: true } })
      .from([groom, bride], { autoAlpha: 0, y: 16, duration: DUR.md, ease: 'paper', stagger: 0.1 })
      .add(bow(groom), 0.6)
      .add(bow(bride), 0.7)
      .to([groom, bride], { ...HEART, duration: DUR.md, ease: 'back.out(1.6)' }, 1.8)
      .to(bride, { '--heart': '0', '--arm-l': '6deg', duration: 0.2 }, 3.6)
      .add(wave(bride, 1, -30), 3.6)
      .to(bride, { '--heart': '1', '--arm-l': '-30deg', '--eo': '0', '--eh': '1', duration: 0.3 })
    idle([groom, bride], root, { bob: true })
  }
}
