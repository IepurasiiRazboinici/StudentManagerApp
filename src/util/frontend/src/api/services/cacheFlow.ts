import { request } from '../client'
import {
  completedReviews,
  classifierRules,
  dataPassport,
  datasetDetails,
  datasets,
  overviewStats,
  policies,
  policyGapItems,
  previewRows,
  remediationPlans,
  reviewQueue,
  transformations,
  usageAssessment,
} from '../../mocks/fixtures'
import type {
  CompletedReview,
  DataPassport,
  DatasetDetail,
  DatasetSummary,
  OverviewStats,
  PolicyReference,
  PreviewRow,
  RemediationPlan,
  ReviewItem,
  ScanProgress,
  Transformation,
  UsageAssessment,
} from '../../types'

const getDetailFallback = (datasetId: string): DatasetDetail =>
  datasetDetails[datasetId] ?? datasetDetails.client_positions

export const cacheFlowApi = {
  getOverview: () =>
    request<OverviewStats>('/stats/overview', {
      fallback: overviewStats,
    }),

  getClassifierRules: () =>
    request<typeof classifierRules>('/classifier-rules', {
      fallback: classifierRules,
    }),

  createClassifierRule: (payload: unknown) =>
    request<{ ok: true; ruleId: string }>('/classifier-rules', {
      method: 'POST',
      body: JSON.stringify(payload),
      fallback: { ok: true, ruleId: 'rule-demo-created' },
    }),

  getDatasets: () =>
    request<DatasetSummary[]>('/datasets', {
      fallback: datasets,
    }),

  getDataset: (datasetId: string) =>
    request<DatasetDetail>(`/datasets/${datasetId}`, {
      fallback: getDetailFallback(datasetId),
    }),

  getDatasetPreview: (datasetId: string) =>
    request<PreviewRow[]>(`/datasets/${datasetId}/preview`, {
      fallback: previewRows,
    }),

  addSource: (payload: unknown) =>
    request<{ ok: true; sourceId: string }>('/sources', {
      method: 'POST',
      body: JSON.stringify(payload),
      fallback: { ok: true, sourceId: 'demo-source-01' },
    }),

  startScan: () =>
    request<{ scanId: string }>('/scans', {
      method: 'POST',
      fallback: { scanId: 'scan-demo-2026-07-22' },
    }),

  getScan: (scanId: string) =>
    request<ScanProgress>(`/scans/${scanId}`, {
      fallback: {
        id: scanId,
        value: 68,
        currentDataset: 'client_positions',
        stages: [
          { label: 'Discovering structure', status: 'complete' },
          { label: 'Profiling data', status: 'complete' },
          { label: 'Detecting sensitive patterns', status: 'active' },
          { label: 'Matching governance policies', status: 'pending' },
          { label: 'Generating classifications', status: 'pending' },
        ],
      },
    }),

  usageCheck: (datasetId: string, payload: unknown) =>
    request<UsageAssessment>(`/datasets/${datasetId}/usage-check`, {
      method: 'POST',
      body: JSON.stringify(payload),
      fallback: usageAssessment,
    }),

  getTransformations: (datasetId: string) =>
    request<Transformation[]>(`/datasets/${datasetId}/remediation/options`, {
      fallback: transformations,
    }),

  getRemediationPlans: (datasetId: string) =>
    request<Record<string, RemediationPlan>>(`/datasets/${datasetId}/remediation`, {
      fallback: remediationPlans,
    }),

  submitReview: (classificationId: string, payload: unknown) =>
    request<{ ok: true }>(`/classifications/${classificationId}/review`, {
      method: 'POST',
      body: JSON.stringify(payload),
      fallback: { ok: true },
    }),

  getReviewQueue: () =>
    request<ReviewItem[]>('/reviews/queue', {
      fallback: reviewQueue,
    }),

  getPolicyGaps: () =>
    request<ReviewItem[]>('/reviews/queue?type=policy-gap', {
      fallback: policyGapItems,
    }),

  getCompletedReviews: () =>
    request<CompletedReview[]>('/reviews/queue?type=completed', {
      fallback: completedReviews,
    }),

  getPolicy: (name: string) =>
    request<PolicyReference>(`/policies/${name}`, {
      fallback: policies[name] ?? policies['FIN-04'],
    }),

  getPassport: () =>
    request<DataPassport>('/data-passports/CF-2026-041', {
      fallback: dataPassport,
    }),
}
