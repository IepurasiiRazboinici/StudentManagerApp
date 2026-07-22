import { describe, expect, it, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { DatasetSummary } from '@/types'
import { renderWithProviders } from '@/test/utils'
import { CataloguePage } from './CataloguePage'

const rows: DatasetSummary[] = [
  {
    id: 'market_ticks',
    name: 'market_ticks.csv',
    sourceKind: 'FILE',
    sourceName: 'Upload',
    sourceLocation: 'x',
    rowCount: 100,
    fieldCount: 5,
    classification: 'PUBLIC',
    confidence: 93,
    reviewStatus: 'AUTO',
    usageStatus: 'ALLOWED',
    matchedRuleCount: 1,
    hasCustomRule: false,
    canBeMadeSafe: false,
    lastAnalysed: '2026-07-21T10:00:00Z',
  },
  {
    id: 'client_positions_sample',
    name: 'client_positions_sample.csv',
    sourceKind: 'FILE',
    sourceName: 'Upload',
    sourceLocation: 'x',
    rowCount: 5000,
    fieldCount: 6,
    classification: 'HIGHLY_RESTRICTED',
    confidence: 98,
    reviewStatus: 'AUTO',
    usageStatus: 'BLOCKED',
    matchedRuleCount: 1,
    hasCustomRule: false,
    canBeMadeSafe: true,
    lastAnalysed: '2026-07-21T10:00:00Z',
  },
]

const hook = vi.hoisted(() => ({ value: {} as ReturnType<typeof mkResult> }))
function mkResult(over: Record<string, unknown>) {
  return { data: rows, isLoading: false, isError: false, refetch: () => {}, ...over }
}

vi.mock('@/hooks', () => ({ useDatasets: () => hook.value }))

describe('CataloguePage filters', () => {
  beforeEach(() => {
    hook.value = mkResult({})
  })

  it('lists all datasets initially', () => {
    renderWithProviders(<CataloguePage />)
    expect(screen.getByText('market_ticks.csv')).toBeInTheDocument()
    expect(screen.getByText('client_positions_sample.csv')).toBeInTheDocument()
  })

  it('filters by search text', async () => {
    renderWithProviders(<CataloguePage />)
    await userEvent.type(screen.getByLabelText('Search datasets'), 'market')
    expect(screen.getByText('market_ticks.csv')).toBeInTheDocument()
    expect(screen.queryByText('client_positions_sample.csv')).toBeNull()
  })

  it('filters by classification', async () => {
    renderWithProviders(<CataloguePage />)
    await userEvent.selectOptions(screen.getByLabelText('Classification'), 'HIGHLY_RESTRICTED')
    expect(screen.getByText('client_positions_sample.csv')).toBeInTheDocument()
    expect(screen.queryByText('market_ticks.csv')).toBeNull()
  })

  it('shows an error state with retry when the request fails', () => {
    hook.value = mkResult({ data: undefined, isError: true })
    renderWithProviders(<CataloguePage />)
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })
})
