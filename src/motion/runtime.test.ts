import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  heroMotion: vi.fn(),
  guard: vi.fn(),
  stopLight: vi.fn(),
}))

vi.mock('../lib/gsap', () => ({
  MEDIA: { motion: 'motion', fine: 'fine', desktop: 'desktop' },
  ScrollTrigger: { refresh: vi.fn() },
  guard: mocks.guard,
  gsap: {
    matchMedia: () => {
      let cleanup: (() => void) | undefined
      return {
        add: (query: unknown, setup: (context: unknown) => (() => void)) => {
          if (typeof query === 'object') cleanup = setup({ conditions: { motion: true } })
        },
        revert: () => cleanup?.(),
      }
    },
  },
}))
vi.mock('../scenes/Hero/heroMotion', () => ({ heroMotion: mocks.heroMotion }))
vi.mock('../scenes/Details/detailsMotion', () => ({ detailsMotion: vi.fn() }))
vi.mock('../scenes/Countdown/countdownMotion', () => ({ countdownMotion: vi.fn() }))
vi.mock('../scenes/Locations/locationsMotion', () => ({ locationsMotion: vi.fn() }))
vi.mock('../scenes/Gallery/galleryMotion', () => ({ galleryMotion: vi.fn() }))
vi.mock('../scenes/Gift/giftMotion', () => ({ giftMotion: vi.fn(), giftCelebrate: vi.fn() }))
vi.mock('../scenes/Opening/openingMotion', () => ({ openDoors: vi.fn(), introDoors: vi.fn(), openHosts: vi.fn() }))
vi.mock('./light', () => ({ startLight: () => mocks.stopLight }))

function timeline() {
  let paused = false
  return {
    paused: () => paused,
    pause: vi.fn(() => { paused = true }),
    play: vi.fn(() => { paused = false }),
  }
}

describe('opening replay playback', () => {
  let runtime: typeof import('./runtime')
  let opening: HTMLElement | null
  const scene = {} as HTMLElement

  beforeEach(async () => {
    vi.resetModules()
    vi.clearAllMocks()
    opening = {} as HTMLElement
    vi.stubGlobal('document', {
      documentElement: { dataset: {} },
      getElementById: () => opening,
      readyState: 'complete',
    })
    mocks.heroMotion.mockImplementation(timeline)
    mocks.guard.mockImplementation(() => vi.fn())
    runtime = await import('./runtime')
  })

  afterEach(() => vi.unstubAllGlobals())

  it('holds the hero until its own doors reveal it', () => {
    const dispose = runtime.mountScene('hero', scene)
    const hero = mocks.heroMotion.mock.results[0].value
    expect(hero.pause).toHaveBeenCalledWith(0)
    expect(mocks.guard).not.toHaveBeenCalled()
    runtime.releaseHero(opening!)
    expect(hero.play).toHaveBeenCalledOnce()
    expect(mocks.guard).toHaveBeenCalledWith(hero)
    dispose()
    expect(mocks.guard.mock.results[0].value).toHaveBeenCalledOnce()
    expect(mocks.stopLight).toHaveBeenCalledOnce()
  })

  it('holds a replay even after the previous opening completed, ignoring stale callbacks', () => {
    const previousOpening = opening!
    const dispose = runtime.mountScene('hero', scene)
    runtime.releaseHero(previousOpening)
    dispose()
    opening = {} as HTMLElement
    const disposeReplay = runtime.mountScene('hero', scene)
    const replay = mocks.heroMotion.mock.results[1].value
    expect(replay.pause).toHaveBeenCalledWith(0)
    runtime.releaseHero(previousOpening)
    expect(replay.play).not.toHaveBeenCalled()
    runtime.releaseHero(opening)
    expect(replay.play).toHaveBeenCalledOnce()
    disposeReplay()
  })

  it('handles doors revealing before the hero motion finishes loading', () => {
    runtime.releaseHero(opening!)
    const dispose = runtime.mountScene('hero', scene)
    expect(mocks.heroMotion.mock.results[0].value.pause).not.toHaveBeenCalled()
    expect(mocks.guard).toHaveBeenCalledOnce()
    dispose()
  })

  it('plays direct links without waiting for an opening', () => {
    opening = null
    const dispose = runtime.mountScene('hero', scene)
    expect(mocks.heroMotion.mock.results[0].value.pause).not.toHaveBeenCalled()
    expect(mocks.guard).toHaveBeenCalledOnce()
    dispose()
  })
})
