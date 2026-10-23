/**
 * Thư viện động tác chibi (chunk motion). Mỗi nhân vật là một phần tử `[data-chibi]` mang toàn bộ
 * trạng thái rig dưới dạng biến CSS (xem src/components/chibi/Chibi.tsx) — động tác chỉ tween các
 * biến đó, hoặc transform của chính phần tử gốc khi cả người di chuyển.
 *
 * Markup luôn ở tư thế CUỐI của cảnh; các hàm ở đây đi từ trạng thái hiện tại tới đích rồi trả về
 * (bow, blink, wave), hoặc được dùng với `from` trong timeline của scene.
 */
import { ScrollTrigger, gsap } from '../lib/gsap'

type Target = Element | Element[]

export const chibisIn = (root: Element) => [...root.querySelectorAll<HTMLElement | SVGGElement>('[data-chibi]')]

/** Chớp mắt — chỉ những ai đang mở mắt lúc chớp (mắt cười / đang nhắm thì giữ nguyên). */
export function blink(target: Target) {
  const all = Array.isArray(target) ? target : [target]
  let open: Element[] = []
  return gsap
    .timeline()
    .call(() => {
      open = all.filter((el) => String(gsap.getProperty(el, '--eo')).trim() === '1' && String(gsap.getProperty(el, '--eh')).trim() !== '1')
      if (open.length) gsap.set(open, { '--eo': '0', '--ec': '1' })
    })
    .call(() => void (open.length && gsap.set(open, { '--eo': '1', '--ec': '0' })), [], 0.14)
}

/** Liếc trái – phải rồi về giữa, đầu nghiêng theo. */
export function lookAround(target: Target) {
  return gsap
    .timeline({ defaults: { duration: 0.4, ease: 'silk' } })
    .to(target, { '--face-x': '-4px', '--head-r': '-5deg' })
    .to(target, { '--face-x': '4px', '--head-r': '5deg' }, '+=0.25')
    .to(target, { '--face-x': '0px', '--head-r': '0deg' }, '+=0.25')
}

/** Chạy vào từ `fromX` (px) về vị trí markup: chân/váy xen kẽ, người nảy theo nhịp bước. */
export function run(el: Element, fromX: number, duration = 0.5) {
  const steps = Math.max(2, Math.round(duration / 0.12))
  const stride = { duration: duration / steps, repeat: steps - 1, yoyo: true, ease: 'sine.inOut' }
  return gsap
    .timeline()
    .from(el, { x: fromX, duration, ease: 'power2.out' }, 0)
    .fromTo(el, { '--leg-l': '-18deg', '--leg-r': '18deg', '--skirt': '-4deg' }, { '--leg-l': '18deg', '--leg-r': '-18deg', '--skirt': '4deg', ...stride }, 0)
    .fromTo(el, { '--body-y': '0px' }, { '--body-y': '-4px', ...stride, duration: duration / steps / 2, repeat: steps * 2 - 1 }, 0)
    .to(el, { '--leg-l': '0deg', '--leg-r': '0deg', '--skirt': '0deg', '--body-y': '0px', duration: 0.12 })
}

/** Cúi chào (nhìn thẳng nên cúi = thân trên hạ và co lại, đầu gật, mắt nhắm), giữ rồi đứng lên. */
export function bow(target: Target, depth = 1) {
  return gsap
    .timeline()
    .to(target, { '--upper-y': `${7 * depth}px`, '--upper-sy': `${1 - 0.07 * depth}`, '--head-y': `${5 * depth}px`, '--eo': '0', '--ec': '1', duration: 0.4, ease: 'paper' })
    .to(target, { '--upper-y': '0px', '--upper-sy': '1', '--head-y': '0px', '--eo': '1', '--ec': '0', duration: 0.4, ease: 'silk' }, '+=0.3')
}

/** Vẫy tay phải (giơ lên rồi lắc), mắt cười; cuối cùng về góc tay `restDeg`. */
export function wave(el: Element, times = 2, restDeg = 6) {
  const tl = gsap.timeline().to(el, { '--arm-r': '130deg', '--eo': '0', '--eh': '1', duration: 0.25, ease: 'paper' })
  for (let i = 0; i < times; i++) {
    tl.to(el, { '--arm-r': '112deg', duration: 0.18, ease: 'sine.inOut' }).to(el, { '--arm-r': '138deg', duration: 0.18, ease: 'sine.inOut' })
  }
  return tl.to(el, { '--arm-r': `${restDeg}deg`, duration: 0.3, ease: 'silk' })
}

/** Tim / cánh hoa bay lên lệch nhẹ rồi tan (phần tử đích ở markup luôn ẩn). */
export function floatUp(targets: ArrayLike<Element>, vars: { stagger?: number; rise?: number } = {}) {
  const tl = gsap.timeline()
  Array.from(targets).forEach((el, index) => {
    const at = index * (vars.stagger ?? 0.2)
    tl.fromTo(
      el,
      { y: 0, x: 0, scale: 0.6, rotate: 0 },
      {
        y: -(vars.rise ?? 60),
        x: gsap.utils.random(-12, 12),
        rotate: gsap.utils.random(-25, 25),
        scale: 1,
        duration: 1.6,
        ease: 'power1.out',
      },
      at,
    )
      .fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, ease: 'none' }, at)
      .to(el, { autoAlpha: 0, duration: 0.5, ease: 'power1.in' }, at + 1.1)
  })
  return tl
}

/**
 * Nhịp "đứng chờ": nhún nhẹ + chớp mắt định kỳ. Chỉ chạy khi `trigger` còn trong khung nhìn
 * (khi tab ẩn thì ticker của GSAP tự dừng). Tạo trong gsap.matchMedia nên tự dọn khi scene gỡ.
 */
export function idle(chibis: Element[], trigger: Element, { bob = true } = {}) {
  if (!chibis.length) return
  const loops: gsap.core.Animation[] = []
  if (bob) {
    loops.push(
      gsap.to(chibis, { '--body-y': '-3px', duration: 1.2, ease: 'sine.inOut', yoyo: true, repeat: -1, stagger: 0.4, paused: true }),
    )
  }
  chibis.forEach((el, index) => {
    loops.push(gsap.timeline({ repeat: -1, repeatDelay: 3.2 + index * 0.9, delay: 1 + index, paused: true }).add(blink(el)))
  })
  ScrollTrigger.create({
    trigger,
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (self) => loops.forEach((loop) => (self.isActive ? loop.play() : loop.pause())),
  })
}
