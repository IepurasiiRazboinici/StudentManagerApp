import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { Button, IconButton } from './primitives'

export function Modal({
  open,
  title,
  children,
  onClose,
  labelId = 'modal-title',
}: {
  open: boolean
  title: ReactNode
  children: ReactNode
  onClose: () => void
  labelId?: string
}) {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    ref.current?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="overlay-layer" role="presentation">
      <button className="overlay-scrim" aria-label="Close dialog" onClick={onClose} />
      <section ref={ref} className="modal" role="dialog" aria-modal="true" aria-labelledby={labelId} tabIndex={-1}>
        <div className="drawer-header">
          <h2 id={labelId}>{title}</h2>
          <IconButton label="Close dialog" onClick={onClose}>
            <X size={18} />
          </IconButton>
        </div>
        {children}
      </section>
    </div>
  )
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  message: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <div className="confirm-dialog">
        <p>{message}</p>
        <div className="form-actions">
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={destructive ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
