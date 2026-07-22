import { useUiStore } from '@/stores/uiStore'
import { useClassificationRules } from '@/hooks'
import { Drawer, KeyValue, PriorityBadge, TierBadge, StatusBadge, SystemLock } from '@/components/common'
import { SCOPE_LABEL, TRIGGER_TYPE_LABEL } from '@/utils/labels'
import { formatDateTime } from '@/utils/format'

export function RuleDetailsDrawer() {
  const ruleId = useUiStore((s) => s.ruleDetailsId)
  const close = useUiStore((s) => s.closeRuleDetails)
  const { data: rules } = useClassificationRules()
  const rule = rules?.find((r) => r.id === ruleId)

  return (
    <Drawer open={Boolean(ruleId)} onClose={close} title={rule ? rule.name : 'Rule'} subtitle={rule?.protected ? 'Read-only system rule' : 'Custom rule'}>
      {rule ? (
        <div className="rule-details">
          <div className="rule-details-badges">
            {rule.protected ? <SystemLock /> : <StatusBadge tone="teal">Custom</StatusBadge>}
            <TierBadge tier={rule.targetTier} />
            <PriorityBadge priority={rule.priority} />
            <StatusBadge tone={rule.enabled ? 'green' : 'neutral'}>{rule.enabled ? 'Enabled' : 'Disabled'}</StatusBadge>
          </div>
          <p className="rule-details-description">{rule.description}</p>
          <div className="key-value-grid">
            <KeyValue label="Trigger type" value={TRIGGER_TYPE_LABEL[rule.triggerType]} />
            <KeyValue label="Trigger" value={<span className="mono">{rule.triggerSummary}</span>} />
            <KeyValue label="Scope" value={SCOPE_LABEL[rule.scope]} />
            <KeyValue label="Confidence" value={`${rule.confidence}%`} />
            <KeyValue label="Human review" value={rule.requireHumanReview ? 'Required' : 'Not required'} />
            <KeyValue label="Matched files" value={rule.matchedFiles} />
            <KeyValue label="Updated" value={formatDateTime(rule.updatedAt)} />
          </div>
          {rule.explanationTemplate ? (
            <div className="drawer-section">
              <span className="eyebrow">Explanation template</span>
              <p>{rule.explanationTemplate}</p>
            </div>
          ) : null}
          {rule.protected ? <p className="muted">System rules are implemented by the backend and cannot be edited or deleted.</p> : null}
        </div>
      ) : null}
    </Drawer>
  )
}
