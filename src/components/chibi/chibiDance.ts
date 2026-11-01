/** 135 BPM, inspired by the supplied dance: punches, side steps, then overhead pumps.
 * Sample from media time, never from elapsed animation time (seeking/looping is deterministic).
 */
export function dancePose(seconds: number): Record<string, string> {
  const beat = Math.max(0, seconds) * 135 / 60
  const phrase = beat % 16
  const swing = Math.sin(beat * Math.PI)
  const bounce = Math.sin((beat % 1) * Math.PI)
  const overhead = phrase >= 8
  return {
    '--body-y': `${-7 * bounce}px`,
    '--lean-x': `${7 * swing}px`,
    '--upper-r': `${-8 * swing}deg`,
    '--upper-y': `${3 * (1 - bounce)}px`,
    '--upper-sy': `${1 - 0.035 * (1 - bounce)}`,
    '--head-r': `${5 * swing}deg`,
    '--head-y': `${-2 * bounce}px`,
    '--arm-l': `${overhead ? 145 + 22 * bounce : 65 + 65 * swing}deg`,
    '--arm-r': `${overhead ? 145 + 22 * bounce : 65 - 65 * swing}deg`,
    '--leg-l': `${-10 - 13 * swing}deg`,
    '--leg-r': `${10 - 13 * swing}deg`,
    '--skirt': `${-6 * swing}deg`,
    '--veil': `${8 * swing}deg`,
    '--tuft': `${-10 * swing}deg`,
    '--eo': '0', '--ec': '0', '--eh': '1', '--heart': '0',
  }
}
