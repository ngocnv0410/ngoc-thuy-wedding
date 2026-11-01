import { describe, expect, it } from 'vitest'
import { dancePose } from './badDance'
import { dancePose as bangPose } from './chibiDance'
import reference from './badReferenceDance.json'
import { loadDance } from './loadDance'

describe('BAD reference choreography', () => {
  it('covers the supplied clip at its original speed with its own gestures', () => {
    expect(reference.sourceOffset).toBe(0)
    expect(reference.sourceTimeScale).toBe(1)
    expect(reference.frames.length / reference.fps).toBeCloseTo(reference.duration, 1)
    for (const time of [0, 4, 8, 12, 16, 20, 24]) expect(dancePose(time)).not.toEqual(bangPose(time))
    expect(dancePose(-1)).toEqual(dancePose(0))
    expect(dancePose(100)).toEqual(dancePose(reference.duration))
  })

  it('keeps finite, positive limbs and grounded feet throughout interpolation', () => {
    for (let time = 0; time < reference.duration; time += 1 / 60) {
      const pose = dancePose(time)
      const value = (key: string) => parseFloat(pose[key])
      for (const item of Object.values(pose)) expect(Number.isFinite(parseFloat(item))).toBe(true)
      for (const [key, item] of Object.entries(pose)) if (key.endsWith('-length')) expect(parseFloat(item)).toBeGreaterThan(0)
      const radians = (degrees: number) => degrees * Math.PI / 180
      const feet = ['l', 'r'].map((side) => value(`--leg-upper-${side}-length`) * Math.cos(radians(value(`--leg-${side}`)))
        + value(`--leg-lower-${side}-length`) * Math.cos(radians(value(`--leg-${side}`) + value(`--knee-${side}`))))
      expect(value('--body-y') + Math.max(...feet)).toBeCloseTo(39, 5)
    }
  })

  it('does not jump at tracked-frame boundaries or when revisiting a timestamp', () => {
    for (let i = 1; i < reference.frames.length - 1; i += 11) {
      const time = i / reference.fps
      const before = dancePose(time - .00001), after = dancePose(time + .00001)
      for (const key of Object.keys(before)) expect(Math.abs(parseFloat(before[key]) - parseFloat(after[key]))).toBeLessThan(.1)
      expect(dancePose(time)).toEqual(dancePose(time))
    }
  })

  it('loads and caches the selected choreography independently', async () => {
    const first = loadDance('ateez-bad')
    expect(loadDance('ateez-bad')).toBe(first)
    expect(await first).toBe(dancePose)
    expect(await loadDance('bang-bang-bang')).toBe(bangPose)
  })
})
