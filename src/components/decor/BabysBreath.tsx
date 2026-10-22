import { useMemo } from 'react'
import styles from './BabysBreath.module.css'
import { circlePath, seeded } from './random'

export type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

interface Bouquet {
  stems: string[]
  shadow: string
  florets: string
  centers: string
  /** Nụ khô màu nâu xen giữa các chùm (như hoa baby sấy thật). */
  buds: string
}

const SIZE = 320

/**
 * Bó hoa baby khô vẽ thủ tục: các cành toả ra từ một góc, phân nhánh, đầu nhánh là chùm
 * hoa li ti. Mỗi lớp màu gộp thành một <path> nên dù hàng trăm bông, DOM vẫn rất nhẹ.
 * Gốc toạ độ ở góc dưới trái (0, SIZE), cành vươn lên phía trên phải; góc khác dùng lật hình.
 */
function bouquet(seed: number): Bouquet {
  const rand = seeded(seed)
  const stems: string[] = []
  const shadow: string[] = []
  const florets: string[] = []
  const centers: string[] = []
  const buds: string[] = []

  const cluster = (x: number, y: number, spread: number) => {
    // Mỗi bông là một búp 4 cánh tròn quanh nhuỵ nâu — gần với hoa baby sấy thật (mẫu 3).
    const count = rand.int(10, 18)
    for (let i = 0; i < count; i++) {
      const angle = rand.range(0, Math.PI * 2)
      const distance = Math.sqrt(rand.next()) * spread
      const cx = x + Math.cos(angle) * distance
      const cy = y + Math.sin(angle) * distance
      const r = rand.range(1.2, 2.2)
      const turn = rand.range(0, Math.PI / 2)
      shadow.push(circlePath(cx + 0.9, cy + 1.1, r * 1.9))
      for (let p = 0; p < 4; p++) {
        const a = turn + (p * Math.PI) / 2
        florets.push(circlePath(cx + Math.cos(a) * r * 0.85, cy + Math.sin(a) * r * 0.85, r))
      }
      centers.push(circlePath(cx, cy, r * 0.45))
    }
    for (let i = rand.int(1, 3); i > 0; i--) {
      const angle = rand.range(0, Math.PI * 2)
      const distance = spread * rand.range(0.6, 1.2)
      buds.push(circlePath(x + Math.cos(angle) * distance, y + Math.sin(angle) * distance, rand.range(1.1, 1.9)))
    }
  }

  const mainStems = rand.int(6, 8)
  for (let s = 0; s < mainStems; s++) {
    const angle = rand.range(-1.45, -0.2) // radian: thẳng đứng → nghiêng phải
    const length = rand.range(150, 270)
    const bend = rand.range(-30, 30)
    const x0 = rand.range(0, 30)
    const y0 = SIZE - rand.range(0, 30)
    const x2 = x0 + Math.cos(angle) * length
    const y2 = y0 + Math.sin(angle) * length
    const cx = (x0 + x2) / 2 + bend
    const cy = (y0 + y2) / 2 - bend * 0.5
    stems.push(`M${x0.toFixed(1)} ${y0.toFixed(1)}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`)
    cluster(x2, y2, rand.range(10, 18))

    // Nhánh phụ dọc theo cành.
    const branches = rand.int(2, 4)
    for (let b = 0; b < branches; b++) {
      const t = rand.range(0.45, 0.9)
      const bx = (1 - t) ** 2 * x0 + 2 * (1 - t) * t * cx + t ** 2 * x2
      const by = (1 - t) ** 2 * y0 + 2 * (1 - t) * t * cy + t ** 2 * y2
      const side = rand.next() > 0.5 ? 1 : -1
      const bAngle = angle + side * rand.range(0.35, 0.8)
      const bLength = rand.range(26, 64)
      const ex = bx + Math.cos(bAngle) * bLength
      const ey = by + Math.sin(bAngle) * bLength
      stems.push(`M${bx.toFixed(1)} ${by.toFixed(1)}L${ex.toFixed(1)} ${ey.toFixed(1)}`)
      cluster(ex, ey, rand.range(7, 13))
    }
  }

  return { stems, shadow: shadow.join(''), florets: florets.join(''), centers: centers.join(''), buds: buds.join('') }
}

const FLIP: Record<Corner, string> = {
  'bottom-left': '',
  'bottom-right': `translate(${SIZE} 0) scale(-1 1)`,
  'top-left': `translate(0 ${SIZE}) scale(1 -1)`,
  'top-right': `translate(${SIZE} ${SIZE}) scale(-1 -1)`,
}

interface BabysBreathProps {
  corner: Corner
  seed?: number
  /** Trên nền tối (ánh nến) dùng tông kem sáng hơn. */
  tone?: 'light' | 'dark'
  className?: string
}

/** Hoa baby khô ở góc (hoạ tiết theo mẫu tham khảo 3). Trang trí thuần — ẩn với trình đọc màn hình. */
export function BabysBreath({ corner, seed = 7, tone = 'light', className }: BabysBreathProps) {
  const data = useMemo(() => bouquet(seed), [seed])
  return (
    <svg
      className={[styles.bouquet, className].filter(Boolean).join(' ')}
      data-corner={corner}
      data-tone={tone}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      aria-hidden="true"
      data-anim="bouquet"
    >
      <g transform={FLIP[corner]}>
        {data.stems.map((d, index) => (
          <path key={index} d={d} className={styles.stem} data-anim="stem" />
        ))}
        <g data-anim="bloom">
          <path d={data.shadow} className={styles.shadow} />
          <path d={data.florets} className={styles.floret} />
          <path d={data.centers} className={styles.center} />
          <path d={data.buds} className={styles.bud} />
        </g>
      </g>
    </svg>
  )
}
