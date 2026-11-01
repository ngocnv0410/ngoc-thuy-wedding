import { describe, expect, it } from 'vitest'
import { dancePose } from './chibiDance'

describe('BANG BANG BANG choreography', () => {
  it('returns the same pose after a 16-beat phrase or a seek back', () => {
    const first = dancePose(0.2)
    const loop = dancePose(0.2 + 16 * 60 / 135)
    for (const key of Object.keys(first)) expect(parseFloat(loop[key])).toBeCloseTo(parseFloat(first[key]), 8)
    expect(dancePose(0.2)).toEqual(first)
  })
  it('alternates punches, then lifts both arms for the overhead phrase', () => {
    const punch = dancePose(0.5 * 60 / 135)
    expect(parseFloat(punch['--arm-l'])).toBeGreaterThan(100)
    expect(parseFloat(punch['--arm-r'])).toBeLessThan(20)
    const overhead = dancePose(8.5 * 60 / 135)
    expect(parseFloat(overhead['--arm-l'])).toBeGreaterThan(140)
    expect(overhead['--arm-l']).toBe(overhead['--arm-r'])
  })
})
