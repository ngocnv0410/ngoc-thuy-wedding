import type { ReactNode, Ref } from 'react'
import { Petals } from './Petals'
import styles from './SceneShell.module.css'

export type Light = 'morning' | 'noon' | 'afternoon' | 'golden' | 'candle'

interface SceneShellProps {
  id: string
  light: Light
  /** id của tiêu đề scene, dùng cho `aria-labelledby`. */
  labelledBy: string
  className?: string
  ref?: Ref<HTMLElement>
  children: ReactNode
}

/** Khung một scene: đặt tông ánh sáng (`data-light`) và anchor cho điều hướng. */
export function SceneShell({ id, light, labelledBy, className, ref, children }: SceneShellProps) {
  return (
    <section
      ref={ref}
      id={id}
      data-light={light}
      aria-labelledby={labelledBy}
      className={[styles.scene, className].filter(Boolean).join(' ')}
    >
      {children}
      <Petals />
    </section>
  )
}

interface SceneHeadingProps {
  id: string
  eyebrow: string
  children: ReactNode
  align?: 'center' | 'start'
}

/** Tiêu đề scene: dòng nhãn nhỏ + tiêu đề serif lớn. */
export function SceneHeading({ id, eyebrow, children, align = 'center' }: SceneHeadingProps) {
  return (
    <header className={styles.heading} data-align={align}>
      <p className={styles.eyebrow} data-anim="eyebrow">
        {eyebrow}
      </p>
      <h2 id={id} className={styles.title} data-anim="title">
        {children}
      </h2>
    </header>
  )
}
