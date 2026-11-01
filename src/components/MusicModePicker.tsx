import { useId } from 'react'
import type { MusicMode, MusicModeId } from '../lib/music-source'
import styles from './MusicModePicker.module.css'

export interface MusicModeControl {
  modes: MusicMode[]
  mode: MusicModeId
  onModeChange: (mode: MusicModeId) => void
}

export function MusicModePicker({ modes, mode, onModeChange, compact = false }: MusicModeControl & { compact?: boolean }) {
  const id = useId()
  return <fieldset className={styles.options} data-compact={compact}>
    <legend className="visually-hidden">Chọn chế độ thiệp</legend>
    {modes.map((item) => <label key={item.id} className={styles.option} data-selected={mode === item.id}>
      <input type="radio" name={id} value={item.id} checked={mode === item.id}
        aria-label={item.label} aria-describedby={`${id}-${item.id}`} onChange={() => onModeChange(item.id)} />
      <span className={styles.label}>{item.label}</span>
      <span id={`${id}-${item.id}`} className="visually-hidden">{item.description}</span>
    </label>)}
  </fieldset>
}
