import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { rulesApi } from '@/api'
import type { ClassificationRule, CreateRuleRequest, RulePreviewRequest } from '@/types'
import { qk } from './queryKeys'

export function useClassificationRules() {
  return useQuery({ queryKey: qk.rules, queryFn: rulesApi.listRules })
}

export function useCreateRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (req: CreateRuleRequest) => rulesApi.createRule(req),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.rules })
      void qc.invalidateQueries({ queryKey: qk.audit })
      void qc.invalidateQueries({ queryKey: qk.dashboard })
    },
  })
}

export function usePreviewRule() {
  return useMutation({
    mutationFn: (req: RulePreviewRequest) => rulesApi.previewRule(req),
  })
}

export function useUpdateRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ ruleId, patch }: { ruleId: string; patch: Partial<ClassificationRule> }) =>
      rulesApi.updateRule(ruleId, patch),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.rules })
      void qc.invalidateQueries({ queryKey: qk.audit })
      void qc.invalidateQueries({ queryKey: qk.dashboard })
    },
  })
}

export function useToggleRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ ruleId, enabled }: { ruleId: string; enabled: boolean }) =>
      rulesApi.updateRule(ruleId, { enabled }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.rules })
      void qc.invalidateQueries({ queryKey: qk.audit })
      void qc.invalidateQueries({ queryKey: qk.dashboard })
    },
  })
}

export function useDeleteRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ruleId: string) => rulesApi.deleteRule(ruleId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.rules })
      void qc.invalidateQueries({ queryKey: qk.audit })
      void qc.invalidateQueries({ queryKey: qk.dashboard })
    },
  })
}
