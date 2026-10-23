import { holdPaint } from '../../components/decor/paint'
import { gsap, guard } from '../../lib/gsap'
import { blink, bow, lookAround, rig, toPose, wave } from '../../motion/chibi'

const one = (root: Element, selector: string) => root.querySelector<HTMLElement>(selector)
const all = (root: Element, selector: string) => [...root.querySelectorAll<HTMLElement>(selector)]
const anim = (name: string) => `[data-anim="${name}"]`

let intro: gsap.core.Timeline | undefined
let breathing: gsap.core.Tween | undefined
let hostLoops: gsap.core.Animation[] = []

/** Hai bạn chibi đứng trước cửa, theo thứ tự DOM: bên trái rồi bên phải. */
const hostsOf = (root: Element) => all(root, '[data-anim^="host-"]')
/** +1 với người đứng bên trái (khe cửa / giữa màn hình ở bên phải), −1 với người bên phải. */
const inward = (index: number) => (index === 0 ? 1 : -1)
const stopHosts = () => {
  hostLoops.forEach((loop) => loop.kill())
  hostLoops = []
}

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
  intro.from(all(root, anim('greeting')), { autoAlpha: 0, y: 12, duration: 0.9 }, 0.2)
  if (seal) {
    intro.fromTo(
      seal,
      { autoAlpha: 0, scale: 1.3, y: -16 },
      { autoAlpha: 1, scale: 1, y: 0, duration: 0.7, ease: 'back.out(1.6)' },
      1.0,
    )
  }
  intro.from(all(root, anim('cta')), { autoAlpha: 0, y: 12, duration: 0.6 }, 0.7)

  // "Thở" chỉ bắt đầu khi dấu sáp đã đặt xong — hai tween cùng scale không chồng nhau.
  if (seal) {
    intro.call(() => {
      breathing = gsap.to(seal, { scale: 1.02, duration: 1.2, ease: 'sine.inOut', yoyo: true, repeat: -1 })
    })
  }
  // Hai bạn chibi đứng trước cửa: bước ra, nhìn quanh, chớp mắt rồi nhìn khách (tư thế cuối).
  const hosts = hostsOf(root)
  if (hosts.length) {
    rig(hosts)
    intro
      .from(hosts, { autoAlpha: 0, y: 18, duration: 0.6, stagger: 0.12 }, 1.0)
      .add(lookAround(hosts), 1.8)
      .add(blink(hosts), 3.1)
      // Trong lúc đứng chờ: thở nhẹ liên tục + một chuỗi cử chỉ lặp ~7s cho tới khi khách bấm mở.
      .call(() => {
        stopHosts()
        const [left, right] = hosts
        hostLoops = [
          gsap.to(hosts, { '--body-y': '-3px', duration: 1.3, ease: 'sine.inOut', yoyo: true, repeat: -1, stagger: 0.45 }),
          gsap
            .timeline({ repeat: -1, repeatDelay: 1.8, delay: 0.8 })
            .add(blink(hosts))
            // Quay sang nhìn nhau cười, nghiêng đầu, tóc chú rể nảy.
            .to(hosts, { '--face-x': (i: number) => `${4 * inward(i)}px`, '--eo': '0', '--eh': '1', duration: 0.35, ease: 'silk' }, 0.5)
            .to(hosts, { '--head-r': (i: number) => `${5 * inward(i)}deg`, duration: 0.4, ease: 'silk' }, 0.6)
            .to(hosts, { '--tuft': '-14deg', duration: 0.15, ease: 'power2.out', yoyo: true, repeat: 3 }, 0.7)
            .add(toPose(hosts, { '--face-x': '0px', '--head-r': '0deg', '--eo': '1', '--eh': '0' }, { ease: 'silk' }), 2.0)
            .add(lookAround(hosts), 2.6)
            // Vẫy tay chào khách: người bên phải trước, người bên trái nối theo.
            .add(right ? wave(right, 1) : gsap.timeline(), 4.5)
            .add(left ? wave(left, 1) : gsap.timeline(), 4.9)
            .to(hosts, { '--eo': '1', '--eh': '0', duration: 0.2 }, '+=0.1')
            // Nhún chân một cái (transform của cả người — không tranh `--body-y` với nhịp thở).
            .to(hosts, { y: -7, duration: 0.16, ease: 'power2.out', yoyo: true, repeat: 1, stagger: 0.08 }, '+=0.2'),
        ]
      })
  }
  const cancelGuard = guard(intro)

  return () => {
    cancelGuard()
    intro?.kill()
    breathing?.kill()
    stopHosts()
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

  tl.add(hostsOpen(root), 0)
    .to(all(root, anim('greeting')), { autoAlpha: 0, y: -12, duration: 0.4 }, 0.1)
    .to(all(root, anim('cta')), { autoAlpha: 0, y: 12, duration: 0.4 }, 0.2)
    .call(onReveal, [], 1.05)
    // Chờ hai bạn mời khách vào xong rồi mới tan overlay.
    .to(root, { autoAlpha: 0, duration: 0.5, ease: 'power1.out' }, HOSTS_DONE)

  guard(tl)

  return {
    fastForward: () => void tl.timeScale(3),
    finish: () => void tl.progress(1),
  }
}

/** Lúc hai bạn mời khách xong — overlay bắt đầu tan. */
const HOSTS_DONE = 2.4

/**
 * Bấm "Mở thiệp": hai bạn quay sang nhìn nhau → đi vào giữa tới khe cửa → đưa tay đẩy hai cánh ra
 * (cửa bắt đầu xoay lúc 0.6s) → lùi ra hai bên → đưa tay về phía cửa đã mở, cúi chào mời khách vào.
 */
function hostsOpen(root: HTMLElement) {
  intro?.progress(1)
  stopHosts()
  const tl = gsap.timeline({ defaults: { ease: 'paper' } })
  const hosts = hostsOf(root)
  if (!hosts.length) return tl
  rig(hosts)
  // Quãng đi vào: mép trong của mỗi người tới sát khe cửa (giữa màn hình).
  const middle = root.getBoundingClientRect().left + root.clientWidth / 2
  const walkIn = hosts.map((el, i) => {
    const box = el.getBoundingClientRect()
    return middle - 6 * inward(i) - (i === 0 ? box.right : box.left)
  })
  const stride = { duration: 0.11, ease: 'sine.inOut', yoyo: true }
  const walk = (at: number, steps: number) =>
    tl
      .fromTo(
        hosts,
        { '--leg-l': '-16deg', '--leg-r': '16deg', '--skirt': '-4deg' },
        { '--leg-l': '16deg', '--leg-r': '-16deg', '--skirt': '4deg', ...stride, repeat: steps },
        at,
      )
      .to(hosts, { '--body-y': '-4px', ...stride, duration: stride.duration / 2, repeat: steps * 2 + 1 }, at)
      .to(hosts, { '--leg-l': '0deg', '--leg-r': '0deg', '--skirt': '0deg', '--body-y': '0px', duration: 0.1 }, at + stride.duration * (steps + 1))

  tl.to(hosts, { '--face-x': (i: number) => `${4 * inward(i)}px`, '--eo': '0', '--eh': '1', duration: 0.2 }, 0)
    // Đi vào giữa.
    .to(hosts, { x: (i: number) => walkIn[i], duration: 0.5, ease: 'power1.inOut' }, 0.05)
  walk(0.05, 3)
  // Đẩy cửa: hai tay đưa về phía cánh cửa của mình, người nghiêng theo.
  tl.to(
    hosts,
    {
      '--arm-l': (i: number) => (i === 0 ? '95deg' : '-55deg'),
      '--arm-r': (i: number) => (i === 0 ? '-55deg' : '95deg'),
      '--upper-r': (i: number) => `${-10 * inward(i)}deg`,
      '--face-x': (i: number) => `${-4 * inward(i)}px`,
      duration: 0.3,
    },
    0.55,
  )
    .to(hosts, { '--arm-l': '6deg', '--arm-r': '6deg', '--upper-r': '0deg', duration: 0.25, ease: 'silk' }, 1.05)
    // Lùi ra hai bên, nhường lối vào.
    .to(hosts, { x: (i: number) => walkIn[i] * 0.25, duration: 0.45, ease: 'power1.inOut' }, 1.15)
  walk(1.15, 3)
  // Mời vào: tay hướng về cửa đã mở, cúi chào, mắt cười.
  return tl
    .to(
      hosts,
      {
        '--arm-r': (i: number) => (i === 0 ? '100deg' : '6deg'),
        '--arm-l': (i: number) => (i === 0 ? '6deg' : '100deg'),
        '--face-x': '0px',
        '--head-r': (i: number) => `${6 * inward(i)}deg`,
        duration: 0.35,
        ease: 'back.out(1.4)',
      },
      1.6,
    )
    .add(bow(hosts, 0.8), 1.75)
    .to(hosts, { '--eo': '0', '--ec': '0', '--eh': '1', duration: 0.15 }, 2.3)
}

/** Bản 3D: cửa do Doors3D mở, hai bạn chibi chạy timeline riêng — có lưới an toàn và tua nhanh. */
export function openHosts(root: HTMLElement) {
  const tl = hostsOpen(root)
  guard(tl)
  return {
    fastForward: () => void tl.timeScale(3),
    finish: () => void tl.progress(1),
  }
}
