import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, ShieldPlus } from 'lucide-react'
import type { ReviewDecisionKind } from '@/types'
import { useReviewQueue, useSubmitReview } from '@/hooks'
import { useUiStore } from '@/stores/uiStore'
import { toast } from '@/stores/toastStore'
import {
  Button,
  ConfidenceIndicator,
  EmptyState,
  ErrorState,
  EvidenceBadge,
  PageHeader,
  Panel,
  TierBadge,
} from '@/components/common'
import { ReviewQueueRail } from '@/components/reviews/ReviewQueueRail'
import { REVIEW_CATEGORY_LABEL } from '@/utils/labels'

const ACTIONS: Array<{ key: ReviewDecisionKind; label: string; shortcut: string; variant: 'primary' | 'secondary' | 'ghost' | 'danger' }> = [
  { key: 'APPROVE', label: 'Approve', shortcut: 'A', variant: 'primary' },
  { key: 'OVERRIDE', label: 'Override', shortcut: 'O', variant: 'secondary' },
  { key: 'REQUEST_CHANGES', label: 'Request Changes', shortcut: 'C', variant: 'secondary' },
  { key: 'REJECT_USAGE', label: 'Reject Usage', shortcut: 'R', variant: 'ghost' },
  { key: 'ESCALATE', label: 'Escalate', shortcut: 'E', variant: 'ghost' },
]

export function ReviewQueuePage() {
  const navigate = useNavigate()
  const { data, isLoading, isError, refetch } = useReviewQueue()
  const submit = useSubmitReview()
  const openAddRule = useUiStore((s) => s.openAddRule)
  const [chosenId, setChosenId] = useState<string | undefined>(undefined)
  // Derive the active item so we never call setState from an effect on load.
  const selectedId = chosenId && data?.some((i) => i.id === chosenId) ? chosenId : data?.[0]?.id
  const selected = data?.find((i) => i.id === selectedId)

  const act = (decision: ReviewDecisionKind) => {
    if (!selected) return
    submit.mutate(
      { classificationId: selected.classificationId, req: { decision } },
      {
        onSuccess: () => toast.success(`${selected.datasetName}: decision recorded.`),
        onError: () => toast.error('Could not submit the decision.'),
      },
    )
  }

  if (isLoading) {
    return (
      <div className="page-stack">
        <PageHeader title="Review Queue" />
        <Panel>Loading review queue…</Panel>
      </div>
    )
  }
  if (isError) {
    return (
      <div className="page-stack">
        <PageHeader title="Review Queue" />
        <ErrorState description="The review queue could not be loaded." onRetry={() => void refetch()} />
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="page-stack">
        <PageHeader title="Review Queue" description="Uncertain and high-risk decisions that need a human." />
        <EmptyState title="Nothing to review" description="All classifications are confirmed. New items will appear here after scans and rule changes." />
      </div>
    )
  }

  return (
    <div className="page-stack">
      <PageHeader title="Review Queue" description="Uncertain and high-risk decisions that need a human data steward." />

      <div className="review-layout">
        <ReviewQueueRail items={data} selectedId={selectedId} onSelect={setChosenId} />

        <div className="review-main">
          {selected ? (
            <Panel>
              <div className="review-head">
                <div>
                  <span className="eyebrow">{REVIEW_CATEGORY_LABEL[selected.category]}</span>
                  <h2 className="mono">{selected.datasetName}</h2>
                </div>
                <div className="review-head-badges">
                  <TierBadge tier={selected.currentClassification} />
                  {selected.proposedClassification ? (
                    <>
                      <ArrowRight size={16} aria-hidden />
                      <TierBadge tier={selected.proposedClassification} />
                    </>
                  ) : null}
                  <ConfidenceIndicator value={selected.confidence} size="sm" />
                </div>
              </div>

              <p className="review-reason">{selected.reason}</p>
              {selected.intendedUse ? (
                <p className="muted">Intended use: {selected.intendedUse}</p>
              ) : null}

              <div className="drawer-section">
                <span className="eyebrow">Evidence</span>
                <ul className="review-evidence">
                  {selected.evidence.map((e) => (
                    <li key={e.id}>
                      <EvidenceBadge kind={e.kind} />
                      <div>
                        <strong>{e.label}</strong>
                        <p>{e.explanation}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="drawer-section">
                <span className="eyebrow">Recommended action</span>
                <p>{selected.recommendedAction}</p>
              </div>

              <div className="review-actions">
                {ACTIONS.map((a) => (
                  <Button key={a.key} variant={a.variant} onClick={() => act(a.key)} disabled={submit.isPending}>
                    {a.label} <kbd>{a.shortcut}</kbd>
                  </Button>
                ))}
                <Button variant="ghost" onClick={() => openAddRule({ datasetId: selected.datasetId, scope: 'ALL_FILES' })}>
                  <ShieldPlus size={15} /> Add Rule
                </Button>
                {selected.category === 'PROPOSED_SAFE_VERSION' ? (
                  <Button variant="secondary" onClick={() => navigate(`/data-passport/${selected.datasetId}`)}>
                    View Data Passport
                  </Button>
                ) : null}
              </div>

              <p className="shortcut-hint muted">Shortcuts: A approve · O override · C request changes · R reject usage · E escalate</p>
            </Panel>
          ) : null}
        </div>
      </div>
    </div>
  )
}
