import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react'
import type { Music } from '../content/types'
import { music } from '../lib/music'
import styles from './AudioToggle.module.css'

/** The audio element stays mounted while the invitation scenes replay. */
export function AudioToggle({ track, opening }: { track: Music; opening: boolean }) {
  const state = useSyncExternalStore(music.subscribe, music.getSnapshot)
  const [expanded, setExpanded] = useState(false)
  const dockRef = useRef<HTMLDivElement>(null)
  const controlsRef = useRef<HTMLDivElement>(null)
  const detailsRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()
  const visible = expanded && !opening

  useEffect(() => {
    if (controlsRef.current) return music.mountControls(controlsRef.current, track.title)
  }, [track.title])

  useEffect(() => {
    if (!visible) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setExpanded(false)
      detailsRef.current?.focus()
    }
    const onPointer = (event: PointerEvent) => {
      if (!dockRef.current?.contains(event.target as Node)) setExpanded(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [visible])

  return (
    <div ref={dockRef} className={styles.dock} data-opening={opening}>
      <div className={styles.controls}>
        <button type="button" className={styles.toggle} aria-pressed={state.wanted}
          aria-label={state.wanted ? 'Tắt nhạc nền' : 'Bật nhạc nền'} onClick={() => {
            if (state.error) setExpanded(true)
            music.toggle()
          }}>
          <span className={styles.bars} data-playing={state.playing} aria-hidden="true">
            <span /><span /><span /><span />
          </span>
        </button>
        <button ref={detailsRef} type="button" className={styles.details} aria-label="Mở trình phát nhạc"
          aria-expanded={visible} aria-controls={panelId} onClick={() => setExpanded((value) => !value)}>
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="m6 8 4 4 4-4" /></svg>
        </button>
      </div>
      {state.error && !visible && !opening && (
        <button type="button" className={styles.retryHint} aria-label="Thử phát lại nhạc" onClick={() => {
          setExpanded(true)
          music.play()
        }}>Chưa tải được nhạc · Thử lại</button>
      )}
      <section id={panelId} className={styles.panel} data-open={visible} inert={!visible} aria-label="Trình phát nhạc nền">
        <header className={styles.panelHeader}>
          <span>Nhạc nền</span>
          <button type="button" aria-label="Đóng trình phát nhạc" onClick={() => {
            setExpanded(false)
            detailsRef.current?.focus()
          }}>×</button>
        </header>
        <p className={styles.trackTitle}>{track.title}</p>
        {track.artist && <p className={styles.artist}>{track.artist}</p>}
        <div ref={controlsRef} className={styles.audio} />
        <p className={styles.status} role="status">
          {state.error ? 'Chưa tải được nhạc. Bấm bật nhạc để thử lại.' : state.loading ? 'Đang tải nhạc…' : ''}
        </p>
        <div className={styles.credits}>
          {track.artistUrl && <a href={track.artistUrl} target="_blank" rel="noopener noreferrer">Nghệ sĩ</a>}
          {track.sourceUrl && <a href={track.sourceUrl} target="_blank" rel="noopener noreferrer">Nguồn bản thu</a>}
          {track.licenseUrl && <a href={track.licenseUrl} target="_blank" rel="noopener noreferrer">CC BY-SA 3.0</a>}
        </div>
      </section>
    </div>
  )
}
