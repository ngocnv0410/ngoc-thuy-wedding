import type { CSSProperties } from 'react'
import { PROP } from './chibiArt'
import styles from './ChibiProp.module.css'

export type PropKind = 'calendar' | 'map' | 'envelope' | 'mailbox' | 'heart' | 'petal'

const VIEWBOX: Record<PropKind, string> = {
  calendar: '-12 -14 24 28',
  map: '-16 -13 32 26',
  envelope: '-19 -13 38 26',
  mailbox: '-24 -24 68 70',
  heart: '-9 -10 18 15',
  petal: '-3 -4 6 8',
}

/** Nét đạo cụ quanh gốc (0, 0) — lồng được vào tay chibi (`held`) hoặc đứng riêng (`ChibiProp`). */
export function PropArt({ kind, label }: { kind: PropKind; label?: string }) {
  switch (kind) {
    case 'calendar':
      return (
        <g className={styles.prop}>
          <rect x={-11} y={-13} width={22} height={26} rx={1.5} className={styles.paper} />
          <path d="M-11-13h22v6h-22Z" className={styles.accent} />
          <circle cx={-5} cy={-13} r={1.3} className={styles.ink} />
          <circle cx={5} cy={-13} r={1.3} className={styles.ink} />
          {label && (
            <text y={8} textAnchor="middle" className={styles.number}>
              {label}
            </text>
          )}
        </g>
      )
    case 'map':
      return (
        <g className={styles.prop}>
          <path d={PROP.map} className={styles.paper} />
          <path d={PROP.mapFolds} className={styles.fold} />
          <path d={PROP.mapRoute} className={styles.route} />
          <circle cx={10} cy={-5} r={1.8} className={styles.accent} />
        </g>
      )
    case 'envelope':
      return (
        <g className={styles.prop}>
          <rect x={-18} y={-12} width={36} height={24} rx={1} className={styles.paper} />
          <path d="M-18 12L-3 0M18 12L3 0" className={styles.fold} />
          <g className={styles.flap} style={{ transformOrigin: '0px -12px' }}>
            <path d={PROP.envelopeFlap} className={styles.paper} />
          </g>
          <circle cx={0} cy={0} r={2.6} className={styles.accent} />
        </g>
      )
    case 'mailbox':
      return (
        <g className={styles.prop}>
          <path d="M-3 10V44M3 10V44" className={styles.post} />
          <path d={PROP.mailbox} className={styles.paper} />
          <path d="M-13-6H9" className={styles.slot} />
          <g className={styles.flag} style={{ transformOrigin: '32px -4px' }}>
            <path d="M24-4H32V-17" className={styles.post} />
            <path d={PROP.mailboxFlag} className={styles.accent} />
          </g>
        </g>
      )
    case 'heart':
      return <path d={PROP.heart} className={`${styles.prop} ${styles.accent}`} />
    case 'petal':
      return <ellipse rx={2} ry={3.4} className={`${styles.prop} ${styles.petal}`} />
  }
}

interface ChibiPropProps {
  kind: PropKind
  label?: string
  className?: string
  style?: CSSProperties
  anim?: string
}

/** Đạo cụ đứng riêng (phong thư, hộp thư, tim bay…): trang trí, `aria-hidden`. */
export function ChibiProp({ kind, label, className, style, anim }: ChibiPropProps) {
  return (
    <span
      className={[styles.standalone, styles[kind], className].filter(Boolean).join(' ')}
      style={style}
      data-anim={anim}
      aria-hidden="true"
    >
      <svg viewBox={VIEWBOX[kind]} focusable="false">
        <PropArt kind={kind} label={label} />
      </svg>
    </span>
  )
}
