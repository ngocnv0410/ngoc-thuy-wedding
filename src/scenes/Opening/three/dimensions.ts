/**
 * Kích thước phong bì 3D (đơn vị thế giới), khớp tỉ lệ với bản 2.5D trong Opening.module.css:
 * phong bì 1.45 : 1, thẻ chừa 6% hai bên / 5% trên / 7% dưới, nắp dài 58%, đáy chữ V ở 54%.
 */
export const ENV_W = 1.45
export const ENV_H = 1

export const CARD_W = ENV_W * 0.88
export const CARD_H = ENV_H * 0.88
/** Tâm thẻ lệch lên một chút vì lề dưới (7%) lớn hơn lề trên (5%). */
export const CARD_Y = ENV_H * 0.01

export const FLAP_DEPTH = ENV_H * 0.58
export const POCKET_V = ENV_H * 0.54

/** Bán kính lớn nhất của dấu sáp (viền lượn). */
export const SEAL_R = 0.105

/** Lớp giấy cách nhau rất mỏng theo trục z — đủ để che khuất đúng thứ tự. */
export const Z = {
  ground: -0.01,
  back: 0,
  card: 0.004,
  pocket: 0.008,
  flap: 0.012,
  seal: 0.016,
} as const
