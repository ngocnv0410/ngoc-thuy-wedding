import jsQR from 'jsqr'
import { PNG } from 'pngjs'
import QRCode from 'qrcode'
import { describe, expect, it } from 'vitest'
import accounts from '../content/accounts.json'
import { crc16, parseTlv, vietQRPayload } from './vietqr'

describe('crc16 (CCITT-FALSE)', () => {
  it('khớp vector chuẩn "123456789" → 29B1', () => {
    expect(crc16('123456789')).toBe('29B1')
  })
})

describe('vietQRPayload', () => {
  const payload = vietQRPayload({ bin: '970418', accountNumber: '8856138148' })

  it('đúng cấu trúc NAPAS chuyển đến tài khoản', () => {
    const fields = parseTlv(payload)
    expect(fields['00']).toBe('01')
    expect(fields['01']).toBe('11')
    expect(fields['53']).toBe('704')
    expect(fields['58']).toBe('VN')
    const merchant = parseTlv(fields['38'])
    expect(merchant['00']).toBe('A000000727')
    expect(merchant['02']).toBe('QRIBFTTA')
    expect(parseTlv(merchant['01'])).toEqual({ '00': '970418', '01': '8856138148' })
  })

  it('CRC cuối chuỗi tính trên toàn bộ phần trước, gồm cả "6304"', () => {
    expect(payload.slice(-8, -4)).toBe('6304')
    expect(payload.slice(-4)).toBe(crc16(payload.slice(0, -4)))
  })

  it('nội dung chuyển khoản nằm trong trường 62/08', () => {
    const withPurpose = vietQRPayload({ bin: '970407', accountNumber: '19034949101013', purpose: 'Mung cuoi' })
    expect(parseTlv(parseTlv(withPurpose)['62'])['08']).toBe('Mung cuoi')
  })

  it.each([
    [{ bin: '97041', accountNumber: '8856138148' }],
    [{ bin: '970418', accountNumber: '10174-48458' }],
    [{ bin: '970418', accountNumber: '8856138148', purpose: 'Mừng cưới' }],
  ])('từ chối dữ liệu sai %#', (input) => {
    expect(() => vietQRPayload(input)).toThrow()
  })
})

describe('QR thật của cô dâu chú rể', () => {
  it.each(accounts.map((account) => [account.bankName, account] as const))(
    '%s: ảnh QR giải mã lại đúng payload',
    async (_, account) => {
      const payload = vietQRPayload({ bin: account.bin, accountNumber: account.accountNumber })
      const buffer = await QRCode.toBuffer(payload, { errorCorrectionLevel: 'M', margin: 4, width: 512 })
      const png = PNG.sync.read(buffer)
      const decoded = jsQR(new Uint8ClampedArray(png.data), png.width, png.height)
      expect(decoded?.data).toBe(payload)
    },
  )

  it('BIN khớp danh sách Ngân hàng Nhà nước', () => {
    const KNOWN_BIN: Record<string, string> = { Techcombank: '970407', BIDV: '970418' }
    for (const account of accounts) expect(account.bin).toBe(KNOWN_BIN[account.bankName])
  })
})
