import { useEffect, useRef, useState } from 'react'
import type { WeddingContent } from '../content/types'
import { orderedCouple } from '../lib/format'
import { invitationShareUrl, shareInvitation } from '../lib/invitation-share'
import { useToast } from './toast-context'
import styles from './ShareButton.module.css'

export function ShareButton({ content }: { content: WeddingContent }) {
  const notify = useToast()
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [manualUrl, setManualUrl] = useState('')
  const pending = useRef(false)
  const mounted = useRef(true)
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])
  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 2600)
    return () => window.clearTimeout(timer)
  }, [copied])
  useEffect(() => { if (manualUrl) { input.current?.focus(); input.current?.select() } }, [manualUrl])

  async function share() {
    if (pending.current) return
    pending.current = true
    setBusy(true)
    setManualUrl('')
    const [first, second] = orderedCouple(content.couple)
    const url = invitationShareUrl(window.location.href, import.meta.env.BASE_URL,
      document.querySelector<HTMLMetaElement>('meta[property="og:url"]')?.content)
    try {
      const result = await shareInvitation({
        title: `${first.givenName} & ${second.givenName} · Thiệp cưới`,
        text: `Thiệp mời cưới ${first.givenName} & ${second.givenName}`,
        url,
      })
      if (!mounted.current) return
      if (result === 'copied') { setCopied(true); notify('Đã sao chép liên kết thiệp. Bạn có thể dán vào Zalo hoặc Messenger.') }
      if (result === 'manual') setManualUrl(url)
    } finally {
      pending.current = false
      if (mounted.current) setBusy(false)
    }
  }

  return (
    <div className={styles.wrap}>
      <button type="button" className={styles.button} onClick={share} disabled={busy}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          {copied ? <path d="m5 12 4 4L19 6" /> : <><path d="M12 15V3m-4 4 4-4 4 4M6 10H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-1" /></>}
        </svg>
        <span>{copied ? 'Đã sao chép liên kết' : 'Chia sẻ thiệp'}</span>
      </button>
      {manualUrl && <label className={styles.manual}>Nhấn giữ đường dẫn để sao chép
        <input ref={input} value={manualUrl} readOnly onFocus={(event) => event.currentTarget.select()} aria-label="Liên kết chia sẻ thiệp" />
      </label>}
    </div>
  )
}
