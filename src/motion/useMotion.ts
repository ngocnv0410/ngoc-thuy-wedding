import { useEffect, type RefObject } from 'react'
import type * as Runtime from './runtime'

export type SceneKey = Runtime.SceneKey
type RuntimeModule = typeof Runtime

let loading: Promise<RuntimeModule> | undefined

/** Khách không bật "giảm chuyển động". */
export function prefersMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: no-preference)').matches
}

/**
 * Tải chunk motion (GSAP + toàn bộ animation) — chỉ một lần, song song với lần render đầu,
 * không nằm trong JS khởi đầu.
 */
export function loadMotion(): Promise<RuntimeModule> {
  loading ??= import('./runtime')
  return loading
}

/** Như `loadMotion` nhưng bỏ cuộc sau `ms` — dùng khi khách đang chờ (ví dụ vừa bấm "Mở thiệp"). */
export function loadMotionWithin(ms: number): Promise<RuntimeModule> {
  return Promise.race([
    loadMotion(),
    new Promise<never>((_, reject) => window.setTimeout(() => reject(new Error('motion timeout')), ms)),
  ])
}

/**
 * Gắn animation của một scene khi chunk motion đã tải. Khi reduced-motion: không tải gì,
 * nội dung hiển thị tĩnh.
 */
export function useSceneMotion(ref: RefObject<HTMLElement | null>, key: SceneKey) {
  useEffect(() => {
    if (!prefersMotion()) return
    let dispose: (() => void) | undefined
    let cancelled = false
    loadMotion()
      .then((runtime) => {
        if (!cancelled && ref.current) dispose = runtime.mountScene(key, ref.current)
      })
      .catch(() => {
        // Không tải được motion: trang vẫn đầy đủ nội dung, chỉ không có hiệu ứng.
        delete document.documentElement.dataset.motion
      })
    return () => {
      cancelled = true
      dispose?.()
    }
  }, [ref, key])
}

/**
 * Chuyển tới một chương: cuộn mượt (chunk motion) rồi đưa focus vào chương để bàn phím và trình
 * đọc màn hình đi tiếp từ đó. Reduced-motion hoặc chưa tải được motion: nhảy thẳng.
 */
export function goToSection(id: string) {
  const target = document.getElementById(id)
  if (!target) return
  const arrive = () => {
    history.replaceState(null, '', `#${id}`)
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
    target.focus({ preventScroll: true })
  }
  const jumpNow = () => {
    target.scrollIntoView({ behavior: 'instant', block: 'start' })
    arrive()
  }
  if (!prefersMotion()) {
    jumpNow()
    return
  }
  loadMotionWithin(1000)
    .then((runtime) => runtime.scrollToSection(target, arrive))
    .catch(jumpNow)
}

/** Khoá cuộn trang (trong lúc màn mở cửa đang hiện). */
export function lockScroll(locked: boolean) {
  document.documentElement.style.overflow = locked ? 'hidden' : ''
  if (prefersMotion()) {
    loadMotion()
      .then((runtime) => runtime.setScrollLocked(locked))
      .catch(() => {})
  }
}
