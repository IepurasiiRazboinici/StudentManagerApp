import type { ReactNode } from 'react'
import { AlertTriangle, Inbox, RotateCcw } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from './primitives'

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} aria-hidden="true" />
}

/** A skeleton shaped like a data table (header + rows). */
export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="table-skeleton" aria-hidden="true">
      <div className="table-skeleton-head" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="skeleton-line" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="table-skeleton-row" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="skeleton-line" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function CardsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="cards-skeleton" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="panel">
          <Skeleton className="skeleton-eyebrow" />
          <Skeleton className="skeleton-title" />
          <Skeleton className="skeleton-line" />
        </div>
      ))}
    </div>
  )
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string
  description: string
  action?: ReactNode
  icon?: ReactNode
}) {
  return (
    <section className="empty-state" aria-live="polite">
      <span className="empty-icon">{icon ?? <Inbox size={22} aria-hidden />}</span>
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </section>
  )
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'The request failed. Please try again.',
  onRetry,
  retryLabel = 'Retry',
}: {
  title?: string
  description?: string
  onRetry?: () => void
  retryLabel?: string
}) {
  return (
    <section className="error-state" role="alert">
      <span className="error-icon">
        <AlertTriangle size={22} aria-hidden />
      </span>
      <h2>{title}</h2>
      <p>{description}</p>
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry}>
          <RotateCcw size={15} /> {retryLabel}
        </Button>
      ) : null}
    </section>
  )
}

export function InlineError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="inline-error" role="alert">
      <p>{message}</p>
      {onRetry ? (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          <RotateCcw size={14} /> Retry
        </Button>
      ) : null}
    </div>
  )
}
