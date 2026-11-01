import reference from './referenceDance.json'

// A symmetric 5-sample filter removes tracking jitter without shifting gestures in time.
const weights = [1, 4, 6, 4, 1]
const frames = reference.frames.map((row, index) => row.map((_, channel) =>
  weights.reduce((sum, weight, offset) => sum + weight * reference.frames[Math.max(0, Math.min(reference.frames.length - 1, index + offset - 2))][channel], 0) / 16,
))

/** Cubic B-spline: continuous position, velocity AND acceleration at sample boundaries.
 * Positive weights also prevent limb-length overshoot. Sampling remains tied to media time.
 */
export function dancePose(seconds: number): Record<string, string> {
  const position = Math.max(0, Math.min(frames.length - 1, seconds * reference.fps))
  const index = Math.floor(position)
  const t = position - index, t2 = t * t, t3 = t2 * t
  const basis = [(1 - t) ** 3 / 6, (3 * t3 - 6 * t2 + 4) / 6, (-3 * t3 + 3 * t2 + 3 * t + 1) / 6, t3 / 6]
  const row = frames[index].map((_, channel) => basis.reduce((sum, weight, offset) =>
    sum + weight * frames[Math.max(0, Math.min(frames.length - 1, index + offset - 1))][channel], 0))
  const [x, , torso, armL, elbowL, armR, elbowR, legL, kneeL, legR, kneeR, head, armUpperL, armLowerL, armUpperR, armLowerR, legUpperL, legLowerL, legUpperR, legLowerR] = row
  // Keep the lower foot grounded after filtering joint angles and lengths together.
  const radians = (angle: number) => angle * Math.PI / 180
  const footL = legUpperL * Math.cos(radians(legL)) + legLowerL * Math.cos(radians(legL + kneeL))
  const footR = legUpperR * Math.cos(radians(legR)) + legLowerR * Math.cos(radians(legR + kneeR))
  const y = 39 - Math.max(footL, footR)
  return {
    '--lean-x': `${x}px`, '--body-y': `${y}px`,
    '--upper-r': `${torso}deg`, '--upper-y': '0px', '--upper-sy': '1',
    '--head-r': `${head}deg`, '--head-y': '0px',
    '--arm-l': `${armL}deg`, '--elbow-l': `${elbowL}deg`,
    '--arm-r': `${armR}deg`, '--elbow-r': `${elbowR}deg`,
    '--leg-l': `${legL}deg`, '--knee-l': `${kneeL}deg`,
    '--leg-r': `${legR}deg`, '--knee-r': `${kneeR}deg`,
    '--skirt': `${-torso * 0.3}deg`, '--veil': `${-torso * 0.25}deg`, '--tuft': '0deg',
    '--arm-upper-l-length': `${armUpperL}px`, '--arm-lower-l-length': `${armLowerL}px`,
    '--arm-upper-r-length': `${armUpperR}px`, '--arm-lower-r-length': `${armLowerR}px`,
    '--leg-upper-l-length': `${legUpperL}px`, '--leg-lower-l-length': `${legLowerL}px`,
    '--leg-upper-r-length': `${legUpperR}px`, '--leg-lower-r-length': `${legLowerR}px`,
    '--eo': '0', '--ec': '0', '--eh': '1', '--heart': '0',
  }
}
