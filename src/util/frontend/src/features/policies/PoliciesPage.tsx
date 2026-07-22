import { usePolicies } from '@/hooks'
import { useUiStore } from '@/stores/uiStore'
import { EmptyState, ErrorState, PageHeader, Panel, StatusBadge, TableSkeleton } from '@/components/common'
import { formatDate } from '@/utils/format'

export function PoliciesPage() {
  const { data, isLoading, isError, refetch } = usePolicies()
  const openPolicy = useUiStore((s) => s.openPolicy)

  return (
    <div className="page-stack">
      <PageHeader title="Policies" description="Governance policies the backend uses when classifying data. Open a policy to see its cited sections." />

      <Panel>
        {isLoading ? (
          <TableSkeleton rows={3} cols={5} />
        ) : isError ? (
          <ErrorState description="Policies could not be loaded." onRetry={() => void refetch()} />
        ) : !data || data.length === 0 ? (
          <EmptyState title="No policies" description="Add a policy document as a source to begin." />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Version</th>
                  <th>Status</th>
                  <th className="num">Classifications</th>
                  <th>Ingested</th>
                </tr>
              </thead>
              <tbody>
                {data.map((p) => (
                  <tr
                    key={p.id}
                    className="clickable-row"
                    tabIndex={0}
                    role="button"
                    aria-label={`Open ${p.name}`}
                    onClick={() => openPolicy(p.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        openPolicy(p.id)
                      }
                    }}
                  >
                    <td>{p.name}</td>
                    <td className="mono">{p.version}</td>
                    <td>
                      <StatusBadge tone={p.status === 'ACTIVE' ? 'green' : 'neutral'}>{p.status}</StatusBadge>
                    </td>
                    <td className="num">{p.classificationsUsing}</td>
                    <td className="muted">{formatDate(p.ingestedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  )
}
