import { useEffect, useRef, useState } from 'react'
import { copyText } from '../lib/clipboard'
import { Button } from './Button'
import { useToast } from './toast-context'

interface CopyButtonProps {
  value: string
  label: string
  /** Thông báo khi sao chép thành công, ví dụ "Đã sao chép số tài khoản". */
  successMessage: string
  /** Gọi khi không sao chép được, để UI chọn sẵn đoạn text cho khách tự nhấn giữ. */
  onFail?: () => void
  /** Gọi sau khi sao chép thành công (ví dụ để chạy hoạt cảnh trang trí). */
  onCopied?: () => void
  variant?: 'primary' | 'ghost' | 'link'
}

const RESET_MS = 2000

export function CopyButton({ value, label, successMessage, onFail, onCopied, variant = 'ghost' }: CopyButtonProps) {
  const notify = useToast()
  const [copied, setCopied] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  async function handleClick() {
    const ok = await copyText(value)
    if (ok) {
      setCopied(true)
      notify(successMessage)
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setCopied(false), RESET_MS)
      onCopied?.()
    } else {
      notify('Không sao chép được — hãy nhấn giữ để chọn và sao chép.')
      onFail?.()
    }
  }

  return (
    <Button variant={variant} onClick={handleClick} icon={copied ? <CheckIcon /> : <CopyIcon />}>
      {copied ? 'Đã sao chép' : label}
    </Button>
  )
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="8" y="8" width="12" height="12" rx="1" />
      <path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  )
}
