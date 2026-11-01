type Point = { x: number; y: number }
const midpoint = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })
const coord = (p: Point) => `${p.x.toFixed(3)} ${p.y.toFixed(3)}`

/** One tapered ribbon around a rounded elbow/knee, with no internal joint outline. */
export function limbOutline(upper: number, lower: number, bend: number, width: number, wrist: number) {
  const radians = bend * Math.PI / 180
  const direction = { x: -Math.sin(radians), y: Math.cos(radians) }
  const elbow = { x: 0, y: upper }
  const radius = Math.min(upper * .28, lower * .28, width * 1.5)
  const before = { x: 0, y: upper - radius }
  const after = { x: direction.x * radius, y: upper + direction.y * radius }
  const end = { x: direction.x * lower, y: upper + direction.y * lower }
  const samples = [{ point: { x: 0, y: 0 }, tangent: { x: 0, y: 1 } }, { point: before, tangent: { x: 0, y: 1 } }]
  for (let i = 1; i <= 8; i++) {
    const t = i / 8, u = 1 - t
    samples.push({
      point: { x: u * u * before.x + 2 * u * t * elbow.x + t * t * after.x, y: u * u * before.y + 2 * u * t * elbow.y + t * t * after.y },
      tangent: { x: u * (elbow.x - before.x) + t * (after.x - elbow.x), y: u * (elbow.y - before.y) + t * (after.y - elbow.y) },
    })
  }
  samples.push({ point: end, tangent: direction })
  const left: Point[] = [], right: Point[] = []
  let distance = 0
  const distances = samples.map(({ point }, i) => {
    if (i) distance += Math.hypot(point.x - samples[i - 1].point.x, point.y - samples[i - 1].point.y)
    return distance
  })
  samples.forEach(({ point, tangent }, i) => {
    const length = Math.max(.0001, Math.hypot(tangent.x, tangent.y))
    const w = width + (wrist - width) * distances[i] / Math.max(.001, distance)
    const nx = tangent.y / length * w, ny = -tangent.x / length * w
    left.push({ x: point.x - nx, y: point.y - ny })
    right.push({ x: point.x + nx, y: point.y + ny })
  })
  const side = (points: Point[]) => points.slice(1, -1).map((p, i) => `Q${coord(p)} ${coord(midpoint(p, points[i + 2]))}`).join(' ') + `L${coord(points[points.length - 1])}`
  const tip = { x: end.x + direction.x * wrist, y: end.y + direction.y * wrist }
  const reverse = right.toReversed()
  return `M${coord(left[0])} ${side(left)}Q${coord(tip)} ${coord(reverse[0])} ${side(reverse)}Q0 ${-width} ${coord(left[0])}Z`
}
