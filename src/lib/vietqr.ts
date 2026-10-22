/**
 * Payload VietQR (chuẩn EMVCo Merchant-Presented QR, hồ sơ NAPAS "chuyển nhanh đến tài khoản").
 * Sinh lúc build (scripts/generate-qr.ts) — trang không gọi dịch vụ QR bên thứ ba nào.
 *
 * Cấu trúc:
 *   00 Payload format = "01"
 *   01 Point of initiation = "11" (QR tĩnh, dùng nhiều lần, khách tự nhập số tiền)
 *   38 Merchant account (NAPAS):
 *      00 GUID = "A000000727"
 *      01 Người nhận: 00 BIN ngân hàng (6 số) · 01 số tài khoản
 *      02 Dịch vụ = "QRIBFTTA" (chuyển đến tài khoản)
 *   53 Tiền tệ = "704" (VND) · 58 Quốc gia = "VN"
 *   62 (tuỳ chọn) 08 Nội dung chuyển khoản
 *   63 CRC-16/CCITT-FALSE trên toàn bộ chuỗi tính cả "6304"
 *
 * File này không import gì để script build chạy được trực tiếp bằng Node.
 */

export interface VietQRInput {
  /** Mã BIN ngân hàng theo danh sách của Ngân hàng Nhà nước (ví dụ Techcombank 970407). */
  bin: string
  accountNumber: string
  /** Nội dung chuyển khoản gợi ý — chỉ ký tự ASCII (không dấu). */
  purpose?: string
}

const NAPAS_GUID = 'A000000727'
const SERVICE_TO_ACCOUNT = 'QRIBFTTA'

/** Một trường TLV: id 2 ký tự + độ dài 2 chữ số + giá trị. */
export function tlv(id: string, value: string): string {
  if (value.length > 99) throw new Error(`Trường ${id} quá dài (${value.length} ký tự)`)
  return `${id}${String(value.length).padStart(2, '0')}${value}`
}

/** CRC-16/CCITT-FALSE (đa thức 0x1021, khởi tạo 0xFFFF), trả về 4 ký tự hex in hoa. */
export function crc16(input: string): string {
  let crc = 0xffff
  for (let i = 0; i < input.length; i++) {
    crc ^= input.charCodeAt(i) << 8
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

export function vietQRPayload({ bin, accountNumber, purpose }: VietQRInput): string {
  if (!/^\d{6}$/.test(bin)) throw new Error(`BIN không hợp lệ: "${bin}"`)
  if (!/^\d{6,19}$/.test(accountNumber)) throw new Error(`Số tài khoản không hợp lệ: "${accountNumber}"`)
  if (purpose !== undefined && !/^[\x20-\x7E]{1,25}$/.test(purpose)) {
    throw new Error('Nội dung chuyển khoản phải là ASCII không dấu, tối đa 25 ký tự')
  }

  const beneficiary = tlv('00', bin) + tlv('01', accountNumber)
  const merchant = tlv('00', NAPAS_GUID) + tlv('01', beneficiary) + tlv('02', SERVICE_TO_ACCOUNT)
  let payload = tlv('00', '01') + tlv('01', '11') + tlv('38', merchant) + tlv('53', '704') + tlv('58', 'VN')
  if (purpose) payload += tlv('62', tlv('08', purpose))
  payload += '6304'
  return payload + crc16(payload)
}

/** Tách chuỗi TLV thành map id → giá trị (dùng để kiểm tra). */
export function parseTlv(input: string): Record<string, string> {
  const fields: Record<string, string> = {}
  let i = 0
  while (i < input.length) {
    const id = input.slice(i, i + 2)
    const length = Number(input.slice(i + 2, i + 4))
    if (!Number.isInteger(length)) throw new Error(`TLV hỏng tại vị trí ${i}`)
    fields[id] = input.slice(i + 4, i + 4 + length)
    i += 4 + length
  }
  return fields
}
