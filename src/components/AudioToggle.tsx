import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react'
import type { Music } from '../content/types'
import { music } from '../lib/music'
import styles from './AudioToggle.module.css'
import { MusicModePicker, type MusicModeControl } from './MusicModePicker'

/** The audio element stays mounted while the invitation scenes replay. */
export function AudioToggle({ track, opening, modes, mode, onModeChange }: { track: Music; opening: boolean } & MusicModeControl) {
  const state = useSyncExternalStore(music.subscribe, music.getSnapshot)
  const [expanded, setExpanded] = useState(false)
  const [controlsReady, setControlsReady] = useState(false)
  const dockRef = useRef<HTMLDivElement>(null)
  const controlsRef = useRef<HTMLDivElement>(null)
  const detailsRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()
  const initialTitle = useRef(track.title)
  const visible = expanded && !opening

  // Mount once on first open: removing native controls when hiding the panel can pause audio.
  useEffect(() => {
    if (controlsReady && controlsRef.current) return music.mountControls(controlsRef.current, initialTitle.current)
  }, [controlsReady])

  useEffect(() => {
    controlsRef.current?.querySelector('audio')?.setAttribute('aria-label', track.title)
  }, [track.title, controlsReady])

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

  const openPanel = () => {
    setControlsReady(true)
    setExpanded(true)
  }

  return (
    <div ref={dockRef} className={styles.dock} data-opening={opening}>
      <div className={styles.controls}>
        <button type="button" className={styles.toggle} aria-pressed={state.wanted}
          aria-label={state.wanted ? 'Tắt nhạc nền' : 'Bật nhạc nền'} onClick={() => {
            if (state.error) openPanel()
            music.toggle()
          }}>
          <span className={styles.bars} data-playing={state.playing} aria-hidden="true">
            <span /><span /><span /><span />
          </span>
        </button>
        <button ref={detailsRef} type="button" className={styles.details} aria-label="Chọn chế độ thiệp"
          aria-expanded={visible} aria-controls={panelId} onClick={() => {
            setControlsReady(true)
            setExpanded((value) => !value)
          }}>
          <span>Chế độ</span>
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="m6 8 4 4 4-4" /></svg>
        </button>
      </div>
      {state.error && !visible && !opening && (
        <button type="button" className={styles.retryHint} aria-label="Thử phát lại nhạc" onClick={() => {
          openPanel()
          music.play()
        }}>Chưa tải được nhạc · Thử lại</button>
      )}
      <section id={panelId} className={styles.panel} data-open={visible} inert={!visible} aria-label="Chế độ thiệp và nhạc nền">
        <header className={styles.panelHeader}>
          <span>Chế độ thiệp</span>
          <button type="button" aria-label="Đóng trình phát nhạc" onClick={() => {
            setExpanded(false)
            detailsRef.current?.focus()
          }}>×</button>
        </header>
        <MusicModePicker modes={modes} mode={mode} onModeChange={onModeChange} />
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
