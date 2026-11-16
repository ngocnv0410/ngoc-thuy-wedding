import styles from './Opening.module.css'

/** Two leaves share a single bespoke paper artwork, so the closed center seam meets exactly. */
export function Door({ side }: { side: 'left' | 'right' }) {
  return <div className={styles.door} data-door={side}>
    <div className={styles.gateArtwork} aria-hidden="true" />
    <span className={styles.doorShade} data-shade={side} />
  </div>
}
