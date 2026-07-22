import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle2 } from 'lucide-react'
import { cacheFlowApi } from '../../api/services/cacheFlow'
import { useApp } from '../../app/appContextValue'
import {
  Button,
  ClassificationBadge,
  EmptyState,
  InlineError,
  KeyValue,
  Panel,
  ProgressBar,
  SectionHeader,
  Skeleton,
  StatusBadge,
  TabButton,
} from '../../components/ui'
import type { ReviewItem } from '../../types'

type ReviewTab = 'pending' | 'policy-gaps' | 'completed'

export function ReviewCenterPage() {
  const [params] = useSearchParams()
  const initialTab = (params.get('tab') as ReviewTab | null) ?? 'pending'
  const [tab, setTab] = useState<ReviewTab>(initialTab)
  const pendingQuery = useQuery({
    queryKey: ['review-queue'],
    queryFn: cacheFlowApi.getReviewQueue,
  })
  const gapsQuery = useQuery({
    queryKey: ['policy-gaps'],
    queryFn: cacheFlowApi.getPolicyGaps,
  })
  const completedQuery = useQuery({
    queryKey: ['completed-reviews'],
    queryFn: cacheFlowApi.getCompletedReviews,
  })

  if (pendingQuery.isLoading || gapsQuery.isLoading || completedQuery.isLoading) {
    return <ReviewSkeleton />
  }

  if (pendingQuery.isError || gapsQuery.isError || completedQuery.isError) {
    return (
      <InlineError
        action={
          <Button
            variant="secondary"
            onClick={() => {
              void pendingQuery.refetch()
              void gapsQuery.refetch()
              void completedQuery.refetch()
            }}
          >
            Retry classification
          </Button>
        }
      />
    )
  }

  return (
    <div className="review-page">
      <SectionHeader
        eyebrow="Review Center"
        title="What requires a human decision?"
        description="Approve, change or escalate governance decisions from one compact queue."
      />

      <div className="tabs">
        <TabButton active={tab === 'pending'} onClick={() => setTab('pending')}>
          Pending
        </TabButton>
        <TabButton active={tab === 'policy-gaps'} onClick={() => setTab('policy-gaps')}>
          Policy Gaps
        </TabButton>
        <TabButton active={tab === 'completed'} onClick={() => setTab('completed')}>
          Completed
        </TabButton>
      </div>

      {tab === 'pending' ? <PendingReview items={pendingQuery.data ?? []} /> : null}
      {tab === 'policy-gaps' ? <PolicyGaps items={gapsQuery.data ?? []} /> : null}
      {tab === 'completed' ? <CompletedReviews /> : null}
    </div>
  )
}

function PendingReview({ items }: { items: ReviewItem[] }) {
  const { showToast } = useApp()
  const [queue, setQueue] = useState(items)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [fullEvidenceOpen, setFullEvidenceOpen] = useState(false)

  const selected = queue[selectedIndex]

  const moveNext = () => setSelectedIndex((current) => Math.min(current + 1, Math.max(queue.length - 1, 0)))
  const movePrev = () => setSelectedIndex((current) => Math.max(current - 1, 0))

  const approveSelected = () => {
    if (!selected) {
      return
    }

    const approved = selected
    const previousIndex = selectedIndex
    setQueue((current) => current.filter((item) => item.id !== approved.id))
    setSelectedIndex((current) => Math.min(current, Math.max(queue.length - 2, 0)))
    showToast(`${approved.datasetName} approved.`, {
      actionLabel: 'Undo',
      onAction: () => {
        setQueue((current) => {
          const next = [...current]
          next.splice(previousIndex, 0, approved)
          return next
        })
        setSelectedIndex(previousIndex)
      },
    })
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }

      if (event.key === 'j' || event.key === 'ArrowDown') {
        event.preventDefault()
        moveNext()
      }
      if (event.key === 'k' || event.key === 'ArrowUp') {
        event.preventDefault()
        movePrev()
      }
      if (event.key.toLowerCase() === 'a') {
        event.preventDefault()
        approveSelected()
      }
      if (event.key.toLowerCase() === 'u') {
        event.preventDefault()
        showToast('Use the Undo action on the latest approval toast.')
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  if (!selected) {
    return (
      <EmptyState
        title="Pending queue cleared"
        description="No remaining review decisions require action in this workspace."
      />
    )
  }

  return (
    <div className="review-split">
      <aside className="queue-rail" aria-label="Pending review queue">
        <div className="queue-progress">
          <strong>14 of 37 reviewed</strong>
          <ProgressBar value={38} />
        </div>
        {queue.map((item, index) => (
          <button
            key={item.id}
            className={index === selectedIndex ? 'queue-item active' : 'queue-item'}
            onClick={() => setSelectedIndex(index)}
          >
            <strong className="mono">{item.datasetName}</strong>
            <span>
              {item.category} / {item.confidence}%
            </span>
          </button>
        ))}
      </aside>

      <Panel className="decision-panel">
        <div className="decision-header">
          <div>
            <StatusBadge tone={selected.category === 'Privacy Risk' || selected.category === 'High Risk' ? 'red' : 'amber'}>
              {selected.category}
            </StatusBadge>
            <h2 className="mono">{selected.datasetName}</h2>
          </div>
          <ClassificationBadge value={selected.proposedClassification ?? selected.currentClassification} />
        </div>
        <div className="review-summary-grid">
          <KeyValue label="Current classification" value={<ClassificationBadge value={selected.currentClassification} />} />
          <KeyValue label="Proposed classification" value={selected.proposedClassification ?? 'No change'} />
          <KeyValue label="Intended use" value={selected.intendedUse ?? 'Not requested'} />
          <KeyValue label="Confidence" value={`${selected.confidence}%`} />
        </div>
        <section className="drawer-section">
          <h3>Why review is needed</h3>
          <p>{selected.reason}</p>
        </section>
        <section className="drawer-section">
          <h3>Privacy evidence</h3>
          <ul className="plain-list">
            {selected.evidence.slice(0, fullEvidenceOpen ? selected.evidence.length : 2).map((evidence) => (
              <li key={evidence}>{evidence}</li>
            ))}
          </ul>
          <button className="text-link" type="button" onClick={() => setFullEvidenceOpen(!fullEvidenceOpen)}>
            {fullEvidenceOpen ? 'Hide full evidence' : 'Show full evidence'}
          </button>
        </section>
        <section className="drawer-section">
          <h3>Recommended action</h3>
          <p>{selected.recommendedAction}</p>
        </section>
        <div className="review-actions">
          <Button onClick={approveSelected} title="A">
            <CheckCircle2 size={16} /> Approve
          </Button>
          <Button variant="secondary" onClick={() => showToast('Classification change form opened.')}>
            Change Classification
          </Button>
          <Button variant="secondary" onClick={() => showToast('Change request sent.')}>
            Request Changes
          </Button>
          <Button variant="ghost" onClick={() => showToast('Decision escalated to Privacy Governance.')}>
            Escalate
          </Button>
        </div>
        <div className="shortcut-row">
          <span>J / Arrow Down: next</span>
          <span>K / Arrow Up: previous</span>
          <span>A: approve</span>
          <span>U: undo</span>
        </div>
      </Panel>
    </div>
  )
}

function PolicyGaps({ items }: { items: ReviewItem[] }) {
  const { showToast } = useApp()

  return (
    <div className="policy-gap-list">
      {items.map((item) => (
        <Panel key={item.id} className="policy-gap-item">
          <div>
            <StatusBadge dashed>Policy Gap</StatusBadge>
            <h2 className="mono">{item.datasetName}</h2>
            <p>{item.reason}</p>
          </div>
          <div className="gap-details">
            {item.evidence.map((line) => (
              <span key={line}>{line}</span>
            ))}
            <StatusBadge tone="neutral" dashed>
              Temporary status: Unknown
            </StatusBadge>
          </div>
          <div className="section-actions">
            <Button variant="secondary" onClick={() => showToast(`${item.datasetName} flagged for Privacy Governance.`)}>
              Flag for Privacy Governance
            </Button>
            <Button onClick={() => showToast('Temporary classification assigned.')}>Assign Temporary Classification</Button>
          </div>
        </Panel>
      ))}
    </div>
  )
}

function CompletedReviews() {
  const { data } = useQuery({
    queryKey: ['completed-reviews'],
    queryFn: cacheFlowApi.getCompletedReviews,
  })

  return (
    <Panel className="completed-list">
      {data?.map((item) => (
        <div key={item.id} className="completed-item">
          <StatusBadge tone="teal">{item.decision}</StatusBadge>
          <strong className="mono">{item.datasetName}</strong>
          <span>{item.reviewer}</span>
          <small>{item.timestamp}</small>
        </div>
      ))}
    </Panel>
  )
}

function ReviewSkeleton() {
  return (
    <div className="review-page">
      <Skeleton className="skeleton-title" />
      <Skeleton className="skeleton-line" />
      <Skeleton className="skeleton-panel" />
    </div>
  )
}
