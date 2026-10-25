/**
 * Nội dung chia sẻ link (tiêu đề, mô tả, ảnh xem trước trên Zalo/Messenger/Facebook) — suy ra
 * từ wedding.ts, dùng chung cho script sinh ảnh OG và plugin chèn thẻ meta trong vite.config.
 */
import { createHash } from 'node:crypto'
import { wedding } from '../src/content/wedding.ts'
import { dottedDate, orderedCouple, primaryDay, solarParts, weekday } from '../src/lib/format.ts'

const [first, second] = orderedCouple(wedding.couple)
const day = primaryDay(wedding.days)

export const share = {
  title: `${first.givenName} & ${second.givenName} · Thiệp cưới`,
  description: `Trân trọng kính mời bạn đến chung vui cùng ${first.givenName} & ${second.givenName} · ${weekday(day.solar)} ${dottedDate(day.solar)}`,
  first: first.givenName,
  second: second.givenName,
  monogram: wedding.couple.monogram,
  tagline: wedding.couple.tagline ?? '',
  dateLine: `${weekday(day.solar)} · ${dottedDate(day.solar)}`,
  year: solarParts(day.solar).year,
  image: '/og.jpg',
  imageWidth: 1200,
  imageHeight: 630,
}

export const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export const shareImageVersion = (image: Uint8Array) => createHash('sha256').update(image).digest('hex').slice(0, 12)
export const versionedShareImage = (version: string) => `/social/wedding-${version}.jpg`

/**
 * Thẻ meta cho <head>. Ảnh OG cần URL tuyệt đối: lấy từ SITE_URL (tên miền chính thức) hoặc
 * CF_PAGES_URL (Cloudflare Pages tự cấp khi build); không có thì dùng đường dẫn tương đối.
 */
export function shareMetaTags(siteUrl?: string, imageVersion?: string): string {
  const origin = siteUrl?.trim().replace(/\/+$/, '') ?? ''
  const image = `${origin}${imageVersion ? versionedShareImage(imageVersion) : share.image}`
  const tags: Array<[string, string, string]> = [
    ['name', 'description', share.description],
    ['property', 'og:type', 'website'],
    ['property', 'og:locale', 'vi_VN'],
    ['property', 'og:title', share.title],
    ['property', 'og:description', share.description],
    ['property', 'og:image', image],
    ...(image.startsWith('https://') ? [['property', 'og:image:secure_url', image] as [string, string, string]] : []),
    ['property', 'og:image:type', 'image/jpeg'],
    ['property', 'og:image:width', String(share.imageWidth)],
    ['property', 'og:image:height', String(share.imageHeight)],
    ['property', 'og:image:alt', `Thiệp cưới ${share.first} & ${share.second}`],
    ['name', 'twitter:card', 'summary_large_image'],
    ['name', 'twitter:title', share.title],
    ['name', 'twitter:description', share.description],
    ['name', 'twitter:image', image],
    ['name', 'twitter:image:alt', `Thiệp cưới ${share.first} & ${share.second}`],
  ]
  if (origin) tags.push(['property', 'og:url', `${origin}/${imageVersion ? `?v=${imageVersion}` : ''}`])
  return tags.map(([attr, key, value]) => `<meta ${attr}="${key}" content="${escapeHtml(value)}" />`).join('\n    ')
}
