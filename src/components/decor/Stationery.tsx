import { BabysBreath, type Corner, type Variant } from './BabysBreath'
import { MarbleFrame } from './MarbleFrame'
import styles from './Stationery.module.css'

interface Sprig {
  corner: Corner
  variant?: Variant
  seed: number
}

interface StationeryProps {
  /** Seed của nền loang — mỗi scene một seed để hoạ tiết không lặp. */
  seed: number
  /** Hoa baby ở góc; mặc định một chùm trên + một cành dưới ở hai góc đối nhau. */
  sprigs: Sprig[]
  tone?: 'light' | 'dark'
  density?: 'full' | 'quiet'
}

/**
 * Nền "tờ thiệp" theo mẫu tham khảo 3: giấy loang cẩm thạch + hoa baby khô ở góc. Đặt làm con
 * đầu tiên của scene; tự cắt phần tràn của hoa nên scene không cần `overflow: hidden` (giữ được
 * dải phim cuộn ngang của Album).
 */
export function Stationery({ seed, sprigs, tone = 'light', density = 'full' }: StationeryProps) {
  if (density === 'quiet') return <div className={`${styles.stationery} ${styles.quiet}`} aria-hidden="true" />

  return (
    <div className={styles.stationery} data-tone={tone} aria-hidden="true">
      <MarbleFrame seed={seed} tone={tone} />
      {sprigs.map((sprig) => (
        <BabysBreath key={sprig.corner} corner={sprig.corner} variant={sprig.variant} seed={sprig.seed} tone={tone} />
      ))}
    </div>
  )
}
