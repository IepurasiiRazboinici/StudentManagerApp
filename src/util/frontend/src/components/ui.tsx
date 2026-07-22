import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'
import { X } from 'lucide-react'
import type { ClassificationTier, EvidenceKind, UsageStatus } from '../types'

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'icon'
}) {
  return <button className={clsx('button', `button-${variant}`, `button-${size}`, className)} {...props} />
}

export function StatusBadge({
  children,
  tone = 'neutral',
  dashed = false,
  className,
}: {
  children: ReactNode
  tone?: 'neutral' | 'blue' | 'amber' | 'red' | 'green' | 'violet' | 'teal'
  dashed?: boolean
  className?: string
}) {
  return <span className={clsx('badge', `badge-${tone}`, dashed && 'badge-dashed', className)}>{children}</span>
}

export function ClassificationBadge({ value }: { value: ClassificationTier }) {
  const tone: Record<ClassificationTier, 'neutral' | 'blue' | 'amber' | 'red'> = {
    Public: 'neutral',
    Corporate: 'blue',
    Restricted: 'amber',
    'Highly Restricted': 'red',
    Unknown: 'neutral',
  }

  return (
    <StatusBadge tone={tone[value]} dashed={value === 'Unknown'}>
      {value}
    </StatusBadge>
  )
}

export function UsageBadge({ value }: { value: UsageStatus }) {
  const tone: Record<UsageStatus, 'neutral' | 'blue' | 'amber' | 'red' | 'green'> = {
    Allowed: 'green',
    Conditional: 'amber',
    Blocked: 'red',
    'Guidance Needed': 'neutral',
    'Conditionally allowed': 'amber',
  }

  return <StatusBadge tone={tone[value]}>{value}</StatusBadge>
}

export function EvidenceBadge({ kind }: { kind: EvidenceKind }) {
  const labels: Record<EvidenceKind, string> = {
    detector: 'Detector',
    policy: 'Policy',
    context: 'Context',
    aggregation: 'Aggregation',
    human: 'Human decision',
  }
  const tones: Record<EvidenceKind, 'green' | 'violet' | 'blue' | 'amber' | 'teal'> = {
    detector: 'green',
    policy: 'violet',
    context: 'blue',
    aggregation: 'amber',
    human: 'teal',
  }

  return <StatusBadge tone={tones[kind]}>{labels[kind]}</StatusBadge>
}

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  return (
    <div className="progress-wrap" aria-label={label}>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${Math.max(0, Math.min(value, 100))}%` }} />
      </div>
      {label ? <span className="progress-label">{label}</span> : null}
    </div>
  )
}

export function IconButton({
  label,
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
  children: ReactNode
}) {
  return (
    <button className={clsx('icon-button', className)} aria-label={label} title={label} {...props}>
      {children}
    </button>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('skeleton', className)} aria-hidden="true" />
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <section className="empty-state">
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </section>
  )
}

export function InlineError({
  title = 'Classification failed. The dataset profile is still available.',
  action,
}: {
  title?: string
  action?: ReactNode
}) {
  return (
    <div className="inline-error" role="alert">
      <p>{title}</p>
      {action}
    </div>
  )
}

export function Drawer({
  open,
  title,
  children,
  onClose,
  wide = false,
}: {
  open: boolean
  title: string
  children: ReactNode
  onClose: () => void
  wide?: boolean
}) {
  if (!open) {
    return null
  }

  return (
    <div className="overlay-layer" role="presentation">
      <button className="overlay-scrim" aria-label="Close panel" onClick={onClose} />
      <aside className={clsx('drawer', wide && 'drawer-wide')} aria-label={title}>
        <div className="drawer-header">
          <h2>{title}</h2>
          <IconButton label="Close panel" onClick={onClose}>
            <X size={18} />
          </IconButton>
        </div>
        {children}
      </aside>
    </div>
  )
}

export function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean
  title: string
  children: ReactNode
  onClose: () => void
}) {
  if (!open) {
    return null
  }

  return (
    <div className="overlay-layer" role="presentation">
      <button className="overlay-scrim" aria-label="Close dialog" onClick={onClose} />
      <section className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="drawer-header">
          <h2>{title}</h2>
          <IconButton label="Close dialog" onClick={onClose}>
            <X size={18} />
          </IconButton>
        </div>
        {children}
      </section>
    </div>
  )
}

export function MetricBlock({
  label,
  value,
  onClick,
}: {
  label: string
  value: string | number
  onClick?: () => void
}) {
  const Element = onClick ? 'button' : 'div'

  return (
    <Element className="metric-block" onClick={onClick}>
      <strong>{value}</strong>
      <span>{label}</span>
    </Element>
  )
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="section-header">
      <div>
        {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {action ? <div className="section-actions">{action}</div> : null}
    </div>
  )
}

export function KeyValue({
  label,
  value,
  mono = false,
}: {
  label: string
  value: ReactNode
  mono?: boolean
}) {
  return (
    <div className="key-value">
      <span>{label}</span>
      <strong className={mono ? 'mono' : undefined}>{value}</strong>
    </div>
  )
}

export function TabButton({
  active,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  active: boolean
}) {
  return (
    <button className={clsx('tab-button', active && 'tab-button-active')} {...props}>
      {children}
    </button>
  )
}

export function Panel({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx('panel', className)} {...props}>
      {children}
    </div>
  )
}
