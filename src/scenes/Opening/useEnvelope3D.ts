import { type ComponentType, type RefObject, useCallback, useEffect, useRef, useState } from 'react'
import { canUse3D, forced3D } from '../../lib/capabilities'
import type { Envelope3DApi, Envelope3DProps } from './three/Envelope3D'

/** Chunk 3D phải sẵn sàng trong khoảng này kể từ khi overlay hiện; quá hạn thì giữ 2.5D. */
const READY_MS = 2500
/** Phong bì 2.5D xuất hiện xong lúc ~1.8s — chỉ đổi sang 3D khi nó đã nằm yên. */
const SETTLED_MS = 1900

/**
 * Nâng cấp phong bì 2.5D lên 3D (React Three Fiber) cho máy đủ mạnh. Bản 2.5D luôn hiện trước
 * và là fallback: không đạt ngưỡng thiết bị, tải chậm, khách đã bấm mở, hay mất WebGL context
 * đều giữ / quay về 2.5D.
 */
export function useEnvelope3D(started: RefObject<boolean>) {
  const [Component, setComponent] = useState<ComponentType<Envelope3DProps> | null>(null)
  const [active, setActive] = useState(false)
  const api = useRef<Envelope3DApi | null>(null)
  const expired = useRef(false)
  const mountedAt = useRef(0)

  useEffect(() => {
    if (!canUse3D()) return
    mountedAt.current = performance.now()
    const timer = forced3D()
      ? undefined
      : window.setTimeout(() => {
          if (api.current) return
          expired.current = true
          setComponent(null)
        }, READY_MS)
    import('./three/Envelope3D')
      .then((module) => {
        if (!expired.current) setComponent(() => module.default)
      })
      .catch(() => {})
    return () => window.clearTimeout(timer)
  }, [])

  const discard = useCallback(() => {
    api.current = null
    setActive(false)
    setComponent(null)
  }, [])

  const onReady = useCallback(
    (ready: Envelope3DApi) => {
      if (expired.current || started.current) {
        discard()
        return
      }
      api.current = ready
      const wait = Math.max(0, SETTLED_MS - (performance.now() - mountedAt.current))
      window.setTimeout(() => {
        // Khách đã bấm mở trong lúc chờ: animation 2.5D đang chạy, không đổi giữa chừng.
        if (started.current || api.current !== ready) return
        ready.refit()
        setActive(true)
        ready.startIdle()
      }, wait)
    },
    [discard, started],
  )

  return { Component, active, api, onReady, discard }
}
