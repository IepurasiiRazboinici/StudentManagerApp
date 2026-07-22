import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { DatasetDetails, EvidenceKind, EvidenceSignal } from '@/types'
import { useUiStore } from '@/stores/uiStore'
import { EvidenceDrawer } from './EvidenceDrawer'

const KINDS: EvidenceKind[] = ['EXPLICIT_MARKER', 'DETECTOR', 'POLICY', 'CONTEXT', 'AGGREGATION', 'CUSTOM_RULE', 'HUMAN']

const evidence: EvidenceSignal[] = KINDS.map((kind, i) => ({
  id: `ev-${i}`,
  kind,
  label: `${kind} signal`,
  explanation: `${kind} explanation`,
  weight: 0.5,
}))

const dataset: DatasetDetails = {
  id: 'ds',
  name: 'sample.csv',
  sourceKind: 'FILE',
  sourceName: 'Upload',
  sourceLocation: 'uploads/sample.csv',
  rowCount: 10,
  fieldCount: 1,
  classification: 'RESTRICTED',
  confidence: 80,
  reviewStatus: 'REVIEW_REQUIRED',
  usageStatus: 'REVIEW_REQUIRED',
  matchedRuleCount: 1,
  hasCustomRule: true,
  canBeMadeSafe: true,
  lastAnalysed: '2026-07-21T10:00:00Z',
  protectionSummary: 'summary',
  whyThisTier: 'Because of the evidence.',
  owner: 'Owner',
  retention: '1y',
  explicitMarkers: [],
  matchedRules: [],
  fields: [
    {
      id: 'fld-1',
      name: 'ownergroup',
      dataType: 'string',
      classification: 'RESTRICTED',
      confidence: 80,
      matchedRuleIds: [],
      matchedRuleNames: [],
      maskedSample: 'OG-███',
      reviewStatus: 'REVIEW_REQUIRED',
      evidence,
      whyThisTier: 'Because of the evidence.',
      whatReducesTier: 'Remove the mapping.',
    },
  ],
  reviewHistory: [{ id: 'h1', action: 'Flagged', actor: 'System', timestamp: '2026-07-21T10:00:00Z' }],
  policyReferences: [],
}

vi.mock('@/hooks', () => ({
  useDatasetDetails: () => ({ data: dataset, isLoading: false }),
  useSubmitReview: () => ({ mutate: vi.fn(), isPending: false }),
}))

describe('EvidenceDrawer', () => {
  beforeEach(() => {
    useUiStore.getState().openEvidence('ds', 'fld-1')
  })

  it('renders every evidence kind returned by the backend', () => {
    render(<EvidenceDrawer />)
    expect(screen.getByText('Explicit marker')).toBeInTheDocument()
    expect(screen.getByText('Detector')).toBeInTheDocument()
    expect(screen.getByText('Policy')).toBeInTheDocument()
    expect(screen.getByText('Context')).toBeInTheDocument()
    expect(screen.getByText('Aggregation')).toBeInTheDocument()
    expect(screen.getByText('Custom rule')).toBeInTheDocument()
    // HUMAN appears for the evidence group and the review-history header
    expect(screen.getAllByText('Human review').length).toBeGreaterThanOrEqual(1)
  })

  it('shows the backend "why" and "what reduces the tier" explanations', () => {
    render(<EvidenceDrawer />)
    expect(screen.getByText('Why this tier?')).toBeInTheDocument()
    expect(screen.getByText('What could reduce the tier?')).toBeInTheDocument()
    expect(screen.getByText('Remove the mapping.')).toBeInTheDocument()
  })

  it('offers Confirm / Override / Add Note / Add New Rule actions', () => {
    render(<EvidenceDrawer />)
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Override' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add Note' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add new rule/i })).toBeInTheDocument()
  })
})
