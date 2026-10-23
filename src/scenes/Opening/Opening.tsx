import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Button } from '../../components/Button'
import { Chibi } from '../../components/chibi/Chibi'
import { CoupleNames } from '../../components/CoupleNames'
import { Seal } from '../../components/Seal'
import type { WeddingContent } from '../../content/types'
import { orderedCouple, primaryDay, solarParts } from '../../lib/format'
import { music } from '../../lib/music'
import { loadMotion, loadMotionWithin, lockScroll, prefersMotion } from '../../motion/useMotion'
import styles from './Opening.module.css'
import { Door } from './Door'
import { useDoors3D } from './useDoors3D'

interface OpeningProps {
  content: WeddingContent
  /** Cửa đã mở xong (hoặc được bỏ qua): gỡ overlay. */
  onDone: () => void
}

interface OpenControl {
  fastForward: () => void
  finish: () => void
}

/** Fallback khi không có motion: overlay mờ dần bằng CSS trong 400ms. */
const FADE_MS = 420

/**
 * Scene 0 — Hai cánh cửa hoa văn nổi, dấu sáp niêm trên khe cửa. Bản 2.5D (SVG/CSS + GSAP) luôn
 * hiện trước; máy đủ mạnh được nâng lên bản 3D (useDoors3D). Toàn bộ nội dung thiệp đã có trong
 * DOM phía sau; cửa mở ra là thấy bìa thật. Overlay luôn có lối ra ("Bỏ qua", hoặc tự mờ đi nếu
 * animation không tải được).
 */
export function Opening({ content, onDone }: OpeningProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [closing, setClosing] = useState(false)
  const [withMusic, setWithMusic] = useState(false)
  const started = useRef(false)
  const finished = useRef(false)
  const control = useRef<OpenControl | null>(null)
  // Callback ref (state) để lớp 3D render lại khi cửa 2.5D đã có trong DOM.
  const [stage, setStage] = useState<HTMLDivElement | null>(null)
  const doors3D = useDoors3D(started)

  const { couple, music: track } = content
  const leftWho = couple.order === 'bride-first' ? 'bride' : 'groom'
  const [first, second] = orderedCouple(couple)
  const date = solarParts(primaryDay(content.days).solar)
  const text3D = useMemo(
    () => ({ first: first.givenName, second: second.givenName, monogram: couple.monogram }),
    [first.givenName, second.givenName, couple.monogram],
  )

  const finish = useCallback(() => {
    if (finished.current) return
    finished.current = true
    onDone()
  }, [onDone])

  // Khoá cuộn và đưa focus vào hộp thoại.
  useLayoutEffect(() => {
    lockScroll(true)
    ref.current?.focus({ preventScroll: true })
    return () => lockScroll(false)
  }, [])

  // Keep keyboard navigation inside the invitation until the opening is dismissed.
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        if (control.current) control.current.finish()
        else fadeOut()
        return
      }
      if (event.key !== 'Tab') return
      const buttons = [...dialog.querySelectorAll<HTMLButtonElement>('button')].filter((button) => !button.disabled && getComputedStyle(button).visibility !== 'hidden')
      const firstButton = buttons[0]
      const lastButton = buttons.at(-1)
      if (event.shiftKey && (document.activeElement === firstButton || document.activeElement === dialog)) {
        event.preventDefault()
        lastButton?.focus()
      } else if (!event.shiftKey && document.activeElement === lastButton) {
        event.preventDefault()
        firstButton?.focus()
      }
    }
    dialog.addEventListener('keydown', onKey)
    return () => dialog.removeEventListener('keydown', onKey)
  })

  // Cửa hiện hoa văn, dấu sáp đặt lên khe (chỉ khi có motion).
  useEffect(() => {
    if (!prefersMotion()) return
    let dispose: (() => void) | undefined
    let cancelled = false
    loadMotion()
      .then((runtime) => {
        if (!cancelled && ref.current) dispose = runtime.introDoors(ref.current)
      })
      .catch(() => {})
    return () => {
      cancelled = true
      dispose?.()
    }
  }, [])

  const fadeOut = useCallback(() => {
    setClosing(true)
    if (prefersMotion()) {
      loadMotion()
        .then((runtime) => runtime.releaseHero())
        .catch(() => {})
    }
    window.setTimeout(finish, FADE_MS)
  }, [finish])

  async function open() {
    if (started.current) {
      control.current?.fastForward()
      return
    }
    started.current = true
    // Phải gọi đồng bộ trong cú chạm để trình duyệt cho phép phát âm thanh.
    if (withMusic) music.play()
    if (!prefersMotion()) {
      fadeOut()
      return
    }
    try {
      const runtime = await loadMotionWithin(1500)
      if (!ref.current) return
      const api3d = doors3D.active ? doors3D.api.current : null
      if (api3d) {
        // Bản 3D tự mở cửa; hai bạn chibi (lớp DOM trên canvas) đi theo cùng nhịp.
        const hosts = runtime.openHosts(ref.current)
        const doors = api3d.open(ref.current, { onReveal: runtime.releaseHero, onDone: finish })
        control.current = {
          fastForward: () => {
            doors.fastForward()
            hosts.fastForward()
          },
          finish: () => {
            hosts.finish()
            doors.finish()
          },
        }
      } else {
        control.current = runtime.openDoors(ref.current, finish)
      }
    } catch {
      fadeOut()
    }
  }

  /** Mất WebGL context: đang mở thì kết thúc luôn, chưa mở thì quay về bản 2.5D. */
  function on3DFail() {
    if (started.current && control.current) control.current.finish()
    else doors3D.discard()
  }

  function skip() {
    started.current = true
    if (control.current) control.current.finish()
    else fadeOut()
  }

  return (
    <div
      id="opening"
      ref={ref}
      className={styles.overlay}
      data-closing={closing}
      data-mode={doors3D.active ? '3d' : '2d'}
      role="dialog"
      aria-modal="true"
      aria-label={`Thiệp mời cưới ${first.givenName} và ${second.givenName}`}
      tabIndex={-1}
    >
      <button type="button" className={styles.skip} onClick={skip}>
        Bỏ qua phần mở đầu
      </button>

      {/* Bản 2.5D: lùi ra sau (bọc ngoài, không bị style inline của GSAP đè) khi bản 3D thay chỗ. */}
      <div className={styles.flat}>
        <div ref={setStage} className={styles.doors}>
          <Door side="left" />
          <Door side="right" />
          <span className={styles.seamLight} data-seam aria-hidden="true" />
        </div>

        {/* Chạm thẳng vào dấu sáp cũng mở thiệp; người dùng bàn phím dùng nút "Mở thiệp". */}
        <div className={styles.seal} data-anim="seal" onClick={open} aria-hidden="true">
          <span className={styles.sealHalf} data-half="left" data-anim="seal-left">
            <Seal monogram={couple.monogram} />
          </span>
          <span className={styles.sealHalf} data-half="right" data-anim="seal-right">
            <Seal monogram={couple.monogram} />
          </span>
        </div>
      </div>

      {doors3D.Component && stage && (
        <div className={styles.canvas3d}>
          <doors3D.Component
            stage={stage}
            text={text3D}
            onReady={doors3D.onReady}
            onFail={on3DFail}
            onOpenRequest={open}
          />
        </div>
      )}

      <div className={styles.greeting} data-anim="greeting">
        <CoupleNames first={first.givenName} second={second.givenName} layout="inline" size="section" className={styles.openingNames} />
        <p className={styles.openingDate}>{date.day} <span>·</span> {date.month} <span>·</span> {date.year}</p>
      </div>

      {/*
       * Hai bạn chibi đứng trước cửa, hai bên nút "Mở thiệp" (chung cho bản 2.5D và 3D, nằm trên
       * canvas). Bấm mở: đi tới đẩy cửa rồi đứng sang hai bên mời khách vào.
       */}
      <div className={styles.hosts} aria-hidden="true">
        <Chibi who={leftWho} hand="r" look="front" anim="host-left" />
        <Chibi who={leftWho === 'groom' ? 'bride' : 'groom'} hand="l" look="front" anim="host-right" />
      </div>

      <div className={styles.actions} data-anim="cta">
        <Button variant="primary" size="lg" onClick={open}>
          Mở thiệp <svg aria-hidden="true" viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M5 15L15 5M5 5h10v10" /></svg>
        </Button>
        {track && (
          <button
            type="button"
            className={styles.musicChoice}
            aria-pressed={withMusic}
            onClick={() => setWithMusic((value) => !value)}
          >
            <span className={styles.check} aria-hidden="true" />
            Mở kèm nhạc
          </button>
        )}
      </div>
    </div>
  )
}
