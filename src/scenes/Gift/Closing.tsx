import { type CSSProperties } from 'react'
import { Button } from '../../components/Button'
import { Chibi } from '../../components/chibi/Chibi'
import { ChibiProp } from '../../components/chibi/ChibiProp'
import { Seal } from '../../components/Seal'
import { ShareButton } from '../../components/ShareButton'
import type { WeddingContent } from '../../content/types'
import { dottedDate, orderedCouple, primaryDay, weekday } from '../../lib/format'
import { useVisibleMotion } from '../../motion/useVisibleMotion'
import styles from './Gift.module.css'

/** A little farewell tableau; motion pauses when the footer is out of view. */
export function Closing({ content }: { content: WeddingContent }) {
  const { ref, active } = useVisibleMotion<HTMLElement>()
  const [first, second] = orderedCouple(content.couple)
  const day = primaryDay(content.days)

  return (
    <footer ref={ref} className={styles.closing} data-anim="closing" data-ambient-active={active}>
      <div className={styles.closingStage} data-anim="closing-stage" aria-hidden="true">
        <svg className={styles.closingArch} viewBox="0 0 360 280" fill="none" focusable="false">
          <path d="M40 248V148a140 140 0 0 1 280 0v100M49 247V148a131 131 0 0 1 262 0v99" />
          <path className={styles.closingDots} d="M31 240V148a149 149 0 0 1 298 0v92" />
          <path d="M20 254q160 25 320 0M35 260q145 21 290 0" />
          <path d="M35 244q-20-34-12-70m6 43q-17-2-18-15 13 2 18 15m-5-24q-14-7-10-19 12 6 10 19M325 244q20-34 12-70m-6 43q17-2 18-15-13 2-18 15m5-24q14-7 10-19-12 6-10 19" />
        </svg>
        <span className={styles.closingSeal} data-anim="closing-seal">
          <Seal monogram={content.couple.monogram} size={56} />
        </span>
        <div className={styles.closingCouple}>
          <Chibi who="groom" pose="heart" size="lg" anim="bye-groom" />
          <Chibi who="bride" pose="heart" size="lg" anim="bye-bride" />
        </div>
        {Array.from({ length: 7 }, (_, index) => (
          <ChibiProp
            key={index}
            kind={index % 2 ? 'petal' : 'heart'}
            className={`${styles.closingFloat} ${index % 2 ? styles.closingPetal : ''}`}
            style={{ '--i': index } as CSSProperties}
          />
        ))}
        <span className={`${styles.closingSpark} ${styles.closingSparkLeft}`}>✧</span>
        <span className={`${styles.closingSpark} ${styles.closingSparkRight}`}>✧</span>
      </div>
      <div className={styles.closingText} data-anim="closing-text">
        <p className={styles.closingNames}>{first.givenName} <span>&amp;</span> {second.givenName}</p>
        <p className={styles.closingLine}>Hẹn gặp bạn trong ngày vui của chúng mình</p>
        <p className={styles.closingDate}>
          {weekday(day.solar)} · <time dateTime={day.solar}>{dottedDate(day.solar)}</time>
        </p>
        <ShareButton content={content} />
        <Button variant="link" href="#bia">Về đầu thiệp</Button>
      </div>
    </footer>
  )
}
