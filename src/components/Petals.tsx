import { useEffect, useRef, useState, type CSSProperties } from 'react'
import styles from './Petals.module.css'

/** Leaves and petals behind each scene's content; sleeps off screen and in background tabs. */
export function Petals({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    let visible = false
    const update = () => setActive(visible && !document.hidden)
    const resize = new ResizeObserver(() => {
      // A long section needs a longer fall, keeping the speed gentle throughout the page.
      node.style.setProperty('--fall-height', `${node.clientHeight + 48}px`)
      node.style.setProperty('--fall-time', `${Math.max(18, node.clientHeight / 35)}s`)
    })
    resize.observe(node)
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      update()
    })
    observer.observe(node)
    document.addEventListener('visibilitychange', update)
    return () => {
      observer.disconnect()
      resize.disconnect()
      document.removeEventListener('visibilitychange', update)
    }
  }, [])
  return (
    <div ref={ref} className={`${styles.petals} ${className}`} data-petals data-active={active} aria-hidden="true">
      {Array.from({ length: 10 }, (_, i) => (
        <span key={i} style={{ '--i': i, '--x': `${(i * 29 + 7) % 96}%`, '--drift': `${i % 2 ? 54 : -42}px`, '--phase': (i * 0.137 + 0.05) % 1 } as CSSProperties}>
          <i data-kind={i % 3 === 0 ? 'petal' : 'leaf'} />
        </span>
      ))}
    </div>
  )
}
