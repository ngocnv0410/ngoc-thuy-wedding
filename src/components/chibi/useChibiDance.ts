import { useEffect, type RefObject } from 'react'
import { music } from '../../lib/music'
import type { DanceId } from '../../content/types'
import type { DanceSampler } from './danceSampler'
import { loadDance } from './loadDance'
import { bindDanceLimbs } from './danceLimbs'

/** Override inherited GSAP rig values on the inner SVG, leaving door/reveal motion intact. */
export function useChibiDance(ref: RefObject<SVGSVGElement | null>, dance: DanceId | undefined) {
  useEffect(() => {
    const svg = ref.current
    if (!dance || !svg) return
    let sample: DanceSampler | undefined
    let disposed = false
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
      for (const key of Object.keys(sample?.(0) ?? {})) svg.style.removeProperty(key)
    }
    const tick = () => {
      if (!sample || !music.advancing) { frame = 0; return }
      const pose = sample(music.currentTime)
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
    loadDance(dance).then((sampler) => {
      if (disposed) return
      sample = sampler
      sync()
    }).catch(() => { /* A failed decorative chunk must not interrupt audio or invitation. */ })
    return () => {
      disposed = true
      clear()
      observer.disconnect()
      unsubscribe()
      reduced.removeEventListener('change', sync)
      document.removeEventListener('visibilitychange', sync)
    }
  }, [ref, dance])
}
