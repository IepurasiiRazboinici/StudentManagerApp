import { useUiStore } from '@/stores/uiStore'
import { usePolicy } from '@/hooks'
import { Drawer, KeyValue, StatusBadge, Skeleton } from '@/components/common'
import { formatDate } from '@/utils/format'

export function PolicySideSheet() {
  const policyId = useUiStore((s) => s.policySheetId)
  const close = useUiStore((s) => s.closePolicy)
  const { data: policy, isLoading } = usePolicy(policyId ?? undefined)

  return (
    <Drawer open={Boolean(policyId)} onClose={close} title={policy ? policy.name : 'Policy'} subtitle={policy ? `Version ${policy.version}` : undefined}>
      {isLoading ? (
        <div className="stack">
          <Skeleton className="skeleton-line" />
          <Skeleton className="skeleton-panel" />
        </div>
      ) : policy ? (
        <div className="policy-sheet">
          <div className="rule-details-badges">
            <StatusBadge tone={policy.status === 'ACTIVE' ? 'green' : 'neutral'}>{policy.status}</StatusBadge>
            <StatusBadge tone="blue">{policy.classificationsUsing} classifications</StatusBadge>
          </div>
          <div className="key-value-grid">
            <KeyValue label="Version" value={policy.version} />
            <KeyValue label="Ingested" value={formatDate(policy.ingestedAt)} />
            <KeyValue label="Coverage" value={`${policy.coverage}%`} />
          </div>
          {policy.sections.map((section) => (
            <section key={section.id} className="policy-section-block">
              <span className="mono policy-ref">{section.reference}</span>
              <h3>{section.title}</h3>
              <blockquote>{section.body}</blockquote>
              {section.datasetsUsing.length > 0 ? (
                <div className="policy-datasets">
                  <span className="eyebrow">Datasets using this section</span>
                  <div className="rule-pills">
                    {section.datasetsUsing.map((d) => (
                      <span key={d} className="badge badge-neutral mono">
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>
          ))}
        </div>
      ) : (
        <p className="muted">Policy not found.</p>
      )}
    </Drawer>
  )
}
