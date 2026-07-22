import { useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import type { ClassificationTier, ReviewStatus, SourceKind, UsageStatus } from '@/types'
import { useDatasets } from '@/hooks'
import { Button, EmptyState, ErrorState, PageHeader, Panel, TableSkeleton } from '@/components/common'
import { DatasetTable } from '@/components/datasets/DatasetTable'
import {
  REVIEW_STATUS_LABEL,
  TIER_LABEL,
  USAGE_STATUS_LABEL,
} from '@/utils/labels'

const TIERS: ClassificationTier[] = ['PUBLIC', 'CORPORATE', 'RESTRICTED', 'HIGHLY_RESTRICTED', 'UNKNOWN']
const REVIEWS: ReviewStatus[] = ['AUTO', 'CONFIRMED', 'OVERRIDDEN', 'REVIEW_REQUIRED']
const USAGES: UsageStatus[] = ['ALLOWED', 'CONDITIONALLY_ALLOWED', 'BLOCKED', 'REVIEW_REQUIRED']
const SOURCES: SourceKind[] = ['FILE', 'POSTGRESQL']

export function CataloguePage() {
  const [params, setParams] = useSearchParams()
  const { data, isLoading, isError, refetch } = useDatasets()

  const get = (key: string) => params.get(key) ?? ''
  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const search = get('q').toLowerCase()
  const filtered = (data ?? []).filter((d) => {
    if (search && !d.name.toLowerCase().includes(search)) return false
    if (get('classification') && d.classification !== get('classification')) return false
    if (get('source') && d.sourceKind !== get('source')) return false
    if (get('review') && d.reviewStatus !== get('review')) return false
    if (get('usage') && d.usageStatus !== get('usage')) return false
    if (get('hasCustomRule') === 'true' && !d.hasCustomRule) return false
    if (get('canBeMadeSafe') === 'true' && !d.canBeMadeSafe) return false
    return true
  })

  const hasFilters = Array.from(params.keys()).length > 0

  return (
    <div className="page-stack">
      <PageHeader title="Data Catalogue" description="Datasets classified by the backend. Filter, then open a dataset to inspect its evidence." />

      <Panel className="catalogue-filters">
        <div className="filter-search">
          <Search size={15} aria-hidden />
          <input
            className="cf-input"
            type="search"
            placeholder="Search datasets…"
            value={get('q')}
            onChange={(e) => set('q', e.target.value)}
            aria-label="Search datasets"
          />
        </div>
        <div className="filter-row">
          <select className="cf-input" value={get('classification')} onChange={(e) => set('classification', e.target.value)} aria-label="Classification">
            <option value="">All classifications</option>
            {TIERS.map((t) => (
              <option key={t} value={t}>
                {TIER_LABEL[t]}
              </option>
            ))}
          </select>
          <select className="cf-input" value={get('source')} onChange={(e) => set('source', e.target.value)} aria-label="Source type">
            <option value="">All sources</option>
            {SOURCES.map((s) => (
              <option key={s} value={s}>
                {s === 'FILE' ? 'File' : 'PostgreSQL'}
              </option>
            ))}
          </select>
          <select className="cf-input" value={get('review')} onChange={(e) => set('review', e.target.value)} aria-label="Review status">
            <option value="">All review states</option>
            {REVIEWS.map((r) => (
              <option key={r} value={r}>
                {REVIEW_STATUS_LABEL[r]}
              </option>
            ))}
          </select>
          <select className="cf-input" value={get('usage')} onChange={(e) => set('usage', e.target.value)} aria-label="Usage status">
            <option value="">All usage states</option>
            {USAGES.map((u) => (
              <option key={u} value={u}>
                {USAGE_STATUS_LABEL[u]}
              </option>
            ))}
          </select>
          <label className="toggle-filter">
            <input type="checkbox" checked={get('hasCustomRule') === 'true'} onChange={(e) => set('hasCustomRule', e.target.checked ? 'true' : '')} />
            Has custom rule
          </label>
          <label className="toggle-filter">
            <input type="checkbox" checked={get('canBeMadeSafe') === 'true'} onChange={(e) => set('canBeMadeSafe', e.target.checked ? 'true' : '')} />
            Can be made safe
          </label>
          {hasFilters ? (
            <Button variant="ghost" size="sm" onClick={() => setParams(new URLSearchParams(), { replace: true })}>
              Clear
            </Button>
          ) : null}
        </div>
      </Panel>

      <Panel>
        {isLoading ? (
          <TableSkeleton rows={6} cols={9} />
        ) : isError ? (
          <ErrorState description="The catalogue could not be loaded." onRetry={() => void refetch()} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={hasFilters ? 'No datasets match these filters' : 'No datasets have been scanned yet'}
            description={hasFilters ? 'Adjust or clear the filters to see more results.' : 'Add a data source to begin.'}
          />
        ) : (
          <DatasetTable datasets={filtered} />
        )}
      </Panel>
    </div>
  )
}
