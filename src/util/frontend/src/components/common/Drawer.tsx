import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { IconButton } from './primitives'

/**
 * Accessible right-side drawer. Renders a scrim + dialog, closes on Escape and
 * scrim click, and moves focus into the panel on open. The content behind stays
 * mounted (e.g. the dataset table under the Evidence Drawer).
 */
export function Drawer({
  open,
  title,
  subtitle,
  children,
  footer,
  onClose,
  wide = false,
  labelId = 'drawer-title',
}: {
  open: boolean
  title: ReactNode
  subtitle?: ReactNode
  children: ReactNode
  footer?: ReactNode
  onClose: () => void
  wide?: boolean
  labelId?: string
}) {
  const panelRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    panelRef.current?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="overlay-layer" role="presentation">
      <button className="overlay-scrim" aria-label="Close panel" onClick={onClose} />
      <aside
        ref={panelRef}
        className={cn('drawer', wide && 'drawer-wide')}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
        tabIndex={-1}
      >
        <div className="drawer-header">
          <div className="drawer-title-block">
            <h2 id={labelId}>{title}</h2>
            {subtitle ? <span>{subtitle}</span> : null}
          </div>
          <IconButton label="Close panel" onClick={onClose}>
            <X size={18} />
          </IconButton>
        </div>
        <div className="drawer-body">{children}</div>
        {footer ? <div className="drawer-actions">{footer}</div> : null}
      </aside>
    </div>
  )
}
