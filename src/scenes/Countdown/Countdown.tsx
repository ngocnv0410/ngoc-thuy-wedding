import { useEffect, useRef, useState } from 'react'
import type { WeddingContent } from '../../content/types'
import { countdownTo, weddingDayStart } from '../../lib/countdown'
import { primaryDay } from '../../lib/format'
import { useSceneMotion } from '../../motion/useMotion'
import styles from './Countdown.module.css'

function useCountdown(target: number) {
  const [remaining, setRemaining] = useState(() => countdownTo(target))
  useEffect(() => {
    let timer: number | undefined
    const update = () => {
      window.clearTimeout(timer)
      const next = countdownTo(target)
      setRemaining(next)
      // Recompute from the clock each tick; background tabs never cause drift.
      if (!next.reached && !document.hidden) timer = window.setTimeout(update, 1000 - (Date.now() % 1000))
    }
    update()
    document.addEventListener('visibilitychange', update)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', update)
    }
  }, [target])
  return remaining
}

export function Countdown({ content }: { content: WeddingContent }) {
  const ref = useRef<HTMLDivElement>(null)
  useSceneMotion(ref, 'countdown')
  const day = primaryDay(content.days)
  const remaining = useCountdown(weddingDayStart(day.solar))
  const units = [
    { value: remaining.days, label: 'Ngày' },
    { value: remaining.hours, label: 'Giờ' },
    { value: remaining.minutes, label: 'Phút' },
    { value: remaining.seconds, label: 'Giây' },
  ]

  return (
    <div ref={ref} id="dem-nguoc" className={styles.keepsake} aria-labelledby="countdown-title">
      <h3 id="countdown-title" className={styles.title}>Cùng đếm ngược đến ngày vui</h3>
      <div className={styles.clockArea}>
        <div role="timer" aria-live="off" aria-label="Thời gian còn lại đến ngày cưới">
          <dl className={styles.clock}>
            {units.map(({ value, label }) => (
              <div className={styles.unit} key={label}>
                <dt className={styles.label}>{label}</dt>
                <dd className={styles.number}><span key={value}>{String(value).padStart(2, '0')}</span></dd>
              </div>
            ))}
          </dl>
        </div>
        {remaining.reached && <p className={styles.caption} role="status">Ngày hạnh phúc đã đến</p>}
      </div>
    </div>
  )
}
