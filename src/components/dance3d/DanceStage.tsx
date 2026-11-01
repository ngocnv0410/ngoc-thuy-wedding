import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { DanceId } from '../../content/types'
import type { DanceSceneApi } from './DanceScene'
import { loadMotion3D } from './motion'
import { loadDanceScene } from './preload'
import styles from './DanceStage.module.css'

export function DanceStage({ dance, layout = 'couple', brideFirst = false, fallback, className }: {
  dance: DanceId; layout?: 'couple' | 'hosts'; brideFirst?: boolean; fallback: ReactNode; className?: string
}) {
  const host = useRef<HTMLDivElement>(null)
  const api = useRef<DanceSceneApi | null>(null)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let disposed = false
    const fail = () => { if (host.current) { setReady(false); api.current?.dispose(); api.current = null } }
    Promise.all([loadDanceScene(), loadMotion3D(dance)]).then(([scene, clip]) => {
      if (disposed || !host.current) return
      try {
        if (!api.current) api.current = scene.createDanceScene(host.current, { layout, brideFirst, onFail: fail })
        const current = api.current
        current.setClip(clip)
        if (api.current === current) setReady(true)
      } catch { fail() }
    }).catch(() => { if (!disposed) fail() })
    return () => { disposed = true }
  }, [dance, layout, brideFirst])
  useEffect(() => () => { api.current?.dispose(); api.current = null }, [])
  return <span className={[styles.stage, className].filter(Boolean).join(' ')} data-layout={layout}
    data-dance-3d={dance} data-ready={ready} aria-hidden="true">
    <span className={styles.fallback}>{fallback}</span>
    <div ref={host} className={styles.canvas} />
  </span>
}
