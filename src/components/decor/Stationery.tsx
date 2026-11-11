import { MarbleFrame } from './MarbleFrame'
import { BotanicalCorner, type BotanicalCornerName, type BotanicalVariant } from './BotanicalCorner'
import styles from './Stationery.module.css'

interface StationeryProps {
  /** Seed của nền loang — mỗi scene một seed để hoạ tiết không lặp. */
  seed: number
  /** Cành lá watercolor ở hai góc đối nhau; giữ tên prop cũ để tương thích. */
  drapes?: BotanicalCornerName[]
  decoration?: BotanicalVariant
  tone?: 'light' | 'dark'
}

/**
 * Nền "tờ thiệp": giấy sáng, vân cẩm thạch nhạt và cành lá be–olive ở góc. Đặt làm con
 * đầu tiên của scene; tự cắt phần tràn của trang trí nên scene không cần `overflow: hidden`
 * (giữ nguyên vùng tương tác nội dung).
 */
export function Stationery({ seed, drapes, decoration, tone = 'light' }: StationeryProps) {
  return (
    <div className={styles.stationery} data-tone={tone} aria-hidden="true">
      <MarbleFrame seed={seed} tone={tone} />
      {(drapes ?? ['top-left', 'bottom-right']).map((corner, index) => (
        <BotanicalCorner key={corner} corner={corner} index={index} variant={decoration ?? (drapes ? 'cover' : 'section')} />
      ))}
    </div>
  )
}
