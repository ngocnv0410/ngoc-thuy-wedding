import { useEffect, useRef } from 'react'
import styles from './OpeningAtmosphere.module.css'

const TAU = Math.PI * 2
const clamp = (v: number) => Math.max(0, Math.min(1, v))
const ease = (v: number) => 1 - Math.pow(1 - clamp(v), 3)

/** Two fine streams of foil light complement the botanical corners of the paper gate. */
export function OpeningAtmosphere({ opening }: { opening: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const openingAt = useRef(0)
  useEffect(() => { openingAt.current = opening ? performance.now() : 0 }, [opening])
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d', { alpha: true })
    if (!canvas || !ctx) return
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0, width = 0, height = 0, viewportWidth = 0, viewportHeight = 0, offsetX = 0, offsetY = 0, seed = 52037
    const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 }
    const particles = Array.from({ length: 2000 }, (_, i) => ({
      u: random(), offset: (random() + random() + random() - 1.5), top: i % 2 === 0,
      depth: random(), phase: random() * TAU, speed: 0.6 + random() * 0.8,
      size: 0.4 + Math.pow(random(), 3) * 1.65, glint: i % 89 === 0, near: i % 19 === 0,
    }))
    const sprite = document.createElement('canvas'); sprite.width = sprite.height = 40
    const pen = sprite.getContext('2d')!
    const glow = pen.createRadialGradient(20, 20, 0, 20, 20, 20)
    glow.addColorStop(0, '#fffef7'); glow.addColorStop(0.1, '#fff5d5')
    glow.addColorStop(0.35, 'rgba(224,191,123,.2)'); glow.addColorStop(1, 'rgba(224,191,123,0)')
    pen.fillStyle = glow; pen.fillRect(0, 0, 40, 40)
    const resize = () => {
      viewportWidth = canvas.clientWidth; viewportHeight = canvas.clientHeight
      const style = getComputedStyle(canvas)
      const artWidth = Number(style.getPropertyValue('--opening-art-width')) || 852
      const artHeight = Number(style.getPropertyValue('--opening-art-height')) || 1847
      const fit = Math.min(viewportWidth / artWidth, viewportHeight / artHeight)
      width = artWidth * fit; height = artHeight * fit
      offsetX = (viewportWidth - width) / 2; offsetY = (viewportHeight - height) / 2
      const ratio = Math.min(devicePixelRatio || 1, 1.5)
      canvas.width = Math.round(viewportWidth * ratio); canvas.height = Math.round(viewportHeight * ratio)
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    }
    const observer = new ResizeObserver(resize); observer.observe(canvas); resize()
    const star = (x: number, y: number, r: number, alpha: number) => {
      ctx.globalAlpha = alpha
      ctx.drawImage(sprite, x - r * 4, y - r * 4, r * 8, r * 8)
      ctx.beginPath(); ctx.moveTo(x, y - r * 3)
      ctx.quadraticCurveTo(x + r * 0.12, y - r * 0.15, x + r * 2, y)
      ctx.quadraticCurveTo(x + r * 0.12, y + r * 0.15, x, y + r * 3)
      ctx.quadraticCurveTo(x - r * 0.12, y + r * 0.15, x - r * 2, y)
      ctx.quadraticCurveTo(x - r * 0.12, y - r * 0.15, x, y - r * 3)
      ctx.fillStyle = '#fffdf1'; ctx.fill(); ctx.strokeStyle = 'rgba(170,128,57,.55)'; ctx.lineWidth = 0.5; ctx.stroke()
    }
    const comet = (p: number) => {
      const t = clamp(p)
      return { x: width * (0.96 * (1 - t) ** 2 + 2 * 0.5 * t * (1 - t) + 0.5 * t * t),
        y: height * (0.055 * (1 - t) ** 2 + 2 * 0.08 * t * (1 - t) + 0.5 * t * t) }
    }
    const draw = (now: number) => {
      frame = 0
      if (motion.matches || document.hidden) { ctx.clearRect(0, 0, viewportWidth, viewportHeight); return }
      const time = now / 1000
      const elapsed = openingAt.current ? (now - openingAt.current) / 1000 : -1
      const release = elapsed < 0 ? 0 : ease((elapsed - 0.5) / 3.8)
      const fade = 1 - release
      ctx.clearRect(0, 0, viewportWidth, viewportHeight)
      ctx.save(); ctx.translate(offsetX, offsetY)
      for (const p of particles) {
        const u = (p.u + time * 0.016 * p.speed) % 1
        const scatter = p.offset * (0.008 + 0.015 * p.depth)
        let x = width * (p.top ? 0.43 + u * 0.55 : 0.02 + u * 0.54)
        let y = height * (p.top ? 0.035 + 0.09 * Math.sin(u * Math.PI) + scatter : 0.87 + 0.085 * Math.sin(u * Math.PI * 0.9) + scatter)
        x += (width / 2 - x) * release * 0.65
        y += (height / 2 - y) * release * 0.42
        const twinkle = 0.18 + 0.82 * Math.pow((Math.sin(time * p.speed * 1.9 + p.phase) + 1) / 2, 2)
        const alpha = twinkle * (0.35 + p.depth * 0.6) * fade
        const size = p.size * (0.6 + p.depth * 0.6)
        const halo = p.near ? 4.5 : 3
        ctx.globalAlpha = alpha
        ctx.drawImage(sprite, x - size * halo, y - size * halo, size * halo * 2, size * halo * 2)
        ctx.fillStyle = '#a77e38'; ctx.fillRect(x, y, Math.max(0.85, size * 0.7), Math.max(0.85, size * 0.7))
        if (p.glint) star(x, y, 1.5 + twinkle * 1.5, Math.min(1, alpha * 1.6))
      }
      if (elapsed >= 0 && elapsed < 4.1) {
        const progress = ease(elapsed / 1.05)
        const intensity = clamp(elapsed * 4) * (1 - clamp((elapsed - 1.25) / 1.2))
        for (let j = 47; j >= 0; j--) {
          const position = comet(Math.max(0, progress - j * 0.006))
          ctx.globalAlpha = intensity * Math.pow(1 - j / 48, 2) * 0.65
          ctx.drawImage(sprite, position.x - 5, position.y - 5, 10, 10)
          if (j > 0) {
            const next = comet(Math.max(0, progress - (j - 1) * 0.006))
            ctx.globalAlpha = intensity * Math.pow(1 - j / 48, 2) * 0.5
            ctx.beginPath(); ctx.moveTo(position.x, position.y); ctx.lineTo(next.x, next.y)
            ctx.strokeStyle = '#bd9445'; ctx.lineWidth = 0.75; ctx.stroke()
          }
        }
        const head = comet(progress); star(head.x, head.y, 3.2, intensity)
        if (elapsed > 0.9) {
          const expansion = ease((elapsed - 0.9) / 2.5)
          const alpha = (1 - expansion) * 0.8
          const radius = width * (0.1 + expansion * 0.9)
          const halo = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, radius)
          halo.addColorStop(0, `rgba(255,249,224,${alpha * 0.65})`); halo.addColorStop(1, 'rgba(255,243,210,0)')
          ctx.globalAlpha = 1; ctx.fillStyle = halo; ctx.fillRect(0, 0, width, height)
          for (let i = 0; i < 100; i++) {
            const lane = i % 2 ? -1 : 1
            const u = (i / 100 + expansion * 0.45) % 1
            const x = width / 2 + lane * width * expansion * (0.08 + u * 0.54)
            const y = height / 2 + Math.sin(u * Math.PI * 1.5) * height * expansion * 0.14
            ctx.globalAlpha = alpha * (0.2 + u * 0.65)
            ctx.drawImage(sprite, x - 4, y - 4, 8, 8)
            ctx.fillStyle = '#bd964f'; ctx.fillRect(x, y, 0.8, 0.8)
          }
        }
      }
      ctx.globalAlpha = 1
      ctx.restore()
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
