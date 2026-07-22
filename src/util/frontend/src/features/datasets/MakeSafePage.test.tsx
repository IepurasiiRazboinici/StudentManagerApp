import { describe, expect, it, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { RemediationPlan } from '@/types'
import { renderRoute } from '@/test/utils'
import { MakeSafePage } from './MakeSafePage'

const { previewMock } = vi.hoisted(() => ({ previewMock: vi.fn() }))

const plan: RemediationPlan = {
  id: 'plan-test',
  datasetId: 'mixed_market_client_log',
  datasetName: 'mixed_market_client_log.csv',
  riskContributors: [{ id: 'rc1', field: 'client_id', severity: 'CRITICAL', reason: 'Direct identifier.', relatedRuleOrPolicy: 'FIN-04' }],
  transformations: [
    { id: 't1', kind: 'REMOVE_FIELD', title: 'Remove client_id', field: 'client_id', description: 'Drop it.', recommended: true },
    { id: 't2', kind: 'BUCKET_NUMERIC', title: 'Bucket position_size', field: 'position_size', description: 'Range it.', recommended: false },
  ],
  original: { classification: 'HIGHLY_RESTRICTED', riskScore: 86, usageStatus: 'BLOCKED', remainingSensitiveFields: ['client_id'], utilityRetained: 100 },
  proposed: { classification: 'PUBLIC', riskScore: 14, usageStatus: 'ALLOWED', remainingSensitiveFields: [], utilityRetained: 80 },
  createdAt: '2026-07-21T10:00:00Z',
}

vi.mock('@/hooks', () => ({
  useRemediationPlan: () => ({ data: plan, isLoading: false, isError: false, refetch: () => {} }),
  usePreviewRemediation: () => ({ mutate: previewMock, data: undefined, isPending: false, isError: false }),
  useSubmitPlanReview: () => ({ mutate: vi.fn(), isPending: false }),
}))

describe('MakeSafePage remediation preview', () => {
  beforeEach(() => previewMock.mockReset())

  it('requests a preview from the backend after transformations change', async () => {
    renderRoute(<MakeSafePage />, { path: '/datasets/:datasetId/make-safe', initialEntries: ['/datasets/mixed_market_client_log/make-safe'] })

    // debounced preview fires on mount with the recommended selection
    await waitFor(() => expect(previewMock).toHaveBeenCalled(), { timeout: 2000 })
    previewMock.mockReset()

    // toggling a transformation triggers another backend preview request
    await userEvent.click(screen.getByRole('button', { name: /Bucket position_size/i }))
    await waitFor(
      () =>
        expect(previewMock).toHaveBeenCalledWith({
          planId: 'plan-test',
          req: { transformationIds: expect.arrayContaining(['t1', 't2']) },
        }),
      { timeout: 2000 },
    )
  })

  it('shows the risk contributors and transformation options', () => {
    renderRoute(<MakeSafePage />, { path: '/datasets/:datasetId/make-safe', initialEntries: ['/datasets/mixed_market_client_log/make-safe'] })
    expect(screen.getByText('Risk contributors')).toBeInTheDocument()
    expect(screen.getByText('Remove client_id')).toBeInTheDocument()
  })
})
