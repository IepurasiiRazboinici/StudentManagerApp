import { useNavigate } from 'react-router-dom'
import { Database, FileText } from 'lucide-react'
import type { DatasetSummary } from '@/types'
import { ConfidenceIndicator, ReviewStatusBadge, TierBadge, UsageStatusBadge } from '@/components/common'
import { formatDate, formatNumber } from '@/utils/format'

export function DatasetTable({ datasets }: { datasets: DatasetSummary[] }) {
  const navigate = useNavigate()

  return (
    <div className="table-wrap">
      <table className="data-table dataset-table">
        <thead>
          <tr>
            <th>Dataset</th>
            <th>Source</th>
            <th className="num">Rows</th>
            <th>Classification</th>
            <th>Confidence</th>
            <th>Review</th>
            <th>Usage</th>
            <th className="num">Rules</th>
            <th>Last analysed</th>
          </tr>
        </thead>
        <tbody>
          {datasets.map((d) => (
            <tr
              key={d.id}
              className="clickable-row"
              tabIndex={0}
              role="link"
              aria-label={`Open ${d.name}`}
              onClick={() => navigate(`/datasets/${d.id}`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  navigate(`/datasets/${d.id}`)
                }
              }}
            >
              <td>
                <span className="dataset-cell">
                  <span className="mono">{d.name}</span>
                  {d.hasCustomRule ? <span className="badge badge-teal">Custom rule</span> : null}
                </span>
              </td>
              <td>
                <span className="source-cell">
                  {d.sourceKind === 'POSTGRESQL' ? <Database size={14} aria-hidden /> : <FileText size={14} aria-hidden />}
                  {d.sourceName}
                </span>
              </td>
              <td className="num">{formatNumber(d.rowCount)}</td>
              <td>
                <TierBadge tier={d.classification} />
              </td>
              <td>
                <ConfidenceIndicator value={d.confidence} size="sm" />
              </td>
              <td>
                <ReviewStatusBadge status={d.reviewStatus} />
              </td>
              <td>
                <UsageStatusBadge status={d.usageStatus} />
              </td>
              <td className="num">{d.matchedRuleCount}</td>
              <td className="muted">{formatDate(d.lastAnalysed)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
