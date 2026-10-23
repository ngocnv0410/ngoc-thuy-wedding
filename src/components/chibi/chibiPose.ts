import type { CSSProperties, ReactNode } from 'react'

export type ChibiWho = 'groom' | 'bride'
/** Tư thế cuối của mỗi cảnh. Animation chỉ chạy `from` tới tư thế này (reduced-motion: đứng yên ở đây). */
export type ChibiPose = 'stand' | 'hold' | 'carry' | 'point' | 'heart' | 'wave'
export type ChibiLook = 'front' | 'left' | 'right' | 'down-left' | 'down-right'
export type ChibiEyes = 'open' | 'closed' | 'happy'
export type ChibiSize = 'sm' | 'md' | 'lg'
export type Side = 'l' | 'r'

export interface FigureProps {
  who: ChibiWho
  pose?: ChibiPose
  look?: ChibiLook
  eyes?: ChibiEyes
  /** Cô dâu nghiêng đầu tựa vai chú rể. */
  lean?: boolean
  /** Đạo cụ cầm trên tay (vẽ quanh gốc 0,0, luôn đứng thẳng dù tay xoay). */
  held?: ReactNode
  /** Tay cầm đạo cụ / tay chỉ. Mặc định: tay phía người kia (chú rể bên trái nên là tay phải). */
  hand?: Side
}

/** Tay buông hơi rời thân. Góc tay dương = giơ ra ngoài, âm = khép vào trong. */
const REST = 6

/** Các biến của rig. CSS đọc `var(--x, var(--pose-x))`. */
export const RIG_KEYS = [
  'body-y',
  'lean-x',
  'upper-r',
  'upper-y',
  'upper-sy',
  'head-r',
  'head-y',
  'face-x',
  'face-y',
  'arm-l',
  'arm-r',
  'leg-l',
  'leg-r',
  'skirt',
  'veil',
  'tuft',
  'eo',
  'ec',
  'eh',
  'heart',
] as const

/**
 * Tư thế cuối của nhân vật, đặt thành biến `--pose-*` trên phần tử gốc. GSAP chỉ tween các biến
 * không tiền tố (`--arm-r`…) đè lên trên; khi GSAP dọn animation (StrictMode, đổi matchMedia) nó
 * xoá biến của nó và CSS rơi về đúng tư thế này — React không bao giờ bị mất giá trị.
 * Đơn vị luôn ghi rõ để GSAP nội suy được.
 */
export function chibiVars({ who, pose = 'stand', look = 'front', eyes, lean = false, hand }: FigureProps) {
  const side = hand ?? (who === 'groom' ? 'r' : 'l')
  let armL = REST
  let armR = REST
  let mood: ChibiEyes = 'open'
  if (pose === 'hold') {
    // Hai bàn tay gặp nhau ở giữa cặp đôi (khớp khoảng chồng trong .couple).
    if (side === 'r') armR = 50
    else armL = 50
  } else if (pose === 'carry') {
    if (side === 'r') armR = 70
    else armL = 70
  } else if (pose === 'point') {
    if (side === 'r') armR = 95
    else armL = 95
  } else if (pose === 'heart') {
    armL = -30
    armR = -30
    mood = 'happy'
  } else if (pose === 'wave') {
    armR = 130
    mood = 'happy'
  }
  const shown = eyes ?? mood

  const faceX = look.endsWith('left') ? -4 : look.endsWith('right') ? 4 : 0
  const faceY = look.startsWith('down') ? 2.5 : 0

  return {
    '--pose-body-y': '0px',
    '--pose-lean-x': lean ? '-3px' : '0px',
    '--pose-upper-r': '0deg',
    '--pose-upper-y': '0px',
    '--pose-upper-sy': '1',
    '--pose-head-r': lean ? '-8deg' : '0deg',
    '--pose-head-y': '0px',
    '--pose-face-x': `${faceX}px`,
    '--pose-face-y': `${faceY}px`,
    '--pose-arm-l': `${armL}deg`,
    '--pose-arm-r': `${armR}deg`,
    '--pose-leg-l': '0deg',
    '--pose-leg-r': '0deg',
    '--pose-skirt': '0deg',
    '--pose-veil': '0deg',
    '--pose-tuft': '0deg',
    '--pose-eo': shown === 'open' ? '1' : '0',
    '--pose-ec': shown === 'closed' ? '1' : '0',
    '--pose-eh': shown === 'happy' ? '1' : '0',
    '--pose-heart': pose === 'heart' ? '1' : '0',
  } as CSSProperties
}
