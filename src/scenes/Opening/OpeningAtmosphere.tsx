import type { CSSProperties } from 'react'
import styles from './OpeningAtmosphere.module.css'

// Fixed positions keep the opening stable on replay and avoid random hydration shifts.
const flecks = Array.from({ length: 84 }, (_, i) => ({
  x: 3 + ((i * 37 + 11) % 94),
  y: i < 40 ? 2 + ((i * 17) % 24) : i < 80 ? 76 + ((i * 13) % 23) : 30 + ((i * 9) % 36),
  size: i % 9 === 0 ? 4 : i % 3 === 0 ? 2.5 : 1.5,
  delay: -(i % 13) * 0.37,
  duration: 2.8 + (i % 7) * 0.41,
}))

/** Warm, restrained stardust around the doors; no interaction or text is covered. */
export function OpeningAtmosphere({ opening }: { opening: boolean }) {
  return <div className={styles.atmosphere} data-opening-atmosphere data-phase={opening ? 'opening' : 'idle'} aria-hidden="true">
    <div className={styles.dust}>
      {flecks.map((fleck, i) => <i key={i} className={styles.fleck} data-glint={i % 9 === 0}
        style={{ left: `${fleck.x}%`, top: `${fleck.y}%`, width: fleck.size, height: fleck.size,
          '--delay': `${fleck.delay}s`, '--duration': `${fleck.duration}s`,
          '--drift-x': `${(fleck.x - 50) * 0.8}px`, '--drift-y': `${fleck.y < 50 ? -35 : 35}px`,
        } as CSSProperties} />)}
    </div>
    <span className={styles.thread} />
    <span className={styles.star} />
    <span className={styles.bloom} />
  </div>
}
