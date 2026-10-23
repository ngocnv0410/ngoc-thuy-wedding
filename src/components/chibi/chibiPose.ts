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

/**
 * Toàn bộ trạng thái của rig là biến CSS trên phần tử gốc — GSAP chỉ cần tween các biến này trên
 * một phần tử (xem src/motion/chibi.ts). Đơn vị luôn ghi rõ để GSAP nội suy được.
 */
export function chibiVars({ who, pose = 'stand', look = 'front', eyes, lean = false, hand }: FigureProps) {
  const side = hand ?? (who === 'groom' ? 'r' : 'l')
  let armL = REST
  let armR = REST
  let mood: ChibiEyes = 'open'
  if (pose === 'hold') {
    // Hai bàn tay gặp nhau ở giữa cặp đôi (khớp khoảng chồng trong .couple).
    if (who === 'groom') armR = 50
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
    '--body-y': '0px',
    '--lean-x': lean ? '-3px' : '0px',
    '--upper-r': '0deg',
    '--upper-y': '0px',
    '--upper-sy': '1',
    '--head-r': lean ? '-8deg' : '0deg',
    '--head-y': '0px',
    '--face-x': `${faceX}px`,
    '--face-y': `${faceY}px`,
    '--arm-l': `${armL}deg`,
    '--arm-r': `${armR}deg`,
    '--leg-l': '0deg',
    '--leg-r': '0deg',
    '--skirt': '0deg',
    '--veil': '0deg',
    '--tuft': '0deg',
    '--eo': shown === 'open' ? '1' : '0',
    '--ec': shown === 'closed' ? '1' : '0',
    '--eh': shown === 'happy' ? '1' : '0',
    '--heart': pose === 'heart' ? '1' : '0',
  } as CSSProperties
}
