import { create } from 'zustand'
import type { RuleScope, RuleTriggerType } from '@/types'

/**
 * Local UI state only (Zustand). No backend entities are stored here — those
 * live in TanStack Query. This holds sidebar state, which drawers/sheets are
 * open, temporary (non-URL) filters and local demo preferences.
 */

export interface AddRuleContext {
  datasetId?: string
  fileId?: string
  fileName?: string
  scope?: RuleScope
}

export interface EvidenceDrawerState {
  open: boolean
  datasetId?: string
  fieldId?: string
}

export interface RulesFilterState {
  search: string
  tier: string
  trigger: RuleTriggerType | 'ALL'
  enabled: 'ALL' | 'ENABLED' | 'DISABLED'
  scope: 'ALL' | RuleScope
}

interface UiState {
  /* sidebar */
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebar: (collapsed: boolean) => void

  /* evidence drawer */
  evidence: EvidenceDrawerState
  openEvidence: (datasetId: string, fieldId: string) => void
  closeEvidence: () => void

  /* add rule drawer */
  addRuleOpen: boolean
  addRuleContext: AddRuleContext
  openAddRule: (context?: AddRuleContext) => void
  closeAddRule: () => void

  /* rule details drawer */
  ruleDetailsId: string | null
  openRuleDetails: (ruleId: string) => void
  closeRuleDetails: () => void

  /* policy side sheet */
  policySheetId: string | null
  openPolicy: (policyId: string) => void
  closePolicy: () => void

  /* temporary (non-URL) rules filters */
  rulesFilter: RulesFilterState
  setRulesFilter: (patch: Partial<RulesFilterState>) => void
  resetRulesFilter: () => void

  /* local demo preferences */
  demoBannerDismissed: boolean
  dismissDemoBanner: () => void
}

const initialRulesFilter: RulesFilterState = {
  search: '',
  tier: 'ALL',
  trigger: 'ALL',
  enabled: 'ALL',
  scope: 'ALL',
}

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebar: (collapsed) => set({ sidebarCollapsed: collapsed }),

  evidence: { open: false },
  openEvidence: (datasetId, fieldId) => set({ evidence: { open: true, datasetId, fieldId } }),
  closeEvidence: () => set({ evidence: { open: false } }),

  addRuleOpen: false,
  addRuleContext: {},
  openAddRule: (context = {}) => set({ addRuleOpen: true, addRuleContext: context }),
  closeAddRule: () => set({ addRuleOpen: false }),

  ruleDetailsId: null,
  openRuleDetails: (ruleId) => set({ ruleDetailsId: ruleId }),
  closeRuleDetails: () => set({ ruleDetailsId: null }),

  policySheetId: null,
  openPolicy: (policyId) => set({ policySheetId: policyId }),
  closePolicy: () => set({ policySheetId: null }),

  rulesFilter: initialRulesFilter,
  setRulesFilter: (patch) => set((s) => ({ rulesFilter: { ...s.rulesFilter, ...patch } })),
  resetRulesFilter: () => set({ rulesFilter: initialRulesFilter }),

  demoBannerDismissed: false,
  dismissDemoBanner: () => set({ demoBannerDismissed: true }),
}))
