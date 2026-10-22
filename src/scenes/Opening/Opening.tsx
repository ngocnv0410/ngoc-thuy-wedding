import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Button } from '../../components/Button'
import { Seal } from '../../components/Seal'
import type { WeddingContent } from '../../content/types'
import { dottedDate, orderedCouple, primaryDay } from '../../lib/format'
import { music } from '../../lib/music'
import { loadMotion, loadMotionWithin, lockScroll, prefersMotion } from '../../motion/useMotion'
import styles from './Opening.module.css'
import { useEnvelope3D } from './useEnvelope3D'

interface OpeningProps {
  content: WeddingContent
  /** Phong bì đã mở xong (hoặc được bỏ qua): gỡ overlay. */
  onDone: () => void
}

interface OpenControl {
  fastForward: () => void
  finish: () => void
}

/** Hạt bụi trong tia nắng: vị trí giả ngẫu nhiên cố định (LCG) để lần nào cũng giống nhau. */
const DUST = (() => {
  let seed = 7
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
  return Array.from({ length: 36 }, () => ({
    left: `${(rand() * 100).toFixed(1)}%`,
    top: `${(rand() * 100).toFixed(1)}%`,
    size: `${(1 + rand() * 2.2).toFixed(1)}px`,
    duration: `${(9 + rand() * 9).toFixed(1)}s`,
    delay: `${(-rand() * 12).toFixed(1)}s`,
  }))
})()

/** Fallback khi không có motion: overlay mờ dần bằng CSS trong 400ms. */
const FADE_MS = 420

/**
 * Scene 0 — Phong bì mở thiệp. Bản 2.5D (HTML/CSS + GSAP) luôn hiện trước; máy đủ mạnh được nâng
 * lên bản 3D (useEnvelope3D). Toàn bộ nội dung thiệp đã có trong DOM
 * phía dưới; overlay này chỉ là màn mở đầu và luôn có lối ra ("Bỏ qua", hoặc tự mờ đi nếu
 * animation không tải được).
 */
export function Opening({ content, onDone }: OpeningProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [closing, setClosing] = useState(false)
  const [withMusic, setWithMusic] = useState(false)
  const started = useRef(false)
  const finished = useRef(false)
  const control = useRef<OpenControl | null>(null)
  // Callback ref (state) để lớp 3D render lại khi sân khấu 2.5D đã có trong DOM.
  const [stage, setStage] = useState<HTMLDivElement | null>(null)
  const envelope3D = useEnvelope3D(started)

  const { couple, music: track } = content
  const [first, second] = orderedCouple(couple)
  const day = primaryDay(content.days)
  const text3D = useMemo(
    () => ({ first: first.givenName, second: second.givenName, date: dottedDate(day.solar), monogram: couple.monogram }),
    [first.givenName, second.givenName, day.solar, couple.monogram],
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

  // Phong bì xuất hiện (chỉ khi có motion).
  useEffect(() => {
    if (!prefersMotion()) return
    let dispose: (() => void) | undefined
    let cancelled = false
    loadMotion()
      .then((runtime) => {
        if (!cancelled && ref.current) dispose = runtime.introEnvelope(ref.current)
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
      const api3d = envelope3D.active ? envelope3D.api.current : null
      control.current = api3d
        ? api3d.open(ref.current, { onReveal: runtime.releaseHero, onDone: finish })
        : runtime.openEnvelope(ref.current, finish)
    } catch {
      fadeOut()
    }
  }

  /** Mất WebGL context: đang mở thì kết thúc luôn, chưa mở thì quay về bản 2.5D. */
  function on3DFail() {
    if (started.current && control.current) control.current.finish()
    else envelope3D.discard()
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
      data-mode={envelope3D.active ? '3d' : '2d'}
      role="dialog"
      aria-modal="true"
      aria-label={`Thiệp mời cưới ${first.givenName} và ${second.givenName}`}
      tabIndex={-1}
    >
      <button type="button" className={styles.skip} onClick={skip}>
        Bỏ qua phần mở đầu
      </button>

      <div className={styles.dust} aria-hidden="true">
        {DUST.map((dot, index) => (
          <span
            key={index}
            style={{
              left: dot.left,
              top: dot.top,
              width: dot.size,
              height: dot.size,
              animationDuration: dot.duration,
              animationDelay: dot.delay,
            }}
          />
        ))}
      </div>

      <div className={styles.stageWrap}>
        <div ref={setStage} className={styles.stage} data-anim="stage">
          <div className={styles.shadow} data-anim="shadow" aria-hidden="true" />
          <div className={styles.back} data-anim="env-part" aria-hidden="true" />

          <div className={styles.card} data-anim="card" aria-hidden="true">
            <div className={styles.cardFrame}>
              <p className={styles.cardEyebrow}>Thiệp mời cưới</p>
              <p className={styles.cardNames}>
                <span>{first.givenName}</span>
                <span className={styles.cardAmp}>&amp;</span>
                <span>{second.givenName}</span>
              </p>
              <p className={styles.cardDate}>{dottedDate(day.solar)}</p>
            </div>
          </div>

          <div className={styles.pocket} data-anim="env-part" aria-hidden="true">
            <svg className={styles.folds} viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0,100 L42,60 M100,100 L58,60" />
            </svg>
            <p className={styles.names} data-anim="names">
              {first.givenName} &amp; {second.givenName}
            </p>
          </div>

          <div className={styles.flap} data-anim="flap" aria-hidden="true">
            <svg className={styles.flapEdge} viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0,0 L50,100 L100,0" />
            </svg>
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
      </div>

      {envelope3D.Component && stage && (
        <div className={styles.canvas3d}>
          <envelope3D.Component
            stage={stage}
            text={text3D}
            onReady={envelope3D.onReady}
            onFail={on3DFail}
            onOpenRequest={open}
          />
        </div>
      )}

      <div className={styles.actions} data-anim="cta">
        <Button variant="primary" size="lg" onClick={open}>
          Mở thiệp
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
