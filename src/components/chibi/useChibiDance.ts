import { useEffect, type RefObject } from 'react'
import { music } from '../../lib/music'
import { dancePose } from './chibiDance'
import { bindDanceLimbs } from './danceLimbs'

/** Override inherited GSAP rig values on the inner SVG, leaving door/reveal motion intact. */
export function useChibiDance(ref: RefObject<SVGSVGElement | null>, enabled: boolean) {
  useEffect(() => {
    const svg = ref.current
    if (!enabled || !svg) return
    const limbs = bindDanceLimbs(svg)
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    let visible = true
    let frame = 0
    const stop = () => {
      cancelAnimationFrame(frame)
      frame = 0
    }
    const clear = () => {
      stop()
      limbs.reset()
      for (const key of Object.keys(dancePose(0))) svg.style.removeProperty(key)
    }
    const tick = () => {
      if (!music.advancing) { frame = 0; return }
      const pose = dancePose(music.currentTime)
      limbs.apply(pose)
      for (const [key, value] of Object.entries(pose)) svg.style.setProperty(key, value)
      frame = requestAnimationFrame(tick)
    }
    const sync = () => {
      stop()
      // Pause/buffering freezes the current joint pose instead of snapping back to rest.
      if (reduced.matches) { clear(); return }
      const state = music.getSnapshot()
      if (visible && !document.hidden && !reduced.matches && (state.playing || music.advancing) && !state.error) tick()
    }
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      sync()
    })
    observer.observe(svg)
    const unsubscribe = music.subscribe(sync)
    reduced.addEventListener('change', sync)
    document.addEventListener('visibilitychange', sync)
    sync()
    return () => {
      clear()
      observer.disconnect()
      unsubscribe()
      reduced.removeEventListener('change', sync)
      document.removeEventListener('visibilitychange', sync)
    }
  }, [ref, enabled])
}
