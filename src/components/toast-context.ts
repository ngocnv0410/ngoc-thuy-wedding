import { createContext, useContext } from 'react'

export type Notify = (message: string) => void

export const ToastContext = createContext<Notify>(() => {})

/** Hiện thông báo ngắn, được đọc qua vùng `aria-live`. */
export function useToast(): Notify {
  return useContext(ToastContext)
}
