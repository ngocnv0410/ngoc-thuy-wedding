import { DUR, gsap } from '../../lib/gsap'
import { chibisIn, floatUp, idle, rig, toPose } from '../../motion/chibi'

const q = (root: Element, name: string) => root.querySelectorAll(`[data-anim="${name}"]`)

/**
 * Scene 1 — Bìa. Một timeline duy nhất (được giữ lại tới khi màn mở đầu xong): nền loang hiện,
 * dấu sáp đặt xuống, tên "được viết" từ trái sang, cành nguyệt quế và khối ngày
 * hiện theo, hoa baby mọc ở hai góc. Sau đó khung bìa trôi chậm hơn nhịp cuộn.
 */
export function heroMotion(root: HTMLElement) {
  const tl = gsap.timeline({ defaults: { ease: 'paper' }, delay: 0.15 })
  const frame = root.querySelector('[data-anim="frame"]')
  const photo = root.querySelector('[data-anim="photo"]')

  if (photo) tl.fromTo(photo, { scale: 1 }, { scale: 1.06, duration: 12, ease: 'none' }, 0)

  // Nền loang (ảnh tĩnh: chỉ opacity).
  tl.from(q(root, 'wash'), { autoAlpha: 0, duration: DUR.xl, ease: 'silk' }, 0)

  tl.from(
    q(root, 'seal'),
    { autoAlpha: 0, scale: 0.6, rotate: -14, transformOrigin: '50% 50%', duration: DUR.lg, ease: 'back.out(1.4)' },
    0.3,
  ).from(q(root, 'masthead'), { autoAlpha: 0, y: 12, duration: DUR.md }, 0.5)

  // Tên viết tay: lộ dần từ trái sang như nét bút; "&" hiện mờ vào giữa.
  const names = [...q(root, 'name')]
  names.forEach((name, index) => {
    const isAmp = index === 1
    if (isAmp) {
      tl.from(name, { autoAlpha: 0, scale: 0.8, duration: DUR.md }, 1.2)
    } else {
      tl.fromTo(
        name,
        { clipPath: 'inset(-30% 100% -30% -15%)' },
        { clipPath: 'inset(-30% -15% -30% -15%)', duration: 1.3, ease: 'power2.inOut', clearProps: 'clipPath' },
        0.7 + (index === 0 ? 0 : 0.75),
      )
    }
  })

  // Cành nguyệt quế, khối ngày, tagline.
  tl.from(q(root, 'rule'), { drawSVG: 0, duration: DUR.lg, ease: 'silk' }, 1.6)
    .from(q(root, 'leaf'), { scale: 0, transformOrigin: '0% 50%', duration: DUR.sm, ease: 'back.out(2)', stagger: 0.025 }, 1.8)
    .from(q(root, 'diamond'), { scale: 0, rotate: 45, transformOrigin: '50% 50%', duration: DUR.md, ease: 'back.out(2)' }, 2.1)
    .from(q(root, 'date-block'), { autoAlpha: 0, y: 16, duration: DUR.lg }, 2)
    .from(q(root, 'meta'), { autoAlpha: 0, y: 12, duration: DUR.md }, 2.3)
    .from(q(root, 'cue'), { autoAlpha: 0, duration: DUR.md }, 2.6)

  // Hoa baby: cả bó nở ra từ góc gắn (gốc phóng ở CSS theo góc).
  tl.from(q(root, 'bouquet'), { autoAlpha: 0, scale: 0.88, duration: DUR.xl, stagger: 0.3 }, 0.8)

  // Cặp chibi nhô lên sau tagline, cô dâu nghiêng đầu tựa vai chú rể, tim và cánh hoa bay lên.
  const couple = root.querySelector('[data-anim="hero-couple"]')
  if (couple && getComputedStyle(couple).display !== 'none') {
    // Animate từng nhân vật: trên điện thoại khối cặp đôi là "display: contents" (không có hộp).
    const [groom, bride] = chibisIn(couple)
    rig([groom, bride])
    tl.from([groom, bride], { autoAlpha: 0, y: 24, duration: DUR.md, stagger: 0.1 }, 2.5)
      .add(toPose(groom, { '--face-x': '0px' }, { duration: DUR.md, ease: 'silk' }), 2.8)
      .add(toPose(bride, { '--head-r': '0deg', '--lean-x': '0px', '--face-x': '0px' }, { duration: DUR.md, ease: 'silk' }), 2.8)
      .add(floatUp(q(root, 'hero-float'), { stagger: 0.18 }), 3.0)
    idle([groom, bride], root)
  }

  // Cuộn ra: khung bìa / lớp ảnh trôi chậm hơn nội dung, tạo chiều sâu nhẹ.
  const scrollOut = { trigger: root, start: 'top top', end: 'bottom top', scrub: true }
  if (frame) gsap.to(frame, { yPercent: -10, ease: 'none', scrollTrigger: scrollOut })
  const media = root.querySelector('[data-anim="media"]')
  if (media) gsap.to(media, { yPercent: 15, ease: 'none', scrollTrigger: scrollOut })
  const overlay = root.querySelector('[data-anim="overlay"]')
  if (overlay) gsap.to(overlay, { yPercent: -20, ease: 'none', scrollTrigger: scrollOut })

  return tl
}
