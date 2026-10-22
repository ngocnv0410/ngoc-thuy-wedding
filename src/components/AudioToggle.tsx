import { useSyncExternalStore } from 'react'
import { music } from '../lib/music'
import styles from './AudioToggle.module.css'

/** Nút bật/tắt nhạc cố định góc trên phải. Chỉ render khi có nhạc trong dữ liệu. */
export function AudioToggle() {
  const playing = useSyncExternalStore(music.subscribe, music.getPlaying)
  return (
    <button
      type="button"
      className={styles.toggle}
      aria-pressed={playing}
      aria-label={playing ? 'Tắt nhạc nền' : 'Bật nhạc nền'}
      onClick={() => music.toggle()}
    >
      <span className={styles.bars} data-playing={playing} aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </span>
    </button>
  )
}
