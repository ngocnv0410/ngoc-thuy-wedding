import type { ChibiWho, Side } from './chibiPose'
import { paintedArmJoints } from './approvedRigLayout'

export type Point = readonly [number, number]
const add = (a: Point, b: Point): Point => [a[0] + b[0], a[1] + b[1]]
const sub = (a: Point, b: Point): Point => [a[0] - b[0], a[1] - b[1]]
const mul = (a: Point, n: number): Point => [a[0] * n, a[1] * n]
const length = (a: Point) => Math.hypot(...a)
const unit = (a: Point): Point => mul(a, 1 / (length(a) || 1))
const normal = ([x, y]: Point): Point => [-y, x]
export const clamp01 = (n: number) => Math.max(0, Math.min(1, n))
export const smooth = (n: number) => { const t = clamp01(n); return t * t * (3 - 2 * t) }
const mix = (a: Point, b: Point, t: number): Point => add(mul(a, 1 - t), mul(b, t))
const rotate = ([x, y]: Point, degrees: number): Point => {
  const a = degrees * Math.PI / 180
  return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)]
}
function directionMix(a: Point, b: Point, t: number): Point {
  const start = Math.atan2(a[1], a[0])
  const end = Math.atan2(b[1], b[0])
  const delta = ((end - start + Math.PI * 3) % (Math.PI * 2)) - Math.PI
  return [Math.cos(start + delta * t), Math.sin(start + delta * t)]
}
const num = (n: number) => Math.round(n * 1000) / 1000
const xy = (p: Point) => `${num(p[0])} ${num(p[1])}`

function cubic(a: Point, b: Point, c: Point, d: Point, t: number): Point {
  const s = 1 - t
  return add(add(mul(a, s ** 3), mul(b, 3 * s * s * t)), add(mul(c, 3 * s * t * t), mul(d, t ** 3)))
}

/** A single C1-continuous contour: no overlapping elbow discs or cut image edges. */
function contour(points: Point[], closed = true) {
  if (!points.length) return ''
  let d = `M${xy(points[0])}`
  for (let i = 0; i < points.length - (closed ? 0 : 1); i++) {
    const p0 = points[closed ? (i - 1 + points.length) % points.length : Math.max(0, i - 1)]
    const p1 = points[i]
    const p2 = points[(i + 1) % points.length]
    const p3 = points[closed ? (i + 2) % points.length : Math.min(points.length - 1, i + 2)]
    d += `C${xy(add(p1, mul(sub(p2, p0), 1 / 6)))} ${xy(sub(p2, mul(sub(p3, p1), 1 / 6)))} ${xy(p2)}`
  }
  return d + (closed ? 'Z' : '')
}

function resample(points: Point[], count: number): Point[] {
  const distances = [0]
  for (let i = 1; i < points.length; i++) distances.push(distances[i - 1] + length(sub(points[i], points[i - 1])))
  const total = distances.at(-1) || 1
  return Array.from({ length: count }, (_, index) => {
    const target = total * index / (count - 1)
    let i = 1
    while (i < points.length - 1 && distances[i] < target) i++
    return mix(points[i - 1], points[i], (target - distances[i - 1]) / (distances[i] - distances[i - 1] || 1))
  })
}

/** Index fingers meet at the top and thumbs meet at the bottom of the heart. */
const heartHandCurves: Point[][] = [
  [[-11, 6], [-12, 3], [-12, 0], [-10.5, -3]],
  [[-10.5, -3], [-11, -7], [-7, -10], [-3.5, -8]],
  [[-3.5, -8], [-1.8, -7.5], [0, -6], [0, -4.5]],
  [[0, -4.5], [0, -3], [-1.4, -2.5], [-2.2, -3.7]],
  [[-2.2, -3.7], [-4, -5.7], [-5.7, -5.7], [-6.5, -4]],
  [[-6.5, -4], [-7.7, -1.8], [-5.5, .5], [-3, 2]],
  [[-3, 2], [-2, 2.7], [-1, 3.4], [0, 4]],
  [[0, 4], [1.1, 4.8], [.1, 6.7], [-1.2, 6.2]],
  [[-1.2, 6.2], [-3, 5.4], [-3.8, 5], [-4.5, 4.8]],
  [[-4.5, 4.8], [-6, 4.1], [-6.5, 6.7], [-7, 8]],
]
const heartHand = resample(heartHandCurves.flatMap(c => Array.from({ length: 8 }, (_, i) => cubic(c[0], c[1], c[2], c[3], i / 7))), 76)
for (const contact of [[0, -4.5], [0, 4]] as Point[]) {
  let nearest = 0
  for (let i = 1; i < heartHand.length; i++) if (length(sub(heartHand[i], contact)) < length(sub(heartHand[nearest], contact))) nearest = i
  heartHand[nearest] = contact
}

export function heartPlacement(who: ChibiWho) {
  return { center: [60, who === 'groom' ? 124 : 115] as Point, scale: who === 'groom' ? 1 : .84 }
}

/** Solve with the elbow outside the torso, so folded arms never reverse through the body. */
export function elbowFor(shoulder: Point, wrist: Point, upperLength: number, lowerLength: number, side: Side, relaxed = false): Point {
  const delta = sub(wrist, shoulder)
  const distance = Math.max(.01, Math.min(length(delta), upperLength + lowerLength - .01))
  const along = (upperLength ** 2 - lowerLength ** 2 + distance ** 2) / (2 * distance)
  const height = Math.sqrt(Math.max(0, upperLength ** 2 - along ** 2))
  const direction = unit(delta)
  const center = add(shoulder, mul(direction, along))
  const a = add(center, mul(normal(direction), height))
  const b = sub(center, mul(normal(direction), height))
  if (!relaxed) return side === 'l' ? a : b
  return Math.abs(a[1] - b[1]) < .001 ? (side === 'l' ? a : b) : a[1] > b[1] ? a : b
}

function palmPoints(open: number, radius: number): Point[] {
  const curves: Point[][] = []
  const start: Point = [-radius, 0]
  const thumb: Point = [-radius - 1.1 - open, 2.6]
  curves.push([start, [-radius - 1, -1.6 * open], [-radius - 2.2, -.5], thumb])
  let previous = thumb
  const centers = [-2.5, -.5, 1.5, 3.2]
  const tips = [8, 10.7, 10, 7.8]
  for (let i = 0; i < centers.length; i++) {
    const x = centers[i]
    const y = 6.4 + open * (tips[i] - 6.4)
    const base = 5.6 - open * 1.7
    const left: Point = [x - .68, base]
    const right: Point = [x + .68, base]
    curves.push([previous, mix(previous, left, .6), left, left])
    curves.push([left, [x - .85, y + .65], [x + .85, y + .65], right])
    previous = right
  }
  curves.push([previous, [4.6, 3.5], [radius + .6, 1.5], [radius, 0]])
  const extended = resample(curves.flatMap(c => Array.from({ length: 7 }, (_, i) => cubic(c[0], c[1], c[2], c[3], i / 6))), 76)
  const curled: Point[][] = [
    [[-radius, 0], [-radius - 1.5, 0], [-radius - 1.8, 2], [-radius - .6, 3]],
    [[-radius - .6, 3], [-radius - 1, 6], [-2, 7.5], [0, 7.6]],
    [[0, 7.6], [3, 7.8], [4.2, 5.6], [3.5, 2.8]],
    [[3.5, 2.8], [3, 1], [2.6, 0], [radius, 0]],
  ]
  const closed = resample(curled.flatMap(c => Array.from({ length: 15 }, (_, i) => cubic(c[0], c[1], c[2], c[3], i / 14))), 76)
  return closed.map((p, i) => mix(p, extended[i], open))
}

export interface ArmInput {
  who: ChibiWho
  side: Side
  angle: number
  heart: number
  holding?: boolean
  carrying?: boolean
}

export function armGeometry({ who, side, angle, heart, holding = false, carrying = false }: ArmInput) {
  const groom = who === 'groom'
  const sign = side === 'l' ? 1 : -1
  const joints = paintedArmJoints[who][side]
  const shoulder = joints.shoulder
  const restWrist: Point = groom ? [side === 'l' ? 34 : 86, 144] : [side === 'l' ? 32 : 86, 134]
  const upper = holding ? angle : Math.max(-35, Math.min(angle, angle * .2, 26))
  const lower = holding ? 0 : Math.max(0, angle - upper) + Math.max(-30, Math.min(0, angle)) * .8
  const upperLength = length(sub(joints.elbow, shoulder))
  const lowerLength = length(sub(restWrist, joints.elbow))
  const rotatedElbow = add(shoulder, rotate(sub(joints.elbow, shoulder), upper * sign))
  const naturalForearm = rotate(unit(sub(rotatedElbow, shoulder)), -10 * sign)
  const gestureForearm = rotate(unit(sub(restWrist, joints.elbow)), (upper + lower) * sign)
  const forearmDirection = directionMix(naturalForearm, gestureForearm, Math.max(smooth((angle - 15) / 40), smooth((-angle - 5) / 30)))
  const wrist0: Point = holding ? (groom ? [side === 'r' ? 102 : 18, 129] : [side === 'l' ? 22.5 : 95, 128]) : add(rotatedElbow, mul(forearmDirection, lowerLength))
  const elbow0 = holding ? elbowFor(shoulder, wrist0, upperLength, lowerLength, side, true) : rotatedElbow
  const handDirection0 = holding ? [side === 'l' ? -.5 : .5, .8660254] as Point : unit(rotate(sub(wrist0, elbow0), (carrying ? 0 : Math.max(0, Math.min(35, angle - 95))) * sign))
  const h = smooth(heart)
  const placement = heartPlacement(who)
  const targetWrist = add(placement.center, [sign * -9 * placement.scale, 7 * placement.scale])
  const wrist = mix(wrist0, targetWrist, h)
  const elbow = h > 0 ? elbowFor(shoulder, wrist, upperLength, lowerLength, side) : elbow0
  const handDirection = directionMix(handDirection0, [sign * .4472136, -.8944272], h)
  const wristNormal = normal(handDirection)
  const open = carrying || holding ? 0 : smooth((angle - 70) / 30) * (1 - h)
  const skinRadius = 2.236 * (1 - h + h * placement.scale)
  const genericPalm = palmPoints(open, skinRadius).map(([x, y]) => add(wrist, add(mul(wristNormal, x * (holding ? .85 : 1)), mul(handDirection, y * (holding ? .72 : 1)))))
  const targetPalm = (side === 'l' ? heartHand : [...heartHand].reverse()).map(([x, y]) => add(sub(add(placement.center, [x * sign * placement.scale, y * placement.scale]), targetWrist), wrist))
  const palm = genericPalm.map((p, i) => mix(p, targetPalm[i], h))
  const baseWidth = skinRadius * (holding ? .85 : 1)
  palm[0] = sub(wrist, mul(wristNormal, baseWidth))
  palm[palm.length - 1] = add(wrist, mul(wristNormal, baseWidth))
  // Use the hand's actual two wrist endpoints for the final curve tangent and width.
  const palmStart = palm[0]
  const palmEnd = palm.at(-1)!
  const wristWidth = groom ? 3.55 : length(sub(palmEnd, palmStart)) / 2
  const endNormal = groom ? wristNormal : unit(sub(palmEnd, palmStart))
  const tangent = unit(add(unit(sub(elbow, shoulder)), unit(sub(wrist, elbow))))
  const rounding = Math.min(length(sub(elbow, shoulder)), length(sub(wrist, elbow))) * .26
  const c1 = add(shoulder, mul(sub(elbow, shoulder), .45))
  const c2 = sub(elbow, mul(tangent, rounding))
  const c3 = add(elbow, mul(tangent, rounding))
  const c4 = sub(wrist, mul(handDirection, 3.2))
  const centers: Point[] = []
  const normals: Point[] = []
  const widths: number[] = []
  for (let i = 0; i <= 40; i++) {
    const t = i / 20
    const segment = t <= 1 ? [shoulder, c1, c2, elbow] : [elbow, c3, c4, wrist]
    const u = Math.min(1, t <= 1 ? t : t - 1)
    const center = cubic(segment[0], segment[1], segment[2], segment[3], u)
    const derivative = add(add(mul(sub(segment[1], segment[0]), 3 * (1 - u) ** 2), mul(sub(segment[2], segment[1]), 6 * (1 - u) * u)), mul(sub(segment[3], segment[2]), 3 * u ** 2))
    centers.push(center)
    normals.push(i === 40 ? endNormal : normal(unit(derivative)))
    widths.push(t <= 1 ? (groom ? 4.6 - .25 * smooth(t) : 3.05 + .25 * smooth(t)) : (groom ? 4.35 : 3.3) * (1 - smooth(u)) + wristWidth * smooth(u))
  }
  const left = centers.map((p, i) => sub(p, mul(normals[i], widths[i])))
  const right = centers.map((p, i) => add(p, mul(normals[i], widths[i]))).reverse()
  if (!groom) { left[left.length - 1] = palmStart; right[0] = palmEnd }
  const shoulderCap = sub(shoulder, mul(unit(sub(elbow, shoulder)), groom ? 4.5 : 3))
  const sleevePath = contour([...left, ...right, shoulderCap])
  const skinPath = groom ? contour(palm) : contour([...left, ...palm.slice(1, -1), ...right, shoulderCap])
  const cuffNormal = normal(handDirection)
  const cuffPath = contour([
    sub(sub(wrist, mul(handDirection, 1.3)), mul(cuffNormal, 3.7)),
    sub(add(wrist, mul(handDirection, .8)), mul(cuffNormal, 3.4)),
    add(add(wrist, mul(handDirection, .8)), mul(cuffNormal, 3.4)),
    add(sub(wrist, mul(handDirection, 1.3)), mul(cuffNormal, 3.7)),
  ])
  const heldPoint = add(wrist, mul(handDirection, 4))
  return {
    shoulder, elbow, wrist, palmStart, palmEnd, palm, centers,
    segments: [[shoulder, c1, c2, elbow], [elbow, c3, c4, wrist]] as const,
    sleevePath, skinPath, cuffPath,
    highlight: contour(centers.slice(2, -3), false),
    heldTransform: `translate(${xy([heldPoint[0], heldPoint[1] - 11])})`,
    heartCenter: placement.center,
  }
}
