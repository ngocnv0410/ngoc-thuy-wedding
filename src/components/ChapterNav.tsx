import { type CSSProperties, type MouseEvent, useEffect, useId, useRef, useState } from 'react'
import { goToSection } from '../motion/useMotion'
import styles from './ChapterNav.module.css'

export interface Chapter {
  id: string
  label: string
}

/** Mục lục thu gọn: khách nhảy thẳng tới "Địa điểm" hay "Mừng cưới" mà không phải cuộn hết. */
export function ChapterNav({ chapters }: { chapters: Chapter[] }) {
  const [open, setOpen] = useState(false)
  const [hidden, setHidden] = useState(false)
  const panelId = useId()
  const rootRef = useRef<HTMLElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Ẩn khi cuộn xuống, hiện lại khi cuộn lên.
  useEffect(() => {
    let lastY = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      setHidden(y > lastY && y > 160)
      lastY = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  // Đóng mục lục trước rồi mới cuộn mượt tới chương (không để trình duyệt nhảy giật theo #hash).
  function jump(event: MouseEvent<HTMLAnchorElement>, id: string) {
    event.preventDefault()
    // Không để Lenis (desktop) bắt thêm lần nữa cú bấm anchor này.
    event.stopPropagation()
    setOpen(false)
    goToSection(id)
  }

  return (
    <nav ref={rootRef} className={styles.nav} data-hidden={hidden && !open} aria-label="Mục lục thiệp">
      <button
        ref={buttonRef}
        type="button"
        className={styles.toggle}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className={styles.bars} aria-hidden="true" data-open={open} />
        <span>Mục lục</span>
      </button>
      {/* Luôn trong DOM để mở/đóng có chuyển động; khi đóng thì `inert` (không focus, không đọc). */}
      <ol id={panelId} className={styles.panel} data-open={open} inert={!open}>
        {chapters.map((chapter, index) => (
          <li key={chapter.id} style={{ '--i': index } as CSSProperties}>
            <a href={`#${chapter.id}`} onClick={(event) => jump(event, chapter.id)}>
              <span className={styles.index}>{String(index + 1).padStart(2, '0')}</span>
              {chapter.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
