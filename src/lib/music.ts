/** Background piano starts only after a guest's explicit choice. */
type Listener = () => void
interface MusicState {
  playing: boolean
  wanted: boolean
  requested: boolean
  loading: boolean
  error: boolean
}
const TARGET_VOLUME = 0.35
const FADE_IN_MS = 2000
const FADE_OUT_MS = 600

export class MusicPlayer {
  private audio: HTMLAudioElement | undefined
  private src = ''
  private fadeFrame = 0
  private intent = 0
  private suspended = false
  private listeners = new Set<Listener>()
  private state: MusicState = { playing: false, wanted: false, requested: false, loading: false, error: false }

  configure(src: string) { this.src = src }
  get playing() { return this.state.playing }
  getPlaying = () => this.state.playing
  getSnapshot = () => this.state
  subscribe = (listener: Listener) => {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  private update(patch: Partial<MusicState>) {
    if (Object.entries(patch).every(([key, value]) => this.state[key as keyof MusicState] === value)) return
    this.state = { ...this.state, ...patch }
    this.listeners.forEach((listener) => listener())
  }

  private ensureAudio() {
    if (!this.src) return
    if (this.audio) return this.audio
    // Setting preload before src avoids downloading music on the first page load.
    const audio = this.audio = new Audio()
    audio.preload = 'none'
    audio.loop = true
    audio.volume = 0
    audio.src = this.src
    audio.addEventListener('play', () => this.update({ wanted: true, requested: true, error: false }))
    audio.addEventListener('playing', () => {
      this.update({ playing: true, loading: false, error: false })
      this.fade(TARGET_VOLUME, FADE_IN_MS)
    })
    audio.addEventListener('pause', () => {
      ++this.intent
      cancelAnimationFrame(this.fadeFrame)
      this.update({ wanted: false, playing: false, loading: false })
    })
    audio.addEventListener('waiting', () => {
      if (this.state.wanted) this.update({ loading: true })
    })
    audio.addEventListener('canplay', () => this.update({ loading: false }))
    audio.addEventListener('error', () => {
      ++this.intent
      cancelAnimationFrame(this.fadeFrame)
      this.update({ playing: false, wanted: false, loading: false, error: true })
    })
    return audio
  }

  /** Native controls and the floating button operate the same persistent audio element. */
  mountControls(container: HTMLElement, title: string): () => void {
    const audio = this.ensureAudio()
    if (!audio) return () => {}
    audio.controls = true
    audio.setAttribute('aria-label', title)
    container.append(audio)
    return () => audio.remove()
  }

  private fade(to: number, ms: number, done?: () => void) {
    const audio = this.audio
    if (!audio) return
    cancelAnimationFrame(this.fadeFrame)
    const from = audio.volume
    const start = performance.now()
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / ms)
      audio.volume = from + (to - from) * t
      if (t < 1) this.fadeFrame = requestAnimationFrame(step)
      else done?.()
    }
    this.fadeFrame = requestAnimationFrame(step)
  }

  /** Preload when “Mở kèm nhạc” is selected; this does not start playback. */
  prepare() {
    const audio = this.ensureAudio()
    if (!audio || (this.state.requested && !this.state.error)) return
    audio.preload = 'auto'
    this.update({ requested: true, loading: audio.readyState < 2, error: false })
    audio.load()
  }

  /** Call synchronously inside the guest's click/tap, including on iPhone. */
  play() {
    const audio = this.ensureAudio()
    if (!audio) return
    if (this.playing && !audio.paused) return
    const intent = ++this.intent
    cancelAnimationFrame(this.fadeFrame)
    // Resume during the short fade-out without waiting for a new 'playing' event.
    if (!audio.paused && audio.readyState >= 2) {
      this.update({ wanted: true, playing: true, loading: false, error: false })
      this.fade(TARGET_VOLUME, FADE_IN_MS)
      return
    }
    if (this.state.error) audio.load()
    audio.volume = 0
    this.update({ wanted: true, requested: true, loading: audio.readyState < 2, error: false })
    audio.play().catch(() => {
      // A cancelled, older play() promise must not overwrite a later user choice.
      if (intent === this.intent) this.update({ playing: false, wanted: false, loading: false, error: true })
    })
  }

  pause() {
    ++this.intent
    const wasPlaying = this.playing
    this.update({ wanted: false, playing: false, loading: false })
    cancelAnimationFrame(this.fadeFrame)
    if (wasPlaying) this.fade(0, FADE_OUT_MS, () => this.audio?.pause())
    else this.audio?.pause()
  }

  toggle() {
    if (this.state.wanted || this.playing) this.pause()
    else this.play()
  }

  suspend() {
    if (!this.state.wanted && !this.playing) return
    this.suspended = true
    this.pause()
  }

  resume() {
    if (!this.suspended) return
    this.suspended = false
    this.play()
  }
}

export const music = new MusicPlayer()
