// [DANCE-SWAP] Fit source wrists to a chibi head without stretching the existing arm lengths.
import { Matrix4, Vector3 } from 'three'

const source = new Vector3(), origin = new Vector3(), candidate = new Vector3(), best = new Vector3(), cameraRay = new Vector3(), worldCandidate = new Vector3()
// [DANCE-SWAP] A measured, pose-dependent gown envelope; hand clearance is included.
export interface GownEnvelope { minY: number; maxY: number; x: number; z: number; rx: number; rz: number; padding?: number }
export function fitWristInFrontOfHead(
  shoulder: Vector3, wrist: Vector3, minReach: number, maxReach: number,
  headWorld: Matrix4, headInverse: Matrix4, center: Vector3, radii: Vector3, result: Vector3, gown?: GownEnvelope,
): boolean {
  source.copy(wrist).applyMatrix4(headInverse).sub(center)
  // [DANCE-SWAP] The unchanged scene looks along world -Z; solve visibility toward its +Z viewer,
  // including head yaw/pitch rather than assuming that the head always faces the camera.
  cameraRay.set(0, 0, 1).transformDirection(headInverse)
  const rx = 1 / radii.x ** 2, ry = 1 / radii.y ** 2, rz = 1 / radii.z ** 2
  const a = cameraRay.x ** 2 * rx + cameraRay.y ** 2 * ry + cameraRay.z ** 2 * rz
  const obstruction = (point: Vector3) => {
    const b = 2 * (point.x * cameraRay.x * rx + point.y * cameraRay.y * ry + point.z * cameraRay.z * rz)
    const c = point.x ** 2 * rx + point.y ** 2 * ry + point.z ** 2 * rz - 1
    const discriminant = b * b - 4 * a * c
    return discriminant <= 0 ? 0 : Math.max(0, (-b + Math.sqrt(discriminant)) / (2 * a))
  }
  // [DANCE-SWAP] The gown widens toward the hem; preserve high gestures instead of pushing hands down.
  const gownContact = (p: Vector3): number | undefined => {
    if (!gown) return undefined
    const padding = gown.padding ?? .10
    if (p.y > gown.maxY + padding || p.y < gown.minY - padding) return undefined
    const t = Math.max(0, Math.min(1, (p.y - gown.minY) / (gown.maxY - gown.minY)))
    const shape = .30 + .70 * (1 - t) ** .9
    const rx = gown.rx * shape + padding, rz = gown.rz * shape + padding
    const x = (p.x - gown.x) / rx
    if (Math.abs(x) >= 1) return undefined
    const halfDepth = rz * Math.sqrt(1 - x * x)
    if (Math.abs(p.z - gown.z) >= halfDepth) return undefined
    return gown.z + (p.z < gown.z ? -halfDepth : halfDepth)
  }
  if (obstruction(source) <= 0 && gownContact(wrist) === undefined) { result.copy(wrist); return false }
  origin.copy(shoulder).applyMatrix4(headInverse).sub(center)
  const side = origin.x < 0 ? -1 : 1
  let cost = Infinity, bestX = 0, bestY = 0
  // [DANCE-SWAP] Choose the smallest reachable correction, then refine below one millimeter.
  // Head padding includes palm/fingers; projecting just the wrist onto the face was insufficient.
  const consider = (x: number, y: number) => {
    if (x < 0) return
    candidate.copy(source); candidate.x += side * x; candidate.y -= y
    const blocked = obstruction(candidate)
    if (blocked > 0) candidate.addScaledVector(cameraRay, blocked + .002)
    if (gown) {
      worldCandidate.copy(candidate).add(center).applyMatrix4(headWorld)
      const boundary = gownContact(worldCandidate)
      if (boundary !== undefined) worldCandidate.z = boundary + (boundary < gown.z ? -.002 : .002)
      candidate.copy(worldCandidate).applyMatrix4(headInverse).sub(center)
    }
    // [DANCE-SWAP] Back-side clearance must not reintroduce a head collision.
    if (obstruction(candidate) > .00001) return
    const reach = candidate.distanceTo(origin)
    if (reach < minReach || reach > maxReach) return
    const distance = candidate.distanceToSquared(source) + 4 * (candidate.y - source.y) ** 2
    if (distance < cost) { best.copy(candidate); cost = distance; bestX = x; bestY = y }
  }
  // [DANCE-SWAP] A single downward/outward route avoids switching between two equally close cheek-side solutions.
  if (!gown) {
    let previous = 0
    for (let step = 0; step <= 90; step++) {
      const amount = step * .006
      consider(amount * .35, amount)
      if (Number.isFinite(cost)) {
        let low = previous, high = amount
        for (let k = 0; k < 12; k++) {
          const mid = (low + high) / 2, before = cost
          consider(mid * .35, mid)
          if (cost < before) high = mid
          else low = mid
        }
        break
      }
      previous = amount
    }
  } else for (let x = 0; x <= 40; x++) for (let y = -20; y <= 24; y++) consider(x * .018, y * .018)
  if (gown && Number.isFinite(cost)) for (const step of [.006, .002, .0006666667]) {
    const x = bestX, y = bestY
    for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 2; dy++) consider(x + dx * step, y + dy * step)
  }
  if (!Number.isFinite(cost)) { result.copy(wrist); return false }
  result.copy(best).add(center).applyMatrix4(headWorld)
  return true
}
