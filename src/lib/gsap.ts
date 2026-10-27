import gsap from 'gsap'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

/*
 * GSAP chỉ được import bởi chunk motion tải sau (src/motion/runtime.ts) — không bao giờ từ
 * component, để JS ban đầu không phải mang thư viện này.
 */
gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin)

/**
 * Tên ease dùng chung, xấp xỉ `--ease-paper` (quint out) / `--ease-silk` (cubic in-out) trong
 * tokens.css. Dùng ease có sẵn của GSAP thay vì CustomEase để bớt ~5 KB.
 */
gsap.registerEase('paper', gsap.parseEase('power4.out'))
gsap.registerEase('silk', gsap.parseEase('power2.inOut'))

/** Thời lượng (giây), trùng `--dur-*`. */
export const DUR = { xs: 0.15, sm: 0.3, md: 0.6, lg: 1, xl: 1.6 } as const

/** Điều kiện cho `gsap.matchMedia()`. */
export const MEDIA = {
  motion: '(prefers-reduced-motion: no-preference)',
  reduce: '(prefers-reduced-motion: reduce)',
  desktop: '(min-width: 1024px)',
  fine: '(pointer: fine)',
} as const

export type MotionConditions = { motion: boolean; reduce: boolean; desktop: boolean; fine: boolean }

/**
 * Lưới an toàn: nếu trình duyệt bóp khung hình (tab nền, webview tiết kiệm pin) khiến timeline
 * không chạy, đến hạn thì nhảy thẳng tới cuối — màn mở cửa/thiệp không bao giờ kẹt ở trạng thái ẩn.
 */
export function guard(timeline: gsap.core.Timeline, slackMs = 1500): () => void {
  const timer = window.setTimeout(() => {
    if (timeline.progress() < 1) timeline.progress(1)
  }, timeline.totalDuration() * 1000 + slackMs)
  return () => window.clearTimeout(timer)
}

/**
 * Chữ xuất hiện theo dòng, mỗi dòng trượt lên trong mask. Class `split-line-mask` có
 * padding bù để không cắt dấu chồng tiếng Việt (xem global.css).
 */
export function revealLines(target: Element, vars: { start?: string; stagger?: number; delay?: number } = {}) {
  return SplitText.create(target, {
    type: 'lines',
    mask: 'lines',
    linesClass: 'split-line',
    autoSplit: true,
    onSplit: (self) =>
      gsap.from(self.lines, {
        yPercent: 110,
        duration: DUR.lg,
        ease: 'paper',
        stagger: vars.stagger ?? 0.08,
        delay: vars.delay ?? 0,
        scrollTrigger: vars.start === 'none' ? undefined : { trigger: target, start: vars.start ?? 'top 85%', once: true },
      }),
  })
}

/** Vẽ dần các nét SVG (DrawSVG) khi vào khung nhìn. */
export function drawIn(
  targets: gsap.TweenTarget,
  trigger: Element,
  vars: { duration?: number; stagger?: number; start?: string; delay?: number } = {},
) {
  return gsap.from(targets, {
    drawSVG: 0,
    duration: vars.duration ?? DUR.xl,
    ease: 'silk',
    stagger: vars.stagger ?? 0,
    delay: vars.delay ?? 0,
    scrollTrigger: { trigger, start: vars.start ?? 'top 85%', once: true },
  })
}

/** Nâng nhẹ + hiện dần; dùng cho khối nội dung, thẻ. */
export function riseIn(
  targets: gsap.TweenTarget,
  trigger: Element,
  vars: { y?: number; stagger?: number; start?: string; delay?: number } = {},
) {
  return gsap.from(targets, {
    y: vars.y ?? 24,
    autoAlpha: 0,
    duration: DUR.md,
    ease: 'paper',
    stagger: vars.stagger ?? 0.08,
    delay: vars.delay ?? 0,
    // Trả lại trạng thái gốc: không để transform tồn dư (quan trọng với QR).
    clearProps: 'transform',
    scrollTrigger: { trigger, start: vars.start ?? 'top 90%', once: true },
  })
}

/** Dây lá phân cách: dây và tua cuốn vẽ dần, lá nở dọc dây, bông hoa giữa xoay nở ra. */
export function drawDivider(divider: Element) {
  const once = { trigger: divider, start: 'top 85%', once: true }
  drawIn(divider.querySelectorAll('[data-anim="rule"]'), divider, { duration: DUR.lg })
  gsap.from(divider.querySelectorAll('[data-anim="leaf"]'), {
    scale: 0,
    transformOrigin: '0% 50%',
    duration: DUR.sm,
    ease: 'back.out(2)',
    stagger: 0.03,
    delay: 0.3,
    scrollTrigger: once,
  })
  gsap.from(divider.querySelectorAll('[data-anim="blossom"]'), {
    scale: 0,
    rotate: -72,
    transformOrigin: '50% 50%',
    duration: DUR.md,
    ease: 'back.out(2)',
    delay: 0.7,
    scrollTrigger: once,
  })
}

/**
 * Lụa satin + cành lá ở góc: hiện dần và nở nhẹ từ góc gắn. Ảnh tĩnh nên chỉ animate
 * opacity/transform — chạy trên compositor, không bắt điện thoại vẽ lại.
 */
export function growDrapes(root: Element, trigger: Element = root, delay = 0) {
  const drapes = root.querySelectorAll('[data-anim="drape"]')
  if (!drapes.length) return
  gsap.from(drapes, {
    autoAlpha: 0,
    scale: 0.88,
    duration: DUR.xl,
    ease: 'paper',
    delay,
    stagger: 0.25,
    scrollTrigger: { trigger, start: 'top 85%', once: true },
  })
}

/** Nền loang cẩm thạch hiện dần (ảnh tĩnh: chỉ opacity). */
export function washIn(root: Element, trigger: Element = root, delay = 0) {
  const washes = root.querySelectorAll('[data-anim="wash"]')
  if (washes.length) {
    gsap.from(washes, { autoAlpha: 0, duration: DUR.xl, ease: 'silk', delay, scrollTrigger: { trigger, start: 'top 85%', once: true } })
  }
}

export { gsap, ScrollTrigger, SplitText }
