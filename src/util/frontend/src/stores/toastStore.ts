import { create } from 'zustand'

export type ToastTone = 'success' | 'error' | 'info'

export interface Toast {
  id: string
  message: string
  tone: ToastTone
  actionLabel?: string
  onAction?: () => void
}

interface ToastState {
  toasts: Toast[]
  push: (toast: Omit<Toast, 'id' | 'tone'> & { tone?: ToastTone }) => string
  dismiss: (id: string) => void
}

let seq = 0

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (toast) => {
    seq += 1
    const id = `toast-${seq}`
    const entry: Toast = { id, tone: toast.tone ?? 'info', message: toast.message, actionLabel: toast.actionLabel, onAction: toast.onAction }
    set((s) => ({ toasts: [...s.toasts.slice(-2), entry] }))
    setTimeout(() => get().dismiss(id), 6000)
    return id
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

/** Convenience helper for imperative call sites. */
export const toast = {
  success: (message: string, actionLabel?: string, onAction?: () => void) =>
    useToastStore.getState().push({ message, tone: 'success', actionLabel, onAction }),
  error: (message: string) => useToastStore.getState().push({ message, tone: 'error' }),
  info: (message: string) => useToastStore.getState().push({ message, tone: 'info' }),
}
