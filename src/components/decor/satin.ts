/** Hai góc đối nhau như mẫu thiệp: lụa phủ góc trên trái, lụa cuộn lên ở góc dưới phải. */
export type DrapeCorner = 'top-left' | 'bottom-right'

/** Kích thước theo "px thiệp" (rộng 441px); bản 6x giữ mẫu và alpha cho màn hình DPR cao. */
export const SATIN_ASSETS: Record<DrapeCorner, { name: string; width: number; height: number; sizes: string }> = {
  'top-left': { name: 'satin-top', width: 224, height: 277, sizes: '(min-width: 595.35px) 302.4px, (max-width: 317.52px) 161.28px, 50.7937vw' },
  'bottom-right': { name: 'satin-bottom', width: 268, height: 335, sizes: '(min-width: 595.35px) 361.8px, (max-width: 317.52px) 192.96px, 60.7710vw' },
}

