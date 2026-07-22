import { useNavigate } from 'react-router-dom'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Plus, ScanLine } from 'lucide-react'
import type { ClassificationTier } from '@/types'
import { useDashboardStats, useStartScan } from '@/hooks'
import { toast } from '@/stores/toastStore'
import {
  Button,
  CardsSkeleton,
  ErrorState,
  PageHeader,
  Panel,
  ReviewStatusBadge,
  TierBadge,
} from '@/components/common'
import { AUDIT_EVENT_LABEL, TIER_LABEL } from '@/utils/labels'
import { formatRelative } from '@/utils/format'

const TIER_HEX: Record<ClassificationTier, string> = {
  PUBLIC: '#475467',
  CORPORATE: '#175CD3',
  RESTRICTED: '#B54708',
  HIGHLY_RESTRICTED: '#B42318',
  UNKNOWN: '#667085',
}

const DONUT_ORDER: ClassificationTier[] = ['PUBLIC', 'CORPORATE', 'RESTRICTED', 'HIGHLY_RESTRICTED', 'UNKNOWN']

export function DashboardPage() {
  const navigate = useNavigate()
  const { data, isLoading, isError, refetch, isRefetching } = useDashboardStats()
  const startScan = useStartScan()

  const runScan = () =>
    startScan.mutate(
      { sourceId: 'src-uploads' },
      {
        onSuccess: (res) => navigate(`/scan/${res.scanId}`),
        onError: () => toast.error('Could not start the scan.'),
      },
    )

  const actions = (
    <>
      <Button variant="secondary" onClick={() => navigate('/sources/new')}>
        <Plus size={16} /> Add Data Source
      </Button>
      <Button onClick={runScan} disabled={startScan.isPending}>
        <ScanLine size={16} /> Run Scan
      </Button>
    </>
  )

  if (isLoading) {
    return (
      <div className="page-stack">
        <PageHeader title="Data Protection Overview" description="Discover sensitive data, review decisions, and create safer versions." actions={actions} />
        <CardsSkeleton count={6} />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="page-stack">
        <PageHeader title="Data Protection Overview" actions={actions} />
        <ErrorState description="The dashboard could not be loaded." onRetry={() => void refetch()} />
      </div>
    )
  }

  const donut = DONUT_ORDER.map((tier) => ({ tier, name: TIER_LABEL[tier], value: data.distribution[tier] })).filter((d) => d.value > 0)

  const metrics = [
    { label: 'Datasets analysed', value: data.datasetsAnalysed, onClick: () => navigate('/datasets') },
    { label: 'Highly Restricted', value: data.highlyRestricted, onClick: () => navigate('/datasets?classification=HIGHLY_RESTRICTED') },
    { label: 'Awaiting review', value: data.awaitingReview, onClick: () => navigate('/reviews') },
    { label: 'Active custom rules', value: data.activeCustomRules, onClick: () => navigate('/rules') },
    { label: 'Safe versions created', value: data.safeVersionsCreated },
    { label: 'Policy gaps', value: data.policyGaps, onClick: () => navigate('/reviews') },
  ]

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow={isRefetching ? 'Refreshing…' : undefined}
        title="Data Protection Overview"
        description="Discover sensitive data, review decisions, and create safer versions."
        actions={actions}
      />

      <div className="metrics-grid">
        {metrics.map((m) => {
          const Tag = m.onClick ? 'button' : 'div'
          return (
            <Tag key={m.label} className="metric-tile" onClick={m.onClick}>
              <strong>{m.value}</strong>
              <span>{m.label}</span>
            </Tag>
          )
        })}
      </div>

      <div className="dashboard-grid">
        <Panel className="distribution-panel">
          <div className="panel-head">
            <h2>Classification distribution</h2>
            <span className="muted">Click a segment to filter the catalogue</span>
          </div>
          <div className="donut-wrap">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={donut}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={64}
                  outerRadius={96}
                  paddingAngle={2}
                  onClick={(_data, index) => {
                    const seg = donut[index]
                    if (seg) navigate(`/datasets?classification=${seg.tier}`)
                  }}
                >
                  {donut.map((d) => (
                    <Cell key={d.tier} fill={TIER_HEX[d.tier]} cursor="pointer" />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <ul className="donut-legend">
              {donut.map((d) => (
                <li key={d.tier}>
                  <button type="button" onClick={() => navigate(`/datasets?classification=${d.tier}`)}>
                    <span className="legend-swatch" style={{ background: TIER_HEX[d.tier] }} aria-hidden />
                    {d.name}
                    <strong>{d.value}</strong>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </Panel>

        <Panel className="priority-panel">
          <div className="panel-head">
            <h2>Priority review items</h2>
          </div>
          <ul className="priority-list">
            {data.priorityReviewItems.map((item) => (
              <li key={item.datasetId}>
                <button type="button" onClick={() => navigate(`/datasets/${item.datasetId}`)}>
                  <span className="priority-name mono">{item.datasetName}</span>
                  <span className="priority-badges">
                    <TierBadge tier={item.classification} />
                    {item.reviewStatus === 'REVIEW_REQUIRED' ? <ReviewStatusBadge status={item.reviewStatus} /> : null}
                  </span>
                  <span className="priority-note muted">{item.note}</span>
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel className="opportunities-panel">
        <div className="panel-head">
          <h2>Data protection opportunities</h2>
        </div>
        <p className="opportunity-message">{data.protectionOpportunities.message}</p>
        <Button variant="secondary" onClick={() => navigate('/datasets?canBeMadeSafe=true')}>
          Review opportunities
        </Button>
      </Panel>

      <Panel className="activity-panel">
        <div className="panel-head">
          <h2>Recent governance activity</h2>
          <button type="button" className="text-link" onClick={() => navigate('/audit')}>
            View audit trail
          </button>
        </div>
        <ul className="activity-list">
          {data.recentActivity.map((event) => (
            <li key={event.id}>
              <span className="activity-type">{AUDIT_EVENT_LABEL[event.type]}</span>
              <span className="activity-summary">{event.summary}</span>
              <span className="muted">{formatRelative(event.timestamp)}</span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  )
}
