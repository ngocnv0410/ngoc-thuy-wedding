import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Chibi } from '../../components/chibi/Chibi'
import { ChibiProp, PropArt } from '../../components/chibi/ChibiProp'
import { Stationery } from '../../components/decor/Stationery'
import { SceneShell } from '../../components/SceneShell'
import type { WeddingContent } from '../../content/types'
import { countdownTo, weddingDayStart } from '../../lib/countdown'
import { primaryDay, solarParts, weekday } from '../../lib/format'
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
  const ref = useRef<HTMLElement>(null)
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
    <SceneShell ref={ref} id="dem-nguoc" light="noon" labelledBy="countdown-title" className={styles.scene}>
      <Stationery seed={17} sprigs={[
        { corner: 'top-right', seed: 57 },
        { corner: 'bottom-left', variant: 'sprig', seed: 68 },
      ]} />
      <div className={styles.keepsake} data-anim="countdown-card" data-ambient-active={active}>
        <header className={styles.heading}>
          <p className={styles.eyebrow}>Đếm ngược ngày cưới</p>
          <h2 id="countdown-title" className={styles.title}>Ngày chung đôi</h2>
          <p className={styles.date}>
            {weekday(day.solar)}<span aria-hidden="true"> · </span>
            <time dateTime={day.solar}>{String(date.day).padStart(2, '0')} / {String(date.month).padStart(2, '0')} / {date.year}</time>
          </p>
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

        <div className={styles.clockArea}>
          <div className={styles.fineRule} aria-hidden="true"><span>♡</span></div>
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
          <p className={styles.caption} role="status">
            {remaining.reached ? 'Ngày hạnh phúc đã đến' : `${content.couple.groom.givenName} & ${content.couple.bride.givenName}`}
          </p>
        </div>
      </div>
    </SceneShell>
  )
}
