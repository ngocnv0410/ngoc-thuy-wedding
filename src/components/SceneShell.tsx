import type { ReactNode, Ref } from 'react'
import type { HeadingPhotoContent } from '../content/types'
import { HeadingPhoto } from './HeadingPhoto'
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
  children: ReactNode
  photo?: HeadingPhotoContent
  photoAccent?: ReactNode
  align?: 'center' | 'start'
}

/** Tiêu đề scene: một tiêu đề serif duy nhất. */
export function SceneHeading({ id, children, photo, photoAccent, align = 'center' }: SceneHeadingProps) {
  const heading = <h2 id={id} className={styles.title} data-anim="title">{children}</h2>
  return (
    <header className={styles.heading} data-align={align} data-has-photo={Boolean(photo)}>
      <HeadingPhoto photo={photo} heading={heading}>{photoAccent}</HeadingPhoto>
    </header>
  )
}
