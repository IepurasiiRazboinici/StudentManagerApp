import type { ReactNode } from 'react'
import {
  CircleHelp,
  FileCheck2,
  Landmark,
  Lock,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  UserCheck,
} from 'lucide-react'
import type {
  ClassificationTier,
  EvidenceKind,
  RulePriority,
  ReviewStatus,
  Severity,
  UsageStatus,
} from '@/types'
import {
  EVIDENCE_KIND_LABEL,
  EVIDENCE_KIND_TONE,
  PRIORITY_LABEL,
  PRIORITY_TONE,
  REVIEW_STATUS_LABEL,
  REVIEW_STATUS_TONE,
  SEVERITY_LABEL,
  SEVERITY_TONE,
  TIER_LABEL,
  TIER_TONE,
  USAGE_STATUS_LABEL,
  USAGE_STATUS_TONE,
} from '@/utils/labels'
import type { Tone } from '@/utils/labels'
import { cn } from '@/utils/cn'
import { formatConfidence } from '@/utils/format'

export function StatusBadge({
  children,
  tone = 'neutral',
  dashed = false,
  icon,
  className,
}: {
  children: ReactNode
  tone?: Tone
  dashed?: boolean
  icon?: ReactNode
  className?: string
}) {
  return (
    <span className={cn('badge', `badge-${tone}`, dashed && 'badge-dashed', className)}>
      {icon}
      {children}
    </span>
  )
}

const TIER_ICON: Record<ClassificationTier, ReactNode> = {
  PUBLIC: <ShieldCheck size={13} aria-hidden />,
  CORPORATE: <Landmark size={13} aria-hidden />,
  RESTRICTED: <ShieldAlert size={13} aria-hidden />,
  HIGHLY_RESTRICTED: <ShieldX size={13} aria-hidden />,
  UNKNOWN: <CircleHelp size={13} aria-hidden />,
}

export function TierBadge({ tier }: { tier: ClassificationTier }) {
  return (
    <StatusBadge tone={TIER_TONE[tier]} dashed={tier === 'UNKNOWN'} icon={TIER_ICON[tier]}>
      {TIER_LABEL[tier]}
    </StatusBadge>
  )
}

export function ReviewStatusBadge({ status }: { status: ReviewStatus }) {
  const icon = status === 'REVIEW_REQUIRED' ? <ShieldAlert size={13} aria-hidden /> : status === 'CONFIRMED' ? <FileCheck2 size={13} aria-hidden /> : undefined
  return (
    <StatusBadge tone={REVIEW_STATUS_TONE[status]} icon={icon}>
      {REVIEW_STATUS_LABEL[status]}
    </StatusBadge>
  )
}

const USAGE_ICON: Record<UsageStatus, ReactNode> = {
  ALLOWED: <ShieldCheck size={13} aria-hidden />,
  CONDITIONALLY_ALLOWED: <ShieldAlert size={13} aria-hidden />,
  BLOCKED: <ShieldX size={13} aria-hidden />,
  REVIEW_REQUIRED: <UserCheck size={13} aria-hidden />,
}

export function UsageStatusBadge({ status }: { status: UsageStatus }) {
  return (
    <StatusBadge tone={USAGE_STATUS_TONE[status]} icon={USAGE_ICON[status]}>
      {USAGE_STATUS_LABEL[status]}
    </StatusBadge>
  )
}

export function EvidenceBadge({ kind }: { kind: EvidenceKind }) {
  return <StatusBadge tone={EVIDENCE_KIND_TONE[kind]}>{EVIDENCE_KIND_LABEL[kind]}</StatusBadge>
}

export function PriorityBadge({ priority }: { priority: RulePriority }) {
  return <StatusBadge tone={PRIORITY_TONE[priority]}>{PRIORITY_LABEL[priority]}</StatusBadge>
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  return <StatusBadge tone={SEVERITY_TONE[severity]}>{SEVERITY_LABEL[severity]}</StatusBadge>
}

export function SystemLock() {
  return (
    <span className="system-lock" title="Protected system rule">
      <Lock size={13} aria-hidden /> System
    </span>
  )
}

export function ConfidenceIndicator({ value, size = 'md' }: { value: number; size?: 'sm' | 'md' }) {
  const clamped = Math.max(0, Math.min(value, 100))
  const level = clamped >= 85 ? 'high' : clamped >= 65 ? 'medium' : 'low'
  return (
    <span className={cn('confidence', `confidence-${level}`, size === 'sm' && 'confidence-sm')} title={`Backend confidence ${formatConfidence(clamped)}`}>
      <span className="confidence-track" aria-hidden>
        <span className="confidence-fill" style={{ width: `${clamped}%` }} />
      </span>
      <span className="confidence-value">{formatConfidence(clamped)}</span>
    </span>
  )
}
