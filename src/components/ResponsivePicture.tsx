import type { CSSProperties } from 'react'
import type { ResponsiveImage } from '../content/types'

const FORMAT_ORDER = ['avif', 'webp', 'jpeg', 'jpg', 'png']
const MIME: Record<string, string> = {
  avif: 'image/avif',
  webp: 'image/webp',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
}

interface ResponsivePictureProps {
  image: ResponsiveImage
  /** Ảnh dọc thay thế dưới breakpoint `artBelow` (art direction). */
  portrait?: ResponsiveImage
  artBelow?: number
  alt: string
  sizes: string
  /** Ảnh LCP (bìa): tải ngay, ưu tiên cao. */
  priority?: boolean
  className?: string
  style?: CSSProperties
  /** Móc cho animation (ví dụ push-in ảnh bìa). */
  'data-anim'?: string
}

function sourcesOf(image: ResponsiveImage, media: string | undefined, sizes: string) {
  return Object.entries(image.sources)
    .sort(([a], [b]) => FORMAT_ORDER.indexOf(a) - FORMAT_ORDER.indexOf(b))
    .map(([format, srcSet]) => (
      <source key={`${media ?? 'all'}-${format}`} media={media} type={MIME[format]} srcSet={srcSet} sizes={sizes} />
    ))
}

/** `<picture>` AVIF/WebP/JPEG từ vite-imagetools, có kích thước sẵn để tránh CLS. */
export function ResponsivePicture({
  image,
  portrait,
  artBelow = 640,
  alt,
  sizes,
  priority = false,
  className,
  style,
  'data-anim': dataAnim,
}: ResponsivePictureProps) {
  return (
    <picture>
      {portrait && sourcesOf(portrait, `(max-width: ${artBelow - 1}px)`, sizes)}
      {sourcesOf(image, undefined, sizes)}
      <img
        src={image.img.src}
        width={image.img.w}
        height={image.img.h}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        className={className}
        style={style}
        data-anim={dataAnim}
      />
    </picture>
  )
}
