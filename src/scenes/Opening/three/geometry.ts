import { ExtrudeGeometry, Shape, ShapeGeometry, type Texture } from 'three'
import { ENV_H, ENV_W, FLAP_DEPTH, POCKET_V, SEAL_R } from './dimensions'

/** Túi trước: hình chữ nhật khoét chữ V ở mép trên. Gốc toạ độ ở tâm phong bì. */
export function pocketGeometry() {
  const w = ENV_W / 2
  const h = ENV_H / 2
  const shape = new Shape()
  shape.moveTo(-w, h)
  shape.lineTo(0, h - POCKET_V)
  shape.lineTo(w, h)
  shape.lineTo(w, -h)
  shape.lineTo(-w, -h)
  shape.closePath()
  return new ShapeGeometry(shape)
}

/** Nắp: tam giác treo xuống từ bản lề (gốc toạ độ = trung điểm mép trên). */
export function flapGeometry() {
  const shape = new Shape()
  shape.moveTo(-ENV_W / 2, 0)
  shape.lineTo(ENV_W / 2, 0)
  shape.lineTo(0, -FLAP_DEPTH)
  shape.closePath()
  return new ShapeGeometry(shape)
}

/**
 * ShapeGeometry/ExtrudeGeometry lấy UV = toạ độ (x, y) thô. Đặt repeat/offset để texture phủ
 * vừa khung [minX..minX+width] × [minY..minY+height].
 */
export function fitTexture(texture: Texture, minX: number, minY: number, width: number, height: number) {
  texture.repeat.set(1 / width, 1 / height)
  texture.offset.set(-minX / width, -minY / height)
  return texture
}

/** Bán kính viền lượn của dấu sáp (cùng công thức với Seal.tsx). */
function sealRadius(t: number) {
  return (SEAL_R / 50) * (47 + 2.2 * Math.sin(9 * t) + 1.1 * Math.sin(17 * t + 1.3) + 0.6 * Math.sin(29 * t + 0.4))
}

/** Nửa dấu sáp (trái/phải) có độ dày và cạnh vát — hai nửa tách ra khi mở thiệp. */
export function sealHalfGeometry(side: 'left' | 'right') {
  const shape = new Shape()
  const from = side === 'right' ? -Math.PI / 2 : Math.PI / 2
  const steps = 48
  for (let i = 0; i <= steps; i++) {
    const t = from + (i / steps) * Math.PI
    const r = sealRadius(t)
    const x = r * Math.cos(t)
    const y = r * Math.sin(t)
    if (i === 0) shape.moveTo(0, y)
    shape.lineTo(x, y)
  }
  shape.closePath()
  return new ExtrudeGeometry(shape, {
    depth: 0.012,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 2,
    curveSegments: 1,
  })
}
