import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ClassificationRule, RulePreviewResult } from '@/types'
import { renderWithProviders } from '@/test/utils'
import { RuleForm } from './RuleForm'

const { previewRuleMock, createRuleMock, reclassifyMock } = vi.hoisted(() => ({
  previewRuleMock: vi.fn(),
  createRuleMock: vi.fn(),
  reclassifyMock: vi.fn(),
}))

vi.mock('@/api', async (orig) => {
  const actual = await orig<typeof import('@/api')>()
  return {
    ...actual,
    rulesApi: { ...actual.rulesApi, previewRule: previewRuleMock, createRule: createRuleMock },
    datasetsApi: { ...actual.datasetsApi, reclassify: reclassifyMock },
  }
})

const PREVIEW: RulePreviewResult = {
  matches: true,
  matchedFields: ['ownergroup', 'internal_code', 'entity_alias'],
  currentClassification: 'RESTRICTED',
  currentConfidence: 72,
  predictedClassification: 'HIGHLY_RESTRICTED',
  predictedConfidence: 95,
  requiresHumanReview: true,
  explanation: 'Owner group mappings create a de-anonymisation path.',
}

const CREATED_RULE = { id: 'custom-1', name: 'Owner group identity mappings' } as ClassificationRule

function fillBasics() {
  return async () => {
    await userEvent.type(screen.getByLabelText('Rule name'), 'Owner group identity mappings')
    await userEvent.type(screen.getByLabelText('Description'), 'Maps internal identifiers to entities.')
  }
}

describe('RuleForm', () => {
  beforeEach(() => {
    previewRuleMock.mockReset()
    createRuleMock.mockReset()
    reclassifyMock.mockReset()
  })

  it('renders an accessible, labelled form', () => {
    renderWithProviders(<RuleForm context={{ datasetId: 'ownergroup_mapping' }} onClose={() => {}} />)
    expect(screen.getByRole('form', { name: /add classification rule/i })).toBeInTheDocument()
    expect(screen.getByLabelText('Rule name')).toBeInTheDocument()
  })

  it('changes the trigger configuration when the trigger type changes', async () => {
    renderWithProviders(<RuleForm context={{}} onClose={() => {}} />)
    // default is Field combination
    expect(screen.getByTestId('trigger-FIELD_COMBINATION')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add field/i })).toBeInTheDocument()

    await userEvent.selectOptions(screen.getByLabelText('Trigger type'), 'FILE_NAME')
    expect(screen.getByTestId('trigger-FILE_NAME')).toBeInTheDocument()
    expect(screen.getByLabelText('Operator')).toBeInTheDocument()
  })

  it('does not request a preview when validation fails', async () => {
    renderWithProviders(<RuleForm context={{}} onClose={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: /preview rule/i }))
    expect(await screen.findByText('Give the rule a clear name.')).toBeInTheDocument()
    expect(previewRuleMock).not.toHaveBeenCalled()
  })

  it('shows the backend preview result on success', async () => {
    previewRuleMock.mockResolvedValue(PREVIEW)
    renderWithProviders(<RuleForm context={{ datasetId: 'ownergroup_mapping' }} onClose={() => {}} />)
    await fillBasics()()
    await userEvent.selectOptions(screen.getByLabelText('Trigger type'), 'FILE_NAME')
    await userEvent.type(screen.getByLabelText('Value'), 'mapping')
    await userEvent.click(screen.getByRole('button', { name: /preview rule/i }))

    const previewPanel = await screen.findByTestId('rule-preview-result')
    expect(within(previewPanel).getByText('Predicted result')).toBeInTheDocument()
    expect(within(previewPanel).getByText('Highly Restricted')).toBeInTheDocument()
  })

  it('shows an error when the preview request fails', async () => {
    previewRuleMock.mockRejectedValue(new Error('boom'))
    renderWithProviders(<RuleForm context={{}} onClose={() => {}} />)
    await fillBasics()()
    await userEvent.selectOptions(screen.getByLabelText('Trigger type'), 'FILE_NAME')
    await userEvent.type(screen.getByLabelText('Value'), 'mapping')
    await userEvent.click(screen.getByRole('button', { name: /preview rule/i }))
    expect(await screen.findByTestId('rule-preview-error')).toBeInTheDocument()
  })

  it('saves then reclassifies (Save and Apply sequence)', async () => {
    createRuleMock.mockResolvedValue(CREATED_RULE)
    reclassifyMock.mockResolvedValue({ jobId: 'j', datasetId: 'ownergroup_mapping', state: 'COMPLETE', progress: 100 })
    const onClose = vi.fn()
    renderWithProviders(<RuleForm context={{ datasetId: 'ownergroup_mapping' }} onClose={onClose} />)
    await fillBasics()()
    await userEvent.selectOptions(screen.getByLabelText('Trigger type'), 'FILE_NAME')
    await userEvent.type(screen.getByLabelText('Value'), 'mapping')

    await userEvent.click(screen.getByRole('button', { name: /save and apply/i }))

    await waitFor(() => expect(createRuleMock).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(reclassifyMock).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })
})
