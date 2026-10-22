import styles from './PendingNote.module.css'

/**
 * Ghi chú "đang chờ dữ liệu" — CHỈ hiện khi chạy dev để duyệt bố cục.
 * Bản build production không render gì (khối thiếu dữ liệu sẽ bị ẩn).
 */
export function PendingNote({ children }: { children: string }) {
  if (!import.meta.env.DEV) return null
  return (
    <p className={styles.note}>
      <strong>Chờ dữ liệu (chỉ hiện ở bản dev):</strong> {children}
    </p>
  )
}
