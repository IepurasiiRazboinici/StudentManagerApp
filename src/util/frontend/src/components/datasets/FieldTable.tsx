import type { DataField } from '@/types'
import { useUiStore } from '@/stores/uiStore'
import { ConfidenceIndicator, ReviewStatusBadge, TierBadge } from '@/components/common'

export function FieldTable({ datasetId, fields }: { datasetId: string; fields: DataField[] }) {
  const openEvidence = useUiStore((s) => s.openEvidence)

  if (fields.length === 0) {
    return <p className="muted">This document has no structured fields. Evidence is available at the document level.</p>
  }

  return (
    <div className="table-wrap">
      <table className="data-table field-table">
        <thead>
          <tr>
            <th>Field</th>
            <th>Type</th>
            <th>Classification</th>
            <th>Confidence</th>
            <th>Matched rules</th>
            <th>Masked sample</th>
            <th>Review</th>
          </tr>
        </thead>
        <tbody>
          {fields.map((f) => (
            <tr
              key={f.id}
              className="clickable-row"
              tabIndex={0}
              role="button"
              aria-label={`Inspect evidence for ${f.name}`}
              onClick={() => openEvidence(datasetId, f.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  openEvidence(datasetId, f.id)
                }
              }}
            >
              <td className="mono">{f.name}</td>
              <td className="muted">{f.dataType}</td>
              <td>
                <TierBadge tier={f.classification} />
              </td>
              <td>
                <ConfidenceIndicator value={f.confidence} size="sm" />
              </td>
              <td>
                {f.matchedRuleNames.length > 0 ? (
                  <span className="muted">{f.matchedRuleNames.length} rule{f.matchedRuleNames.length > 1 ? 's' : ''}</span>
                ) : (
                  <span className="muted">—</span>
                )}
              </td>
              <td className="mono masked">{f.maskedSample}</td>
              <td>
                <ReviewStatusBadge status={f.reviewStatus} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
