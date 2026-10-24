import type { WeddingDay } from '../../content/types'
import { WEEKDAY_SHORT, monthGrid, solarParts } from '../../lib/format'
import styles from './MonthCalendar.module.css'

interface MonthCalendarProps {
  days: WeddingDay[]
  primaryId: string
}

/**
 * Lịch tháng mini. Ngày chính được khoanh bằng nét "viết tay"; các ngày lễ khác có chấm vàng.
 * Chỉ vẽ tháng của ngày chính (các lễ thường nằm cùng tháng).
 */
export function MonthCalendar({ days, primaryId }: MonthCalendarProps) {
  const main = days.find((day) => day.id === primaryId) ?? days[0]
  const { month, year } = solarParts(main.solar)
  const marked = new Map(
    days
      .map((day) => ({ day, parts: solarParts(day.solar) }))
      .filter(({ parts }) => parts.month === month && parts.year === year)
      .map(({ day, parts }) => [parts.day, day] as const),
  )

  return (
    <figure className={styles.calendar} data-anim="calendar">
      <figcaption className={styles.caption}>
        <span className={styles.month}>Tháng {month}</span>
        <span className={styles.year}>{year}</span>
      </figcaption>
      <table className={styles.grid} aria-label={`Lịch tháng ${month} năm ${year}`}>
        <thead>
          <tr>
            {WEEKDAY_SHORT.map((label) => (
              <th key={label} scope="col">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {monthGrid(year, month).map((week, index) => (
            <tr key={index}>
              {week.map((date, cell) => {
                const day = date ? marked.get(date) : undefined
                const isPrimary = day?.id === primaryId
                return (
                  <td key={cell} data-weekend={cell >= 5 || undefined} data-mark={day ? (isPrimary ? 'primary' : 'event') : undefined}>
                    {date && (
                      <>
                        <span className={styles.dayNumber} aria-hidden={day ? 'true' : undefined}>{date}</span>
                        {day && <span className="visually-hidden">{`${date}, ${day.title}`}</span>}
                        {isPrimary && <HandCircle />}
                        {day && !isPrimary && <span className={styles.dot} aria-hidden="true" data-anim="mark-dot" />}
                      </>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <ul className={styles.legend} aria-label="Các ngày lễ trong tháng">
        {[...marked.entries()].map(([date, day]) => (
          <li key={day.id} data-primary={day.id === primaryId}>
            <span className={styles.legendDate}>{date}</span>
            <span>{day.title}</span>
          </li>
        ))}
      </ul>
    </figure>
  )
}

/** Vòng khoanh tay, hơi lệch và không khép kín như nét bút thật. */
function HandCircle() {
  return (
    <svg className={styles.circle} viewBox="0 0 60 60" aria-hidden="true">
      <path d="M44 10 C30 2 9 9 7 28 C5 46 22 56 37 53 C52 50 57 34 52 21 C49 14 42 9 33 8" data-anim="hand-circle" />
    </svg>
  )
}
