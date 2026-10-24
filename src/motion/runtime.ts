/**
 * Chunk motion — tải sau lần render đầu. Chứa GSAP, Lenis (tải động tiếp) và toàn bộ
 * animation của các scene. Component không import file này trực tiếp mà qua `useMotion.ts`.
 */
import type Lenis from 'lenis'
import { MEDIA, type MotionConditions, ScrollTrigger, gsap, guard } from '../lib/gsap'
import { detailsMotion } from '../scenes/Details/detailsMotion'
import { countdownMotion } from '../scenes/Countdown/countdownMotion'
import { galleryMotion } from '../scenes/Gallery/galleryMotion'
import { giftMotion } from '../scenes/Gift/giftMotion'

export { giftCelebrate } from '../scenes/Gift/giftMotion'
import { heroMotion } from '../scenes/Hero/heroMotion'
import { locationsMotion } from '../scenes/Locations/locationsMotion'
import { openDoors as openDoorsTimeline } from '../scenes/Opening/openingMotion'
import { startLight } from './light'

export { introDoors, openHosts } from '../scenes/Opening/openingMotion'

export type SceneKey = 'hero' | 'countdown' | 'details' | 'locations' | 'gallery' | 'gift'

/** Re-measure scene positions after async guestbook content changes height. */
export function refreshLayout() { ScrollTrigger.refresh() }

const root = document.documentElement

// ── Bìa: chờ cửa mở mới phát ─────────────────────────────────
interface HeroPlayback {
  timeline: gsap.core.Timeline
  opening: HTMLElement | null
  cancelGuard?: () => void
}
let heroPlayback: HeroPlayback | undefined
// Each mounted opening is a separate viewing, including after skipping or replaying.
const revealedOpenings = new WeakSet<HTMLElement>()

/** Phát phần mở màn của bìa (gọi khi cửa đã hé / được bỏ qua). */
export function releaseHero(opening: HTMLElement) {
  revealedOpenings.add(opening)
  const current = heroPlayback
  // An old opening's async callback must never release a later viewing.
  if (current?.opening === opening && current.timeline.paused()) {
    current.timeline.play()
    current.cancelGuard = guard(current.timeline)
  }
}

/** Mở cửa; bìa thật phía sau được phát ngay khi cửa vừa hé đủ rộng. */
export function openDoors(root: HTMLElement, onDone: () => void) {
  return openDoorsTimeline(root, { onReveal: () => releaseHero(root), onDone })
}

const SCENES: Record<SceneKey, (conditions: MotionConditions, el: HTMLElement) => void | (() => void)> = {
  hero: (_, el) => {
    // Global lighting follows the current scene elements after a full replay remount.
    const stopLight = startLight()
    const current: HeroPlayback = {
      timeline: heroMotion(el),
      opening: document.getElementById('opening'),
    }
    heroPlayback = current
    if (current.opening && !revealedOpenings.has(current.opening)) current.timeline.pause(0)
    else current.cancelGuard = guard(current.timeline)
    return () => {
      stopLight()
      current.cancelGuard?.()
      if (heroPlayback === current) heroPlayback = undefined
    }
  },
  details: (_, el) => detailsMotion(el),
  countdown: (_, el) => countdownMotion(el),
  locations: (_, el) => locationsMotion(el),
  gallery: galleryMotion,
  gift: (_, el) => giftMotion(el),
}

// ── Cuộn mượt (chỉ desktop chuột) ──────────────────────────────
let lenis: Lenis | undefined
let scrollLocked = false

/** Dừng/tiếp tục Lenis cùng lúc với khoá cuộn native. */
export function setScrollLocked(locked: boolean) {
  scrollLocked = locked
  if (locked) lenis?.stop()
  else lenis?.start()
}

function startSmoothScroll(): () => void {
  let cancelled = false
  let tick: ((time: number) => void) | undefined
  import('lenis').then(({ default: LenisClass }) => {
    if (cancelled) return
    lenis = new LenisClass({ autoRaf: false, anchors: true, lerp: 0.1 })
    lenis.on('scroll', ScrollTrigger.update)
    if (scrollLocked) lenis.stop()
    const instance = lenis
    tick = (time: number) => instance.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
  })
  return () => {
    cancelled = true
    if (tick) gsap.ticker.remove(tick)
    lenis?.destroy()
    lenis = undefined
  }
}

// ── Chuyển chương (mục lục) ────────────────────────────────────
let jump: gsap.core.Tween | undefined

/**
 * Cuộn mượt tới một chương: nhanh dần rồi chậm dần (thay cho smooth-scroll native, vốn gắt và
 * khác nhau giữa Safari/Zalo). Thời lượng theo quãng đường, 0.7–1.6s. Desktop dùng Lenis; điện
 * thoại tween vị trí cuộn trực tiếp. Khách chạm/lăn chuột giữa chừng thì dừng ngay.
 */
export function scrollToSection(target: HTMLElement, onDone: () => void) {
  jump?.kill()
  const top = target.getBoundingClientRect().top + window.scrollY
  const distance = Math.abs(top - window.scrollY)
  const duration = gsap.utils.clamp(0.7, 1.6, 0.4 + distance / 2800)

  if (lenis) {
    lenis.scrollTo(target, { duration, easing: gsap.parseEase('power3.inOut'), onComplete: onDone })
    return
  }

  const position = { y: window.scrollY }
  const stop = () => jump?.kill()
  const listen = (add: boolean) => {
    for (const type of ['wheel', 'touchstart', 'keydown'] as const) {
      if (add) window.addEventListener(type, stop, { passive: true, once: true })
      else window.removeEventListener(type, stop)
    }
  }
  listen(true)
  jump = gsap.to(position, {
    y: top,
    duration,
    ease: 'power3.inOut',
    // 'instant': bỏ qua `scroll-behavior: smooth` của trang, nếu không mỗi khung hình lại tự cuộn mượt.
    onUpdate: () => window.scrollTo({ top: position.y, behavior: 'instant' }),
    onComplete: () => {
      listen(false)
      onDone()
    },
    onInterrupt: () => listen(false),
  })
}

// ── Toàn cục: bật một lần khi scene đầu tiên được gắn ──────────
let globalStarted = false

function ensureGlobal() {
  if (globalStarted) return
  globalStarted = true

  const mm = gsap.matchMedia()
  mm.add(MEDIA.motion, () => {
    // 'pending' (đặt bởi script nội tuyến trong index.html) → 'on': hết che phần tử chờ animate.
    root.dataset.motion = 'on'
    return () => {
      delete root.dataset.motion
    }
  })
  mm.add(`${MEDIA.motion} and ${MEDIA.fine} and ${MEDIA.desktop}`, () => startSmoothScroll())

  // Font và ảnh tải xong làm đổi kích thước bố cục: đo lại vị trí các ScrollTrigger.
  const refresh = () => ScrollTrigger.refresh()
  document.fonts?.ready.then(refresh)
  if (document.readyState === 'complete') refresh()
  else window.addEventListener('load', refresh, { once: true })
}

/**
 * Gắn animation cho một scene trong `gsap.matchMedia()`: mọi tween/ScrollTrigger tự dọn khi
 * unmount hoặc khi điều kiện media đổi. Reduced-motion: không chạy gì.
 */
export function mountScene(key: SceneKey, el: HTMLElement): () => void {
  ensureGlobal()
  const mm = gsap.matchMedia()
  mm.add(MEDIA, (context) => {
    const conditions = context.conditions as MotionConditions
    if (conditions.motion) return SCENES[key](conditions, el)
  })
  return () => mm.revert()
}
