import reference from './referenceDance.json'

/** Recorded video frames, interpolated on the audio clock. No invented beat loop. */
export function dancePose(seconds: number): Record<string, string> {
  const position = Math.max(0, Math.min(reference.frames.length - 1, seconds * reference.fps))
  const index = Math.floor(position)
  const t = position - index
  // Cubic interpolation retains smooth velocity between 30fps source samples.
  const row = reference.frames[index].map((_, channel) => {
    const value = (offset: number) => reference.frames[Math.max(0, Math.min(reference.frames.length - 1, index + offset))][channel]
    const a = value(-1), b = value(0), c = value(1), d = value(2)
    return 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t)
  })
  const [x, y, torso, armL, elbowL, armR, elbowR, legL, kneeL, legR, kneeR, head] = row
  return {
    '--lean-x': `${x}px`, '--body-y': `${y}px`,
    '--upper-r': `${torso}deg`, '--upper-y': '0px', '--upper-sy': '1',
    '--head-r': `${head}deg`, '--head-y': '0px',
    '--arm-l': `${armL}deg`, '--elbow-l': `${elbowL}deg`,
    '--arm-r': `${armR}deg`, '--elbow-r': `${elbowR}deg`,
    '--leg-l': `${legL}deg`, '--knee-l': `${kneeL}deg`,
    '--leg-r': `${legR}deg`, '--knee-r': `${kneeR}deg`,
    '--skirt': `${-torso * 0.3}deg`, '--veil': `${-torso * 0.25}deg`, '--tuft': '0deg',
    '--eo': '0', '--ec': '0', '--eh': '1', '--heart': '0',
  }
}
