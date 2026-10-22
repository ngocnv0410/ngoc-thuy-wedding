import { useMemo, useRef, useState } from 'react'
import type { Video } from '../../content/types'
import { music } from '../../lib/music'
import styles from './VideoBlock.module.css'

type State = 'idle' | 'playing' | 'paused' | 'error'

/** Mạng chậm / tiết kiệm dữ liệu → dùng bản nhẹ (nếu có). */
function prefersLowQuality(): boolean {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } })
    .connection
  return Boolean(connection?.saveData) || /(^|-)(2g|3g)$/.test(connection?.effectiveType ?? '')
}

/**
 * Video kỷ niệm: khung điện ảnh, poster + nút phát; video chưa tải gì cho tới khi khách bấm.
 * Bấm phát là có tiếng (đã có cú chạm); nhạc nền tự tạm dừng và bật lại khi video dừng.
 */
export function VideoBlock({ video }: { video: Video }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [state, setState] = useState<State>('idle')
  const src = useMemo(() => (video.srcLow && prefersLowQuality() ? video.srcLow : video.src), [video])

  function start() {
    const el = ref.current
    if (!el) return
    el.muted = false
    el.play().catch(() => setState('error'))
  }

  return (
    <figure className={styles.video} data-state={state}>
      <div className={styles.frame}>
        <video
          ref={ref}
          src={src}
          poster={video.poster}
          preload="none"
          playsInline
          controls={state !== 'idle'}
          onPlay={() => {
            setState('playing')
            music.suspend()
          }}
          onPause={() => {
            setState((current) => (current === 'error' ? current : 'paused'))
            music.resume()
          }}
          onEnded={() => music.resume()}
          onError={() => setState('error')}
        >
          {video.captions && <track kind="captions" src={video.captions} srcLang="vi" label="Tiếng Việt" default />}
        </video>

        {state === 'idle' && (
          <button type="button" className={styles.play} onClick={start} aria-label={`Phát video: ${video.title}`}>
            <span className={styles.playIcon} aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M8 5.5v13l11-6.5z" />
              </svg>
            </span>
          </button>
        )}

        {state === 'error' && (
          <div className={styles.error} role="status">
            <p>Video tạm thời chưa phát được.</p>
            <a href={src} target="_blank" rel="noopener">
              Mở video trực tiếp
            </a>
          </div>
        )}
      </div>
      <figcaption>{video.title}</figcaption>
    </figure>
  )
}
