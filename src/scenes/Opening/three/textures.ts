import { CanvasTexture, SRGBColorSpace } from 'three'
import { CARD_H, CARD_W, ENV_H, ENV_W, FLAP_DEPTH, POCKET_V } from './dimensions'

/*
 * Texture vẽ bằng canvas 2D với chính font của trang (đã có subset tiếng Việt) — chữ trên
 * thẻ và phong bì 3D giống hệt bản 2.5D, không cần tải font/ảnh riêng cho WebGL.
 */

const INK = '#302720'
const TAUPE_INK = '#6b5d50'
const GOLD = '#c6a66b'

/** Pixel trên mỗi đơn vị thế giới. */
const PX = 1000

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

function setLetterSpacing(ctx: CanvasRenderingContext2D, value: string) {
  // `letterSpacing` có từ Chrome 99 / Safari 17; trình duyệt cũ hơn bỏ qua, chữ vẫn đúng.
  ;(ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = value
}

/** Chờ đúng các font + subset tiếng Việt cần cho texture. */
export async function loadTextureFonts(sample: string) {
  if (!document.fonts) return
  await Promise.all([
    document.fonts.load('500 64px "Cormorant Garamond"', sample),
    document.fonts.load('italic 500 64px "Cormorant Garamond"', sample),
    document.fonts.load('500 32px "Be Vietnam Pro"', 'THIỆP MỜI CƯỚI'),
    document.fonts.load('400 64px "Great Vibes"', '&'),
  ])
}

export interface CardText {
  first: string
  second: string
  date: string
}

/** Mặt thẻ thiệp: bản thu nhỏ của bìa (khung chỉ vàng đôi, nhãn, tên, ngày). */
export function cardTexture({ first, second, date }: CardText) {
  const { el, ctx, w, h } = canvas(CARD_W * PX, CARD_H * PX)
  ctx.fillStyle = '#f8f4ec'
  ctx.fillRect(0, 0, w, h)
  grain(ctx, w, h, 6)

  const pad = w * 0.034
  ctx.lineWidth = 2
  ctx.strokeStyle = 'rgba(198, 166, 107, 0.7)'
  ctx.strokeRect(pad, pad, w - pad * 2, h - pad * 2)
  const inner = pad + w * 0.016
  ctx.strokeStyle = 'rgba(198, 166, 107, 0.35)'
  ctx.strokeRect(inner, inner, w - inner * 2, h - inner * 2)

  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  const cx = w / 2

  ctx.fillStyle = TAUPE_INK
  ctx.font = `500 ${w * 0.026}px "Be Vietnam Pro"`
  setLetterSpacing(ctx, `${w * 0.026 * 0.28}px`)
  ctx.fillText('THIỆP MỜI CƯỚI', cx, h * 0.36)

  // Tên: [first] [&] [second], căn giữa theo tổng chiều rộng.
  setLetterSpacing(ctx, '0px')
  const nameFont = `500 ${w * 0.1}px "Cormorant Garamond"`
  const ampFont = `400 ${w * 0.07}px "Great Vibes"`
  const gap = w * 0.024
  ctx.font = nameFont
  const firstW = ctx.measureText(first).width
  const secondW = ctx.measureText(second).width
  ctx.font = ampFont
  const ampW = ctx.measureText('&').width
  let x = cx - (firstW + ampW + secondW + gap * 2) / 2
  const baseline = h * 0.58
  ctx.textAlign = 'left'
  ctx.font = nameFont
  ctx.fillStyle = INK
  ctx.fillText(first, x, baseline)
  x += firstW + gap
  ctx.font = ampFont
  ctx.fillStyle = GOLD
  ctx.fillText('&', x, baseline)
  x += ampW + gap
  ctx.font = nameFont
  ctx.fillStyle = INK
  ctx.fillText(second, x, baseline)

  ctx.textAlign = 'center'
  ctx.font = `500 ${w * 0.036}px "Cormorant Garamond"`
  setLetterSpacing(ctx, `${w * 0.036 * 0.12}px`)
  ctx.fillText(date, cx, h * 0.72)

  return toTexture(el)
}

/** Túi trước: giấy sáng dần về phía trên, nếp chữ V + hai nếp chéo, tên ép chìm. */
export function pocketTexture(names: string) {
  const { el, ctx, w, h } = canvas(ENV_W * PX, ENV_H * PX)
  const gradient = ctx.createLinearGradient(0, 0, w * 0.1, h)
  gradient.addColorStop(0, '#f8f2e8')
  gradient.addColorStop(0.6, '#f1e9db')
  gradient.addColorStop(1, '#ece2d1')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, w, h)
  grain(ctx, w, h, 9)

  ctx.strokeStyle = 'rgba(48, 39, 32, 0.12)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(w / 2, (POCKET_V / ENV_H) * h)
  ctx.lineTo(w, 0)
  ctx.moveTo(0, h)
  ctx.lineTo(w * 0.42, h * 0.6)
  ctx.moveTo(w, h)
  ctx.lineTo(w * 0.58, h * 0.6)
  ctx.stroke()

  // Ép chìm: viền sáng phía dưới, viền tối phía trên, chữ tối nhạt.
  ctx.textAlign = 'center'
  ctx.font = `italic 500 ${w * 0.062}px "Cormorant Garamond"`
  setLetterSpacing(ctx, `${w * 0.062 * 0.12}px`)
  const y = h * 0.86
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)'
  ctx.fillText(names, w / 2, y + 2)
  ctx.fillStyle = 'rgba(48, 39, 32, 0.12)'
  ctx.fillText(names, w / 2, y - 2)
  ctx.fillStyle = 'rgba(48, 39, 32, 0.55)'
  ctx.fillText(names, w / 2, y)

  return toTexture(el)
}

/** Mặt ngoài nắp: giấy sáng phía mép gấp, hai cạnh chéo có nét mảnh. */
export function flapTexture() {
  const { el, ctx, w, h } = canvas(ENV_W * PX, FLAP_DEPTH * PX)
  const gradient = ctx.createLinearGradient(0, 0, 0, h)
  gradient.addColorStop(0, '#fbf7f0')
  gradient.addColorStop(1, '#efe6d6')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, w, h)
  grain(ctx, w, h, 9)
  ctx.strokeStyle = 'rgba(48, 39, 32, 0.14)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(w / 2, h)
  ctx.lineTo(w, 0)
  ctx.stroke()
  return toTexture(el)
}

/** Giấy trơn có hạt (đáy phong bì, mặt trong nắp) — màu nhân với `color` của material. */
export function grainTexture() {
  const { el, ctx, w, h } = canvas(512, 512)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, w, h)
  grain(ctx, w, h, 14)
  return toTexture(el)
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
