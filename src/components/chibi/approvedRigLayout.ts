import { GROUND } from './chibiArt'

// The painted shoe edge is one unit above the legacy SVG ground (transparent fringe).
export const brideDressPlacement = { x: 4, y: 99, width: 112, height: GROUND - 1 - 99 } as const
export const brideVeilPlacement = { x: 4, y: 87, width: 112, height: 76 } as const
/** Overlaps both chin and collar throughout the greeting's head tilt and bow. */
export const neckPlacement = { x: 54.5, y: 93, width: 11, height: 19 } as const
