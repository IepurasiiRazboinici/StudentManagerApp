import { useEffect, useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { RefreshCw, Send } from 'lucide-react'
import type { RemediationMetrics } from '@/types'
import { usePreviewRemediation, useRemediationPlan, useSubmitPlanReview } from '@/hooks'
import { useRemediationStore } from '@/stores/remediationStore'
import { toast } from '@/stores/toastStore'
import {
  Button,
  ErrorState,
  PageHeader,
  Panel,
  SeverityBadge,
  Skeleton,
} from '@/components/common'
import { TransformationCard } from '@/components/remediation/TransformationCard'
import { BeforeAfterPanel } from '@/components/remediation/BeforeAfterPanel'
import { MaskedPreviewTable } from '@/components/remediation/MaskedPreviewTable'

export function MakeSafePage() {
  const { datasetId } = useParams()
  const navigate = useNavigate()
  const { data: plan, isLoading, isError, refetch } = useRemediationPlan(datasetId)
  const preview = usePreviewRemediation()
  const submit = useSubmitPlanReview()

  const planId = plan?.id ?? ''
  const selected = useRemediationStore((s) => s.selectedByPlan[planId] ?? [])
  const init = useRemediationStore((s) => s.init)
  const toggle = useRemediationStore((s) => s.toggle)

  const recommendedIds = useMemo(() => plan?.transformations.filter((t) => t.recommended).map((t) => t.id) ?? [], [plan])

  useEffect(() => {
    if (plan) init(plan.id, recommendedIds)
  }, [plan, recommendedIds, init])

  const selectedKey = selected.join(',')
  useEffect(() => {
    if (!planId) return
    const handle = setTimeout(() => {
      preview.mutate({ planId, req: { transformationIds: selected } })
    }, 400)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId, selectedKey])

  if (isLoading) {
    return (
      <div className="page-stack">
        <PageHeader eyebrow="Make it Safe" title="Make it Safe" />
        <Panel>
          <Skeleton className="skeleton-title" />
          <Skeleton className="skeleton-panel" />
        </Panel>
      </div>
    )
  }

  if (isError || !plan) {
    return (
      <div className="page-stack">
        <PageHeader eyebrow="Make it Safe" title="Make it Safe" />
        <ErrorState description="The remediation plan could not be generated." onRetry={() => void refetch()} retryLabel="Try again" />
      </div>
    )
  }

  const proposed: RemediationMetrics = preview.data?.proposed ?? plan.proposed
  const maskedRows = preview.data?.maskedPreview ?? []

  const onSubmit = () =>
    submit.mutate(
      { planId: plan.id, req: { decision: 'APPROVE' } },
      {
        onSuccess: () => {
          toast.success('Safe version submitted for review.')
          navigate('/reviews')
        },
        onError: () => toast.error('Could not submit the safe version.'),
      },
    )

  return (
    <div className="page-stack">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/datasets">Data Catalogue</Link>
        <span aria-hidden>/</span>
        <Link to={`/datasets/${plan.datasetId}`} className="mono">
          {plan.datasetName}
        </Link>
        <span aria-hidden>/</span>
        <span>Make it Safe</span>
      </nav>

      <PageHeader
        title="Make it Safe"
        description="Select transformations. The backend recalculates the safe version — nothing is computed in the browser."
        actions={
          <>
            <Button variant="secondary" onClick={() => preview.mutate({ planId: plan.id, req: { transformationIds: selected } })} disabled={preview.isPending}>
              <RefreshCw size={15} className={preview.isPending ? 'spin' : undefined} /> Re-evaluate
            </Button>
            <Button onClick={onSubmit} disabled={submit.isPending}>
              <Send size={15} /> Submit for Review
            </Button>
          </>
        }
      />

      <div className="make-safe-grid">
        <div className="make-safe-left">
          <Panel>
            <div className="panel-head">
              <h2>Risk contributors</h2>
            </div>
            <ul className="risk-list">
              {plan.riskContributors.map((rc) => (
                <li key={rc.id}>
                  <div className="risk-head">
                    <span className="mono">{rc.field}</span>
                    <SeverityBadge severity={rc.severity} />
                  </div>
                  <p>{rc.reason}</p>
                  <span className="muted mono">{rc.relatedRuleOrPolicy}</span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel>
            <div className="panel-head">
              <h2>Recommended transformations</h2>
              <span className="muted">Changes re-evaluate automatically</span>
            </div>
            <div className="transformation-grid">
              {plan.transformations.map((t) => (
                <TransformationCard
                  key={t.id}
                  transformation={t}
                  selected={selected.includes(t.id)}
                  onToggle={() => toggle(plan.id, t.id)}
                />
              ))}
            </div>
          </Panel>
        </div>

        <div className="make-safe-right">
          <Panel>
            <div className="panel-head">
              <h2>Before and after</h2>
            </div>
            {preview.isPending ? (
              <div className="stack">
                <Skeleton className="skeleton-line" />
                <Skeleton className="skeleton-panel" />
              </div>
            ) : (
              <BeforeAfterPanel before={plan.original} after={proposed} />
            )}
          </Panel>

          <Panel>
            <div className="panel-head">
              <h2>Safe preview</h2>
            </div>
            {preview.isPending ? (
              <Skeleton className="skeleton-panel" />
            ) : preview.isError ? (
              <div className="inline-error" role="alert">
                <p>The remediation preview could not be generated. Try again.</p>
                <button type="button" className="text-link" onClick={() => preview.mutate({ planId: plan.id, req: { transformationIds: selected } })}>
                  Retry
                </button>
              </div>
            ) : (
              <MaskedPreviewTable rows={maskedRows} />
            )}
          </Panel>
        </div>
      </div>
    </div>
  )
}
