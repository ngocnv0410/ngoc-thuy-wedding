export interface SpriteClip {
  fps: number
  duration: number
  frameCount: number
  width: number
  height: number
  columns: number
  perAtlas: number
  actors: Record<'bride' | 'groom', string[]>
}
export function frameAt(clip: SpriteClip, seconds: number) {
  return Math.min(clip.frameCount - 1, Math.max(0, Math.floor((Number.isFinite(seconds) ? seconds : 0) * clip.fps)))
}
export function frameRect(clip: SpriteClip, frame: number) {
  const cell = frame % clip.perAtlas
  return { atlas: Math.floor(frame / clip.perAtlas), x: cell % clip.columns * clip.width, y: Math.floor(cell / clip.columns) * clip.height }
}
