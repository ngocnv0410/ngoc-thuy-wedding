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
  if (compact) return <label className={styles.compact}>
    <span>Chế độ thiệp</span>
    <select value={mode} onChange={(event) => {
      const selected = modes.find((item) => item.id === event.target.value)
      if (selected) onModeChange(selected.id)
    }}>
      {modes.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
    </select>
  </label>
  return <fieldset className={styles.options}>
    <legend>Chọn chế độ</legend>
    {modes.map((item) => <label key={item.id} className={styles.option} data-selected={mode === item.id}>
      <input type="radio" name={id} value={item.id} checked={mode === item.id} onChange={() => onModeChange(item.id)} />
      <span><strong>{item.label}</strong><small>{item.description}</small></span>
    </label>)}
  </fieldset>
}
