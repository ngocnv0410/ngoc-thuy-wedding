import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MusicPlayer } from './music'

class FakeAudio extends EventTarget {
  src = ''
  preload = ''
  loop = false
  controls = false
  volume = 1
  readyState = 0
  currentTime = 0
  duration = 180
  ended = false
  paused = true
  load = vi.fn()
  setAttribute = vi.fn()
  remove = vi.fn()
  play = vi.fn(() => {
    this.paused = false
    this.dispatchEvent(new Event('play'))
    return Promise.resolve()
  })
  pause = vi.fn(() => {
    if (this.paused) return
    this.paused = true
    this.dispatchEvent(new Event('pause'))
  })
  start() {
    this.paused = false
    this.readyState = 4
    this.dispatchEvent(new Event('playing'))
  }
}

describe('background piano', () => {
  let player: MusicPlayer
  let audio: FakeAudio
  let constructor: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] })
    audio = new FakeAudio()
    constructor = vi.fn(function () { return audio })
    vi.stubGlobal('Audio', constructor)
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => setTimeout(() => callback(performance.now()), 16))
    vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id))
    player = new MusicPlayer()
    player.configure('audio/canon-in-d-piano.mp3')
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('mounts one looping audio element without autoplaying or preloading it', () => {
    const container = { append: vi.fn() } as unknown as HTMLElement
    const unmount = player.mountControls(container, 'Canon in D')
    expect(constructor).toHaveBeenCalledOnce()
    expect(container.append).toHaveBeenCalledWith(audio)
    expect(audio.preload).toBe('none')
    expect(audio.loop).toBe(true)
    expect(audio.controls).toBe(true)
    expect(audio.play).not.toHaveBeenCalled()
    expect(audio.load).not.toHaveBeenCalled()
    unmount()
    player.mountControls(container, 'Canon in D')
    expect(constructor).toHaveBeenCalledOnce()
    expect(audio.pause).not.toHaveBeenCalled()
  })

  it('prepares music once after the guest selects the music option, without playing', () => {
    player.prepare()
    player.prepare()
    expect(audio.preload).toBe('auto')
    expect(audio.load).toHaveBeenCalledOnce()
    expect(audio.play).not.toHaveBeenCalled()
    expect(player.getSnapshot()).toMatchObject({ wanted: false, playing: false, requested: true })
  })

  it('only marks playback active after the media starts, fading to a quiet volume', () => {
    player.play()
    expect(player.getSnapshot()).toMatchObject({ wanted: true, playing: false })
    audio.start()
    expect(player.getPlaying()).toBe(true)
    vi.advanceTimersByTime(2100)
    expect(audio.volume).toBeCloseTo(0.35)
  })

  it('fades out before pausing, then resumes at the current playback position', () => {
    player.play()
    audio.start()
    vi.advanceTimersByTime(2100)
    player.pause()
    expect(player.getPlaying()).toBe(false)
    expect(audio.pause).not.toHaveBeenCalled()
    vi.advanceTimersByTime(650)
    expect(audio.pause).toHaveBeenCalledOnce()
    expect(audio.volume).toBe(0)
  })

  it('keeps volume valid when an already queued frame predates the fade', () => {
    let frame: FrameRequestCallback = () => {}
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      frame = callback
      return 1
    })
    player.play()
    audio.start()
    frame(performance.now() - 8)
    expect(audio.volume).toBe(0)
  })

  it('keeps audio audible when the guest resumes during a fade-out', () => {
    player.play()
    audio.start()
    vi.advanceTimersByTime(2100)
    player.pause()
    vi.advanceTimersByTime(100)
    player.play()
    vi.advanceTimersByTime(2100)
    expect(audio.pause).not.toHaveBeenCalled()
    expect(audio.play).toHaveBeenCalledOnce()
    expect(audio.volume).toBeCloseTo(0.35)
    expect(player.getPlaying()).toBe(true)
  })

  it('cancels a pending start without reporting its rejected promise as a playback failure', async () => {
    let rejectStart: (error: Error) => void = () => {}
    audio.play.mockImplementationOnce(() => {
      audio.paused = false
      return new Promise<void>((_, reject) => { rejectStart = reject })
    })
    player.play()
    player.toggle()
    rejectStart(new Error('AbortError'))
    await Promise.resolve()
    expect(audio.pause).toHaveBeenCalledOnce()
    expect(player.getSnapshot()).toMatchObject({ wanted: false, playing: false, error: false })
  })

  it('reports a genuine start failure and lets the guest retry', async () => {
    audio.play.mockRejectedValueOnce(new Error('NotAllowedError'))
    player.play()
    await Promise.resolve()
    expect(player.getSnapshot()).toMatchObject({ playing: false, wanted: false, loading: false, error: true })
    player.play()
    expect(audio.load).toHaveBeenCalledOnce()
    audio.start()
    expect(player.getSnapshot()).toMatchObject({ playing: true, error: false })
  })

  it('reflects playback and pause from the native controls', () => {
    player.prepare()
    audio.play()
    audio.start()
    expect(player.getSnapshot()).toMatchObject({ wanted: true, playing: true })
    audio.pause()
    expect(player.getSnapshot()).toMatchObject({ wanted: false, playing: false })
  })

  it('suspends for a video and only resumes if the guest had wanted music', () => {
    player.suspend()
    player.resume()
    expect(audio.play).not.toHaveBeenCalled()
    player.play()
    audio.start()
    player.suspend()
    vi.advanceTimersByTime(650)
    expect(audio.pause).toHaveBeenCalledOnce()
    player.resume()
    expect(audio.play).toHaveBeenCalledTimes(2)
  })

  it('waits for metadata, starts at 15 seconds and resumes without resetting the position', () => {
    player.configure('audio/alternate.mp3', 15)
    player.play()
    expect(audio.currentTime).toBe(0)
    audio.readyState = 1
    audio.dispatchEvent(new Event('loadedmetadata'))
    expect(audio.currentTime).toBe(15)
    audio.start()
    audio.currentTime = 42
    player.pause()
    vi.advanceTimersByTime(650)
    player.play()
    expect(audio.currentTime).toBe(42)
  })

  it('loops an offset track from 15 seconds and does not restart after a user pause', () => {
    player.configure('audio/alternate.mp3', 15)
    player.play()
    audio.start()
    expect(audio.loop).toBe(false)
    audio.currentTime = 180
    audio.ended = true
    audio.pause()
    audio.dispatchEvent(new Event('ended'))
    expect(audio.currentTime).toBe(15)
    expect(audio.play).toHaveBeenCalledTimes(2)
    audio.ended = false
    player.pause()
    vi.advanceTimersByTime(650)
    audio.dispatchEvent(new Event('ended'))
    expect(audio.play).toHaveBeenCalledTimes(2)
  })

  it('keeps snapshots stable until an actual playback-state change', () => {
    const snapshot = player.getSnapshot()
    player.configure('audio/canon-in-d-piano.mp3')
    expect(player.getSnapshot()).toBe(snapshot)
    player.play()
    expect(player.getSnapshot()).not.toBe(snapshot)
  })
})
