import { Link, useNavigate, useParams } from 'react-router-dom'
import { RefreshCw, ShieldCheck, ShieldPlus, SlidersHorizontal } from 'lucide-react'
import { useDatasetDetails, useReclassifyDataset } from '@/hooks'
import { useUiStore } from '@/stores/uiStore'
import { toast } from '@/stores/toastStore'
import {
  Button,
  ConfidenceIndicator,
  ErrorState,
  Panel,
  ReviewStatusBadge,
  Skeleton,
  StatusBadge,
  TierBadge,
  UsageStatusBadge,
} from '@/components/common'
import { FieldTable } from '@/components/datasets/FieldTable'
import { PriorityBadge } from '@/components/common'
import { formatDateTime, formatNumber } from '@/utils/format'

export function DatasetDetailsPage() {
  const { datasetId } = useParams()
  const navigate = useNavigate()
  const { data, isLoading, isError, refetch } = useDatasetDetails(datasetId)
  const reclassify = useReclassifyDataset(datasetId ?? '')
  const openAddRule = useUiStore((s) => s.openAddRule)
  const openPolicy = useUiStore((s) => s.openPolicy)

  const onReclassify = () =>
    reclassify.mutate(undefined, {
      onSuccess: () => toast.success('Reclassification complete — updated by the backend.'),
      onError: () => toast.error('Reclassification failed. Try again.'),
    })

  if (isLoading) {
    return (
      <div className="page-stack">
        <Panel>
          <Skeleton className="skeleton-eyebrow" />
          <Skeleton className="skeleton-title" />
          <Skeleton className="skeleton-line" />
        </Panel>
        <Panel>
          <Skeleton className="skeleton-panel" />
        </Panel>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="page-stack">
        <ErrorState description="This dataset could not be loaded." onRetry={() => void refetch()} />
      </div>
    )
  }

  return (
    <div className="page-stack">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/datasets">Data Catalogue</Link>
        <span aria-hidden>/</span>
        <span className="mono">{data.name}</span>
      </nav>

      <Panel className="dataset-header">
        <div className="dataset-header-main">
          <h1 className="mono dataset-title">{data.name}</h1>
          <div className="dataset-meta">
            <span>{data.sourceName}</span>
            <span>·</span>
            <span>{formatNumber(data.rowCount)} rows</span>
            <span>·</span>
            <span>{data.fieldCount} fields</span>
            <span>·</span>
            <span>Last analysed {formatDateTime(data.lastAnalysed)}</span>
          </div>
          <div className="dataset-badges">
            <TierBadge tier={data.classification} />
            <ConfidenceIndicator value={data.confidence} />
            <ReviewStatusBadge status={data.reviewStatus} />
            <UsageStatusBadge status={data.usageStatus} />
          </div>
        </div>
        <div className="dataset-actions">
          <Button variant="secondary" onClick={() => navigate(`/datasets/${data.id}/intended-use`)}>
            <ShieldCheck size={15} /> Check Intended Use
          </Button>
          <Button variant="secondary" onClick={() => navigate(`/datasets/${data.id}/make-safe`)} disabled={!data.canBeMadeSafe}>
            <SlidersHorizontal size={15} /> Make it Safe
          </Button>
          <Button variant="secondary" onClick={() => openAddRule({ datasetId: data.id, scope: 'ALL_FILES' })}>
            <ShieldPlus size={15} /> Add New Rule
          </Button>
          <Button onClick={onReclassify} disabled={reclassify.isPending}>
            <RefreshCw size={15} className={reclassify.isPending ? 'spin' : undefined} /> {reclassify.isPending ? 'Reclassifying…' : 'Reclassify'}
          </Button>
        </div>
      </Panel>

      {reclassify.isPending ? (
        <div className="privacy-callout" role="status">
          Reclassification in progress — the backend is re-evaluating this dataset.
        </div>
      ) : null}

      <Panel>
        <div className="panel-head">
          <h2>Protection summary</h2>
        </div>
        <p className="summary-text">{data.protectionSummary}</p>
        <div className="why-block">
          <h3>Why this tier?</h3>
          <p>{data.whyThisTier}</p>
        </div>
      </Panel>

      {data.explicitMarkers.length > 0 ? (
        <Panel>
          <div className="panel-head">
            <h2>Explicit markers</h2>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Marker</th>
                  <th>Resulting tier</th>
                  <th>Confidence</th>
                  <th>Conflict</th>
                </tr>
              </thead>
              <tbody>
                {data.explicitMarkers.map((m) => (
                  <tr key={m.id}>
                    <td>{m.marker}</td>
                    <td>
                      <TierBadge tier={m.resultingTier} />
                    </td>
                    <td>
                      <ConfidenceIndicator value={m.confidence} size="sm" />
                    </td>
                    <td>
                      <StatusBadge tone={m.conflict ? 'amber' : 'green'}>{m.conflict ? 'Conflict' : 'No conflict'}</StatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      ) : null}

      <Panel>
        <div className="panel-head">
          <h2>Matched rules</h2>
        </div>
        {data.matchedRules.length === 0 ? (
          <p className="muted">No rules matched this dataset.</p>
        ) : (
          <ul className="matched-rules">
            {data.matchedRules.map((rule) => (
              <li key={rule.ruleId}>
                <div className="matched-rule-head">
                  <strong>{rule.name}</strong>
                  <StatusBadge tone={rule.source === 'SYSTEM' ? 'neutral' : 'teal'}>{rule.source === 'SYSTEM' ? 'System' : 'Custom'}</StatusBadge>
                  <TierBadge tier={rule.targetTier} />
                  <PriorityBadge priority={rule.priority} />
                </div>
                <p>{rule.explanation}</p>
                {rule.matchedFields.length > 0 ? (
                  <div className="rule-pills">
                    {rule.matchedFields.map((f) => (
                      <span key={f} className="badge badge-neutral mono">
                        {f}
                      </span>
                    ))}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel>
        <div className="panel-head">
          <h2>Fields</h2>
          <span className="muted">Select a field to inspect its evidence</span>
        </div>
        <FieldTable datasetId={data.id} fields={data.fields} />
      </Panel>

      {data.policyReferences.length > 0 ? (
        <Panel>
          <div className="panel-head">
            <h2>Policies</h2>
          </div>
          <div className="rule-pills">
            {data.policyReferences.map((p) => (
              <button key={p.policyId} type="button" className="badge badge-violet policy-chip" onClick={() => openPolicy(p.policyId)}>
                {p.code} {p.section}
              </button>
            ))}
          </div>
        </Panel>
      ) : null}

      <Panel>
        <div className="panel-head">
          <h2>Review history</h2>
        </div>
        {data.reviewHistory.length === 0 ? (
          <p className="muted">No review decisions have been recorded for this dataset.</p>
        ) : (
          <ul className="timeline">
            {data.reviewHistory.map((h) => (
              <li key={h.id}>
                <span className="timeline-dot" aria-hidden />
                <div>
                  <strong>{h.action}</strong>
                  {h.note ? <p>{h.note}</p> : null}
                  <span className="muted">
                    {h.actor} · {formatDateTime(h.timestamp)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}
