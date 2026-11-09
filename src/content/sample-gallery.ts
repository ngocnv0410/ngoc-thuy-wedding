import garden from '../assets/gallery-samples/garden.webp?w=480;960&format=avif;webp&as=picture'
import letter from '../assets/gallery-samples/letter.webp?w=480;960&format=avif;webp&as=picture'
import flowers from '../assets/gallery-samples/flowers.webp?w=480;960&format=avif;webp&as=picture'
import arch from '../assets/gallery-samples/arch.webp?w=480;960&format=avif;webp&as=picture'
import rings from '../assets/gallery-samples/rings.webp?w=480;960&format=avif;webp&as=picture'
import moon from '../assets/gallery-samples/moon.webp?w=480;960&format=avif;webp&as=picture'
import type { GalleryChapter } from './types'

/** Temporary illustrations only. Replace these chapters when the wedding photos arrive. */
export const sampleGallery: GalleryChapter[] = [
  {
    id: 'mau-ben-nhau', title: 'Ngày mình bên nhau', sample: true,
    caption: 'Một câu chuyện nhỏ, được kể bằng những khoảnh khắc dịu dàng.',
    items: [
      { image: garden, role: 'hero-portrait', alt: 'Minh họa mẫu: cô dâu chú rể trong khu vườn', caption: 'Bên nhau, những ngày bình yên cũng thành đặc biệt.' },
      { image: letter, role: 'detail', alt: 'Minh họa mẫu: phong thư và lời hẹn ước', caption: 'Gửi người thương một lời hẹn.' },
      { role: 'quote', text: 'Điều đẹp nhất là từ nay, mình có nhau.' },
      { image: flowers, role: 'landscape', alt: 'Minh họa mẫu: hoa cưới trong nắng sớm', caption: 'Dành cho nhau những điều dịu dàng.' },
    ],
  },
  {
    id: 'mau-chung-doi', title: 'Hẹn một ngày chung đôi', sample: true,
    caption: 'Đếm từng ngày đến lúc cùng viết tiếp hành trình mới.',
    items: [
      { image: arch, role: 'pair', alt: 'Minh họa mẫu: cặp đôi dưới vòm hoa cưới', caption: 'Một ngày vui, một chặng đường mới.' },
      { image: rings, role: 'detail', alt: 'Minh họa mẫu: đôi nhẫn và dải lụa', caption: 'Một lời hứa để cùng gìn giữ.' },
      { image: moon, role: 'pair', alt: 'Minh họa mẫu: cặp đôi dưới ánh trăng', caption: 'Cùng nhau đi qua những mùa thương.' },
    ],
  },
]
