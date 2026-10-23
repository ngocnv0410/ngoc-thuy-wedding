/**
 * Chunk motion — tải sau lần render đầu. Chứa GSAP, Lenis (tải động tiếp) và toàn bộ
 * animation của các scene. Component không import file này trực tiếp mà qua `useMotion.ts`.
 */
import type Lenis from 'lenis'
import { MEDIA, type MotionConditions, ScrollTrigger, gsap, guard } from '../lib/gsap'
import { detailsMotion } from '../scenes/Details/detailsMotion'
import { galleryMotion } from '../scenes/Gallery/galleryMotion'
import { giftMotion } from '../scenes/Gift/giftMotion'

export { giftCelebrate } from '../scenes/Gift/giftMotion'
import { heroMotion } from '../scenes/Hero/heroMotion'
import { locationsMotion } from '../scenes/Locations/locationsMotion'
import { openDoors as openDoorsTimeline } from '../scenes/Opening/openingMotion'
import { startLight } from './light'

export { introDoors, openChibis } from '../scenes/Opening/openingMotion'

export type SceneKey = 'hero' | 'details' | 'locations' | 'gallery' | 'gift'

const root = document.documentElement

// ── Bìa: chờ cửa mở mới phát ─────────────────────────────────
let heroTimeline: gsap.core.Timeline | undefined
let heroReleased = false

const isOpening = () => root.dataset.opening === 'on'

/** Phát phần mở màn của bìa (gọi khi cửa đã hé / được bỏ qua). */
export function releaseHero() {
  heroReleased = true
  if (heroTimeline?.paused()) {
    heroTimeline.play()
    guard(heroTimeline)
  }
}

/** Mở cửa; bìa thật phía sau được phát ngay khi cửa vừa hé đủ rộng. */
export function openDoors(root: HTMLElement, onDone: () => void) {
  return openDoorsTimeline(root, { onReveal: releaseHero, onDone })
}

const SCENES: Record<SceneKey, (conditions: MotionConditions, el: HTMLElement) => void> = {
  hero: (_, el) => {
    heroTimeline = heroMotion(el)
    if (!heroReleased && isOpening()) heroTimeline.pause(0)
    else guard(heroTimeline)
  },
  details: (_, el) => detailsMotion(el),
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

// ── Toàn cục: bật một lần khi scene đầu tiên được gắn ──────────
let globalStarted = false

function ensureGlobal() {
  if (globalStarted) return
  globalStarted = true

  const mm = gsap.matchMedia()
  mm.add(MEDIA.motion, () => {
    // 'pending' (đặt bởi script nội tuyến trong index.html) → 'on': hết che phần tử chờ animate.
    root.dataset.motion = 'on'
    const stopLight = startLight()
    return () => {
      stopLight()
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
    if (conditions.motion) SCENES[key](conditions, el)
  })
  return () => mm.revert()
}
