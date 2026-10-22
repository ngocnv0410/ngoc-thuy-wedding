import type { WeddingDay } from '../content/types'
import { lunarText, solarParts, weekday } from '../lib/format'
import styles from './DateBlock.module.css'

interface DateBlockProps {
  day: WeddingDay
  /** Hiện dòng ngày âm lịch bên dưới. */
  showLunar?: boolean
  size?: 'lg' | 'md'
}

/**
 * Khối ngày kiểu thiệp in (mẫu 2 & 3):
 *            THÁNG 12
 *   THỨ NĂM │  24  │ 2026
 *   Ngày 16 tháng 11 năm Bính Ngọ
 * Nhãn hai bên nằm giữa hai đường chỉ vàng mảnh.
 */
export function DateBlock({ day, showLunar = true, size = 'lg' }: DateBlockProps) {
  const { day: date, month, year } = solarParts(day.solar)
  return (
    <div className={styles.block} data-size={size} data-anim="date-block">
      <p className={styles.month}>Tháng {month}</p>
      <p className={styles.row}>
        <time dateTime={day.solar} className="visually-hidden">
          {weekday(day.solar)}, ngày {date} tháng {month} năm {year}
        </time>
        <span className={styles.side} aria-hidden="true">
          {weekday(day.solar)}
        </span>
        <span className={styles.numeral} aria-hidden="true">
          {String(date).padStart(2, '0')}
        </span>
        <span className={styles.side} aria-hidden="true">
          {year}
        </span>
      </p>
      {showLunar && <p className={styles.lunar}>{lunarText(day.lunar)}</p>}
    </div>
  )
}
