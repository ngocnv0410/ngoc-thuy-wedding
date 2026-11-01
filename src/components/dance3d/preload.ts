import { loadMotion3D } from './motion'

let runtime: ReturnType<typeof importScene> | undefined
function importScene() { return import('./DanceScene') }
export function loadDanceScene() {
  return runtime ??= importScene().catch(error => { runtime = undefined; throw error })
}

interface NetworkHints { saveData?: boolean; effectiveType?: string }
export function shouldPreloadDance(connection?: NetworkHints): boolean {
  return !connection?.saveData && !/^(slow-2g|2g)$/.test(connection?.effectiveType ?? '')
}

/** Sequential idle tasks: the invitation paints first; never prefetch the MP3 recordings. */
export function scheduleDancePreload(): () => void {
  const nav = navigator as Navigator & { connection?: NetworkHints }
  if (!shouldPreloadDance(nav.connection)) return () => {}
  let disposed = false, queued = false, busy = false, cancelIdle = () => {}, timer = 0
  const tasks = [() => loadDanceScene(), () => loadMotion3D('ateez-bad'), () => loadMotion3D('bang-bang-bang')]
  const next = () => {
    if (disposed || queued || busy || document.hidden || !tasks.length) return
    queued = true
    const work = () => {
      queued = false
      if (disposed || document.hidden) return
      const task = tasks.shift()
      if (task) {
        busy = true
        task().catch(() => {}).finally(() => { busy = false; if (!disposed) next() })
      }
    }
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(work, { timeout: 4000 })
      cancelIdle = () => window.cancelIdleCallback(id)
    } else {
      timer = window.setTimeout(work, 600)
      cancelIdle = () => window.clearTimeout(timer)
    }
  }
  const visible = () => { if (!document.hidden) next() }
  // Give content, fonts and the opening animation time to appear before warming the 3D cache.
  timer = window.setTimeout(next, 1800)
  document.addEventListener('visibilitychange', visible)
  return () => {
    disposed = true
    window.clearTimeout(timer)
    cancelIdle()
    document.removeEventListener('visibilitychange', visible)
  }
}
