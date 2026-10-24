import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Chibi } from '../../components/chibi/Chibi'
import { ChibiProp, PropArt } from '../../components/chibi/ChibiProp'
import type { WeddingContent } from '../../content/types'
import { countdownTo, weddingDayStart } from '../../lib/countdown'
import { primaryDay, solarParts } from '../../lib/format'
import { useSceneMotion } from '../../motion/useMotion'
import { useVisibleMotion } from '../../motion/useVisibleMotion'
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
  const { active } = useVisibleMotion(ref)
  const day = primaryDay(content.days)
  const date = solarParts(day.solar)
  const remaining = useCountdown(weddingDayStart(day.solar))
  const units = [
    { value: remaining.days, label: 'Ngày' },
    { value: remaining.hours, label: 'Giờ' },
    { value: remaining.minutes, label: 'Phút' },
    { value: remaining.seconds, label: 'Giây' },
  ]

  return (
    <div ref={ref} id="dem-nguoc" className={styles.keepsake} aria-labelledby="countdown-title" data-ambient-active={active}>
      <div className={styles.intro}>
        <header className={styles.heading}>
          <span className={styles.ornament} aria-hidden="true">✧</span>
          <h3 id="countdown-title" className={styles.title}>Đếm ngược<br /><em>ngày cưới</em></h3>
          <time className={styles.date} dateTime={day.solar}>
            {String(date.day).padStart(2, '0')}<span aria-hidden="true"> · </span>
            {String(date.month).padStart(2, '0')}<span aria-hidden="true"> · </span>{date.year}
          </time>
        </header>

        <div className={styles.stage} aria-hidden="true" data-anim="countdown-stage">
          <svg className={styles.halo} viewBox="0 0 320 250" fill="none" focusable="false">
            <path d="M38 221V128a122 122 0 0 1 244 0v93M47 217V128a113 113 0 0 1 226 0v89" />
            <path className={styles.dotted} d="M30 205V128a130 130 0 0 1 260 0v77" />
            <path d="M14 229q146 17 292 0M20 233q140 17 280 0" />
          </svg>
          <span className={styles.heartSeal}><ChibiProp kind="heart" /></span>
          <div className={styles.couple}>
            <Chibi who="groom" pose="carry" look="right" size="lg" held={<PropArt kind="calendar" label={String(date.day)} />} anim="countdown-groom" />
            <Chibi who="bride" pose="carry" look="left" size="lg" held={<PropArt kind="heart" />} anim="countdown-bride" />
          </div>
          {[0, 1, 2, 3].map((index) => (
            <ChibiProp key={index} kind="heart" className={styles.floatingHeart} style={{ '--i': index } as CSSProperties} />
          ))}
          <span className={`${styles.sparkle} ${styles.sparkleLeft}`}>✧</span>
          <span className={`${styles.sparkle} ${styles.sparkleRight}`}>✧</span>
        </div>
      </div>

      <div className={styles.rule} aria-hidden="true"><span>♡</span></div>
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
