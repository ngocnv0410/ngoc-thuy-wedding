import { describe, expect, it } from 'vitest'
import type { Location } from '../content/types'
import { addressText, directionsUrl } from './maps'

const base: Location = {
  id: 'venue',
  side: 'both',
  label: 'Nhà hàng',
  name: 'Sảnh Ánh Dương',
  address: '12 Đường Mẫu, Phường Thử, Hà Nội',
}

describe('directionsUrl', () => {
  it('ưu tiên toạ độ', () => {
    const url = new URL(directionsUrl({ ...base, coords: { lat: 21.0285, lng: 105.8542 } }))
    expect(url.origin + url.pathname).toBe('https://www.google.com/maps/dir/')
    expect(url.searchParams.get('api')).toBe('1')
    expect(url.searchParams.get('destination')).toBe('21.0285,105.8542')
  })

  it('kèm Place ID cùng tên + địa chỉ, giữ nguyên dấu tiếng Việt', () => {
    const url = new URL(directionsUrl({ ...base, placeId: 'ChIJ123' }))
    expect(url.searchParams.get('destination')).toBe('Sảnh Ánh Dương, 12 Đường Mẫu, Phường Thử, Hà Nội')
    expect(url.searchParams.get('destination_place_id')).toBe('ChIJ123')
  })

  it('dùng link cô dâu chú rể gửi khi không có toạ độ/Place ID', () => {
    expect(directionsUrl({ ...base, mapsUrl: 'https://maps.app.goo.gl/abc' })).toBe('https://maps.app.goo.gl/abc')
  })

  it('fallback tên + địa chỉ', () => {
    const url = new URL(directionsUrl(base))
    expect(url.searchParams.get('destination')).toBe(addressText(base))
  })
})
