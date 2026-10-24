// Import attribute giúp script build (Node) đọc được file này trực tiếp — xem scripts/generate-og.ts.
// Ảnh (import qua vite-imagetools) KHÔNG được import ở đây mà ở file nội dung riêng, vì Node không hiểu.
import accountData from './accounts.json' with { type: 'json' }
import type { Side, WeddingContent } from './types'

/**
 * DỮ LIỆU THẬT — nguồn duy nhất cho toàn bộ trang.
 *
 * Quy ước:
 * - Mục ghi "ĐỀ XUẤT" là lời văn Claude đề xuất — cô dâu chú rể đã duyệt ngày 22/10/2026.
 * - Ngày âm được tính bằng thuật toán Hồ Ngọc Đức (UTC+7) và test đối chiếu; cần so lại
 *   với thiệp giấy trước khi gửi link.
 * - Mảng rỗng / trường bỏ trống = khối đó tự ẩn trên trang.
 * - Tài khoản mừng cưới nằm ở accounts.json (script build đọc file này để sinh ảnh VietQR).
 */
export const wedding: WeddingContent = {
  couple: {
    groom: {
      givenName: 'Ngọc',
      fullName: 'Nguyễn Văn Ngọc',
      father: 'Nguyễn Văn Hòa',
      mother: 'Thạch Thị Hà',
    },
    bride: {
      givenName: 'Thủy',
      fullName: 'Ngô Thị Thủy',
      father: 'Ngô Văn Thọ',
      mother: 'Phạm Thị Thuận',
    },
    order: 'groom-first',
    // ĐỀ XUẤT: chữ cái đầu tên gọi, theo thứ tự chú rể trước.
    monogram: 'N & T',
    // ĐỀ XUẤT — duyệt 23/10/2026
    tagline: 'Rất mong được đón bạn đến chung vui',
  },

  days: [
    {
      id: 'an-hoi',
      title: 'Lễ ăn hỏi',
      solar: '2026-12-23',
      lunar: { day: 15, month: 11, year: 2026, yearName: 'Bính Ngọ' },
    },
    {
      id: 'don-dau',
      title: 'Lễ đón dâu',
      solar: '2026-12-24',
      lunar: { day: 16, month: 11, year: 2026, yearName: 'Bính Ngọ' },
      primary: true,
    },
  ],

  // ĐỀ XUẤT
  invitation: 'Trân trọng kính mời quý khách đến chung vui cùng gia đình chúng tôi trong ngày trọng đại của hai con.',

  // Giờ, bên tổ chức và địa điểm: bổ sung sau.
  events: [
    { id: 'an-hoi', title: 'Lễ ăn hỏi', dayId: 'an-hoi' },
    { id: 'don-dau', title: 'Lễ đón dâu', dayId: 'don-dau' },
  ],

  // Địa chỉ ghi đúng như cô dâu chú rể cung cấp; nút "Chỉ đường" mở link Google Maps kèm theo.
  locations: [
    {
      id: 'nha-gai',
      side: 'bride',
      label: 'Nhà gái',
      name: 'Ngô Thị Thủy',
      address: 'Xuân Cẩm - Hiệp Hòa - Bắc Giang',
      mapsUrl: 'https://maps.app.goo.gl/a1HZ6LF68gpcjcvz7',
    },
    {
      id: 'nha-trai',
      side: 'groom',
      label: 'Nhà trai',
      name: 'Nguyễn Văn Ngọc',
      address: 'Số 5 - ngách 58/1 đường Đình Xuyên - Phù Đổng - Hà Nội',
      mapsUrl: 'https://maps.app.goo.gl/SdhAhyZfi9LXfArMA',
    },
  ],

  // Chờ ảnh.
  gallery: [],

  music: {
    src: 'audio/canon-in-d-piano.mp3',
    title: 'Canon in D — Pachelbel',
    artist: 'Lee Galloway · Piano',
    artistUrl: 'https://www.leegalloway.com/',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Pachelbel%27s_Canon.ogg',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
  },

  // ĐỀ XUẤT
  thankYou: [
    'Cảm ơn bạn đã dành chút thời gian mở tấm thiệp nhỏ này.',
    'Sự hiện diện và lời chúc phúc của bạn là món quà quý giá nhất đối với chúng mình.',
    'Hẹn gặp bạn trong ngày vui!',
  ],

  accounts: accountData.map((account) => ({
    ...account,
    side: account.side as Side,
    qrImage: `/qr/${account.id}.png`,
  })),

}
