import { describe, expect, it } from 'vitest'
import { dancePose } from './chibiDance'
import reference from './referenceDance.json'

describe('reference-video choreography', () => {
  it('keeps the source gestures and deterministically follows seeks', () => {
    for (let index = 0; index < reference.frames.length; index += 3) {
      const pose = dancePose(index / reference.fps)
      for (const [key, channel] of [['--arm-l', 3], ['--elbow-l', 4], ['--arm-r', 5], ['--elbow-r', 6]] as const) {
        const world = parseFloat(pose[key]) + (channel === 3 || channel === 5 ? parseFloat(pose['--body-r']) + parseFloat(pose['--upper-r']) : 0)
        const source = reference.frames[index][channel] + (channel === 3 || channel === 5 ? reference.frames[index][2] : 0)
        expect(Math.abs(world - source)).toBeLessThan(18)
      }
      expect(dancePose(index / reference.fps)).toEqual(pose)
    }
  })
  it('reduces high-frequency acceleration changes in the tracked joints', () => {
    let raw = 0, filtered = 0
    for (const [key, channel] of [['--arm-l', 3], ['--elbow-l', 4], ['--arm-r', 5], ['--elbow-r', 6]] as const) {
      const sample = (index: number) => {
        const pose = dancePose(index / 30)
        return parseFloat(pose[key]) + (channel === 3 || channel === 5 ? parseFloat(pose['--body-r']) + parseFloat(pose['--upper-r']) : 0)
      }
      const rawSample = (index: number) => reference.frames[index][channel] + (channel === 3 || channel === 5 ? reference.frames[index][2] : 0)
      for (let i = 2; i < reference.frames.length - 2; i++) {
        raw += (rawSample(i - 1) - 2 * rawSample(i) + rawSample(i + 1)) ** 2
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
    for (const length of row.slice(12, 20)) expect(length).toBeGreaterThan(0)
    const radians = (angle: number) => angle * Math.PI / 180
    const left = row[16] * Math.cos(radians(row[7])) + row[17] * Math.cos(radians(row[7] + row[8]))
    const right = row[18] * Math.cos(radians(row[9])) + row[19] * Math.cos(radians(row[9] + row[10]))
    expect(150 + row[1] + Math.max(left, right)).toBeCloseTo(189, 1)
  }
})


it('leans the pelvis in both directions at the corresponding tutorial gestures', () => {
  expect(parseFloat(dancePose(4)['--body-r'])).toBeLessThan(-6)
  expect(parseFloat(dancePose(6)['--body-r'])).toBeGreaterThan(6)
})

it('keeps world shoulder angles faithful and the supporting foot grounded while leaning', () => {
  const radians = (angle: number) => angle * Math.PI / 180
  for (let i = 0; i < reference.frames.length; i += 3) {
    const pose = dancePose(i / reference.fps)
    const value = (key: string) => parseFloat(pose[key])
    const roll = value('--body-r')
    expect(Math.abs(roll + value('--upper-r') - reference.frames[i][21])).toBeLessThan(4)
    const hipY = 7 * Math.sin(radians(roll))
    const foot = (side: string) => {
      const thigh = roll + value(`--leg-${side}`), shin = thigh + value(`--knee-${side}`)
      return value(`--leg-upper-${side}-length`) * Math.cos(radians(thigh)) + value(`--leg-lower-${side}-length`) * Math.cos(radians(shin))
    }
    expect(150 + value('--body-y') + Math.max(-hipY + foot('l'), hipY + foot('r'))).toBeCloseTo(189, 5)
  }
})
