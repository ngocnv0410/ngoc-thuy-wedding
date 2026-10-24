export const WISH_NAME_LIMIT = 60
export const WISH_MESSAGE_LIMIT = 600

export interface WishDraft { name: string; message: string }
export interface WeddingWish extends WishDraft { id: string; createdAt: number }

export function normalizeWish(draft: WishDraft): WishDraft {
  return { name: draft.name.normalize('NFC').trim(), message: draft.message.normalize('NFC').trim() }
}

export const hasVisibleText = (text: string) => /[^\s\p{Z}\p{Cf}]/u.test(text)

export function validateWish(draft: WishDraft): string | undefined {
  const { name, message } = normalizeWish(draft)
  if (!hasVisibleText(name)) return 'Bạn hãy điền tên trước khi gửi nhé.'
  if (name.length > WISH_NAME_LIMIT) return `Tên tối đa ${WISH_NAME_LIMIT} ký tự.`
  if (!hasVisibleText(message)) return 'Bạn hãy viết lời chúc trước khi gửi nhé.'
  if (message.length > WISH_MESSAGE_LIMIT) return `Lời chúc tối đa ${WISH_MESSAGE_LIMIT} ký tự.`
}

export function wishErrorMessage(error: unknown): string {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : ''
  if (code.endsWith('unavailable') || code.endsWith('network-request-failed') || code === 'guestbook/offline') {
    return 'Chưa kết nối được. Lời chúc vẫn được giữ trong ô nhập, bạn thử lại khi có mạng nhé.'
  }
  if (code.endsWith('resource-exhausted') || code.endsWith('too-many-requests')) {
    return 'Hiện có nhiều lượt gửi. Bạn chờ một chút rồi thử lại nhé.'
  }
  return 'Chưa gửi được lời chúc. Nội dung vẫn được giữ lại để bạn thử lại.'
}
