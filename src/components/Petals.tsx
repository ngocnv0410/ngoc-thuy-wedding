import { useEffect, useRef, useState, type CSSProperties } from 'react'
import styles from './Petals.module.css'

/** A small, deterministic drift of petals; sleeps outside the viewport and in background tabs. */
export function Petals({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)
  useEffect(() => {
    let visible = false
    const update = () => setActive(visible && !document.hidden)
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      update()
    })
    if (ref.current) observer.observe(ref.current)
    document.addEventListener('visibilitychange', update)
    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', update)
    }
  }, [])
  return (
    <div ref={ref} className={`${styles.petals} ${className}`} data-active={active} aria-hidden="true">
      {Array.from({ length: 8 }, (_, i) => (
        <span key={i} style={{ '--i': i, '--x': `${(i * 29 + 7) % 100}%`, '--drift': `${i % 2 ? 48 : -36}px` } as CSSProperties} />
      ))}
    </div>
  )
}
