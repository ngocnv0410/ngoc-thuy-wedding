import { useEffect, useRef } from 'react'
import styles from './OpeningAtmosphere.module.css'

const TAU = Math.PI * 2
const clamp = (v: number) => Math.max(0, Math.min(1, v))

/** Layered, ribbon-shaped champagne stardust, rendered on one lightweight canvas. */
export function OpeningAtmosphere({ opening }: { opening: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const openingAt = useRef(0)
  useEffect(() => { openingAt.current = opening ? performance.now() : 0 }, [opening])
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d', { alpha: true })
    if (!canvas || !ctx) return
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0, width = 0, height = 0, seed = 42712
    const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 }
    const particles = Array.from({ length: 2400 }, (_, i) => ({
      x: random(), depth: random(), edge: random(), top: i % 2 === 0,
      phase: random() * TAU, speed: 0.2 + random() * 0.6,
      size: 0.2 + Math.pow(random(), 4) * 1.3,
      glint: i % 327 === 0,
    }))
    const sprite = document.createElement('canvas'); sprite.width = sprite.height = 32
    const pen = sprite.getContext('2d')!
    const glow = pen.createRadialGradient(16, 16, 0, 16, 16, 16)
    glow.addColorStop(0, '#fffef5'); glow.addColorStop(0.12, '#fff6cf')
    glow.addColorStop(0.3, 'rgba(255,241,207,.24)'); glow.addColorStop(1, 'rgba(214,174,99,0)')
    pen.fillStyle = glow; pen.fillRect(0, 0, 32, 32)
    const resize = () => {
      width = canvas.clientWidth; height = canvas.clientHeight
      const ratio = Math.min(devicePixelRatio || 1, 1.5)
      canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio)
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    }
    const observer = new ResizeObserver(resize); observer.observe(canvas); resize()
    const star = (x: number, y: number, radius: number, alpha: number) => {
      ctx.globalAlpha = alpha
      ctx.drawImage(sprite, x - radius * 2.5, y - radius * 2.5, radius * 5, radius * 5)
      ctx.beginPath(); ctx.moveTo(x - radius * 3, y); ctx.lineTo(x + radius * 3, y)
      ctx.moveTo(x, y - radius * 4); ctx.lineTo(x, y + radius * 4)
      ctx.strokeStyle = '#fff8dc'; ctx.lineWidth = 0.65; ctx.stroke()
    }
    const draw = (now: number) => {
      frame = 0
      if (motion.matches || document.hidden) { ctx.clearRect(0, 0, width, height); return }
      const time = now / 1000
      const elapsed = openingAt.current ? (now - openingAt.current) / 1000 : -1
      const release = elapsed < 0 ? 0 : clamp(elapsed / 2.5)
      const fade = 1 - release
      ctx.clearRect(0, 0, width, height)
      ctx.globalCompositeOperation = 'source-over'
      // A soft bronze vignette gives the minute particles depth against ivory paper.
      const veil = ctx.createLinearGradient(0, 0, 0, height)
      veil.addColorStop(0, `rgba(65,49,34,${0.76 * fade})`)
      veil.addColorStop(0.12, `rgba(101,76,47,${0.22 * fade})`)
      veil.addColorStop(0.3, 'rgba(101,76,47,0)')
      veil.addColorStop(0.68, 'rgba(101,76,47,0)')
      veil.addColorStop(0.89, `rgba(101,76,47,${0.25 * fade})`)
      veil.addColorStop(1, `rgba(65,49,34,${0.8 * fade})`)
      ctx.fillStyle = veil; ctx.globalAlpha = 1; ctx.fillRect(0, 0, width, height)
      ctx.globalCompositeOperation = 'lighter'
      for (const p of particles) {
        let x = ((p.x + Math.sin(time * p.speed * 0.13 + p.phase) * 0.012 + 1) % 1) * width
        const wave = Math.sin(p.x * 7 + time * 0.24) * 0.018 + Math.cos(p.x * 11 - time * 0.15) * 0.009
        const band = Math.pow(p.edge, 1.8) * 0.17
        let y = (p.top ? band + wave : 1 - band + wave) * height
        x += (x - width / 2) * release * 0.7
        y += (p.top ? -1 : 1) * release * height * 0.12
        const twinkle = 0.28 + 0.72 * Math.pow((Math.sin(time * p.speed * 2 + p.phase) + 1) / 2, 2)
        const alpha = twinkle * (0.5 + p.depth * 0.5) * fade
        const size = p.size * (0.65 + p.depth * 0.8)
        ctx.globalAlpha = alpha
        ctx.drawImage(sprite, x - size * 2.5, y - size * 2.5, size * 5, size * 5)
        ctx.fillStyle = '#fff9e7'; ctx.fillRect(x, y, Math.max(0.45, size * 0.62), Math.max(0.45, size * 0.62))
        if (p.glint) star(x, y, 2 + twinkle * 1.6, alpha * 0.85)
      }
      if (elapsed >= 0 && elapsed < 2.6) {
        const travel = clamp(elapsed / 0.65)
        const cy = height * (0.12 + 0.38 * (1 - Math.pow(1 - travel, 3)))
        const beamAlpha = clamp(elapsed * 5) * (1 - clamp((elapsed - 0.65) / 1.1))
        const beam = ctx.createLinearGradient(0, cy - height * 0.3, 0, cy)
        beam.addColorStop(0, 'rgba(255,240,192,0)'); beam.addColorStop(1, `rgba(255,247,214,${beamAlpha})`)
        ctx.globalAlpha = 1; ctx.fillStyle = beam; ctx.fillRect(width / 2 - 0.6, cy - height * 0.3, 1.2, height * 0.3)
        star(width / 2, cy, 3.5 + Math.sin(travel * Math.PI) * 3, beamAlpha)
        if (elapsed > 0.45) {
          const burst = clamp((elapsed - 0.45) / 1.85)
          const halo = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width * (0.12 + burst * 0.65))
          halo.addColorStop(0, `rgba(255,244,209,${0.58 * (1 - burst)})`); halo.addColorStop(1, 'rgba(255,234,174,0)')
          ctx.fillStyle = halo; ctx.globalAlpha = 1; ctx.fillRect(0, 0, width, height)
          for (let i = 0; i < 160; i++) {
            const angle = i * 2.39996
            const distance = Math.sqrt((i + 1) / 160) * width * burst * 1.1
            const x = width / 2 + Math.cos(angle) * distance
            const y = height / 2 + Math.sin(angle) * distance * 1.25
            ctx.globalAlpha = Math.pow(1 - burst, 2) * (0.4 + (i % 5) * 0.12)
            ctx.drawImage(sprite, x - 3, y - 3, 6, 6)
          }
        }
      }
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1
      frame = requestAnimationFrame(draw)
    }
    const resume = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(draw) }
    motion.addEventListener('change', resume); document.addEventListener('visibilitychange', resume); resume()
    return () => { cancelAnimationFrame(frame); observer.disconnect(); motion.removeEventListener('change', resume); document.removeEventListener('visibilitychange', resume) }
  }, [])
  return <div className={styles.atmosphere} data-opening-atmosphere data-phase={opening ? 'opening' : 'idle'} aria-hidden="true">
    <canvas ref={canvasRef} className={styles.canvas} />
  </div>
}
