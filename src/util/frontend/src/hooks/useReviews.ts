import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { reviewsApi } from '@/api'
import type { SubmitReviewRequest } from '@/types'
import { qk } from './queryKeys'

export function useReviewQueue() {
  return useQuery({ queryKey: qk.reviews, queryFn: reviewsApi.getQueue })
}

export function useReviewDecisions() {
  return useQuery({ queryKey: qk.decisions, queryFn: reviewsApi.getDecisions })
}

export function useSubmitReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ classificationId, req }: { classificationId: string; req: SubmitReviewRequest }) =>
      reviewsApi.submitReview(classificationId, req),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.reviews })
      void qc.invalidateQueries({ queryKey: qk.decisions })
      void qc.invalidateQueries({ queryKey: qk.datasets })
      void qc.invalidateQueries({ queryKey: qk.dashboard })
      void qc.invalidateQueries({ queryKey: qk.audit })
    },
  })
}

export function useApproveSafeVersion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (datasetId: string) => reviewsApi.approveSafeVersion(datasetId),
    onSuccess: (_data, datasetId) => {
      void qc.invalidateQueries({ queryKey: qk.reviews })
      void qc.invalidateQueries({ queryKey: qk.passport(datasetId) })
      void qc.invalidateQueries({ queryKey: qk.dashboard })
      void qc.invalidateQueries({ queryKey: qk.audit })
    },
  })
}
