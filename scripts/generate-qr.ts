/**
 * Sinh ảnh QR VietQR cho từng tài khoản mừng cưới vào public/qr/<id>.png.
 * Chạy tự động trước `dev` và `build` (xem package.json); Node 24 chạy thẳng file .ts.
 *
 * QR đen thuần trên nền trắng thuần, quiet zone 4 module, sửa lỗi mức M, 1024px — đủ nét để
 * quét trực tiếp trên màn hình và khi khách lưu ảnh rồi quét từ thư viện ảnh.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import QRCode from 'qrcode'
import accounts from '../src/content/accounts.json' with { type: 'json' }
import { vietQRPayload } from '../src/lib/vietqr.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'public', 'qr')
mkdirSync(outDir, { recursive: true })

for (const account of accounts) {
  const payload = vietQRPayload({ bin: account.bin, accountNumber: account.accountNumber })
  const png = await QRCode.toBuffer(payload, {
    type: 'png',
    errorCorrectionLevel: 'M',
    margin: 4,
    width: 1024,
    color: { dark: '#000000', light: '#ffffff' },
  })
  writeFileSync(join(outDir, `${account.id}.png`), png)
  console.log(`QR ${account.id}: ${account.bankName} ${account.accountNumber}`)
}
