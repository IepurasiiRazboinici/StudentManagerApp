import { CheckCircle2, Info, XCircle } from 'lucide-react'
import { useToastStore } from '@/stores/toastStore'
import type { ToastTone } from '@/stores/toastStore'

const ICON: Record<ToastTone, typeof Info> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
}

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)

  return (
    <div className="toast-host" aria-live="polite" role="status">
      {toasts.map((t) => {
        const Icon = ICON[t.tone]
        return (
          <div key={t.id} className={`toast toast-${t.tone}`}>
            <Icon size={16} aria-hidden />
            <span>{t.message}</span>
            {t.actionLabel ? (
              <button
                type="button"
                onClick={() => {
                  t.onAction?.()
                  dismiss(t.id)
                }}
              >
                {t.actionLabel}
              </button>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
