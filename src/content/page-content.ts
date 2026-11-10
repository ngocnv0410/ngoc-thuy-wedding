// Browser-only image imports stay separate from wedding.ts, which Node reads at build time.
import { wedding as savedWedding } from './wedding'
import { sampleGallery } from './sample-gallery'
import type { WeddingContent } from './types'

export const wedding: WeddingContent = {
  ...savedWedding,
  gallery: savedWedding.gallery.length ? savedWedding.gallery : sampleGallery,
}
