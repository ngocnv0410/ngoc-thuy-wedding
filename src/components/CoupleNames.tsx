import type { ElementType } from 'react'
import styles from './CoupleNames.module.css'

interface CoupleNamesProps {
  first: string
  second: string
  as?: ElementType
  id?: string
  size?: 'hero' | 'section' | 'signature'
  layout?: 'stacked' | 'inline'
  className?: string
  tabIndex?: number
}

/**
 * Tên cô dâu chú rể và dấu "&" viết tay nhũ vàng (Alex Brush) — theo mẫu
 * chữ tên tham khảo. Mỗi phần có `data-anim="name"` để motion xử lý.
 */
export function CoupleNames({
  first,
  second,
  as: Tag = 'p',
  id,
  size = 'section',
  layout = 'stacked',
  className,
  tabIndex,
}: CoupleNamesProps) {
  return (
    <Tag
      id={id}
      tabIndex={tabIndex}
      className={[styles.names, className].filter(Boolean).join(' ')}
      data-size={size}
      data-layout={layout}
    >
      <span className={styles.name} data-anim="name">
        {first}
      </span>
      <span className={styles.amp} aria-label="và" data-anim="name">
        &amp;
      </span>
      <span className={styles.name} data-anim="name">
        {second}
      </span>
    </Tag>
  )
}
