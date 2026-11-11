// Browser-only imports. Replace these temporary illustrations with real wedding photos.
import garden from '../assets/gallery-samples/garden.webp?w=480;960&format=avif;webp&as=picture'
import arch from '../assets/gallery-samples/arch.webp?w=480;960&format=avif;webp&as=picture'
import moon from '../assets/gallery-samples/moon.webp?w=480;960&format=avif;webp&as=picture'
import type { HeadingPhotoContent, HeadingPhotoSection } from './types'

export const sampleHeadingPhotos: Partial<Record<HeadingPhotoSection, HeadingPhotoContent>> = {
  'thong-tin': { image: garden, alt: 'Ảnh mẫu: cặp đôi trong khu vườn', focus: '50% 52%', sample: true, style: 'double' },
  'dia-diem': { image: arch, alt: 'Ảnh mẫu: cặp đôi dưới vòm hoa', focus: '50% 52%', sample: true, style: 'soft' },
  'mung-cuoi': { image: moon, alt: 'Ảnh mẫu: cặp đôi dưới ánh trăng', focus: '50% 52%', sample: true, style: 'letter' },
}
