import { CanvasTexture, SRGBColorSpace, type Texture } from 'three'
import { ART_W, NAME, RELIEF, RING, artBox, mirrorX, nameSize } from '../doorArt'

/*
 * Texture vẽ bằng canvas 2D với chính font của trang (đã có subset tiếng Việt) và cùng hoạ tiết
 * với bản 2.5D (doorArt) — cửa 3D giống hệt cửa 2.5D, không cần tải font/ảnh riêng cho WebGL.
 */

function canvas(width: number, height: number) {
  const el = document.createElement('canvas')
  el.width = Math.round(width)
  el.height = Math.round(height)
  const ctx = el.getContext('2d')!
  return { el, ctx, w: el.width, h: el.height }
}

function toTexture(el: HTMLCanvasElement) {
  const texture = new CanvasTexture(el)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

/** Hạt giấy: điểm sáng/tối ngẫu nhiên (seed cố định) phủ rất nhẹ. */
function grain(ctx: CanvasRenderingContext2D, w: number, h: number, strength = 10) {
  const image = ctx.getImageData(0, 0, w, h)
  let seed = 11
  for (let i = 0; i < image.data.length; i += 4) {
    seed = (seed * 16807) % 2147483647
    const n = ((seed / 2147483647) - 0.5) * strength
    image.data[i] += n
    image.data[i + 1] += n
    image.data[i + 2] += n
  }
  ctx.putImageData(image, 0, 0)
}

/** Chờ đúng các font + subset tiếng Việt cần cho texture. */
export async function loadTextureFonts(sample: string) {
  if (!document.fonts) return
  await Promise.all([
    document.fonts.load('400 64px "Great Vibes"', `${sample}&`),
    document.fonts.load('500 64px "Cormorant Garamond"', sample),
  ])
}

export interface DoorTextures {
  map: Texture
  normal: Texture
}

const BLUSH = '#ecdccf'
const RELIEF_FACE = '#f3e9e0'

/** Đặt hệ toạ độ của khung hoạ tiết (doorArt) lên canvas cánh cửa; `mirror` soi gương nội dung. */
function setArtSpace(ctx: CanvasRenderingContext2D, w: number, h: number, mirror: boolean) {
  const box = artBox(w, h)
  ctx.setTransform(box.scale, 0, 0, box.scale, box.x, box.y)
  if (mirror) ctx.transform(-1, 0, 0, 1, ART_W, 0)
  return box
}

function drawRelief(ctx: CanvasRenderingContext2D, color: string) {
  ctx.fillStyle = color
  ctx.strokeStyle = color
  ctx.lineCap = 'round'
  for (const relief of RELIEF) {
    const path = new Path2D(relief.d)
    if (relief.stroke) {
      ctx.lineWidth = relief.stroke
      ctx.stroke(path)
    } else {
      ctx.fill(path)
    }
  }
}

/** Tên + vòng nắm (không soi gương chữ: toạ độ x tự đổi theo cánh). */
function drawMetal(ctx: CanvasRenderingContext2D, name: string, mirror: boolean, fill: string | CanvasGradient) {
  const x = (value: number) => (mirror ? mirrorX(value) : value)
  ctx.fillStyle = fill
  ctx.strokeStyle = fill
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.font = `400 ${nameSize(name)}px "Great Vibes"`
  ctx.fillText(name, NAME.x, NAME.y)
  ctx.beginPath()
  ctx.arc(x(RING.x), RING.y - RING.r + 4, RING.plate, 0, Math.PI * 2)
  ctx.fill()
  ctx.lineWidth = 4.5
  ctx.beginPath()
  ctx.arc(x(RING.x), RING.y + RING.r * 0.6, RING.r, 0, Math.PI * 2)
  ctx.stroke()
}

/** Bản đồ độ cao (trắng = nổi) → normal map tangent-space (texture lật trục y khi tải lên GPU). */
function normalFromHeight(source: HTMLCanvasElement, strength: number) {
  const { el, ctx, w, h } = canvas(source.width, source.height)
  const height = source.getContext('2d')!.getImageData(0, 0, w, h).data
  const out = ctx.createImageData(w, h)
  const at = (x: number, y: number) => height[(Math.min(h - 1, Math.max(0, y)) * w + Math.min(w - 1, Math.max(0, x))) * 4] / 255
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength
      const length = Math.hypot(dx, dy, 1)
      const i = (y * w + x) * 4
      out.data[i] = ((-dx / length) * 0.5 + 0.5) * 255
      out.data[i + 1] = ((dy / length) * 0.5 + 0.5) * 255
      out.data[i + 2] = ((1 / length) * 0.5 + 0.5) * 255
      out.data[i + 3] = 255
    }
  }
  ctx.putImageData(out, 0, 0)
  const texture = new CanvasTexture(el)
  texture.anisotropy = 4
  return texture
}

/**
 * Mặt một cánh cửa (w × h pixel): giấy hồng phấn, nắng xiên góc trên trái, mép khe tối hơn,
 * hoa văn + tên ép kim + vòng nắm; kèm normal map để hoa văn nổi thật dưới ánh sáng 3D.
 */
export function doorTextures(side: 'left' | 'right', name: string, width: number, height: number): DoorTextures {
  const mirror = side === 'right'
  const { el, ctx, w, h } = canvas(width, height)

  ctx.fillStyle = BLUSH
  ctx.fillRect(0, 0, w, h)
  const sunX = mirror ? 0 : w * 0.1
  const sun = ctx.createRadialGradient(sunX, 0, 0, sunX, 0, Math.max(w, h) * 0.75)
  sun.addColorStop(0, `rgba(255, 250, 244, ${mirror ? 0.45 : 0.7})`)
  sun.addColorStop(1, 'rgba(255, 250, 244, 0)')
  ctx.fillStyle = sun
  ctx.fillRect(0, 0, w, h)
  const seam = ctx.createLinearGradient(mirror ? w : 0, 0, mirror ? 0 : w, 0)
  seam.addColorStop(0.82, 'rgba(120, 92, 72, 0)')
  seam.addColorStop(1, `rgba(120, 92, 72, ${mirror ? 0.1 : 0.14})`)
  ctx.fillStyle = seam
  ctx.fillRect(0, 0, w, h)
  grain(ctx, w, h, 8)
  // Mép khe cửa: chỉ tối ở cánh trái, chỉ sáng ở cánh phải (như bản 2.5D).
  ctx.fillStyle = mirror ? 'rgba(255, 250, 244, 0.6)' : 'rgba(120, 92, 72, 0.35)'
  ctx.fillRect(mirror ? 0 : w - 2, 0, 2, h)

  const box = setArtSpace(ctx, w, h, mirror)
  drawRelief(ctx, RELIEF_FACE)
  ctx.setTransform(box.scale, 0, 0, box.scale, box.x, box.y)
  const gold = ctx.createLinearGradient(NAME.x - 120, NAME.y - 80, NAME.x + 120, NAME.y + 80)
  gold.addColorStop(0, '#a8823f')
  gold.addColorStop(0.35, '#e8d3a2')
  gold.addColorStop(0.6, '#b8955a')
  gold.addColorStop(1, '#d9bd84')
  drawMetal(ctx, name, mirror, gold)

  // Độ cao: hoa văn nổi tròn cạnh (làm mờ), tên và vòng nắm nổi như nhau.
  const relief = canvas(width, height)
  relief.ctx.fillStyle = '#000'
  relief.ctx.fillRect(0, 0, w, h)
  relief.ctx.filter = `blur(${(box.scale * 1.3).toFixed(2)}px)`
  setArtSpace(relief.ctx, w, h, mirror)
  drawRelief(relief.ctx, '#fff')
  relief.ctx.setTransform(box.scale, 0, 0, box.scale, box.x, box.y)
  drawMetal(relief.ctx, name, mirror, '#fff')

  return { map: toTexture(el), normal: normalFromHeight(relief.el, 3.6 * box.scale) }
}

/** Mặt dấu sáp: sáp vàng loang, hai vòng ép, monogram nổi. */
export function sealTexture(monogram: string) {
  const { el, ctx, w, h } = canvas(512, 512)
  const c = w / 2
  const wax = ctx.createRadialGradient(c * 0.76, c * 0.64, 0, c, c, c)
  wax.addColorStop(0, '#dcc28f')
  wax.addColorStop(0.55, '#c6a66b')
  wax.addColorStop(1, '#9c7e45')
  ctx.fillStyle = wax
  ctx.fillRect(0, 0, w, h)
  grain(ctx, w, h, 12)

  const press = ctx.createRadialGradient(c, c, c * 0.5, c, c, c * 0.68)
  press.addColorStop(0, 'rgba(0,0,0,0)')
  press.addColorStop(1, 'rgba(90, 69, 35, 0.35)')
  ctx.fillStyle = press
  ctx.beginPath()
  ctx.arc(c, c, c * 0.68, 0, Math.PI * 2)
  ctx.fill()
  ctx.lineWidth = 4
  ctx.strokeStyle = 'rgba(243, 230, 200, 0.55)'
  ctx.stroke()
  ctx.lineWidth = 2
  ctx.strokeStyle = 'rgba(125, 98, 50, 0.35)'
  ctx.beginPath()
  ctx.arc(c, c, c * 0.61, 0, Math.PI * 2)
  ctx.stroke()

  const [left, right] = monogram.split('&').map((part) => part.trim())
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const draw = (fill: string, dy: number) => {
    ctx.fillStyle = fill
    if (right === undefined) {
      ctx.font = `500 ${w * 0.2}px "Cormorant Garamond"`
      ctx.fillText(monogram, c, c + dy)
      return
    }
    ctx.font = `500 ${w * 0.2}px "Cormorant Garamond"`
    ctx.fillText(left, c - w * 0.15, c + dy)
    ctx.fillText(right, c + w * 0.15, c + dy)
    ctx.font = `400 ${w * 0.17}px "Great Vibes"`
    ctx.fillText('&', c, c + dy + w * 0.01)
  }
  draw('rgba(241, 226, 191, 0.5)', 3)
  draw('rgba(90, 69, 35, 0.85)', 0)

  return toTexture(el)
}

/** Quầng sáng sau khe cửa: dải sáng ấm theo chiều dọc, tan dần ra hai bên. */
export function glowTexture() {
  const { el, ctx, w, h } = canvas(256, 512)
  const gradient = ctx.createRadialGradient(w / 2, h * 0.46, 0, w / 2, h * 0.46, h * 0.5)
  gradient.addColorStop(0, 'rgba(255, 248, 232, 0.95)')
  gradient.addColorStop(1, 'rgba(255, 240, 214, 0)')
  ctx.setTransform(0.5, 0, 0, 1, w / 4, 0)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, w * 2, h)
  return toTexture(el)
}
