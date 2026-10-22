import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { imagetools } from 'vite-imagetools'
import { escapeHtml, share, shareMetaTags } from './scripts/share.ts'

/**
 * Chèn tiêu đề và thẻ chia sẻ (Open Graph) vào index.html từ wedding.ts — một nguồn dữ liệu.
 * URL tuyệt đối của ảnh OG: SITE_URL (tên miền chính thức) hoặc CF_PAGES_URL (Cloudflare Pages).
 */
function shareMeta(): Plugin {
  return {
    name: 'share-meta',
    transformIndexHtml(html) {
      return html
        .replace('%SHARE_TITLE%', escapeHtml(share.title))
        .replace('<!-- share-meta -->', shareMetaTags(process.env.SITE_URL ?? process.env.CF_PAGES_URL))
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Ảnh gốc trong src/assets/photos được xử lý lúc build thành AVIF/WebP/JPEG + srcset.
    // Directive cụ thể (kích thước, format) khai báo ngay tại câu import, ví dụ:
    //   import cover from './cover.jpg?w=640;1080;1600&format=avif;webp;jpg&as=picture'
    imagetools({ removeMetadata: true }),
    shareMeta(),
  ],
  // Thư viện chỉ được import động (chunk motion, chunk 3D): khai báo trước để dev server không
  // phải tối ưu lại giữa chừng (lỗi 504 "Outdated Optimize Dep" ở lần tải đầu).
  optimizeDeps: {
    include: ['gsap', 'gsap/ScrollTrigger', 'gsap/SplitText', 'gsap/DrawSVGPlugin', 'lenis', 'three', '@react-three/fiber'],
  },
})
