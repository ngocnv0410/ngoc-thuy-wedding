import { useEffect, useId, useRef, useState } from 'react'
import { Button } from '../../components/Button'
import { Chibi, ChibiCouple } from '../../components/chibi/Chibi'
import { ChibiProp, PropArt } from '../../components/chibi/ChibiProp'
import { CopyButton } from '../../components/CopyButton'
import type { BankAccount } from '../../content/types'
import { groupDigits } from '../../lib/clipboard'
import { lockScroll, prefersMotion } from '../../motion/useMotion'
import styles from './GiftCard.module.css'

const SIDE_LABEL = { bride: 'Nhà gái', groom: 'Nhà trai', both: 'Cô dâu & chú rể' } as const

interface GiftCardProps {
  account: BankAccount
  onAction?: () => void
}

/** A compact invitation to open a gift envelope. Bank details and the unchanged QR live in a native modal. */
export function GiftCard({ account, onAction }: GiftCardProps) {
  const id = useId()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const numberRef = useRef<HTMLSpanElement>(null)
  const closeTimer = useRef<number | undefined>(undefined)
  const opened = useRef(false)
  const [closing, setClosing] = useState(false)
  const who = account.side === 'bride' ? 'bride' : 'groom'
  const label = SIDE_LABEL[account.side]
  const alt = `Mã QR chuyển khoản ${account.bankName} – ${account.accountName}`
  const qrSrc = import.meta.env.BASE_URL + account.qrImage.replace(/^\//, '')

  useEffect(() => () => {
    window.clearTimeout(closeTimer.current)
    if (opened.current) lockScroll(false)
  }, [])

  function open() {
    const dialog = dialogRef.current
    if (!dialog || dialog.open) return
    window.clearTimeout(closeTimer.current)
    closeTimer.current = undefined
    setClosing(false)
    dialog.showModal()
    opened.current = true
    lockScroll(true)
  }

  function closeNow() {
    dialogRef.current?.close()
    // Native close events are queued; unlock now so the page is usable immediately.
    onClosed()
  }

  function close() {
    if (closeTimer.current !== undefined) return
    if (!prefersMotion()) {
      closeNow()
      return
    }
    setClosing(true)
    closeTimer.current = window.setTimeout(closeNow, 180)
  }

  function onClosed() {
    // Ignore the queued event from a previous close, including after a rapid reopen.
    if (!opened.current || dialogRef.current?.open) return
    opened.current = false
    window.clearTimeout(closeTimer.current)
    closeTimer.current = undefined
    setClosing(false)
    lockScroll(false)
    triggerRef.current?.focus({ preventScroll: true })
  }

  function selectNumber() {
    const node = numberRef.current
    if (!node) return
    const range = document.createRange()
    range.selectNodeContents(node)
    const selection = window.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(range)
  }

  return (
    <>
      <button ref={triggerRef} type="button" className={styles.card} onClick={open}
        aria-haspopup="dialog" aria-controls={id} aria-label={`Mở QR mừng cưới ${label}`}>
        <Chibi who={who} size="sm" pose="carry" eyes="happy" held={<PropArt kind="envelope" />} className={styles.host} />
        <span className={styles.summary}>
          <span className={styles.side}>{label}</span>
          <span className={styles.recipient}>{account.accountName}</span>
          <span className={styles.bank}>{account.bankName}</span>
        </span>
        <span className={styles.openLabel}>
          <QrIcon />
          <span>Mở QR</span>
        </span>
      </button>

      <dialog id={id} ref={dialogRef} className={styles.dialog} data-closing={closing}
        aria-labelledby={`${id}-title`} data-lenis-prevent="true"
        onCancel={(event) => { event.preventDefault(); close() }}
        onClose={onClosed}
        onClick={(event) => { if (event.target === dialogRef.current) close() }}>
        <div className={styles.panel}>
          <button type="button" className={styles.close} onClick={close} aria-label="Đóng mã QR">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M6 6L18 18M6 18L18 6" /></svg>
          </button>
          <div className={styles.dialogHeader}>
            <div className={styles.coupleStage} aria-hidden="true">
              <ChibiCouple size="sm" pose="heart" lean className={styles.dialogCouple} />
              <ChibiProp kind="heart" className={styles.heart} />
            </div>
            <p className={styles.side}>{label}</p>
            <h3 id={`${id}-title`} className={styles.dialogTitle}>{account.accountName}</h3>
          </div>
          <div className={styles.qrPaper}>
            <img src={qrSrc} alt={alt} width={240} height={240} className={styles.qr} />
          </div>
          <p className={styles.bank}>{account.bankName}</p>
          <p className={styles.number}><span ref={numberRef}>{groupDigits(account.accountNumber)}</span></p>
          <div className={styles.actions}>
            <Button variant="primary" href={qrSrc}
              download={`QR-mung-cuoi-${account.bankName}-${account.accountName.replace(/\s+/g, '-')}.png`}
              onClick={onAction}>Lưu ảnh QR</Button>
            <CopyButton variant="ghost" value={account.accountNumber} label="Sao chép STK"
              successMessage="Đã sao chép số tài khoản" onFail={selectNumber} onCopied={onAction} />
          </div>
          <p className={styles.hint}>Trên iPhone: nhấn giữ ảnh QR để lưu vào Ảnh.</p>
        </div>
      </dialog>
    </>
  )
}

function QrIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <path d="M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM15 15h3v3h3v3h-6zM21 12v3M12 3v3M12 12h3M3 12h3M12 18v3" />
    </svg>
  )
}
