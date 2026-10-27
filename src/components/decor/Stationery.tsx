import { MarbleFrame } from './MarbleFrame'
import { SatinCorner, type DrapeCorner } from './SatinCorner'
import styles from './Stationery.module.css'

interface StationeryProps {
  /** Seed của nền loang — mỗi scene một seed để hoạ tiết không lặp. */
  seed: number
  /** Lụa satin + cành lá ở góc; thường là hai góc đối nhau trên trái + dưới phải như mẫu. */
  drapes?: DrapeCorner[]
  tone?: 'light' | 'dark'
}

/**
 * Nền "tờ thiệp": giấy loang cẩm thạch + lụa satin và cành lá nhũ vàng ở góc. Đặt làm con
 * đầu tiên của scene; tự cắt phần tràn của trang trí nên scene không cần `overflow: hidden`
 * (giữ được dải phim cuộn ngang của Album).
 */
export function Stationery({ seed, drapes = [], tone = 'light' }: StationeryProps) {
  return (
    <div className={styles.stationery} data-tone={tone} aria-hidden="true">
      <MarbleFrame seed={seed} tone={tone} />
      {drapes.map((corner, index) => (
        <SatinCorner key={corner} corner={corner} index={index} />
      ))}
    </div>
  )
}
