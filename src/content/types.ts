/**
 * Schema nội dung thiệp cưới. `wedding.ts` là nguồn dữ liệu duy nhất; component không được
 * tự sinh ngày, giờ, địa điểm hay thông tin ngân hàng.
 * Trường optional bị bỏ trống thì khối tương ứng bị ẩn trên trang.
 */

/** Bên tổ chức: nhà gái, nhà trai, hoặc chung (tiệc). */
export type Side = 'bride' | 'groom' | 'both'

export interface Person {
  /** Tên gọi hiển thị lớn ở Hero, ví dụ "Thủy". */
  givenName: string
  /** Họ tên đầy đủ, hiển thị ở phần Hai họ. */
  fullName: string
  father?: string
  mother?: string
}

export interface Couple {
  bride: Person
  groom: Person
  /** Thứ tự tên trên Hero và phong bì. */
  order: 'groom-first' | 'bride-first'
  /** Chữ cái trên dấu sáp, ví dụ "T & N". */
  monogram: string
  tagline?: string
}

export interface LunarDate {
  day: number
  month: number
  year: number
  /** Tháng nhuận. */
  leap?: boolean
  /** Tên năm Can Chi, ví dụ "Bính Ngọ". */
  yearName: string
}

export interface WeddingDay {
  id: string
  /** "Lễ ăn hỏi", "Lễ đón dâu"… */
  title: string
  /** Ngày dương lịch `YYYY-MM-DD`. */
  solar: string
  /** Ngày âm lịch; được test đối chiếu với `solar`. */
  lunar: LunarDate
  /** Ngày hiển thị trên bìa và phong bì. Đúng một ngày được đánh dấu. */
  primary?: boolean
}

/** Giờ `HH:mm`. */
export type Time = string

export interface WeddingEvent {
  id: string
  title: string
  /** Tham chiếu `WeddingDay.id`. */
  dayId: string
  /** Bỏ trống thì không hiện nhãn Nhà gái/Nhà trai. */
  side?: Side
  /** Bỏ trống khi chưa chốt giờ: trang hiện ngày, lịch thêm sự kiện cả ngày. */
  time?: Time
  endTime?: Time
  /** Tham chiếu `Location.id`. */
  locationId?: string
  note?: string
}

export interface Coordinates {
  lat: number
  lng: number
}

export interface Location {
  id: string
  side: Side
  /** Nhãn ngắn: "Nhà gái", "Nhà trai", "Nhà hàng". */
  label: string
  name: string
  address: string
  coords?: Coordinates
  /** Google Place ID, giúp Maps hiển thị đúng tên địa điểm. */
  placeId?: string
  /** Link Google Maps do cô dâu chú rể cung cấp (dùng khi không có toạ độ/placeId). */
  mapsUrl?: string
  /** Gửi xe, sảnh, tầng… */
  note?: string
  phone?: string
  /** Cho phép mở bản đồ nhúng (facade) — mặc định tắt. */
  embed?: boolean
}

export interface BankAccount {
  id: string
  side: Side
  bankName: string
  /** Mã BIN theo danh sách của Ngân hàng Nhà nước — dùng để sinh VietQR. */
  bin: string
  /** In hoa, đúng như ngân hàng hiển thị. */
  accountName: string
  /** Chuỗi gốc, chỉ gồm chữ số. */
  accountNumber: string
  /** Ảnh QR VietQR sinh lúc build (`public/qr/<id>.png`). */
  qrImage: string
}

/** Vai trò của ảnh trong câu chuyện; quyết định layout và chuyển động. */
export type PhotoRole = 'hero-portrait' | 'landscape' | 'detail' | 'pair' | 'quote'

/**
 * Kết quả import ảnh qua vite-imagetools với `&as=picture`
 * (ví dụ `import img from './a.jpg?w=640;1280&format=avif;webp;jpg&as=picture'`).
 */
export interface ResponsiveImage {
  /** Format → srcset. */
  sources: Record<string, string>
  img: { src: string; w: number; h: number }
}

export interface Cover {
  /** Ảnh ngang cho tablet/desktop. */
  landscape: ResponsiveImage
  /** Ảnh dọc riêng cho điện thoại (art direction). */
  portrait?: ResponsiveImage
  alt: string
  /** `object-position` chỉnh tay theo bố cục ảnh, ví dụ "50% 30%". */
  focus?: string
}

export interface Photo {
  image: ResponsiveImage
  alt: string
  role: Exclude<PhotoRole, 'quote'>
  caption?: string
}

export interface Quote {
  role: 'quote'
  text: string
}

export interface GalleryChapter {
  id: string
  title: string
  caption?: string
  items: Array<Photo | Quote>
}

export interface Video {
  src: string
  /** Bản nhẹ cho mạng chậm. */
  srcLow?: string
  poster: string
  title: string
  captions?: string
}

export interface Music {
  src: string
  title: string
}

export interface WeddingContent {
  couple: Couple
  cover?: Cover
  days: WeddingDay[]
  invitation?: string
  events: WeddingEvent[]
  locations: Location[]
  gallery: GalleryChapter[]
  video?: Video
  thankYou: string[]
  accounts: BankAccount[]
  music?: Music
}
