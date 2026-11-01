import { describe, expect, it } from 'vitest'
import { dancePose } from './chibiDance'
import reference from './referenceDance.json'

describe('reference-video choreography', () => {
  it('keeps the source gestures and deterministically follows seeks', () => {
    for (let index = 0; index < reference.frames.length; index += 3) {
      const pose = dancePose(index / reference.fps)
      for (const [key, channel] of [['--arm-l', 3], ['--elbow-l', 4], ['--arm-r', 5], ['--elbow-r', 6]] as const) {
        expect(Math.abs(parseFloat(pose[key]) - reference.frames[index][channel])).toBeLessThan(18)
      }
      expect(dancePose(index / reference.fps)).toEqual(pose)
    }
  })
  it('reduces high-frequency acceleration changes in the tracked joints', () => {
    let raw = 0, filtered = 0
    for (const [key, channel] of [['--arm-l', 3], ['--elbow-l', 4], ['--arm-r', 5], ['--elbow-r', 6]] as const) {
      const sample = (index: number) => parseFloat(dancePose(index / 30)[key])
      for (let i = 2; i < reference.frames.length - 2; i++) {
        raw += (reference.frames[i - 1][channel] - 2 * reference.frames[i][channel] + reference.frames[i + 1][channel]) ** 2
        filtered += (sample(i - 1) - 2 * sample(i) + sample(i + 1)) ** 2
      }
    }
    expect(filtered / raw).toBeLessThan(.85)
  })
  it('keeps acceleration continuous at animation sample boundaries', () => {
    const h = .00001
    const acceleration = (time: number) => (parseFloat(dancePose(time - h)['--elbow-r']) - 2 * parseFloat(dancePose(time)['--elbow-r']) + parseFloat(dancePose(time + h)['--elbow-r'])) / (h * h)
    for (let i = 4; i < reference.frames.length - 4; i += 11) {
      expect(Math.abs(acceleration(i / 30 - h) - acceleration(i / 30 + h))).toBeLessThan(5)
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
