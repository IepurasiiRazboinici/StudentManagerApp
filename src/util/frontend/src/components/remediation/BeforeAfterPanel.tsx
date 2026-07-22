import { ArrowRight } from 'lucide-react'
import type { RemediationMetrics } from '@/types'
import { TierBadge, UsageStatusBadge } from '@/components/common'

function MetricColumn({ label, metrics }: { label: string; metrics: RemediationMetrics }) {
  return (
    <div className="ba-column">
      <span className="eyebrow">{label}</span>
      <div className="ba-row">
        <span>Classification</span>
        <TierBadge tier={metrics.classification} />
      </div>
      <div className="ba-row">
        <span>Risk score</span>
        <strong>{metrics.riskScore}</strong>
      </div>
      <div className="ba-row">
        <span>Usage</span>
        <UsageStatusBadge status={metrics.usageStatus} />
      </div>
      <div className="ba-row">
        <span>Utility retained</span>
        <strong>{metrics.utilityRetained}%</strong>
      </div>
      <div className="ba-row ba-row-fields">
        <span>Remaining sensitive fields</span>
        {metrics.remainingSensitiveFields.length > 0 ? (
          <div className="rule-pills">
            {metrics.remainingSensitiveFields.map((f) => (
              <span key={f} className="badge badge-red mono">
                {f}
              </span>
            ))}
          </div>
        ) : (
          <span className="badge badge-green">None</span>
        )}
      </div>
    </div>
  )
}

export function BeforeAfterPanel({ before, after }: { before: RemediationMetrics; after: RemediationMetrics }) {
  return (
    <div className="before-after-panel">
      <MetricColumn label="Original" metrics={before} />
      <ArrowRight className="ba-arrow" size={20} aria-hidden />
      <MetricColumn label="Proposed safe version" metrics={after} />
    </div>
  )
}
