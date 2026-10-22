import type { Location } from '../content/types'

const DIRECTIONS_BASE = 'https://www.google.com/maps/dir/?api=1'

/**
 * Link "Chỉ đường" theo chuẩn Google Maps URLs (không cần API key; mở app Maps trên mobile).
 * Ưu tiên: toạ độ → Place ID (kèm tên + địa chỉ) → link cô dâu chú rể gửi → tên + địa chỉ.
 * https://developers.google.com/maps/documentation/urls/get-started#directions-action
 */
export function directionsUrl(location: Location): string {
  const params = new URLSearchParams()

  if (location.coords) {
    params.set('destination', `${location.coords.lat},${location.coords.lng}`)
  } else if (location.mapsUrl && !location.placeId) {
    return location.mapsUrl
  } else {
    params.set('destination', `${location.name}, ${location.address}`)
  }
  if (location.placeId) {
    params.set('destination_place_id', location.placeId)
  }

  return `${DIRECTIONS_BASE}&${params.toString()}`
}

/** Chuỗi dùng cho nút "Sao chép địa chỉ". */
export function addressText(location: Location): string {
  return `${location.name}, ${location.address}`
}
