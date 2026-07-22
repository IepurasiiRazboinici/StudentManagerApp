import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import type { ClassificationRule } from '@/types'
import { useDeleteRule, useToggleRule } from '@/hooks'
import { toast } from '@/stores/toastStore'
import { useUiStore } from '@/stores/uiStore'
import { ConfirmDialog, IconButton, PriorityBadge, StatusBadge, SystemLock, TierBadge } from '@/components/common'

/**
 * Active rules table used on the File Configuration and Dataset Details pages.
 * System rules render as read-only with a protected lock; custom rules can be
 * toggled or deleted (both call the backend and refresh dataset data).
 */
export function ActiveRulesList({ rules, datasetId }: { rules: ClassificationRule[]; datasetId?: string }) {
  const toggle = useToggleRule()
  const del = useDeleteRule()
  const openRuleDetails = useUiStore((s) => s.openRuleDetails)
  const [pendingDelete, setPendingDelete] = useState<ClassificationRule | null>(null)

  const onToggle = (rule: ClassificationRule) => {
    toggle.mutate(
      { ruleId: rule.id, enabled: !rule.enabled },
      {
        onSuccess: () => toast.success(`Rule ${rule.enabled ? 'disabled' : 'enabled'} — dataset data refreshed.`),
        onError: () => toast.error('Could not update the rule.'),
      },
    )
  }

  const confirmDelete = () => {
    if (!pendingDelete) return
    del.mutate(pendingDelete.id, {
      onSuccess: () => toast.success('Custom rule deleted.'),
      onError: () => toast.error('Could not delete the rule.'),
    })
    setPendingDelete(null)
  }

  return (
    <>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Rule</th>
              <th>Source</th>
              <th>Target tier</th>
              <th>Priority</th>
              <th>Match</th>
              <th>Enabled</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {rules.map((rule) => (
              <tr key={rule.id}>
                <td>
                  <button type="button" className="link-cell" onClick={() => openRuleDetails(rule.id)}>
                    {rule.name}
                  </button>
                </td>
                <td>{rule.protected ? <SystemLock /> : <StatusBadge tone="teal">Custom</StatusBadge>}</td>
                <td>
                  <TierBadge tier={rule.targetTier} />
                </td>
                <td>
                  <PriorityBadge priority={rule.priority} />
                </td>
                <td>
                  <StatusBadge tone={rule.matchStatus === 'MATCHED' ? 'green' : 'neutral'}>
                    {rule.matchStatus === 'MATCHED' ? 'Matched' : rule.matchStatus === 'NOT_MATCHED' ? 'No match' : '—'}
                  </StatusBadge>
                </td>
                <td>
                  {rule.protected ? (
                    <span className="muted">Always on</span>
                  ) : (
                    <label className="switch-inline">
                      <input type="checkbox" checked={rule.enabled} onChange={() => onToggle(rule)} aria-label={`Toggle ${rule.name}`} />
                      <span>{rule.enabled ? 'On' : 'Off'}</span>
                    </label>
                  )}
                </td>
                <td className="row-actions">
                  {rule.protected ? (
                    <span className="lock-hint" title="Protected system rule">
                      <SystemLock />
                    </span>
                  ) : (
                    <>
                      <IconButton
                        label={`Edit ${rule.name}`}
                        onClick={() =>
                          useUiStore.getState().openAddRule({ datasetId, scope: rule.scope, fileId: rule.scopeFileId })
                        }
                      >
                        <Pencil size={15} />
                      </IconButton>
                      <IconButton label={`Delete ${rule.name}`} onClick={() => setPendingDelete(rule)}>
                        <Trash2 size={15} />
                      </IconButton>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete custom rule?"
        message={
          <>
            This permanently removes <strong>{pendingDelete?.name}</strong>. The backend will re-evaluate affected
            datasets.
          </>
        }
        confirmLabel="Delete rule"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  )
}
