/**
 * Nhạc nền: không bao giờ tự phát. Chỉ phát khi khách bấm (cú chạm "Mở thiệp" khi đã chọn
 * "Mở kèm nhạc", hoặc nút nhạc) — đủ điều kiện user-gesture của trình duyệt.
 * Âm lượng tăng/giảm dần; iOS bỏ qua `volume` nên ở đó nhạc bật/tắt ngay.
 */
type Listener = () => void

const TARGET_VOLUME = 0.6
const FADE_IN_MS = 2000
const FADE_OUT_MS = 600

class MusicPlayer {
  private audio: HTMLAudioElement | undefined
  private src = ''
  private fadeFrame = 0
  private listeners = new Set<Listener>()
  playing = false

  configure(src: string) {
    this.src = src
  }

  subscribe = (listener: Listener) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getPlaying = () => this.playing

  private emit() {
    this.listeners.forEach((listener) => listener())
  }

  private setPlaying(value: boolean) {
    if (this.playing === value) return
    this.playing = value
    this.emit()
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

  /** Phải được gọi đồng bộ trong trình xử lý cú bấm của khách. */
  play() {
    if (!this.src) return
    if (!this.audio) {
      this.audio = new Audio(this.src)
      this.audio.loop = true
      this.audio.preload = 'auto'
    }
    this.audio.volume = 0
    this.setPlaying(true)
    this.audio
      .play()
      .then(() => this.fade(TARGET_VOLUME, FADE_IN_MS))
      .catch(() => this.setPlaying(false))
  }

  pause() {
    this.setPlaying(false)
    this.fade(0, FADE_OUT_MS, () => this.audio?.pause())
  }

  toggle() {
    if (this.playing) this.pause()
    else this.play()
  }

  private suspended = false

  /** Video kỷ niệm bắt đầu phát: tạm dừng nhạc nền (nhớ để bật lại). */
  suspend() {
    if (!this.playing) return
    this.suspended = true
    this.pause()
  }

  /** Video dừng/kết thúc: bật lại nhạc nếu trước đó đang phát. */
  resume() {
    if (!this.suspended) return
    this.suspended = false
    this.play()
  }
}

export const music = new MusicPlayer()
