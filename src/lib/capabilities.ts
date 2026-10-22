/**
 * Quyết định có dùng màn mở cửa 3D (WebGL) hay giữ bản 2.5D. Bản 2.5D luôn hiện trước; 3D chỉ
 * là lớp nâng cấp cho máy đủ mạnh, mạng không tiết kiệm dữ liệu và khách không giảm chuyển động.
 */

interface NetworkInformationLike {
  saveData?: boolean
  effectiveType?: string
}

export interface DeviceHints {
  reducedMotion: boolean
  saveData: boolean
  effectiveType?: string
  /** GB; Safari không có — coi như đủ. */
  deviceMemory?: number
  hardwareConcurrency?: number
  webgl2: boolean
  /**
   * Điện thoại: màn hình cảm ứng, cạnh ngắn < 768px. Bản 3D (≈900 KB three.js, dựng normal map,
   * biên dịch shader) làm đơ máy tầm trung vài giây lúc mở trang — điện thoại luôn dùng 2.5D.
   */
  phone?: boolean
  /** `?mocua=2d` / `?mocua=3d` để QA ép một chế độ. */
  override?: '2d' | '3d'
}

/** Logic thuần, tách khỏi trình duyệt để test được. */
export function decide3D(hints: DeviceHints): boolean {
  if (hints.override) return hints.override === '3d' && hints.webgl2
  if (hints.reducedMotion || hints.saveData || !hints.webgl2 || hints.phone) return false
  if (hints.effectiveType && /2g$/.test(hints.effectiveType)) return false
  if ((hints.deviceMemory ?? 8) < 4) return false
  if ((hints.hardwareConcurrency ?? 4) < 4) return false
  return true
}

function hasWebGL2(): boolean {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2')
    if (!gl) return false
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return true
  } catch {
    return false
  }
}

function overrideParam(): '2d' | '3d' | undefined {
  const param = new URLSearchParams(window.location.search).get('mocua')
  return param === '2d' || param === '3d' ? param : undefined
}

/** QA đang ép bản 3D (`?mocua=3d`) — bỏ giới hạn thời gian chờ tải. */
export function forced3D(): boolean {
  return overrideParam() === '3d'
}

export function canUse3D(): boolean {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: NetworkInformationLike }
  return decide3D({
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    saveData: Boolean(nav.connection?.saveData),
    effectiveType: nav.connection?.effectiveType,
    deviceMemory: nav.deviceMemory,
    hardwareConcurrency: nav.hardwareConcurrency,
    webgl2: hasWebGL2(),
    phone: window.matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) < 768,
    override: overrideParam(),
  })
}
