import { useRef } from 'react'
import { Button } from '../../components/Button'
import { CopyButton } from '../../components/CopyButton'
import type { BankAccount } from '../../content/types'
import { groupDigits } from '../../lib/clipboard'
import styles from './GiftCard.module.css'

const SIDE_LABEL = { bride: 'Nhà gái', groom: 'Nhà trai', both: 'Cô dâu & chú rể' } as const

/**
 * Thẻ mừng cưới. QR luôn trên nền trắng thuần, không transform/blur sau khi hiện.
 * Trên điện thoại, "Lưu ảnh QR" và "Sao chép STK" được ưu tiên vì khách không thể tự quét
 * QR trên chính màn hình của mình.
 */
interface GiftCardProps {
  account: BankAccount
  /** Khách vừa lưu ảnh QR hoặc sao chép thông tin chuyển khoản. */
  onAction?: () => void
}

export function GiftCard({ account, onAction }: GiftCardProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const numberRef = useRef<HTMLSpanElement>(null)
  const alt = `Mã QR chuyển khoản ${account.bankName} – ${account.accountName}`
  const fullText = `${account.bankName} – ${account.accountName} – ${account.accountNumber}`
  // qrImage tính từ gốc site; thêm base path khi site chạy dưới thư mục con (GitHub Pages).
  const qrSrc = import.meta.env.BASE_URL + account.qrImage.replace(/^\//, '')

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
    <div className={styles.card}>
      <p className={styles.side}>{SIDE_LABEL[account.side]}</p>

      <button type="button" className={styles.qrButton} onClick={() => dialogRef.current?.showModal()}>
        <img src={qrSrc} alt={alt} width={240} height={240} className={styles.qr} />
        <span className="visually-hidden">Phóng to mã QR</span>
      </button>

      <dl className={styles.info}>
        <div>
          <dt>Ngân hàng</dt>
          <dd>{account.bankName}</dd>
        </div>
        <div>
          <dt>Chủ tài khoản</dt>
          <dd>{account.accountName}</dd>
        </div>
        <div>
          <dt>Số tài khoản</dt>
          <dd className={styles.number}>
            <span ref={numberRef}>{groupDigits(account.accountNumber)}</span>
          </dd>
        </div>
      </dl>

      <div className={styles.actions}>
        <Button
          variant="primary"
          href={qrSrc}
          download={`QR-mung-cuoi-${account.bankName}-${account.accountName.replace(/\s+/g, '-')}.png`}
          className={styles.save}
          onClick={onAction}
        >
          Lưu ảnh QR
        </Button>
        <CopyButton
          variant="ghost"
          value={account.accountNumber}
          label="Sao chép STK"
          successMessage="Đã sao chép số tài khoản"
          onFail={selectNumber}
          onCopied={onAction}
        />
        <Button variant="ghost" onClick={() => dialogRef.current?.showModal()} className={styles.zoom}>
          Phóng to QR
        </Button>
        <CopyButton
          variant="link"
          value={fullText}
          label="Sao chép toàn bộ"
          successMessage="Đã sao chép thông tin chuyển khoản"
          onCopied={onAction}
        />
      </div>
      <p className={styles.hint}>Trên iPhone: nhấn giữ ảnh QR để lưu vào Ảnh.</p>

      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-label={alt}
        onClick={(event) => {
          if (event.target === dialogRef.current) dialogRef.current?.close()
        }}
      >
        <img src={qrSrc} alt={alt} className={styles.dialogQr} />
        <p className={styles.dialogInfo}>
          {account.bankName} · {account.accountName}
          <br />
          {groupDigits(account.accountNumber)}
        </p>
        <p className={styles.dialogHint}>Tăng độ sáng màn hình để quét dễ hơn</p>
        <form method="dialog">
          <button type="submit" className={styles.close}>
            Đóng
          </button>
        </form>
      </dialog>
    </div>
  )
}
