import { useState } from 'react'
import { ShieldPlus } from 'lucide-react'
import type { EvidenceKind, EvidenceSignal } from '@/types'
import { useUiStore } from '@/stores/uiStore'
import { toast } from '@/stores/toastStore'
import { useDatasetDetails, useSubmitReview } from '@/hooks'
import {
  Button,
  ConfidenceIndicator,
  Drawer,
  EvidenceBadge,
  ReviewStatusBadge,
  Skeleton,
  TierBadge,
} from '@/components/common'
import { EVIDENCE_KIND_LABEL } from '@/utils/labels'
import { formatDateTime } from '@/utils/format'

const EVIDENCE_ORDER: EvidenceKind[] = [
  'EXPLICIT_MARKER',
  'DETECTOR',
  'POLICY',
  'CONTEXT',
  'AGGREGATION',
  'CUSTOM_RULE',
  'HUMAN',
]

function EvidenceGroup({ kind, items }: { kind: EvidenceKind; items: EvidenceSignal[] }) {
  if (items.length === 0) return null
  return (
    <section className="evidence-group" aria-label={`${EVIDENCE_KIND_LABEL[kind]} evidence`}>
      <div className="evidence-group-head">
        <EvidenceBadge kind={kind} />
        <span className="muted">{items.length} signal{items.length > 1 ? 's' : ''}</span>
      </div>
      {items.map((item) => (
        <div key={item.id} className="evidence-item">
          <div className="evidence-item-head">
            <strong>{item.label}</strong>
            <span className="evidence-weight" title="Signal weight">
              weight {item.weight.toFixed(2)}
            </span>
          </div>
          <p>{item.explanation}</p>
          <div className="evidence-item-meta">
            {item.reference ? <span className="mono">{item.reference}</span> : null}
            {item.matchedMaskedValue ? <span className="mono masked">{item.matchedMaskedValue}</span> : null}
            {item.confidence !== undefined ? <ConfidenceIndicator value={item.confidence} size="sm" /> : null}
            {item.actor ? <span className="muted">{item.actor}</span> : null}
            {item.timestamp ? <span className="muted">{formatDateTime(item.timestamp)}</span> : null}
          </div>
        </div>
      ))}
    </section>
  )
}

export function EvidenceDrawer() {
  const evidence = useUiStore((s) => s.evidence)
  const close = useUiStore((s) => s.closeEvidence)
  const openAddRule = useUiStore((s) => s.openAddRule)
  const { data: detail, isLoading } = useDatasetDetails(evidence.open ? evidence.datasetId : undefined)
  const submitReview = useSubmitReview()
  const [showNote, setShowNote] = useState(false)
  const [note, setNote] = useState('')

  const fieldItem = detail?.fields.find((f) => f.id === evidence.fieldId)

  const act = (decision: 'APPROVE' | 'OVERRIDE') => {
    if (!detail) return
    submitReview.mutate(
      { classificationId: `cls-${detail.id}`, req: { decision, note: note.trim() || undefined } },
      {
        onSuccess: () =>
          toast.success(
            decision === 'APPROVE' ? 'Classification confirmed.' : 'Classification override recorded.',
          ),
        onError: () => toast.error('Could not submit the decision.'),
      },
    )
    setShowNote(false)
    setNote('')
  }

  const startAddRule = () => {
    close()
    openAddRule({ datasetId: detail?.id, scope: 'ALL_FILES' })
  }

  const footer = fieldItem ? (
    <div className="evidence-footer">
      <div className="evidence-footer-actions">
        <Button variant="secondary" onClick={() => act('APPROVE')} disabled={submitReview.isPending}>
          Confirm
        </Button>
        <Button variant="secondary" onClick={() => act('OVERRIDE')} disabled={submitReview.isPending}>
          Override
        </Button>
        <Button variant="ghost" onClick={() => setShowNote((v) => !v)}>
          Add Note
        </Button>
        <Button variant="ghost" onClick={startAddRule}>
          <ShieldPlus size={15} /> Add New Rule
        </Button>
      </div>
      {showNote ? (
        <textarea
          className="cf-input"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Reviewer note (included with Confirm / Override)…"
          aria-label="Reviewer note"
        />
      ) : null}
    </div>
  ) : null

  return (
    <Drawer
      open={evidence.open}
      onClose={close}
      title={fieldItem ? fieldItem.name : 'Field evidence'}
      subtitle="Evidence returned by the backend"
      footer={footer}
    >
      {isLoading ? (
        <div className="stack">
          <Skeleton className="skeleton-line" />
          <Skeleton className="skeleton-panel" />
        </div>
      ) : fieldItem ? (
        <div className="evidence-body">
          <div className="evidence-summary">
            <TierBadge tier={fieldItem.classification} />
            <ConfidenceIndicator value={fieldItem.confidence} />
            <ReviewStatusBadge status={fieldItem.reviewStatus} />
          </div>

          <div className="why-block">
            <h3>Why this tier?</h3>
            <p>{fieldItem.whyThisTier}</p>
          </div>

          {EVIDENCE_ORDER.map((kind) => (
            <EvidenceGroup key={kind} kind={kind} items={fieldItem.evidence.filter((e) => e.kind === kind)} />
          ))}

          {fieldItem.evidence.length === 0 ? (
            <p className="muted">No additional evidence signals were returned for this field.</p>
          ) : null}

          <div className="reduce-block">
            <h3>What could reduce the tier?</h3>
            <p>{fieldItem.whatReducesTier}</p>
          </div>

          {detail && detail.reviewHistory.length > 0 ? (
            <section className="evidence-group">
              <div className="evidence-group-head">
                <EvidenceBadge kind="HUMAN" />
                <span className="muted">Human review history</span>
              </div>
              {detail.reviewHistory.map((h) => (
                <div key={h.id} className="evidence-item">
                  <div className="evidence-item-head">
                    <strong>{h.action}</strong>
                    <span className="muted">{formatDateTime(h.timestamp)}</span>
                  </div>
                  {h.note ? <p>{h.note}</p> : null}
                  <span className="muted">{h.actor}</span>
                </div>
              ))}
            </section>
          ) : null}
        </div>
      ) : (
        <p className="muted">Select a field to inspect its evidence.</p>
      )}
    </Drawer>
  )
}
