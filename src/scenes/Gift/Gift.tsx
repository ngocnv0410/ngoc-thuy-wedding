import { useCallback, useRef } from 'react'
import { Button } from '../../components/Button'
import { Chibi } from '../../components/chibi/Chibi'
import { ChibiProp } from '../../components/chibi/ChibiProp'
import { Divider } from '../../components/Ornament'
import { Stationery } from '../../components/decor/Stationery'
import { PendingNote } from '../../components/PendingNote'
import { SceneShell } from '../../components/SceneShell'
import { Seal } from '../../components/Seal'
import type { WeddingContent } from '../../content/types'
import { dottedDate, orderedCouple, primaryDay, weekday } from '../../lib/format'
import { loadMotion, prefersMotion, useSceneMotion } from '../../motion/useMotion'
import styles from './Gift.module.css'
import { GiftCard } from './GiftCard'

/** Mừng cưới & lời cảm ơn, giấy kem champagne cùng các phong thư mở QR. */
export function Gift({ content }: { content: WeddingContent }) {
  const ref = useRef<HTMLElement>(null)
  const mailRef = useRef<HTMLDivElement>(null)
  useSceneMotion(ref, 'gift')

  // Phong thư bật khỏi hộp thư, hiện trái tim — chỉ trang trí; Toast vẫn là phản hồi chính.
  const celebrate = useCallback(() => {
    if (!prefersMotion()) return
    loadMotion()
      .then((runtime) => mailRef.current && runtime.giftCelebrate(mailRef.current))
      .catch(() => {})
  }, [])
  const { couple, accounts, thankYou } = content
  const [first, second] = orderedCouple(couple)
  const day = primaryDay(content.days)

  return (
    <SceneShell ref={ref} id="mung-cuoi" light="golden" labelledBy="gift-title" className={styles.scene}>
      <Stationery
        seed={34}
        tone="light"
        sprigs={[
          { corner: 'top-right', seed: 95 },
          { corner: 'bottom-left', variant: 'sprig', seed: 106 },
        ]}
      />
      <article className={styles.letter}>
        <p className={styles.eyebrow} data-anim="letter-eyebrow">
          Lời cảm ơn
        </p>
        <h2 id="gift-title" className={styles.title} data-anim="letter-title">
          Thương gửi bạn
        </h2>
        <div className={styles.letterBody}>
          {thankYou.map((paragraph, index) => (
            <p key={index} data-anim="letter-line">
              {paragraph}
            </p>
          ))}
        </div>
        <p className={styles.signature} data-anim="signature">
          {first.givenName} &amp; {second.givenName}
        </p>
      </article>

      <Divider className={styles.divider} />

      <section className={styles.gifts} aria-labelledby="gift-heading" data-anim="gifts">
        <h3 id="gift-heading" className={styles.subtitle}>
          Gửi quà mừng
        </h3>
        {accounts.length === 0 ? (
          <PendingNote>tài khoản mừng cưới (ngân hàng, tên chủ TK, STK, ảnh QR gốc).</PendingNote>
        ) : (
          <>
            <div ref={mailRef} className={styles.mail} aria-hidden="true" data-anim="mail">
              <ChibiProp kind="mailbox" className={styles.mailbox} anim="mailbox" />
              <ChibiProp kind="envelope" className={styles.mailEnvelope} anim="mail-envelope" />
              <ChibiProp kind="heart" className={styles.mailHeart} anim="mail-heart" />
            </div>
            <p className={styles.giftLead}>
              Nếu bạn muốn gửi quà mừng từ xa, chúng mình xin trân trọng đón nhận tại đây.
            </p>
            <ul className={styles.cards} data-count={accounts.length}>
              {accounts.map((account) => (
                <li key={account.id}>
                  <GiftCard account={account} onAction={celebrate} />
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <footer className={styles.closing}>
        {/* Hai bạn hai bên dấu sáp: cúi chào khách rồi giơ tay tạo hình trái tim. */}
        <div className={styles.closingStage}>
          <Chibi who="groom" pose="heart" anim="bye-groom" />
          <span className={styles.closingSeal} data-anim="closing-seal">
            <Seal monogram={couple.monogram} size={104} />
          </span>
          <Chibi who="bride" pose="heart" anim="bye-bride" />
        </div>
        <div className={styles.closingText} data-anim="closing-text">
          <p className={styles.closingLine}>Hẹn gặp bạn trong ngày vui của chúng mình</p>
          <p className={styles.closingDate}>
            {weekday(day.solar)} · <time dateTime={day.solar}>{dottedDate(day.solar)}</time>
          </p>
          <Button variant="link" href="#bia">
            Về đầu thiệp
          </Button>
        </div>
      </footer>
    </SceneShell>
  )
}
