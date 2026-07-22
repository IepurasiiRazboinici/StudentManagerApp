import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Plus, ShieldPlus } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { cacheFlowApi } from '../../api/services/cacheFlow'
import { useApp } from '../../app/appContextValue'
import {
  Button,
  ClassificationBadge,
  EmptyState,
  InlineError,
  MetricBlock,
  Panel,
  SectionHeader,
  Skeleton,
  StatusBadge,
} from '../../components/ui'
import type { ClassificationTier, DatasetSummary } from '../../types'

const distributionOrder: Array<Exclude<ClassificationTier, 'Unknown'>> = [
  'Public',
  'Corporate',
  'Restricted',
  'Highly Restricted',
]

const classificationColors: Record<Exclude<ClassificationTier, 'Unknown'>, string> = {
  Public: '#94a3b8',
  Corporate: '#60a5fa',
  Restricted: '#f2b84b',
  'Highly Restricted': '#ef7d85',
}

export function OverviewPage() {
  const navigate = useNavigate()
  const { openAddSource, openClassifierRule } = useApp()
  const stats = useQuery({
    queryKey: ['overview'],
    queryFn: cacheFlowApi.getOverview,
  })
  const datasetQuery = useQuery({
    queryKey: ['datasets'],
    queryFn: cacheFlowApi.getDatasets,
  })
  const ruleQuery = useQuery({
    queryKey: ['classifier-rules'],
    queryFn: cacheFlowApi.getClassifierRules,
  })

  const datasets = datasetQuery.data ?? []

  if (stats.isLoading || datasetQuery.isLoading || ruleQuery.isLoading) {
    return <OverviewSkeleton />
  }

  if (stats.isError || datasetQuery.isError || ruleQuery.isError) {
    return (
      <InlineError
        action={
          <Button
            variant="secondary"
            onClick={() => {
              void stats.refetch()
              void datasetQuery.refetch()
              void ruleQuery.refetch()
            }}
          >
            Retry classification
          </Button>
        }
      />
    )
  }

  if (!datasets.length) {
    return (
      <EmptyState
        title="Your data governance workspace is ready"
        description="Connect a file or PostgreSQL database to discover, classify and review enterprise data."
        action={
          <>
            <Button onClick={openAddSource}>
              <Plus size={16} /> Add your first source
            </Button>
            <div className="workflow-strip" aria-label="Workflow">
              <span>Discover</span>
              <span>Classify</span>
              <span>Explain</span>
              <span>Make Safe</span>
            </div>
          </>
        }
      />
    )
  }

  const needsAttention = datasets.filter((dataset) => dataset.needsReview || dataset.riskScore >= 60).slice(0, 3)
  const distributionChartData = distributionOrder.map((classification) => ({
    classification,
    count: stats.data?.distribution[classification] ?? 0,
  }))
  const scanChartData = stats.data?.recentScans ?? []

  return (
    <div className="overview-page">
      <SectionHeader
        eyebrow="Governance overview"
        title="Privacy protection status"
        description="Focus on datasets where personal data, consent risk or external processing needs a decision."
      />

      <section className="metrics-row" aria-label="Governance metrics">
        <MetricBlock label="Datasets" value={stats.data?.datasets ?? 0} />
        <MetricBlock label="Fields classified" value={stats.data?.fieldsClassified ?? 0} />
        <MetricBlock label="Awaiting review" value={stats.data?.awaitingReview ?? 0} onClick={() => navigate('/review')} />
        <MetricBlock
          label="Policy gaps"
          value={stats.data?.policyGaps ?? 0}
          onClick={() => navigate('/review?tab=policy-gaps')}
        />
      </section>

      <Panel className="distribution-panel">
        <div className="compact-heading">
          <div>
            <h2>Classification distribution</h2>
            <p>From F-10: a readable distribution visual, not a decorative dashboard chart.</p>
          </div>
        </div>
        <div className="chart-card" aria-label="Classification distribution chart">
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={distributionChartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke="#e6edf5" vertical={false} />
              <XAxis dataKey="classification" tickLine={false} axisLine={false} tick={{ fill: '#657386', fontSize: 11 }} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: '#8a98aa', fontSize: 11 }} />
              <Tooltip
                cursor={{ fill: 'rgba(37, 99, 235, 0.05)' }}
                contentStyle={{ border: '1px solid #dce5ef', borderRadius: 10 }}
              />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {distributionChartData.map((entry) => (
                  <Cell key={entry.classification} fill={classificationColors[entry.classification]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="classification-chart-actions">
          {distributionOrder.map((classification) => {
            const value = stats.data?.distribution[classification] ?? 0

            return (
              <button
                key={classification}
                className="chart-filter-button"
                onClick={() => navigate(`/data?classification=${encodeURIComponent(classification)}`)}
              >
                <span>{classification}</span>
                <strong>{value}</strong>
              </button>
            )
          })}
        </div>
      </Panel>

      <Panel className="scan-chart-panel">
        <div className="compact-heading">
          <div>
            <h2>Scan profiling and bounded AI payload</h2>
            <p>Rows are profiled locally; only compact masked profiles are sent downstream.</p>
          </div>
        </div>
        <div className="scan-chart-grid">
          <div className="chart-card">
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={scanChartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="#e6edf5" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#657386', fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#8a98aa', fontSize: 11 }} />
                <Tooltip contentStyle={{ border: '1px solid #dce5ef', borderRadius: 10 }} />
                <Bar dataKey="rowsProcessed" name="Rows profiled" fill="#72b7b2" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-card">
            <ResponsiveContainer width="100%" height={170}>
              <LineChart data={scanChartData} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="#e6edf5" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#657386', fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#8a98aa', fontSize: 11 }} />
                <Tooltip contentStyle={{ border: '1px solid #dce5ef', borderRadius: 10 }} />
                <Line
                  type="monotone"
                  dataKey="llmPayloadKb"
                  name="LLM payload KB"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#2563eb' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Panel>

      <section className="attention-layout">
        <div>
          <div className="compact-heading airy-heading">
            <h2>Needs attention</h2>
            <p>Prioritized by privacy risk and policy coverage.</p>
          </div>
          <div className="attention-list">
            {needsAttention.map((dataset) => (
              <AttentionItem key={dataset.id} dataset={dataset} />
            ))}
          </div>
        </div>

        <Panel className="opportunities-panel">
          <StatusBadge tone="green">Privacy-first remediation</StatusBadge>
          <h2>5 datasets can become safer with minimization and pseudonymisation.</h2>
          <p>Recommended plans reduce exposure while keeping the analysis useful.</p>
          <Button variant="secondary" onClick={() => navigate('/data/client_market_analysis/make-safe')}>
            Open Make it Safe
          </Button>
        </Panel>
      </section>

      <Panel className="rules-panel">
        <div>
          <StatusBadge tone="blue">Classifier rules</StatusBadge>
          <h2>{ruleQuery.data?.filter((rule) => rule.status === 'Active').length ?? 0} active privacy guardrails</h2>
          <p>Rules catch personal data signals before policy matching starts.</p>
        </div>
        <div className="rule-pills">
          {ruleQuery.data?.slice(0, 3).map((rule) => (
            <span key={rule.id}>
              <strong>{rule.name}</strong>
              {rule.targetField}
            </span>
          ))}
        </div>
        <Button variant="secondary" onClick={openClassifierRule}>
          <ShieldPlus size={16} /> Add classifier rule
        </Button>
      </Panel>
    </div>
  )
}

function AttentionItem({ dataset }: { dataset: DatasetSummary }) {
  const navigate = useNavigate()

  return (
    <button className="attention-item" onClick={() => navigate(`/data?dataset=${dataset.id}`)}>
      <div>
        <strong className="mono">{dataset.name}</strong>
        <span>{dataset.attentionReason}</span>
      </div>
      <div className="attention-meta">
        {dataset.classification === 'Unknown' && dataset.reviewStatus === 'Policy Gap' ? (
          <StatusBadge dashed>No policy guidance found</StatusBadge>
        ) : (
          <ClassificationBadge value={dataset.classification} />
        )}
        <span>{dataset.confidence}% confidence</span>
      </div>
    </button>
  )
}

function OverviewSkeleton() {
  return (
    <div className="overview-page">
      <div className="section-header">
        <div>
          <Skeleton className="skeleton-eyebrow" />
          <Skeleton className="skeleton-title" />
          <Skeleton className="skeleton-line" />
        </div>
      </div>
      <div className="metrics-row">
        <Skeleton />
        <Skeleton />
        <Skeleton />
        <Skeleton />
      </div>
      <Skeleton className="skeleton-panel" />
      <Skeleton className="skeleton-panel" />
    </div>
  )
}
