import { DUR, type MotionConditions, SplitText, gsap } from '../../lib/gsap'
import { animateSceneHeading } from '../../lib/sceneHeading'

const once = (trigger: Element, start = 'top 85%') => ({ trigger, start, once: true })

/**
 * Scene 4 — Album. Mỗi vai trò ảnh có một chuyển động riêng (không áp một hiệu ứng cho mọi ảnh):
 * - hero-portrait: mở màn che từ dưới lên
 * - landscape: parallax trong khung (scrub)
 * - detail: thu nhỏ về đúng cỡ + hiện dần
 * - pair: hai ảnh trôi ngược chiều nhau
 * - quote: hiện theo từng chữ
 * Desktop: chương thứ hai thành dải phim pin cuộn ngang — khoảnh khắc bất ngờ duy nhất của album.
 */
export function galleryMotion({ desktop }: MotionConditions, root: HTMLElement) {
  animateSceneHeading(root)

  for (const head of root.querySelectorAll('[data-anim="chapter-head"]')) {
    gsap.from(head.children, { autoAlpha: 0, y: 16, duration: DUR.md, ease: 'paper', stagger: 0.1, scrollTrigger: once(head) })
  }

  const film = desktop ? root.querySelector<HTMLElement>('[data-film="true"] [data-anim="track"]') : null

  for (const item of root.querySelectorAll<HTMLElement>('[data-role]')) {
    if (film?.contains(item)) continue
    const media = item.querySelector('img')
    switch (item.dataset.role) {
      case 'hero-portrait':
        gsap.fromTo(
          item.querySelector('figure') ?? item,
          { clipPath: 'inset(100% 0% 0% 0%)' },
          { clipPath: 'inset(0% 0% 0% 0%)', duration: DUR.xl, ease: 'silk', clearProps: 'clipPath', scrollTrigger: once(item) },
        )
        if (media) gsap.from(media, { scale: 1.15, duration: DUR.xl + 0.4, ease: 'paper', scrollTrigger: once(item) })
        break
      case 'landscape':
        if (media) {
          gsap.fromTo(
            media,
            { yPercent: -8, scale: 1.16 },
            {
              yPercent: 8,
              scale: 1.16,
              ease: 'none',
              scrollTrigger: { trigger: item, start: 'top bottom', end: 'bottom top', scrub: true },
            },
          )
        }
        break
      case 'detail':
        gsap.from(item, { autoAlpha: 0, scale: 1.08, duration: DUR.lg, ease: 'paper', clearProps: 'transform', scrollTrigger: once(item) })
        break
      case 'pair': {
        // Trên mobile ảnh nằm trong hàng vuốt ngang: trôi dọc sẽ làm lệch hàng.
        if (!desktop) break
        const index = [...(item.parentElement?.querySelectorAll('[data-role="pair"]') ?? [])].indexOf(item)
        gsap.fromTo(
          item,
          { y: index % 2 === 0 ? 60 : -60 },
          { y: 0, ease: 'none', scrollTrigger: { trigger: item, start: 'top bottom', end: 'center center', scrub: true } },
        )
        break
      }
      case 'quote': {
        const quote = item.querySelector('blockquote')
        if (quote) {
          SplitText.create(quote, {
            type: 'words',
            autoSplit: true,
            onSplit: (self) =>
              gsap.from(self.words, { autoAlpha: 0, y: 10, duration: DUR.md, ease: 'paper', stagger: 0.05, scrollTrigger: once(quote) }),
          })
        }
        break
      }
    }
  }

  if (film) {
    const chapter = film.closest<HTMLElement>('[data-film="true"]')!
    // Trượt tới khi ảnh cuối chạm mép phải vùng nội dung (trừ padding của chương).
    const distance = () => {
      const style = getComputedStyle(chapter)
      const inner = chapter.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
      return Math.max(0, film.scrollWidth - inner)
    }
    gsap.to(film, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: chapter,
        start: 'top top',
        end: () => `+=${distance()}`,
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
      },
    })
    // Ảnh trong dải phim hiện dần khi trượt vào khung hình.
    gsap.from(film.querySelectorAll('[data-role]'), {
      autoAlpha: 0.25,
      duration: DUR.lg,
      ease: 'paper',
      stagger: 0.12,
      scrollTrigger: once(chapter, 'top 70%'),
    })
  }
}
