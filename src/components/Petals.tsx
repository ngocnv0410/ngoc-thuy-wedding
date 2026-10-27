import { useEffect, useRef, useState, type CSSProperties } from 'react'
import styles from './Petals.module.css'

/** Vị trí lá xanh trong 16 hạt rơi: 5 lá trên màn lớn, 4 lá trong 10 hạt đầu hiện trên điện thoại. */
const LEAVES = [0, 2, 5, 8, 12]

/** Cherry blossoms with a few green leaves behind each scene's content; sleeps off screen and in background tabs. */
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
      {Array.from({ length: 16 }, (_, i) => {
        const slot = LEAVES.indexOf(i)
        const leaf = slot < 0 ? 0 : (slot % 4) + 1 // 4 ảnh lá, dùng vòng lại
        const kind = leaf ? 'leaf' : 'flower'
        // Ba lớp sâu: vài bông sát ống kính (to, nhoè), bông xa nhỏ, còn lại cỡ vừa.
        const depth = kind !== 'flower' ? undefined : i === 4 || i === 9 ? 'near' : i % 3 === 1 ? 'far' : undefined
        return (
          <span key={i} data-kind={kind} data-depth={depth}
            style={{ '--i': i, '--x': `${(i * 29 + 7) % 96}%`, '--drift': `${i % 2 ? 54 : -42}px`, '--phase': (i * 0.137 + 0.05) % 1 } as CSSProperties}>
            <i data-kind={kind} data-variant={leaf ? undefined : (i % 4) + 1} data-leaf={leaf || undefined} />
          </span>
        )
      })}
    </div>
  )
}
