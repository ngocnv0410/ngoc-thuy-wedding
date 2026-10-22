import { useLayoutEffect, useRef } from 'react'
import styles from './BabysBreath.module.css'
import { type Corner, SHAPE, type Tone, type Variant, bouquetSvg } from './bouquet.ts'
import { drawSvg, paintDensity, queuePaint } from './paint'

export type { Corner, Variant }

interface BabysBreathProps {
  corner: Corner
  variant?: Variant
  seed?: number
  /** Trên nền tối (ánh nến) dùng tông kem sáng hơn. */
  tone?: Tone
  className?: string
}

/**
 * Hoa baby khô ở góc (hoạ tiết theo mẫu tham khảo 3), vẽ một lần thành bitmap trên canvas lúc
 * trình duyệt rảnh (xem paint.ts). Trang trí thuần — ẩn với trình đọc màn hình.
 */
export function BabysBreath({ corner, variant = 'spray', seed = 7, tone = 'light', className }: BabysBreathProps) {
  const ref = useRef<HTMLCanvasElement>(null)
  const { width, height } = SHAPE[variant]

  useLayoutEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    return queuePaint(() => {
      const scale = (canvas.clientWidth * paintDensity()) / width
      if (!scale) return
      return drawSvg(canvas, bouquetSvg(seed, variant, corner, tone), Math.round(width * scale), Math.round(height * scale))
    })
  }, [seed, variant, corner, tone, width, height])

  return (
    <canvas
      ref={ref}
      className={[styles.bouquet, className].filter(Boolean).join(' ')}
      // Kích thước ban đầu chỉ để giữ tỉ lệ khung trước khi vẽ (CSS quyết định bề ngang).
      width={width}
      height={height}
      aria-hidden="true"
      data-corner={corner}
      data-variant={variant}
      data-anim="bouquet"
    />
  )
}
