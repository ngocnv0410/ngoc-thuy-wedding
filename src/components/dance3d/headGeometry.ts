import { BufferGeometry, Float32BufferAttribute } from 'three'
import profiles from '../../assets/chibi/approved/head-profiles.json'

/** Closed volume follows the portrait's silhouette. Front and back meet along one seam. */
export function approvedHeadGeometry(bride: boolean): BufferGeometry {
  const source = profiles[bride ? 'bride' : 'groom']
  const unit = 1.03 / Math.max(profiles.groom.height, profiles.bride.height)
  const width = source.width * unit, height = source.height * unit
  const positions: number[] = [], uv: number[] = [], indices: number[] = []
  const slices = 64, rows = source.rows.length
  for (let row = 0; row < rows; row++) {
    const bounds = source.rows[row] ?? [.5, .5]
    const mid = (bounds[0] + bounds[1]) / 2, radius = Math.max(0, (bounds[1] - bounds[0]) / 2 - .012)
    const y = (1 - row / (rows - 1)) * height - .025
    // The chin is rounded; the nose/cheeks project forward while hair stays continuous.
    const depth = Math.min(.17, radius * width * .42)
    for (let slice = 0; slice <= slices; slice++) {
      const angle = slice / slices * Math.PI * 2
      const u = mid + radius * Math.cos(angle)
      const front = Math.sin(angle)
      positions.push((u - .5) * width, y, depth * front)
      uv.push(u, 1 - row / (rows - 1))
    }
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new Float32BufferAttribute(uv, 2))
  for (const back of [false, true]) {
    const start = indices.length
    for (let row = 0; row < rows - 1; row++) for (let slice = back ? slices / 2 : 0; slice < (back ? slices : slices / 2); slice++) {
      const a = row * (slices + 1) + slice, b = a + slices + 1
      indices.push(a, a + 1, b, a + 1, b + 1, b)
    }
    geometry.addGroup(start, indices.length - start, back ? 1 : 0)
  }
  geometry.setIndex(indices); geometry.computeVertexNormals()
  return geometry
}
