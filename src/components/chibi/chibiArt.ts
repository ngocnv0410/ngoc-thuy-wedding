/**
 * Nét vẽ chibi cô dâu – chú rể (vẽ lại theo ảnh mẫu, đơn giản hoá cho nét mảnh). Một nhân vật nằm
 * trong khung VIEW_W × VIEW_H, mặt đất ở y = GROUND, nhìn thẳng. Mọi bộ phận vẽ ở tư thế đứng
 * thẳng; tư thế khác do biến CSS xoay quanh các pivot dưới đây (xem Chibi.tsx).
 *
 * Tay phải (phía phải khung hình) dùng lại nét tay trái, lật gương qua trục x = MIRROR_X.
 */
export const VIEW_W = 120
export const VIEW_H = 200
export const GROUND = 196
export const MIRROR_X = 120

/** Khung chỉ lấy phần đầu — cho cảnh ló đầu sau cánh cửa. */
export const HEAD_VIEWBOX = '8 0 104 112'

export const PIVOT = {
  body: [60, GROUND],
  upper: [60, 150],
  head: [60, 106],
  shoulderL: [45, 114],
  shoulderR: [75, 114],
  hipL: [53, 150],
  hipR: [67, 150],
  skirt: [60, 140],
  veil: [60, 30],
  tuft: [66, 15],
} as const

/** Vị trí bàn tay khi buông thẳng (tay trái) — nơi gắn đạo cụ cầm theo. */
export const HAND_L = [40, 148] as const
export const HAND_R = [MIRROR_X - HAND_L[0], HAND_L[1]] as const

export const EYE_X = [45, 75] as const
export const EYE_Y = 74

export const SHARED = {
  shadow: { cx: 60, cy: 195, rx: 30, ry: 3.6 },
  face: { cx: 60, cy: 68, rx: 40, ry: 37 },
  neck: 'M55 98L65 98L65 112L55 112Z',
  cheekL: { cx: 35, cy: 87, rx: 6, ry: 3.2 },
  cheekR: { cx: 85, cy: 87, rx: 6, ry: 3.2 },
  nose: 'M60 82q1.2 1.4-0.2 2.4',
  mouth: 'M55.5 90Q60 93.6 64.5 90',
  /** Tim nhỏ giữa hai bàn tay (tư thế "tay tim"). */
  chestHeart: 'M60 150C54 145 52 140 55.5 138C57.5 137 59.2 138.4 60 140C60.8 138.4 62.5 137 64.5 138C68 140 66 145 60 150Z',
}

/** Mắt mở / nhắm / cười (^^) quanh tâm (cx, EYE_Y). */
export const eye = {
  lash: (cx: number) => `M${cx - 8.5} 71Q${cx} 62 ${cx + 8.5} 71`,
  closed: (cx: number) => `M${cx - 7} 75Q${cx} 79 ${cx + 7} 75`,
  happy: (cx: number) => `M${cx - 7} 77Q${cx} 68 ${cx + 7} 77`,
  brow: (cx: number) => `M${cx - 6} 59Q${cx} 56 ${cx + 6} 59`,
}

export const GROOM = {
  earL: { cx: 21, cy: 73, rx: 5, ry: 7 },
  earR: { cx: 99, cy: 73, rx: 5, ry: 7 },
  hair: 'M18 74C14 36 34 14 62 14C90 14 108 36 102 74C100 64 96 56 90 50C80 56 64 56 50 50C44 46 40 48 36 52C28 56 22 64 18 74Z',
  strands: 'M50 50C56 42 66 36 76 34M90 50C88 40 82 32 74 28M36 52C38 42 44 34 52 30',
  tuft: 'M61 15C61 8 66 3 74 3C70 6 68 10 69 15Z',
  jacket: 'M42 116C42 110 48 107 54 107L66 107C72 107 78 110 78 116L80 153C67 156 53 156 40 153Z',
  shirt: 'M54 107L60 126L66 107Z',
  tie: 'M60 113L53 109L53 117L60 114L67 117L67 109Z',
  lapels: 'M54 107L58 131M66 107L62 131M68 133L75 132',
  buttons: [
    [60, 137],
    [60, 144],
  ],
  /** Tay trái: ống tay vest + cổ tay áo sơ mi + bàn tay. */
  sleeve: 'M39 112C35 118 34 128 35 142L45 142C45 132 47 122 51 114Z',
  cuff: 'M35 140L45 140L45 144L35 144Z',
  hand: { cx: 40, cy: 148, rx: 5, ry: 5.5 },
  /** Chân trái: ống quần + giày. */
  leg: 'M47 148L46.5 184L57 184L59 148Z',
  shoe: 'M43.5 184Q42 192 50 192L58 192Q60 187 57 184Z',
}

export const BRIDE = {
  hairBack:
    'M22 56C8 92 10 130 20 164C26 158 30 152 33 144C38 150 44 150 46 142L74 142C76 150 82 150 87 144C90 152 94 158 100 164C110 130 112 92 98 56Z',
  hair: 'M18 80C14 40 34 15 60 15C86 15 106 40 102 80C98 66 92 54 82 46C74 44 66 38 61 30C56 42 44 50 32 56C26 62 21 70 18 80Z',
  /** Lọn tóc gợn sóng trước vai trái (phải: lật gương). */
  lock: 'M19 76C14 92 22 104 17 118C14 128 20 134 26 132C22 122 30 112 26 98C25 90 24 84 23 78Z',
  strands: 'M61 30C66 40 76 46 88 52M61 30C58 40 48 50 36 56',
  veilL: 'M40 30C18 56 6 120 10 182C22 188 34 186 42 178C36 140 38 90 52 34Z',
  veilR: 'M80 30C98 56 108 110 104 156C96 160 88 158 84 152C88 112 84 70 68 34Z',
  flowers: [
    [26, 50],
    [31, 40],
    [38, 32],
    [47, 26],
    [57, 22],
    [67, 21],
  ],
  shoulders: 'M46 117C46 111 52 108 60 108C68 108 74 111 74 117L72 125L48 125Z',
  bodice: 'M47 121C52 118 56 120 60 122C64 120 68 118 73 121L74 141L46 141Z',
  straps: 'M50.5 120.5L49.5 111M69.5 120.5L70.5 111',
  waist: 'M46 140L74 140',
  skirt: 'M46 139L74 139C80 160 90 176 98 190C80 196 40 196 22 190C30 176 40 160 46 139Z',
  folds: 'M54 146C52 162 48 176 44 192M60 146L60 194M66 146C68 162 72 176 76 192',
  arm: 'M41.5 113C38.5 120 37.5 130 38.5 144L45.5 144C45.5 132 47.5 122 49.5 115Z',
  hand: { cx: 42, cy: 147.5, rx: 4.6, ry: 5 },
}

/** Đạo cụ, vẽ quanh gốc (0, 0). */
export const PROP = {
  heart: 'M0 4C-6-1-8-6-4.5-8C-2.5-9-0.8-7.6 0-6C0.8-7.6 2.5-9 4.5-8C8-6 6-1 0 4Z',
  map: 'M-15-10L-5-12L5-10L15-12L15 10L5 12L-5 10L-15 12Z',
  mapFolds: 'M-5-12V10M5-10V12',
  mapRoute: 'M-11 6C-6 0 2 4 10-5',
  envelopeFlap: 'M-18-12L0 2L18-12Z',
  mailbox: 'M-22-8C-22-18-14-22 0-22L14-22C22-22 24-16 24-8L24 10L-22 10Z',
  mailboxFlag: 'M32-17L41-17L41-10L32-10Z',
}
