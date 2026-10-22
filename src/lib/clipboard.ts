/**
 * Sao chép văn bản. Trình duyệt nhúng (Zalo, Messenger) đôi khi chặn `navigator.clipboard`,
 * nên có fallback `execCommand`. Trả `false` khi cả hai thất bại; UI khi đó chọn sẵn đoạn
 * text để khách tự nhấn giữ sao chép.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Rơi xuống fallback bên dưới.
  }
  return legacyCopy(text)
}

function legacyCopy(text: string): boolean {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  textarea.setSelectionRange(0, text.length)
  let ok = false
  try {
    ok = document.execCommand('copy')
  } catch {
    ok = false
  }
  textarea.remove()
  return ok
}

/** Hiển thị STK theo nhóm 4 số cho dễ đọc; khi sao chép vẫn dùng chuỗi gốc. */
export function groupDigits(accountNumber: string): string {
  return accountNumber.replace(/\s+/g, '').replace(/(\d{4})(?=\d)/g, '$1 ')
}
