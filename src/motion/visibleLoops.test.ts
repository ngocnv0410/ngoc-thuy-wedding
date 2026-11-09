import { afterEach, describe, expect, it, vi } from 'vitest'

const context = vi.hoisted(() => ({ dispose: undefined as undefined | (() => void) }))
vi.mock('../lib/gsap', () => ({ gsap: { context: (setup: () => () => void) => { context.dispose = setup() } } }))
import { visibleLoops } from './visibleLoops'

afterEach(() => { vi.unstubAllGlobals(); context.dispose = undefined })

describe('decorative loop lifecycle', () => {
  it('gates opening, viewport and background playback, and cleans up on replay', () => {
    let intersect: (entries: { isIntersecting: boolean }[]) => void = () => {}
    let mutation = () => {}
    const events = new Map<string, () => void>()
    const stopIntersection = vi.fn(), stopMutation = vi.fn()
    const root = { dataset: { opening: 'on' } }
    const doc = { hidden: false, documentElement: root,
      addEventListener: (name: string, fn: () => void) => events.set(name, fn),
      removeEventListener: (name: string) => events.delete(name) }
    vi.stubGlobal('document', doc)
    vi.stubGlobal('IntersectionObserver', class {
      constructor(callback: typeof intersect) { intersect = callback }
      observe() {} disconnect = stopIntersection
    })
    vi.stubGlobal('MutationObserver', class {
      constructor(callback: () => void) { mutation = callback }
      observe() {} disconnect = stopMutation
    })
    const loop = { play: vi.fn(), pause: vi.fn(), kill: vi.fn() }
    visibleLoops({} as Element, [loop as unknown as Parameters<typeof visibleLoops>[1][number]])
    intersect([{ isIntersecting: true }])
    expect(loop.play).not.toHaveBeenCalled()
    delete (root.dataset as { opening?: string }).opening
    mutation()
    expect(loop.play).toHaveBeenCalledOnce()
    doc.hidden = true
    events.get('visibilitychange')!()
    expect(loop.pause).toHaveBeenCalledTimes(2)
    doc.hidden = false
    events.get('visibilitychange')!()
    intersect([{ isIntersecting: false }])
    expect(loop.pause).toHaveBeenCalledTimes(3)
    context.dispose!()
    expect(stopIntersection).toHaveBeenCalledOnce()
    expect(stopMutation).toHaveBeenCalledOnce()
    expect(loop.kill).toHaveBeenCalledOnce()
    expect(events.size).toBe(0)
  })
})
