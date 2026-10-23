import { useEffect, useRef, useState, type RefObject } from 'react'

/** Run decorative loops only while visible, in a foreground tab, with motion enabled. */
export function useVisibleMotion<T extends Element>(externalRef?: RefObject<T | null>) {
  const ownRef = useRef<T>(null)
  const ref = externalRef ?? ownRef
  const [active, setActive] = useState(false)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    const motion = window.matchMedia('(prefers-reduced-motion: no-preference)')
    let visible = false
    const update = () => setActive(visible && !document.hidden && motion.matches)
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      update()
    })
    observer.observe(node)
    document.addEventListener('visibilitychange', update)
    motion.addEventListener('change', update)
    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', update)
      motion.removeEventListener('change', update)
    }
  }, [ref])
  return { ref, active }
}
