import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { remediationApi } from '@/api'
import type { RemediationPreviewRequest, SubmitReviewRequest } from '@/types'
import { qk } from './queryKeys'

export function useRemediationPlan(datasetId: string | undefined) {
  return useQuery({
    queryKey: datasetId ? qk.remediationPlan(datasetId) : ['remediation', 'none'],
    queryFn: () => remediationApi.getPlan(datasetId as string),
    enabled: Boolean(datasetId),
  })
}

export function useGenerateRemediationPlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (datasetId: string) => remediationApi.getPlan(datasetId),
    onSuccess: (plan) => {
      void qc.invalidateQueries({ queryKey: qk.remediationPlan(plan.datasetId) })
      void qc.invalidateQueries({ queryKey: qk.audit })
    },
  })
}

export function usePreviewRemediation() {
  return useMutation({
    mutationFn: ({ planId, req }: { planId: string; req: RemediationPreviewRequest }) =>
      remediationApi.previewRemediation(planId, req),
  })
}

export function useSubmitPlanReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ planId, req }: { planId: string; req: SubmitReviewRequest }) =>
      remediationApi.submitPlanReview(planId, req),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.reviews })
      void qc.invalidateQueries({ queryKey: qk.decisions })
      void qc.invalidateQueries({ queryKey: qk.audit })
    },
  })
}
