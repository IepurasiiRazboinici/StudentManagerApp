import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, MoreHorizontal, Search, ShieldCheck } from 'lucide-react'
import { cacheFlowApi } from '../../api/services/cacheFlow'
import { useApp } from '../../app/appContextValue'
import {
  Button,
  ClassificationBadge,
  Drawer,
  EmptyState,
  EvidenceBadge,
  InlineError,
  KeyValue,
  ProgressBar,
  SectionHeader,
  Skeleton,
  StatusBadge,
  TabButton,
  UsageBadge,
} from '../../components/ui'
import type { ClassificationTier, DatasetDetail, DatasetSummary, EvidenceKind, SourceType } from '../../types'

const classificationOptions: Array<'All' | ClassificationTier> = [
  'All',
  'Public',
  'Corporate',
  'Restricted',
  'Highly Restricted',
  'Unknown',
]

const sourceOptions: Array<'All' | SourceType> = ['All', 'PostgreSQL', 'CSV', 'JSON', 'TXT']

export function DataExplorerPage() {
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [classification, setClassification] = useState<'All' | ClassificationTier>(
    (params.get('classification') as ClassificationTier | null) ?? 'All',
  )
  const [source, setSource] = useState<'All' | SourceType>('All')
  const [needsReviewOnly, setNeedsReviewOnly] = useState(false)
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false)
  const classificationParam = params.get('classification') as ClassificationTier | null
  const activeClassification = classificationParam ?? classification
  const selectedDatasetId = params.get('dataset')

  const datasetsQuery = useQuery({
    queryKey: ['datasets'],
    queryFn: cacheFlowApi.getDatasets,
  })

  const datasets = useMemo(() => datasetsQuery.data ?? [], [datasetsQuery.data])
  const sourceCount = new Set(datasets.map((dataset) => dataset.sourceName)).size

  const filteredDatasets = useMemo(() => {
    return datasets.filter((dataset) => {
      const matchesSearch =
        !search ||
        dataset.name.toLowerCase().includes(search.toLowerCase()) ||
        dataset.sourceName.toLowerCase().includes(search.toLowerCase())
      const matchesClassification = activeClassification === 'All' || dataset.classification === activeClassification
      const matchesSource = source === 'All' || dataset.sourceType === source
      const matchesReview = !needsReviewOnly || dataset.needsReview || dataset.reviewStatus === 'Policy Gap'

      return matchesSearch && matchesClassification && matchesSource && matchesReview
    })
  }, [activeClassification, datasets, needsReviewOnly, search, source])

  const openDataset = (datasetId: string) => {
    const next = new URLSearchParams(params)
    next.set('dataset', datasetId)
    setParams(next)
  }

  const closeDataset = () => {
    const next = new URLSearchParams(params)
    next.delete('dataset')
    setParams(next)
  }

  if (datasetsQuery.isLoading) {
    return <DataExplorerSkeleton />
  }

  if (datasetsQuery.isError) {
    return (
      <InlineError
        action={
          <Button variant="secondary" onClick={() => void datasetsQuery.refetch()}>
            Retry classification
          </Button>
        }
      />
    )
  }

  return (
    <div className="data-page">
      <SectionHeader
        eyebrow={`${datasets.length} datasets / ${sourceCount} sources`}
        title="Data Explorer"
        description="Review personal-data exposure, policy coverage and safe usage status."
      />

      <section className="toolbar" aria-label="Dataset filters">
        <label className="search-field">
          <Search size={16} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search datasets" />
        </label>
        <label>
          Classification
          <select
            value={activeClassification}
            onChange={(event) => {
              const value = event.target.value as 'All' | ClassificationTier
              setClassification(value)
              const next = new URLSearchParams(params)
              if (value === 'All') {
                next.delete('classification')
              } else {
                next.set('classification', value)
              }
              setParams(next)
            }}
          >
            {classificationOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label>
          Source
          <select value={source} onChange={(event) => setSource(event.target.value as SourceType)}>
            {sourceOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label className="toggle-filter">
          <input
            type="checkbox"
            checked={needsReviewOnly}
            onChange={(event) => setNeedsReviewOnly(event.target.checked)}
          />
          Needs Review
        </label>
        <Button variant="ghost" onClick={() => setMoreFiltersOpen(!moreFiltersOpen)}>
          <MoreHorizontal size={16} /> More Filters
        </Button>
      </section>

      {moreFiltersOpen ? (
        <div className="more-filters">
          <span>Confidence above 40%</span>
          <span>Last scan: current workspace</span>
          <span>Usage status included</span>
        </div>
      ) : null}

      {filteredDatasets.length ? (
        <div className="table-wrap">
          <table className="dataset-table">
            <thead>
              <tr>
                <th>Dataset</th>
                <th>Source</th>
                <th>Classification</th>
                <th>Confidence</th>
                <th>Usage</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredDatasets.map((dataset) => (
                <DatasetRow key={dataset.id} dataset={dataset} onOpen={() => openDataset(dataset.id)} />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="No datasets match these filters"
          description="Adjust the search, classification or source filters to expand the table."
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setSearch('')
                setClassification('All')
                setSource('All')
                setNeedsReviewOnly(false)
                const next = new URLSearchParams(params)
                next.delete('classification')
                setParams(next)
              }}
            >
              Reset filters
            </Button>
          }
        />
      )}

      <DatasetDetailDrawer key={selectedDatasetId ?? 'closed'} datasetId={selectedDatasetId} onClose={closeDataset} />
    </div>
  )
}

function DatasetRow({ dataset, onOpen }: { dataset: DatasetSummary; onOpen: () => void }) {
  return (
    <tr
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onOpen()
        }
      }}
    >
      <td>
        <strong className="mono">{dataset.name}</strong>
        <span>{dataset.attentionReason}</span>
      </td>
      <td>{dataset.sourceType}</td>
      <td>
        <ClassificationBadge value={dataset.classification} />
      </td>
      <td>
        <ProgressBar value={dataset.confidence} label={`${dataset.confidence}%`} />
      </td>
      <td>
        <UsageBadge value={dataset.usageStatus} />
      </td>
      <td>
        <StatusBadge dashed={dataset.reviewStatus === 'Policy Gap'}>{dataset.reviewStatus}</StatusBadge>
      </td>
    </tr>
  )
}

function DatasetDetailDrawer({ datasetId, onClose }: { datasetId: string | null; onClose: () => void }) {
  const navigate = useNavigate()
  const { openPolicy, showToast } = useApp()
  const [tab, setTab] = useState<'summary' | 'evidence' | 'history'>('summary')
  const [showAllFields, setShowAllFields] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const detailQuery = useQuery({
    queryKey: ['dataset', datasetId],
    queryFn: () => cacheFlowApi.getDataset(datasetId ?? 'client_positions'),
    enabled: Boolean(datasetId),
  })

  const detail = detailQuery.data

  return (
    <Drawer open={Boolean(datasetId)} title="Dataset detail" onClose={onClose}>
      {detailQuery.isLoading ? <Skeleton className="skeleton-panel" /> : null}
      {detail ? (
        <div className="dataset-drawer">
          <div className="drawer-title-block">
            <div>
              <h3 className="mono">{detail.name}</h3>
              <p>{detail.why}</p>
            </div>
            <ClassificationBadge value={detail.classification} />
          </div>

          <div className="drawer-summary-grid">
            <KeyValue label="Confidence" value={`${detail.confidence}%`} />
            <KeyValue label="Usage" value={<UsageBadge value={detail.usageStatus} />} />
            <KeyValue label="Source" value={detail.sourceType} />
            <KeyValue label="Fields" value={detail.fieldCount} />
          </div>

          <div className="tabs" role="tablist" aria-label="Dataset detail tabs">
            <TabButton active={tab === 'summary'} onClick={() => setTab('summary')}>
              Summary
            </TabButton>
            <TabButton active={tab === 'evidence'} onClick={() => setTab('evidence')}>
              Evidence
            </TabButton>
            <TabButton active={tab === 'history'} onClick={() => setTab('history')}>
              History
            </TabButton>
          </div>

          {tab === 'summary' ? (
            <SummaryTab
              detail={detail}
              showAllFields={showAllFields}
              setShowAllFields={setShowAllFields}
              openPolicy={() => openPolicy(detail.policy)}
              onAssess={() => navigate(`/data/${detail.id}/make-safe`)}
              menuOpen={menuOpen}
              setMenuOpen={setMenuOpen}
              showToast={showToast}
            />
          ) : null}

          {tab === 'evidence' ? <EvidenceTab detail={detail} openPolicy={openPolicy} /> : null}
          {tab === 'history' ? <HistoryTab detail={detail} /> : null}
        </div>
      ) : null}
    </Drawer>
  )
}

function SummaryTab({
  detail,
  showAllFields,
  setShowAllFields,
  openPolicy,
  onAssess,
  menuOpen,
  setMenuOpen,
  showToast,
}: {
  detail: DatasetDetail
  showAllFields: boolean
  setShowAllFields: (value: boolean) => void
  openPolicy: () => void
  onAssess: () => void
  menuOpen: boolean
  setMenuOpen: (value: boolean) => void
  showToast: (message: string) => void
}) {
  const visibleFields = showAllFields ? detail.fields : detail.fields.filter((field) => field.sensitivity !== 'Low')

  return (
    <div className="drawer-tab-content">
      <div className="metadata-grid">
        <KeyValue label="Owner" value={detail.owner} />
        <KeyValue label="Review status" value={detail.reviewStatus} />
        <KeyValue label="Retention" value={detail.retention} />
        <KeyValue label="Last scan" value={detail.lastScan} mono />
      </div>

      <section className="drawer-section">
        <div className="compact-heading">
          <h4>Privacy-relevant fields</h4>
          <button type="button" className="text-link" onClick={() => setShowAllFields(!showAllFields)}>
            {showAllFields ? 'Show relevant fields' : 'View all fields'}
          </button>
        </div>
        <div className="field-list">
          {visibleFields.map((field) => (
            <div key={field.name} className="field-row">
              <div>
                <strong className="mono">{field.name}</strong>
                <span>{field.evidence}</span>
              </div>
              <StatusBadge tone={field.sensitivity === 'Critical' ? 'red' : field.sensitivity === 'High' ? 'amber' : 'blue'}>
                {field.sensitivity}
              </StatusBadge>
            </div>
          ))}
        </div>
      </section>

      <section className="drawer-section">
        <div className="compact-heading">
          <h4>Processing privacy boundary</h4>
        </div>
        <div className="metadata-grid">
          <KeyValue label="Rows profiled locally" value={detail.rowCount.toLocaleString()} />
          <KeyValue label="Masked samples" value="500" />
          <KeyValue label="LLM payload" value="38 KB" />
          <KeyValue label="Raw values" value="Not sent downstream" />
        </div>
      </section>

      <section className="drawer-section policy-callout">
        <ShieldCheck size={17} />
        <div>
          <strong>
            {detail.policy.name} {detail.policy.section}
          </strong>
          <p>{detail.policy.excerpt}</p>
          <button type="button" className="text-link" onClick={openPolicy}>
            Open policy citation
          </button>
        </div>
      </section>

      <div className="drawer-actions">
        <Button onClick={onAssess}>Assess intended use</Button>
        <div className="overflow-menu">
          <Button variant="secondary" size="icon" aria-label="More actions" onClick={() => setMenuOpen(!menuOpen)}>
            <MoreHorizontal size={16} />
          </Button>
          {menuOpen ? (
            <div className="menu-popover">
              <button type="button" onClick={() => showToast('Classification approved.')}>
                Approve classification
              </button>
              <button type="button" onClick={() => showToast('Override workflow opened.')}>
                Override classification
              </button>
              <button type="button" onClick={() => showToast('Re-run analysis queued.')}>
                Re-run analysis
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function EvidenceTab({
  detail,
  openPolicy,
}: {
  detail: DatasetDetail
  openPolicy: (policy: DatasetDetail['policy']) => void
}) {
  const groups = detail.evidence.reduce<Record<EvidenceKind, typeof detail.evidence>>(
    (accumulator, evidence) => {
      accumulator[evidence.kind] = [...(accumulator[evidence.kind] ?? []), evidence]
      return accumulator
    },
    {
      detector: [],
      policy: [],
      context: [],
      aggregation: [],
      human: [],
    },
  )

  return (
    <div className="drawer-tab-content">
      <div className="confidence-block">
        <strong>{detail.confidence}% confidence</strong>
        <ProgressBar value={detail.confidence} />
        <p>
          Confidence is based on deterministic signals, policy coverage and privacy context.
        </p>
      </div>

      {Object.entries(groups)
        .filter(([, items]) => items.length)
        .map(([kind, items], index) => (
          <details key={kind} className="evidence-group" open={index === 0}>
            <summary>
              <EvidenceBadge kind={kind as EvidenceKind} />
              <span>{items.length} signal{items.length > 1 ? 's' : ''}</span>
              <ChevronDown size={15} />
            </summary>
            {items.map((item) => (
              <div key={item.id} className="evidence-item">
                <strong>{item.title}</strong>
                <p>{item.description}</p>
                <ul>
                  {item.details.map((detailLine) => (
                    <li key={detailLine}>{detailLine}</li>
                  ))}
                </ul>
                {item.policy ? (
                  <button className="text-link" type="button" onClick={() => openPolicy(item.policy ?? detail.policy)}>
                    {item.policy.name} {item.policy.section}
                  </button>
                ) : null}
              </div>
            ))}
          </details>
        ))}
    </div>
  )
}

function HistoryTab({ detail }: { detail: DatasetDetail }) {
  return (
    <div className="drawer-tab-content">
      <ol className="timeline">
        {detail.history.map((item) => (
          <li key={item.id}>
            <span />
            <div>
              <strong>{item.label}</strong>
              <small>
                {item.timestamp} / {item.actor}
              </small>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

function DataExplorerSkeleton() {
  return (
    <div className="data-page">
      <Skeleton className="skeleton-title" />
      <Skeleton className="skeleton-line" />
      <Skeleton className="skeleton-panel" />
      <Skeleton className="skeleton-table" />
    </div>
  )
}
