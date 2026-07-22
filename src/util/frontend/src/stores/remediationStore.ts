import { create } from 'zustand'

/** Selected remediation transformations, keyed by plan id (local UI state). */
interface RemediationState {
  selectedByPlan: Record<string, string[]>
  init: (planId: string, ids: string[]) => void
  toggle: (planId: string, id: string) => void
  selected: (planId: string) => string[]
}

export const useRemediationStore = create<RemediationState>((set, get) => ({
  selectedByPlan: {},
  init: (planId, ids) =>
    set((s) => (s.selectedByPlan[planId] ? s : { selectedByPlan: { ...s.selectedByPlan, [planId]: ids } })),
  toggle: (planId, id) =>
    set((s) => {
      const current = s.selectedByPlan[planId] ?? []
      const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
      return { selectedByPlan: { ...s.selectedByPlan, [planId]: next } }
    }),
  selected: (planId) => get().selectedByPlan[planId] ?? [],
}))
