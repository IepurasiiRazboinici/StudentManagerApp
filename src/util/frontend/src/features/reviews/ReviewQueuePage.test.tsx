import { describe, expect, it, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReviewItem } from '@/types'
import { renderWithProviders } from '@/test/utils'
import { ReviewQueuePage } from './ReviewQueuePage'

const { submitMock } = vi.hoisted(() => ({ submitMock: vi.fn() }))

const item: ReviewItem = {
  id: 'rev-1',
  classificationId: 'cls-ownergroup',
  datasetId: 'ownergroup_mapping',
  datasetName: 'ownergroup_mapping.csv',
  category: 'LOW_CONFIDENCE',
  confidence: 72,
  currentClassification: 'RESTRICTED',
  reason: 'Undocumented provenance.',
  evidence: [{ id: 'e1', kind: 'CONTEXT', label: 'Provenance', explanation: 'Undocumented.', weight: 0.5 }],
  recommendedAction: 'Confirm or override.',
  policyReferences: [],
}

vi.mock('@/hooks', () => ({
  useReviewQueue: () => ({ data: [item], isLoading: false, isError: false, refetch: () => {} }),
  useSubmitReview: () => ({ mutate: submitMock, isPending: false }),
}))

describe('ReviewQueuePage actions', () => {
  beforeEach(() => submitMock.mockReset())

  it('shows the selected review item', () => {
    renderWithProviders(<ReviewQueuePage />)
    expect(screen.getAllByText('ownergroup_mapping.csv').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Undocumented provenance.')).toBeInTheDocument()
  })

  it('submits an Approve decision through the backend mutation', async () => {
    renderWithProviders(<ReviewQueuePage />)
    await userEvent.click(screen.getByRole('button', { name: /approve/i }))
    expect(submitMock).toHaveBeenCalledWith(
      { classificationId: 'cls-ownergroup', req: { decision: 'APPROVE' } },
      expect.anything(),
    )
  })

  it('submits an Override decision through the backend mutation', async () => {
    renderWithProviders(<ReviewQueuePage />)
    await userEvent.click(screen.getByRole('button', { name: /override/i }))
    expect(submitMock).toHaveBeenCalledWith(
      { classificationId: 'cls-ownergroup', req: { decision: 'OVERRIDE' } },
      expect.anything(),
    )
  })
})
