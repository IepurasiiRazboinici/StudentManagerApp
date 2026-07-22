import { useMemo, useState } from 'react'
import { Download, Search } from 'lucide-react'
import type { AuditEventType } from '@/types'
import { useAuditEvents } from '@/hooks'
import { toast } from '@/stores/toastStore'
import { Button, EmptyState, ErrorState, PageHeader, Panel, TableSkeleton } from '@/components/common'
import { AUDIT_EVENT_LABEL } from '@/utils/labels'
import { formatDateTime } from '@/utils/format'

export function AuditTrailPage() {
  const { data, isLoading, isError, refetch } = useAuditEvents()
  const [search, setSearch] = useState('')
  const [type, setType] = useState<AuditEventType | 'ALL'>('ALL')
  const [actor, setActor] = useState('ALL')
  const [since, setSince] = useState('')

  const actors = useMemo(() => Array.from(new Set((data ?? []).map((e) => e.actor))), [data])

  const filtered = (data ?? []).filter((e) => {
    if (search && !`${e.summary} ${e.detail}`.toLowerCase().includes(search.toLowerCase())) return false
    if (type !== 'ALL' && e.type !== type) return false
    if (actor !== 'ALL' && e.actor !== actor) return false
    if (since && new Date(e.timestamp) < new Date(since)) return false
    return true
  })

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'cache-flow-audit-events.json'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Audit events exported.')
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="Audit Trail"
        description="Every governance action, in order."
        actions={
          <Button variant="secondary" onClick={exportJson} disabled={!data || data.length === 0}>
            <Download size={15} /> Export
          </Button>
        }
      />

      <Panel className="catalogue-filters">
        <div className="filter-search">
          <Search size={15} aria-hidden />
          <input className="cf-input" type="search" placeholder="Search events…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search events" />
        </div>
        <div className="filter-row">
          <select className="cf-input" value={type} onChange={(e) => setType(e.target.value as AuditEventType | 'ALL')} aria-label="Event type">
            <option value="ALL">All event types</option>
            {(Object.keys(AUDIT_EVENT_LABEL) as AuditEventType[]).map((t) => (
              <option key={t} value={t}>
                {AUDIT_EVENT_LABEL[t]}
              </option>
            ))}
          </select>
          <select className="cf-input" value={actor} onChange={(e) => setActor(e.target.value)} aria-label="Actor">
            <option value="ALL">All actors</option>
            {actors.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <input className="cf-input" type="date" value={since} onChange={(e) => setSince(e.target.value)} aria-label="Since date" />
        </div>
      </Panel>

      <Panel>
        {isLoading ? (
          <TableSkeleton rows={7} cols={4} />
        ) : isError ? (
          <ErrorState description="Audit events could not be loaded." onRetry={() => void refetch()} />
        ) : filtered.length === 0 ? (
          <EmptyState title="No matching events" description="Adjust the filters to see more governance activity." />
        ) : (
          <ul className="audit-list">
            {filtered.map((e) => (
              <li key={e.id}>
                <span className="audit-type badge badge-neutral">{AUDIT_EVENT_LABEL[e.type]}</span>
                <div className="audit-body">
                  <strong>{e.summary}</strong>
                  <p className="muted">{e.detail}</p>
                </div>
                <div className="audit-meta">
                  <span>{e.actor}</span>
                  <span className="muted">{formatDateTime(e.timestamp)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}
