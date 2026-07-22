import type { ReviewItem } from '@/types'
import { cn } from '@/utils/cn'
import { TierBadge } from '@/components/common'
import { REVIEW_CATEGORY_LABEL } from '@/utils/labels'

export function ReviewQueueRail({
  items,
  selectedId,
  onSelect,
}: {
  items: ReviewItem[]
  selectedId: string | undefined
  onSelect: (id: string) => void
}) {
  return (
    <nav className="queue-rail" aria-label="Review queue">
      <div className="queue-rail-head">
        <span className="eyebrow">Queue</span>
        <span className="badge badge-amber">{items.length}</span>
      </div>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className={cn('queue-item', selectedId === item.id && 'queue-item-active')}
              onClick={() => onSelect(item.id)}
              aria-current={selectedId === item.id}
            >
              <span className="queue-item-cat">{REVIEW_CATEGORY_LABEL[item.category]}</span>
              <span className="queue-item-name mono">{item.datasetName}</span>
              <span className="queue-item-meta">
                <TierBadge tier={item.currentClassification} />
                <span className="muted">{item.confidence}%</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
