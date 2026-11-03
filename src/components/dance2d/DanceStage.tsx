import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { DanceId } from '../../content/types'
import { music } from '../../lib/music'
import { frameAt, frameRect, type SpriteClip } from './frames'
import styles from './DanceStage.module.css'

export function DanceStage({ dance, layout = 'couple', brideFirst = false, fallback, className }: {
  dance: DanceId; layout?: 'couple' | 'hosts'; brideFirst?: boolean; fallback: ReactNode; className?: string
}) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const element = canvas.current!
    const context = element.getContext('2d')
    if (!context) return
    const abort = new AbortController()
    const base = `${import.meta.env.BASE_URL}dance/${dance}/`
    const images = new Map<string, ImageBitmap>()
    const pending = new Map<string, Promise<void>>()
    const failed = new Set<string>()
    let clip: SpriteClip | undefined, disposed = false, visible = true, raf = 0, last = -1
    let desired = new Set<string>()
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    setReady(false)
    const active = () => visible && !document.hidden && !element.closest('[inert]')
    const request = (name: string) => {
      if (images.has(name) || pending.has(name) || failed.has(name)) return
      const promise = fetch(base + name, { signal: abort.signal }).then(r => {
        if (!r.ok) throw new Error('Atlas unavailable')
        return r.blob()
      }).then(createImageBitmap).then(image => {
        if (disposed || !desired.has(name)) image.close()
        else images.set(name, image)
      }).catch(() => { failed.add(name) }).finally(() => {
        pending.delete(name)
        if (!disposed && images.has(name)) wake()
      })
      pending.set(name, promise)
    }
    const draw = () => {
      raf = 0
      if (disposed || !clip || !active()) return
      const frame = frameAt(clip, reduced.matches ? 0 : music.currentTime)
      const rect = frameRect(clip, frame)
      const who = brideFirst ? ['bride','groom'] as const : ['groom','bride'] as const
      const next = (rect.atlas + 1) % clip.actors.bride.length
      desired = new Set(who.flatMap(actor => [clip!.actors[actor][rect.atlas], clip!.actors[actor][next]]))
      for (const [name, image] of images) if (!desired.has(name)) { image.close(); images.delete(name) }
      for (const name of desired) request(name)
      const actors = who.map(actor => images.get(clip!.actors[actor][rect.atlas]))
      if (actors.every(Boolean)) {
        if (last !== frame) {
          context.clearRect(0,0,element.width,element.height)
          actors.forEach((image, i) => context.drawImage(image!, rect.x, rect.y, clip!.width, clip!.height, i * 256, 0, 256, 384))
          last = frame
          element.dataset.frame = String(frame)
        }
        setReady(true)
      } else { setReady(false); last = -1 }
      if (music.advancing && !reduced.matches) raf = requestAnimationFrame(draw)
    }
    function wake() { if (!disposed && !raf && active()) raf = requestAnimationFrame(draw) }
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; wake() })
    observer.observe(element)
    const opening = new MutationObserver(wake)
    opening.observe(document.documentElement, { attributes:true, attributeFilter:['data-opening'] })
    const unsubscribe = music.subscribe(wake)
    document.addEventListener('visibilitychange',wake)
    reduced.addEventListener('change',wake)
    fetch(base+'manifest.json',{signal:abort.signal}).then(r => { if(!r.ok) throw new Error('Manifest unavailable'); return r.json() }).then(data => {
      if(disposed) return
      clip=data; wake()
    }).catch(() => { /* Keep fallback and music controls. */ })
    return () => {
      disposed=true; abort.abort(); cancelAnimationFrame(raf); unsubscribe(); observer.disconnect(); opening.disconnect()
      document.removeEventListener('visibilitychange',wake); reduced.removeEventListener('change',wake)
      images.forEach(image => image.close()); images.clear()
    }
  },[dance,brideFirst])
  return <span className={[styles.stage,className].filter(Boolean).join(' ')} data-layout={layout} data-dance-2d={dance} data-ready={ready} aria-hidden="true">
    <span className={styles.fallback}>{fallback}</span>
    <canvas ref={canvas} width={512} height={384} className={styles.canvas}/>
  </span>
}
