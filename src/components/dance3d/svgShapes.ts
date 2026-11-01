import { Shape } from 'three'

/** Preserve the original chibi's Bezier silhouettes when building beveled 3D meshes. */
export function chibiShapes(path: string, originX: number, originY: number): Shape[] {
  const tokens = path.match(/[a-zA-Z]|-?(?:\d*\.\d+|\d+)(?:e[-+]?\d+)?/g) ?? []
  const shapes: Shape[] = []
  let i = 0, command = '', x = 0, y = 0, startX = 0, startY = 0
  let shape: Shape | undefined
  const point = (px: number, py: number): [number, number] => [(px - originX) / 100, (originY - py) / 100]
  const number = () => { const value = Number(tokens[i++]); if (!Number.isFinite(value)) throw Error('Invalid chibi path'); return value }
  while (i < tokens.length) {
    if (/^[a-z]$/i.test(tokens[i])) command = tokens[i++]
    const relative = command === command.toLowerCase(), type = command.toUpperCase()
    const offsetX = relative ? x : 0, offsetY = relative ? y : 0
    if (type === 'Z') { shape?.closePath(); x = startX; y = startY; command = ''; continue }
    if (type === 'M' || type === 'L') {
      x = number() + offsetX; y = number() + offsetY
      if (type === 'M') {
        shape = new Shape(); shapes.push(shape); shape.moveTo(...point(x, y))
        startX = x; startY = y; command = relative ? 'l' : 'L'
      } else shape?.lineTo(...point(x, y))
    } else if (type === 'C') {
      const a = point(number() + offsetX, number() + offsetY), b = point(number() + offsetX, number() + offsetY)
      x = number() + offsetX; y = number() + offsetY
      shape?.bezierCurveTo(...a, ...b, ...point(x, y))
    } else if (type === 'Q') {
      const control = point(number() + offsetX, number() + offsetY)
      x = number() + offsetX; y = number() + offsetY
      shape?.quadraticCurveTo(...control, ...point(x, y))
    } else throw Error(`Unsupported chibi path command: ${command}`)
  }
  return shapes
}
