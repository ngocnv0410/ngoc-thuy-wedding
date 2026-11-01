import { GROUND } from './chibiArt'

// The painted shoe edge is one unit above the legacy SVG ground (transparent fringe).
export const brideDressPlacement = { x: 4, y: 99, width: 112, height: GROUND - 1 - 99 } as const
export const brideVeilPlacement = { x: 4, y: 87, width: 112, height: 76 } as const
/** Overlaps both chin and collar throughout the greeting's head tilt and bow. */
export const neckPlacement = { x: 54.5, y: 93, width: 11, height: 19 } as const

/** Painted joint centers, independent of the older vector character's skeleton. */
export const paintedArmJoints = {
  groom: { l: { shoulder: [43, 108], elbow: [35.3, 128] }, r: { shoulder: [77, 108], elbow: [84.8, 128] }, shoulderRadius: 4, elbowRadius: 4.5 },
  bride: { l: { shoulder: [44.5, 102], elbow: [37.5, 121] }, r: { shoulder: [73, 102], elbow: [79.7, 121] }, shoulderRadius: 2.8, elbowRadius: 4.1 },
} as const
