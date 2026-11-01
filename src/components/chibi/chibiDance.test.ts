import { describe, expect, it } from 'vitest'
import { dancePose } from './chibiDance'
import reference from './referenceDance.json'

describe('reference-video choreography', () => {
  it('uses the recorded poses at their media timestamps, including after seeking back', () => {
    for (const index of [0, 60, 180, 420, 720]) {
      const pose = dancePose(index / reference.fps)
      expect(parseFloat(pose['--arm-l'])).toBeCloseTo(reference.frames[index][3], 6)
      expect(parseFloat(pose['--elbow-l'])).toBeCloseTo(reference.frames[index][4], 6)
      expect(dancePose(index / reference.fps)).toEqual(pose)
    }
  })
  it('keeps all interpolated channels finite across the entire recording', () => {
    for (let t = 0; t < reference.duration; t += 1 / 120) {
      for (const value of Object.values(dancePose(t))) expect(Number.isFinite(parseFloat(value))).toBe(true)
    }
  })
  it('interpolates continuously between recorded frames and clamps at the edges', () => {
    for (let i = 1; i < reference.frames.length - 1; i += 7) {
      const before = dancePose(i / 30 - 0.00001)
      const after = dancePose(i / 30 + 0.00001)
      for (const key of Object.keys(before)) expect(Math.abs(parseFloat(before[key]) - parseFloat(after[key]))).toBeLessThan(0.1)
    }
    expect(dancePose(-1)).toEqual(dancePose(0))
    expect(dancePose(1000)).toEqual(dancePose((reference.frames.length - 1) / 30))
  })
})

it('keeps articulated bone lengths positive and supports a grounded stance', () => {
  for (const row of reference.frames) {
    for (const length of row.slice(12)) expect(length).toBeGreaterThan(0)
    const radians = (angle: number) => angle * Math.PI / 180
    const left = row[16] * Math.cos(radians(row[7])) + row[17] * Math.cos(radians(row[7] + row[8]))
    const right = row[18] * Math.cos(radians(row[9])) + row[19] * Math.cos(radians(row[9] + row[10]))
    expect(150 + row[1] + Math.max(left, right)).toBeCloseTo(189, 1)
  }
})
