import type {
  RemediationPlan,
  RemediationPreview,
  RemediationPreviewRequest,
  ReviewDecision,
  SubmitReviewRequest,
} from '@/types'
import { mockDb } from '@/mocks/db'
import { request } from './apiClient'

export const remediationApi = {
  getPlan: (datasetId: string) =>
    request<RemediationPlan>(`/datasets/${datasetId}/remediation-plan`, {
      method: 'POST',
      mock: () => mockDb.getRemediationPlan(datasetId),
      delay: 500,
    }),

  previewRemediation: (planId: string, req: RemediationPreviewRequest) =>
    request<RemediationPreview>(`/remediation-plans/${planId}/preview`, {
      method: 'POST',
      body: req,
      mock: () => mockDb.previewRemediation(planId, req.transformationIds),
      delay: 450,
    }),

  submitPlanReview: (planId: string, req: SubmitReviewRequest) =>
    request<ReviewDecision>(`/remediation-plans/${planId}/submit-review`, {
      method: 'POST',
      body: req,
      mock: () => mockDb.submitPlanReview(planId, req),
      delay: 400,
    }),
}
