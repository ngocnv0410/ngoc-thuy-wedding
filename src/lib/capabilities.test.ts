import { describe, expect, it } from 'vitest'
import { decide3D, type DeviceHints } from './capabilities'

const strong: DeviceHints = {
  reducedMotion: false,
  saveData: false,
  effectiveType: '4g',
  deviceMemory: 8,
  hardwareConcurrency: 8,
  webgl2: true,
}

describe('decide3D', () => {
  it('máy mạnh, mạng tốt → 3D', () => {
    expect(decide3D(strong)).toBe(true)
  })

  it('Safari không báo deviceMemory/hardwareConcurrency → vẫn 3D', () => {
    expect(decide3D({ ...strong, deviceMemory: undefined, hardwareConcurrency: undefined })).toBe(true)
  })

  it.each<[string, Partial<DeviceHints>]>([
    ['giảm chuyển động', { reducedMotion: true }],
    ['tiết kiệm dữ liệu', { saveData: true }],
    ['mạng 2g', { effectiveType: '2g' }],
    ['mạng slow-2g', { effectiveType: 'slow-2g' }],
    ['RAM 2 GB', { deviceMemory: 2 }],
    ['2 nhân CPU', { hardwareConcurrency: 2 }],
    ['không có WebGL2', { webgl2: false }],
  ])('%s → 2.5D', (_, change) => {
    expect(decide3D({ ...strong, ...change })).toBe(false)
  })

  it('QA ép chế độ qua ?mocua=', () => {
    expect(decide3D({ ...strong, override: '2d' })).toBe(false)
    expect(decide3D({ ...strong, deviceMemory: 1, override: '3d' })).toBe(true)
    expect(decide3D({ ...strong, webgl2: false, override: '3d' })).toBe(false)
  })
})
