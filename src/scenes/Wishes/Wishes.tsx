import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Chibi } from '../../components/chibi/Chibi'
import { PropArt } from '../../components/chibi/ChibiProp'
import { SceneShell } from '../../components/SceneShell'
import type { WeddingContent } from '../../content/types'
import { hasVisibleText, normalizeWish, validateWish, wishErrorMessage, WISH_MESSAGE_LIMIT, WISH_NAME_LIMIT, type WeddingWish } from '../../lib/wish-content'
import { loadMotion, prefersMotion } from '../../motion/useMotion'
import styles from './Wishes.module.css'

type Guestbook = typeof import('../../lib/wishes')
type FeedState = 'loading' | 'ready' | 'error'
const dateFormat = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh',
})

export function Wishes({ content }: { content: WeddingContent }) {
  const ref = useRef<HTMLElement>(null)
  const nameInput = useRef<HTMLInputElement>(null)
  const messageInput = useRef<HTMLTextAreaElement>(null)
  const list = useRef<HTMLUListElement>(null)
  const mounted = useRef(true)
  const sending = useRef(false)
  const [near, setNear] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [service, setService] = useState<Guestbook>()
  const [wishes, setWishes] = useState<WeddingWish[]>([])
  const [feedState, setFeedState] = useState<FeedState>('loading')
  const [guestState, setGuestState] = useState<FeedState>('loading')
  const [ownWish, setOwnWish] = useState<WeddingWish | null>(null)
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [slow, setSlow] = useState(false)
  const [receipt, setReceipt] = useState<'sent' | 'existing'>()

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  // Fetch the Firebase SDK and open the live query only near this section.
  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setNear(true); observer.disconnect() }
    }, { rootMargin: '400px' })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!near) return
    let cancelled = false
    let stop: (() => void) | undefined
    let stopGuest: (() => void) | undefined
    const timeout = window.setTimeout(() => { if (!cancelled) setFeedState('error') }, 12000)
    const guestTimeout = window.setTimeout(() => { if (!cancelled) setGuestState('error') }, 12000)
    import('../../lib/wishes').then((api) => {
      if (cancelled) return
      setService(api)
      stopGuest = api.watchGuestWish((wish) => {
        if (cancelled) return
        window.clearTimeout(guestTimeout)
        setGuestState('ready')
        if (wish) {
          setOwnWish(wish)
          if (!sending.current) setReceipt((previous) => previous ?? 'existing')
        }
      }, () => {
        if (!cancelled) { window.clearTimeout(guestTimeout); setGuestState('error') }
      })
      stop = api.watchWishes((next, fromCache) => {
        if (cancelled) return
        setWishes(next)
        if (!fromCache || next.length > 0) {
          window.clearTimeout(timeout)
          setFeedState('ready')
        }
      }, () => {
        if (!cancelled) { window.clearTimeout(timeout); setFeedState('error') }
      })
    }).catch(() => {
      if (!cancelled) {
        window.clearTimeout(timeout); window.clearTimeout(guestTimeout)
        setFeedState('error'); setGuestState('error')
      }
    })
    return () => { cancelled = true; window.clearTimeout(timeout); window.clearTimeout(guestTimeout); stop?.(); stopGuest?.() }
  }, [near, attempt])

  useEffect(() => { if (list.current) list.current.scrollTop = 0 }, [ownWish?.id])

  const displayedWishes = ownWish
    ? [wishes.find((wish) => wish.id === ownWish.id) ?? ownWish, ...wishes.filter((wish) => wish.id !== ownWish.id)]
    : wishes

  function retry() {
    setFeedState('loading')
    setGuestState('loading')
    setAttempt((value) => value + 1)
  }

  // Async wishes change the positions of the scenes below the guestbook.
  useEffect(() => {
    if (!ref.current || !prefersMotion()) return
    let cancelled = false
    let frame = 0
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        loadMotion().then((runtime) => { if (!cancelled) runtime.refreshLayout() }).catch(() => {})
      })
    })
    observer.observe(ref.current)
    return () => { cancelled = true; observer.disconnect(); cancelAnimationFrame(frame) }
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (sending.current || receipt || guestState !== 'ready') return
    const draft = normalizeWish({ name, message })
    const invalid = validateWish(draft)
    if (invalid) {
      setError(invalid)
      if (!hasVisibleText(draft.name) || draft.name.length > WISH_NAME_LIMIT) nameInput.current?.focus()
      else messageInput.current?.focus()
      return
    }
    if (!service) { setError('Chưa kết nối được. Bạn thử tải lại phần lời chúc nhé.'); return }
    sending.current = true
    setSubmitting(true)
    setError('')
    const timeout = window.setTimeout(() => { if (mounted.current) setSlow(true) }, 10000)
    try {
      const result = await service.sendWish(draft)
      if (mounted.current) {
        setOwnWish(result.wish)
        setReceipt(result.alreadySent ? 'existing' : 'sent')
      }
    } catch (failure) {
      if (mounted.current) setError(wishErrorMessage(failure))
    } finally {
      sending.current = false
      window.clearTimeout(timeout)
      if (mounted.current) { setSubmitting(false); setSlow(false) }
    }
  }

  return (
    <SceneShell ref={ref} id="loi-chuc" light="afternoon" labelledBy="wishes-title" className={styles.scene}>
      <header className={styles.heading}>
        <p className={styles.eyebrow}>Lời chúc mừng</p>
        <h2 id="wishes-title">Gửi lời chúc</h2>
        <p>Dành tặng {content.couple.groom.givenName} &amp; {content.couple.bride.givenName}</p>
      </header>
      <div className={styles.layout}>
        {receipt ? (
          <div className={styles.receipt} role="status">
            <Chibi who="bride" pose="carry" eyes="happy" held={<PropArt kind="envelope" />} className={styles.host} />
            <h3>{receipt === 'sent' ? 'Đã gửi lời chúc' : 'Bạn đã gửi lời chúc rồi'}</h3>
            <p>Cảm ơn bạn đã gửi lời chúc đến {content.couple.groom.givenName} &amp; {content.couple.bride.givenName}!</p>
          </div>
        ) : guestState !== 'ready' ? (
          <div className={styles.guestCheck} aria-busy={guestState === 'loading'}>
            <p role="status">{guestState === 'loading' ? 'Đang kiểm tra lời chúc của bạn…' : 'Chưa kiểm tra được lời chúc của bạn. Bạn thử kết nối lại nhé.'}</p>
            {guestState === 'error' && <button className={styles.submit} type="button" onClick={retry}>Thử lại kết nối</button>}
          </div>
        ) : (
          <form className={styles.form} onSubmit={submit} noValidate aria-busy={submitting}>
            <label htmlFor="wish-name">Tên của bạn</label>
            <input ref={nameInput} id="wish-name" name="name" autoComplete="name" required maxLength={WISH_NAME_LIMIT}
              value={name} disabled={submitting} onChange={(event) => { setName(event.target.value); setError('') }}
              aria-describedby={error ? 'wish-error' : undefined} />
            <label htmlFor="wish-message">Lời chúc</label>
            <textarea ref={messageInput} id="wish-message" name="message" rows={5} required maxLength={WISH_MESSAGE_LIMIT}
              value={message} disabled={submitting} onChange={(event) => { setMessage(event.target.value); setError('') }}
              aria-describedby={`wish-length wish-public${error ? ' wish-error' : ''}`} />
            <span id="wish-length" className={styles.length}>{message.length}/{WISH_MESSAGE_LIMIT}</span>
            {error && <p id="wish-error" className={styles.error} role="alert">{error}</p>}
            {slow && <p className={styles.note} role="status">Đang chờ kết nối. Bạn giữ trang mở để nhận kết quả gửi nhé.</p>}
            <button className={styles.submit} type="submit" disabled={submitting || !service}>
              <SendIcon /><span>{submitting ? 'Đang gửi…' : 'Gửi lời chúc'}</span>
            </button>
            <p id="wish-public" className={styles.note}>Lời chúc sẽ được hiển thị công khai trên thiệp.</p>
          </form>
        )}
        <section className={styles.feed} aria-labelledby="wish-feed-title">
          <h3 id="wish-feed-title">Lời chúc từ mọi người</h3>
          {displayedWishes.length > 0 && (
            <ul ref={list} className={styles.messages} data-lenis-prevent="true" tabIndex={0} aria-label="Những lời chúc mới nhất">
              {displayedWishes.map((wish) => (
                <li key={wish.id} className={styles.wish}>
                  {wish.id === ownWish?.id && <span className={styles.ownLabel}>Lời chúc của bạn</span>}
                  <div className={styles.author}>
                    <span className={styles.initial} aria-hidden="true">{Array.from(wish.name)[0]}</span>
                    <div><h4>{wish.name}</h4><time dateTime={new Date(wish.createdAt).toISOString()}>{dateFormat.format(wish.createdAt)}</time></div>
                  </div>
                  <p>{wish.message}</p>
                </li>
              ))}
            </ul>
          )}
          {feedState === 'loading' && displayedWishes.length === 0 && <p className={styles.empty} role="status">Đang tải lời chúc…</p>}
          {feedState === 'ready' && displayedWishes.length === 0 && <p className={styles.empty}>Chưa có lời chúc. Bạn có thể là người đầu tiên gửi lời chúc đến hai chúng mình.</p>}
          {feedState === 'error' && (
            <div className={styles.feedError}>
              <p role="status">Chưa tải được lời chúc. Bạn thử lại nhé.</p>
              <button type="button" onClick={retry}>Tải lại lời chúc</button>
            </div>
          )}
        </section>
      </div>
    </SceneShell>
  )
}

function SendIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="m3 10 18-7-7 18-3-8-8-3Zm8 3L21 3" /></svg>
}
