import { type RefObject, useLayoutEffect, useRef, useState } from 'react'
import styles from './MarbleFrame.module.css'
import { type Tone, W, frame, frameCrispSvg, frameSoftSvg } from './marble.ts'
import { loadSvg, paintDensity, queuePaint } from './paint'

/** Chiều cao khung vẽ theo tỉ lệ thật của phần tử (làm tròn, chỉ đổi khi lệch nhiều). */
function useFrameHeight(ref: RefObject<HTMLCanvasElement | null>) {
  const [height, setHeight] = useState(() => Math.round((W * window.innerHeight) / Math.max(1, window.innerWidth) / 50) * 50)
  useLayoutEffect(() => {
    const node = ref.current
    if (!node) return
    const update = () => {
      const { width, height: h } = node.getBoundingClientRect()
      if (!width || !h) return
      const next = Math.round((W * h) / width / 50) * 50
      setHeight((current) => (Math.abs(next - current) / current > 0.15 ? next : current))
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(node)
    return () => observer.disconnect()
  }, [ref])
  return height
}

interface MarbleFrameProps {
  seed?: number
  tone?: Tone
  className?: string
}

/** Lớp mềm vẽ ở nửa độ phân giải CSS: vân mây, mảng loang vốn đã mờ — phóng lên không thấy khác. */
const SOFT_DENSITY = 0.5
/** Gân và hạt nhũ: đủ nét trên màn hình dày điểm ảnh mà section dài không ngốn bộ nhớ. */
const CRISP_DENSITY = 1.25
/** Trần số điểm ảnh của một nền (~16 MB) — section rất dài thì hạ mật độ. */
const MAX_PIXELS = 4_000_000

/**
 * Nền theo mẫu tham khảo 3 (marble.ts): giấy kem sáng, mảng loang be-xám mép hữu cơ ôm các mép,
 * giữa sáng mờ dần, gân nhũ vàng mảnh gãy khúc lấm tấm. Vẽ một lần thành bitmap trên canvas lúc
 * trình duyệt rảnh (paint.ts): lớp mềm nhiều filter vẽ ở độ phân giải thấp rồi phóng lên, gân và
 * hạt nhũ vẽ nét lên trên. Canvas kéo vừa section.
 */
export function MarbleFrame({ seed = 5, tone = 'light', className }: MarbleFrameProps) {
  const ref = useRef<HTMLCanvasElement>(null)
  const H = useFrameHeight(ref)

  useLayoutEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    return queuePaint(async () => {
      const cssW = canvas.clientWidth
      const cssH = (cssW * H) / W
      if (!cssW) return
      const data = frame(seed, H)
      const density = Math.min(paintDensity(), CRISP_DENSITY, Math.sqrt(MAX_PIXELS / (cssW * cssH)))
      const [soft, crisp] = await Promise.all([loadSvg(frameSoftSvg(data, seed, H, tone)), loadSvg(frameCrispSvg(data, H, tone))])

      // Lớp mềm rasterize nhỏ trước (filter nhiễu tính trên ít điểm ảnh), rồi phóng mượt lên.
      const small = document.createElement('canvas')
      small.width = Math.max(32, Math.round(cssW * SOFT_DENSITY))
      small.height = Math.max(32, Math.round(cssH * SOFT_DENSITY))
      small.getContext('2d')?.drawImage(soft, 0, 0, small.width, small.height)

      canvas.width = Math.round(cssW * density)
      canvas.height = Math.round(cssH * density)
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(small, 0, 0, canvas.width, canvas.height)
      ctx.drawImage(crisp, 0, 0, canvas.width, canvas.height)
    })
  }, [seed, H, tone])

  return (
    <canvas
      ref={ref}
      className={[styles.frame, className].filter(Boolean).join(' ')}
      data-tone={tone}
      aria-hidden="true"
      data-anim="wash"
    />
  )
}
