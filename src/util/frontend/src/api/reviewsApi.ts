import type { DataPassport, ReviewDecision, ReviewItem, SubmitReviewRequest } from '@/types'
import { mockDb } from '@/mocks/db'
import { request } from './apiClient'

export const reviewsApi = {
  getQueue: () =>
    request<ReviewItem[]>('/reviews/queue', {
      mock: () => mockDb.listReviews(),
    }),

  getDecisions: () =>
    request<ReviewDecision[]>('/reviews/decisions', {
      mock: () => mockDb.listReviewDecisions(),
    }),

  submitReview: (classificationId: string, req: SubmitReviewRequest) =>
    request<ReviewDecision>(`/classifications/${classificationId}/review`, {
      method: 'POST',
      body: req,
      mock: () => mockDb.submitReview(classificationId, req),
      delay: 350,
    }),

  approveSafeVersion: (datasetId: string) =>
    request<DataPassport>(`/datasets/${datasetId}/approve-safe-version`, {
      method: 'POST',
      mock: () => mockDb.approveSafeVersion(datasetId),
      delay: 600,
    }),
}
