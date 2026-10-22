import type { Photo } from '../../content/types'

export interface LightboxItem {
  photo: Photo
  /** Thumbnail trên trang — PhotoSwipe phóng ra từ đúng vị trí này và trả focus về khi đóng. */
  element: HTMLElement
}

/**
 * Lightbox album (PhotoSwipe 5) — thư viện và CSS chỉ tải khi khách bấm vào ảnh đầu tiên.
 * Có sẵn: vuốt, pinch-zoom, ←/→/Esc, focus trap, trả focus về ảnh vừa mở.
 */
export async function openLightbox(items: LightboxItem[], index: number) {
  const [{ default: PhotoSwipe }] = await Promise.all([
    import('photoswipe'),
    import('photoswipe/style.css'),
    import('./lightbox.css'),
  ])
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const pswp = new PhotoSwipe({
    dataSource: items.map(({ photo, element }) => ({
      src: photo.image.img.src,
      width: photo.image.img.w,
      height: photo.image.img.h,
      // Ưu tiên WebP (AVIF chưa được mọi webview hỗ trợ trong <img srcset>).
      srcset: photo.image.sources.webp ?? photo.image.sources.jpeg ?? photo.image.sources.jpg,
      alt: photo.alt,
      msrc: element.querySelector('img')?.currentSrc,
      element,
      thumbCropped: true,
    })),
    index,
    showHideAnimationType: reduced ? 'fade' : 'zoom',
    bgOpacity: 0.96,
    closeTitle: 'Đóng (Esc)',
    zoomTitle: 'Phóng to',
    arrowPrevTitle: 'Ảnh trước',
    arrowNextTitle: 'Ảnh sau',
    errorMsg: 'Không tải được ảnh này',
    indexIndicatorSep: ' / ',
  })

  // Chú thích ảnh (nếu có) ở mép dưới.
  pswp.on('uiRegister', () => {
    pswp.ui?.registerElement({
      name: 'caption',
      order: 9,
      isButton: false,
      appendTo: 'root',
      onInit: (el) => {
        const update = () => {
          const caption = items[pswp.currIndex]?.photo.caption ?? ''
          el.textContent = caption
          el.hidden = !caption
        }
        pswp.on('change', update)
        update()
      },
    })
  })

  pswp.init()
}
