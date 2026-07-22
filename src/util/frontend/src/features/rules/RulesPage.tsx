import { useState } from 'react'
import { Copy, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import type { ClassificationRule, ClassificationTier } from '@/types'
import { useClassificationRules, useCreateRule, useDeleteRule, useToggleRule } from '@/hooks'
import { useUiStore } from '@/stores/uiStore'
import { toast } from '@/stores/toastStore'
import {
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  IconButton,
  PageHeader,
  Panel,
  PriorityBadge,
  StatusBadge,
  SystemLock,
  TabButton,
  TableSkeleton,
  TierBadge,
} from '@/components/common'
import { SCOPE_LABEL, TIER_LABEL, TRIGGER_TYPE_LABEL } from '@/utils/labels'
import { formatDate } from '@/utils/format'

const TIERS: ClassificationTier[] = ['PUBLIC', 'CORPORATE', 'RESTRICTED', 'HIGHLY_RESTRICTED', 'UNKNOWN']
type Tab = 'ALL' | 'SYSTEM' | 'CUSTOM'

export function RulesPage() {
  const { data, isLoading, isError, refetch } = useClassificationRules()
  const filter = useUiStore((s) => s.rulesFilter)
  const setFilter = useUiStore((s) => s.setRulesFilter)
  const openAddRule = useUiStore((s) => s.openAddRule)
  const openRuleDetails = useUiStore((s) => s.openRuleDetails)
  const toggle = useToggleRule()
  const del = useDeleteRule()
  const create = useCreateRule()
  const [tab, setTab] = useState<Tab>('ALL')
  const [pendingDelete, setPendingDelete] = useState<ClassificationRule | null>(null)

  const rules = (data ?? []).filter((r) => {
    if (tab === 'SYSTEM' && r.source !== 'SYSTEM') return false
    if (tab === 'CUSTOM' && r.source !== 'CUSTOM') return false
    if (filter.search && !r.name.toLowerCase().includes(filter.search.toLowerCase())) return false
    if (filter.tier !== 'ALL' && r.targetTier !== filter.tier) return false
    if (filter.trigger !== 'ALL' && r.triggerType !== filter.trigger) return false
    if (filter.enabled === 'ENABLED' && !r.enabled) return false
    if (filter.enabled === 'DISABLED' && r.enabled) return false
    if (filter.scope !== 'ALL' && r.scope !== filter.scope) return false
    return true
  })

  const duplicate = (rule: ClassificationRule) => {
    if (!rule.trigger) return
    create.mutate(
      {
        name: `${rule.name} (copy)`,
        description: rule.description,
        scope: rule.scope,
        scopeFileId: rule.scopeFileId,
        triggerType: rule.triggerType,
        trigger: rule.trigger,
        targetTier: rule.targetTier,
        confidence: rule.confidence,
        priority: rule.priority,
        requireHumanReview: rule.requireHumanReview,
        explanationTemplate: rule.explanationTemplate,
        enabled: false,
      },
      {
        onSuccess: () => toast.success('Rule duplicated (saved as disabled).'),
        onError: () => toast.error('Could not duplicate the rule.'),
      },
    )
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="Classification Rules"
        description="System rules are implemented and protected by the backend. Custom rules are yours to manage."
        actions={
          <Button onClick={() => openAddRule({ scope: 'ALL_FILES' })}>
            <Plus size={16} /> New rule
          </Button>
        }
      />

      <div className="tabs" role="tablist" aria-label="Rule type">
        <TabButton active={tab === 'ALL'} onClick={() => setTab('ALL')}>
          All Rules
        </TabButton>
        <TabButton active={tab === 'SYSTEM'} onClick={() => setTab('SYSTEM')}>
          System Rules
        </TabButton>
        <TabButton active={tab === 'CUSTOM'} onClick={() => setTab('CUSTOM')}>
          Custom Rules
        </TabButton>
      </div>

      <Panel className="catalogue-filters">
        <div className="filter-search">
          <Search size={15} aria-hidden />
          <input
            className="cf-input"
            type="search"
            placeholder="Search rules…"
            value={filter.search}
            onChange={(e) => setFilter({ search: e.target.value })}
            aria-label="Search rules"
          />
        </div>
        <div className="filter-row">
          <select className="cf-input" value={filter.tier} onChange={(e) => setFilter({ tier: e.target.value })} aria-label="Target tier">
            <option value="ALL">All tiers</option>
            {TIERS.map((t) => (
              <option key={t} value={t}>
                {TIER_LABEL[t]}
              </option>
            ))}
          </select>
          <select className="cf-input" value={filter.enabled} onChange={(e) => setFilter({ enabled: e.target.value as typeof filter.enabled })} aria-label="Enabled state">
            <option value="ALL">Any state</option>
            <option value="ENABLED">Enabled</option>
            <option value="DISABLED">Disabled</option>
          </select>
          <select className="cf-input" value={filter.scope} onChange={(e) => setFilter({ scope: e.target.value as typeof filter.scope })} aria-label="Scope">
            <option value="ALL">Any scope</option>
            <option value="ALL_FILES">All files</option>
            <option value="THIS_FILE">This file</option>
          </select>
        </div>
      </Panel>

      <Panel>
        {isLoading ? (
          <TableSkeleton rows={6} cols={7} />
        ) : isError ? (
          <ErrorState description="Rules could not be loaded." onRetry={() => void refetch()} />
        ) : rules.length === 0 ? (
          <EmptyState title="No rules match" description="Adjust the filters, or add a custom rule." />
        ) : (
          <div className="table-wrap">
            <table className="data-table rules-table">
              <thead>
                <tr>
                  <th>Rule</th>
                  <th>Source</th>
                  <th>Scope</th>
                  <th>Trigger</th>
                  <th>Target tier</th>
                  <th>Priority</th>
                  <th>Enabled</th>
                  <th className="num">Files</th>
                  <th>Updated</th>
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
                    <td>{SCOPE_LABEL[rule.scope]}</td>
                    <td>{TRIGGER_TYPE_LABEL[rule.triggerType]}</td>
                    <td>
                      <TierBadge tier={rule.targetTier} />
                    </td>
                    <td>
                      <PriorityBadge priority={rule.priority} />
                    </td>
                    <td>
                      {rule.protected ? (
                        <span className="muted">Always on</span>
                      ) : (
                        <label className="switch-inline">
                          <input
                            type="checkbox"
                            checked={rule.enabled}
                            onChange={() =>
                              toggle.mutate(
                                { ruleId: rule.id, enabled: !rule.enabled },
                                { onSuccess: () => toast.success(`Rule ${rule.enabled ? 'disabled' : 'enabled'}.`) },
                              )
                            }
                            aria-label={`Toggle ${rule.name}`}
                          />
                          <span>{rule.enabled ? 'On' : 'Off'}</span>
                        </label>
                      )}
                    </td>
                    <td className="num">{rule.matchedFiles}</td>
                    <td className="muted">{formatDate(rule.updatedAt)}</td>
                    <td className="row-actions">
                      {rule.protected ? (
                        <span className="lock-hint">
                          <SystemLock />
                        </span>
                      ) : (
                        <>
                          <IconButton label={`Edit ${rule.name}`} onClick={() => openAddRule({ scope: rule.scope, fileId: rule.scopeFileId })}>
                            <Pencil size={15} />
                          </IconButton>
                          <IconButton label={`Duplicate ${rule.name}`} onClick={() => duplicate(rule)}>
                            <Copy size={15} />
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
        )}
      </Panel>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete custom rule?"
        message={
          <>
            This permanently removes <strong>{pendingDelete?.name}</strong>.
          </>
        }
        confirmLabel="Delete rule"
        destructive
        onConfirm={() => {
          if (pendingDelete) {
            del.mutate(pendingDelete.id, {
              onSuccess: () => toast.success('Custom rule deleted.'),
              onError: () => toast.error('Could not delete the rule.'),
            })
          }
          setPendingDelete(null)
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}
