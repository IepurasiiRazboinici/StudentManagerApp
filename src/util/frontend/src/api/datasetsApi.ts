import type {
  DataField,
  DatasetDetails,
  DatasetSummary,
  ReclassifyResponse,
  UsageCheckRequest,
  UsageCheckResult,
} from '@/types'
import { mockDb } from '@/mocks/db'
import { INTENDED_USE_LABEL } from '@/utils/labels'
import { request } from './apiClient'

function mockUsageResult(datasetId: string, req: UsageCheckRequest): UsageCheckResult {
  const detail = mockDb.getDataset(datasetId)
  const purpose = INTENDED_USE_LABEL[req.purpose]
  const tier = detail.classification

  if (tier === 'HIGHLY_RESTRICTED') {
    return {
      status: 'BLOCKED',
      summary: `${detail.name} is Highly Restricted and cannot be used for "${purpose}" in its current form.`,
      reasons: ['Contains account/client-level identifiers.', 'No verified anonymisation on record.'],
      conditions: [],
      policyReferences: detail.policyReferences,
      canBeMadeSafe: detail.canBeMadeSafe,
    }
  }
  if (tier === 'RESTRICTED') {
    return {
      status: req.purpose === 'PUBLIC_EXPORT' || req.purpose === 'SHARE_EXTERNAL_PARTNER' ? 'REVIEW_REQUIRED' : 'CONDITIONALLY_ALLOWED',
      summary: `${detail.name} is Restricted. "${purpose}" is allowed only under conditions.`,
      reasons: ['Licensed or derived fields require confirmed permissions.'],
      conditions: ['Confirm licensing for the destination region.', 'Remove derived fields for external distribution.'],
      policyReferences: detail.policyReferences,
      canBeMadeSafe: detail.canBeMadeSafe,
    }
  }
  if (tier === 'CORPORATE') {
    return {
      status: req.purpose === 'PUBLIC_EXPORT' ? 'REVIEW_REQUIRED' : 'ALLOWED',
      summary: `${detail.name} is Corporate and may be used internally for "${purpose}".`,
      reasons: ['No real sensitive values present.'],
      conditions: req.purpose === 'PUBLIC_EXPORT' ? ['Public export requires governance sign-off.'] : [],
      policyReferences: detail.policyReferences,
      canBeMadeSafe: false,
    }
  }
  return {
    status: 'ALLOWED',
    summary: `${detail.name} is Public and cleared for "${purpose}".`,
    reasons: ['No sensitive identifiers or licensed derivations detected.'],
    conditions: [],
    policyReferences: detail.policyReferences,
    canBeMadeSafe: false,
  }
}

export const datasetsApi = {
  listDatasets: () =>
    request<DatasetSummary[]>('/datasets', {
      mock: () => mockDb.listDatasets(),
    }),

  getDataset: (datasetId: string) =>
    request<DatasetDetails>(`/datasets/${datasetId}`, {
      mock: () => mockDb.getDataset(datasetId),
    }),

  getFields: (datasetId: string) =>
    request<DataField[]>(`/datasets/${datasetId}/fields`, {
      mock: () => mockDb.getFields(datasetId),
    }),

  getPreview: (datasetId: string) =>
    request<DataField[]>(`/datasets/${datasetId}/preview`, {
      mock: () => mockDb.getFields(datasetId),
    }),

  reclassify: (datasetId: string) =>
    request<ReclassifyResponse>(`/datasets/${datasetId}/reclassify`, {
      method: 'POST',
      mock: () => {
        // Mutates the mock dataset by applying saved custom rules, then reports done.
        mockDb.reclassify(datasetId)
        return { jobId: `job-${datasetId}`, datasetId, state: 'COMPLETE', progress: 100 }
      },
      delay: 900,
    }),

  usageCheck: (datasetId: string, req: UsageCheckRequest) =>
    request<UsageCheckResult>(`/datasets/${datasetId}/usage-check`, {
      method: 'POST',
      body: req,
      mock: () => mockUsageResult(datasetId, req),
      delay: 500,
    }),
}
