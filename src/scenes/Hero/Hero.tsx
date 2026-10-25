import { useRef } from 'react'
import { CoupleNames } from '../../components/CoupleNames'
import { DateBlock } from '../../components/DateBlock'
import { Stationery } from '../../components/decor/Stationery'
import { Divider } from '../../components/Ornament'
import { ResponsivePicture } from '../../components/ResponsivePicture'
import { Petals } from '../../components/Petals'
import { ShareButton } from '../../components/ShareButton'
import type { WeddingContent } from '../../content/types'
import { orderedCouple, primaryDay, solarParts } from '../../lib/format'
import { useSceneMotion } from '../../motion/useMotion'
import { useVisibleMotion } from '../../motion/useVisibleMotion'
import styles from './Hero.module.css'

interface HeroProps {
  content: WeddingContent
  /** Mở lại màn mở đầu (chỉ có khi màn đó không đang hiện). */
  onReplay?: () => void
}

/**
 * Scene 1 — Bìa. Có ảnh bìa: full-bleed fine-art + chữ phủ.
 * Chưa có ảnh: bìa thiệp in theo mẫu tham khảo — nền ivory loang cẩm thạch gân vàng, hoa baby
 * khô ở hai góc, tên viết tay nhũ vàng, cành nguyệt quế, khối ngày kẹp chỉ vàng.
 */
export function Hero({ content, onReplay }: HeroProps) {
  const ref = useRef<HTMLElement>(null)
  const portraitMotion = useVisibleMotion<HTMLDivElement>()
  useSceneMotion(ref, 'hero')

  const { couple, cover } = content
  const [first, second] = orderedCouple(couple)
  const day = primaryDay(content.days)
  const { day: date, month, year } = solarParts(day.solar)

  const masthead = (
    <p className={styles.masthead} data-anim="masthead">
      Lễ Thành Hôn
    </p>
  )
  const names = (
    <CoupleNames as="h1" id="hero-title" tabIndex={-1} first={first.givenName} second={second.givenName} size="hero" layout={cover ? 'stacked' : 'inline'} className={styles.names} />
  )
  const tagline = couple.tagline && (
    <p className={styles.tagline} data-anim="meta">
      {couple.tagline}
    </p>
  )

  if (cover) {
    return (
      <section ref={ref} id="bia" className={styles.photoHero} aria-labelledby="hero-title" data-light="morning">
        <div className={styles.media} data-anim="media">
          <ResponsivePicture
            image={cover.landscape}
            portrait={cover.portrait}
            alt={cover.alt}
            sizes="100vw"
            priority
            className={styles.photo}
            style={{ objectPosition: cover.focus }}
            data-anim="photo"
          />
        </div>
        <div className={styles.scrim} aria-hidden="true" />
        {masthead}
        <div className={styles.overlay} data-anim="overlay">
          {names}
          <DateBlock day={day} showLunar={false} size="md" />
          {tagline}
          <ShareButton content={content} />
        </div>
        <ScrollCue />
        {onReplay && <ReplayButton onClick={onReplay} />}
      </section>
    )
  }

  return (
    <section ref={ref} id="bia" className={styles.stationery} aria-labelledby="hero-title" data-light="morning">
      <Stationery
        seed={5}
        sprigs={[
          { corner: 'top-right', seed: 11 },
          { corner: 'bottom-left', variant: 'sprig', seed: 23 },
        ]}
      />

      <Petals />
      <div className={styles.composition}>
        <div ref={portraitMotion.ref} className={styles.portrait} data-anim="portrait" data-ambient-active={portraitMotion.active} aria-hidden="true">
          <span className={styles.arch} />
          <img className={styles.illustration} src={`${import.meta.env.BASE_URL}images/wedding-couple.webp`} alt="" width="768" height="1152" fetchPriority="high" decoding="async" />
          <span className={styles.portraitDate}>{year} <span>✦</span> {date}.{month}</span>
        </div>
        <div className={styles.frame} data-anim="frame">
          {masthead}
          {names}
          <Divider className={styles.divider} />
          <DateBlock day={day} size="md" />
          {tagline}
          <ShareButton content={content} />
        </div>
      </div>
      <ScrollCue />
      {onReplay && <ReplayButton onClick={onReplay} />}
    </section>
  )
}

function ReplayButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className={styles.replay} onClick={onClick}>
      Xem lại thiệp mở
    </button>
  )
}

function ScrollCue() {
  return (
    <a href="#thong-tin" className={styles.cue} data-anim="cue">
      <span className={styles.cueLine} aria-hidden="true" />
      <span>Cuộn xuống</span>
    </a>
  )
}
