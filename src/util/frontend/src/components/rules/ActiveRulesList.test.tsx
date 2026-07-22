import { describe, expect, it, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ClassificationRule } from '@/types'
import { renderWithProviders } from '@/test/utils'
import { ActiveRulesList } from './ActiveRulesList'

const { deleteMock, toggleMock } = vi.hoisted(() => ({ deleteMock: vi.fn(), toggleMock: vi.fn() }))

vi.mock('@/hooks', () => ({
  useDeleteRule: () => ({ mutate: deleteMock }),
  useToggleRule: () => ({ mutate: toggleMock }),
}))

const systemRule: ClassificationRule = {
  id: 'sys-3',
  name: 'Account identifiers are Highly Restricted',
  description: 'x',
  source: 'SYSTEM',
  scope: 'ALL_FILES',
  scopeLabel: 'All files',
  triggerType: 'FIELD_NAME',
  triggerSummary: 'identifiers',
  targetTier: 'HIGHLY_RESTRICTED',
  confidence: 97,
  priority: 'CRITICAL',
  requireHumanReview: false,
  explanationTemplate: '',
  enabled: true,
  protected: true,
  matchedFiles: 2,
  matchStatus: 'MATCHED',
  updatedAt: '2026-06-01T00:00:00Z',
}

const customRule: ClassificationRule = {
  ...systemRule,
  id: 'custom-1',
  name: 'Owner group identity mappings',
  source: 'CUSTOM',
  protected: false,
  triggerType: 'FIELD_COMBINATION',
}

describe('ActiveRulesList', () => {
  beforeEach(() => {
    deleteMock.mockReset()
    toggleMock.mockReset()
  })

  it('renders system rules as read-only (no edit/delete controls)', () => {
    renderWithProviders(<ActiveRulesList rules={[systemRule]} />)
    expect(screen.queryByLabelText(`Delete ${systemRule.name}`)).toBeNull()
    expect(screen.queryByLabelText(`Edit ${systemRule.name}`)).toBeNull()
    expect(screen.getAllByText('System').length).toBeGreaterThanOrEqual(1)
  })

  it('confirms before deleting a custom rule', async () => {
    renderWithProviders(<ActiveRulesList rules={[customRule]} />)
    await userEvent.click(screen.getByLabelText(`Delete ${customRule.name}`))
    // confirmation dialog appears
    expect(screen.getByText('Delete custom rule?')).toBeInTheDocument()
    expect(deleteMock).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Delete rule' }))
    expect(deleteMock).toHaveBeenCalledWith('custom-1', expect.anything())
  })
})
