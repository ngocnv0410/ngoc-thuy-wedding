import { describe, expect, it } from 'vitest'
import sharp from 'sharp'
import { readFileSync } from 'node:fs'
import { armGeometry, heartPlacement, type Point } from './armGeometry'
import { paintedArmJoints } from './approvedRigLayout'
import { chibiVars } from './chibiPose'
import { VIEW_H, VIEW_W } from './chibiArt'

const distance = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1])
const WHO = ['groom', 'bride'] as const
const SIDES = ['l', 'r'] as const

describe('continuous 2D limbs and heart gesture', () => {
  it('keeps the relaxed clasp reachable and the two hands touching at the actual CSS spacing', () => {
    for (const who of WHO) for (const side of SIDES) {
      const g = armGeometry({ who, side, angle: who === 'groom' ? 50 : 28, heart: 0, holding: true })
      const joints = paintedArmJoints[who][side]
      const wrist: Point = who === 'groom' ? [side === 'l' ? 34 : 86, 144] : [side === 'l' ? 32 : 86, 134]
      expect(distance(g.shoulder, g.elbow)).toBeCloseTo(distance(joints.shoulder, joints.elbow), 5)
      expect(distance(g.elbow, g.wrist)).toBeCloseTo(distance(joints.elbow, wrist), 5)
    }
    const css = readFileSync(new URL('./Chibi.module.css', import.meta.url), 'utf8')
    const overlap = Number(css.match(/\.couple\s*>\s*\.chibi\s*\+\s*\.chibi\s*\{[^}]*?\*\s*(-[\d.]+)/)?.[1])
    expect(Number.isFinite(overlap)).toBe(true)
    const lean = parseFloat((chibiVars({ who: 'bride', lean: true }) as Record<string, string>)['--pose-lean-x'])
    const offset = VIEW_W + VIEW_H * overlap + lean
    const a = armGeometry({ who: 'groom', side: 'r', angle: 50, heart: 0, holding: true }).palm
    const b = armGeometry({ who: 'bride', side: 'l', angle: 28, heart: 0, holding: true }).palm.map(([x, y]) => [x + offset, y] as Point)
    expect(Math.min(...a.flatMap(p => b.map(q => distance(p, q))))).toBeLessThan(.5)
  })
  it('keeps bone lengths stable and avoids elbow flips throughout the heart transition', () => {
    for (const who of WHO) for (const side of SIDES) {
      const joints = paintedArmJoints[who][side]
      const restWrist: Point = who === 'groom' ? [side === 'l' ? 34 : 86, 144] : [side === 'l' ? 32 : 86, 134]
      let previous = armGeometry({ who, side, angle: 6, heart: 0 })
      for (let i = 1; i <= 200; i++) {
        const next = armGeometry({ who, side, angle: 6, heart: i / 200 })
        expect(distance(next.shoulder, next.elbow)).toBeCloseTo(distance(joints.shoulder, joints.elbow), 5)
        expect(distance(next.elbow, next.wrist)).toBeCloseTo(distance(joints.elbow, restWrist), 5)
        expect(distance(next.elbow, previous.elbow)).toBeLessThan(.6)
        expect(distance(next.wrist, previous.wrist)).toBeLessThan(.6)
        expect(distance([(next.palmStart[0] + next.palmEnd[0]) / 2, (next.palmStart[1] + next.palmEnd[1]) / 2], next.wrist)).toBeLessThan(.000001)
        expect(distance(next.palmStart, next.palmEnd)).toBeGreaterThan(3.7)
        previous = next
      }
    }
  })

  it('joins each wrist to its palm and brings both index fingers and thumbs together', () => {
    for (const who of WHO) {
      const placement = heartPlacement(who)
      const palms = SIDES.map(side => armGeometry({ who, side, angle: 6, heart: 1 }).palm)
      for (const y of [-4.5, 4]) {
        const target: Point = [placement.center[0], placement.center[1] + y * placement.scale]
        for (const palm of palms) expect(Math.min(...palm.map(p => distance(p, target)))).toBeLessThan(.3)
      }
    }
  })

  it('has a smooth tangent through the elbow at intermediate wave and heart poses', () => {
    for (const who of WHO) for (const side of SIDES) for (const angle of [-55, 6, 50, 95, 128, 138]) for (const heart of [0, .25, .5, .75, 1]) {
      const g = armGeometry({ who, side, angle, heart })
      expect(g.skinPath + g.sleevePath).not.toMatch(/NaN|Infinity/)
      const u = [g.segments[0][3][0] - g.segments[0][2][0], g.segments[0][3][1] - g.segments[0][2][1]]
      const v = [g.segments[1][1][0] - g.segments[1][0][0], g.segments[1][1][1] - g.segments[1][0][1]]
      expect((u[0] * v[0] + u[1] * v[1]) / Math.hypot(...u) / Math.hypot(...v)).toBeCloseTo(1, 8)
    }
  })

  it('rasterizes as one connected surface with no detached wrist or elbow fragments', async () => {
    for (const who of WHO) for (const side of SIDES) for (const [angle, heart] of [[6, 0], [128, 0], [-55, 0], [6, .35], [6, .7], [6, 1]]) {
      const g = armGeometry({ who, side, angle, heart })
      const paths = (who === 'groom' ? [g.sleevePath, g.skinPath, g.cuffPath] : [g.skinPath]).map(d => `<path d="${d}" fill="black"/>`).join('')
      const { data, info } = await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="240" height="400" viewBox="0 0 120 200">${paths}</svg>`)).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
      const visited = new Uint8Array(info.width * info.height)
      let components = 0
      for (let index = 0; index < visited.length; index++) {
        if (visited[index] || data[index * 4 + 3] < 80) continue
        let area = 0
        const queue = [index]
        visited[index] = 1
        for (let k = 0; k < queue.length; k++) {
          const p = queue[k]
          area++
          for (const n of [p - 1, p + 1, p - info.width, p + info.width]) {
            if (n < 0 || n >= visited.length || visited[n] || data[n * 4 + 3] < 80) continue
            visited[n] = 1
            queue.push(n)
          }
        }
        if (area >= 5) components++
      }
      expect(components, `${who} ${side} ${angle} ${heart}`).toBe(1)
    }
  })
})
