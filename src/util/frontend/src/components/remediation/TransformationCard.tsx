import { Check } from 'lucide-react'
import type { RemediationTransformation } from '@/types'
import { cn } from '@/utils/cn'
import { TRANSFORMATION_LABEL } from '@/utils/labels'

export function TransformationCard({
  transformation,
  selected,
  onToggle,
}: {
  transformation: RemediationTransformation
  selected: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      className={cn('transformation-card', selected && 'transformation-card-selected')}
      onClick={onToggle}
      aria-pressed={selected}
    >
      <span className="transformation-check" aria-hidden>
        {selected ? <Check size={14} /> : null}
      </span>
      <span className="transformation-body">
        <span className="transformation-title">
          {transformation.title}
          {transformation.recommended ? <span className="badge badge-green">Recommended</span> : null}
        </span>
        <span className="transformation-kind mono">{TRANSFORMATION_LABEL[transformation.kind]}</span>
        <span className="transformation-desc">{transformation.description}</span>
      </span>
    </button>
  )
}
