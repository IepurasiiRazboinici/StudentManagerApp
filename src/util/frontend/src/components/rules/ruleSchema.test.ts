import { describe, expect, it } from 'vitest'
import {
  buildCreateRuleRequest,
  buildTrigger,
  defaultRuleFormValues,
  ruleFormSchema,
  type RuleFormValues,
} from './ruleSchema'

// A valid baseline rule (FILE_NAME trigger with a value) so tests vary one field at a time.
const base: RuleFormValues = {
  ...defaultRuleFormValues,
  name: 'Owner group identity mappings',
  description: 'Maps internal ids to entities.',
  triggerType: 'FILE_NAME',
  fileNameOperator: 'contains',
  fileNameValue: 'mapping',
}

describe('rule form validation', () => {
  it('rejects a short name', () => {
    const result = ruleFormSchema.safeParse({ ...base, name: 'x' })
    expect(result.success).toBe(false)
  })

  it('requires at least two fields for a field combination', () => {
    const result = ruleFormSchema.safeParse({
      ...base,
      triggerType: 'FIELD_COMBINATION',
      combinationFields: [{ value: 'ownergroup' }, { value: '' }],
    })
    expect(result.success).toBe(false)
  })

  it('accepts a valid field combination rule', () => {
    const result = ruleFormSchema.safeParse({
      ...base,
      triggerType: 'FIELD_COMBINATION',
      combinationFields: [{ value: 'ownergroup' }, { value: 'internal_code' }, { value: 'entity_alias' }],
    })
    expect(result.success).toBe(true)
  })

  it('requires marker text for an explicit marker trigger', () => {
    const result = ruleFormSchema.safeParse({ ...base, triggerType: 'EXPLICIT_MARKER', markerText: '' })
    expect(result.success).toBe(false)
  })

  it('enforces the confidence bounds (50–100)', () => {
    expect(ruleFormSchema.safeParse({ ...base, confidence: 40 }).success).toBe(false)
    expect(ruleFormSchema.safeParse({ ...base, confidence: 95 }).success).toBe(true)
  })
})

describe('buildTrigger (dynamic per trigger type)', () => {
  it('builds a field combination trigger with trimmed, non-empty fields', () => {
    const trigger = buildTrigger({
      ...base,
      triggerType: 'FIELD_COMBINATION',
      combinationFields: [{ value: ' ownergroup ' }, { value: 'internal_code' }, { value: '' }],
    })
    expect(trigger).toEqual({ type: 'FIELD_COMBINATION', fields: ['ownergroup', 'internal_code'] })
  })

  it('builds a file name trigger', () => {
    const trigger = buildTrigger({ ...base, triggerType: 'FILE_NAME', fileNameOperator: 'ends_with', fileNameValue: 'mapping.csv' })
    expect(trigger).toEqual({ type: 'FILE_NAME', operator: 'ends_with', value: 'mapping.csv' })
  })

  it('splits field aliases for a field name trigger', () => {
    const trigger = buildTrigger({ ...base, triggerType: 'FIELD_NAME', fieldAliases: 'ownergroup, internal_code' })
    expect(trigger).toEqual({ type: 'FIELD_NAME', aliases: ['ownergroup', 'internal_code'], useRegex: false, pattern: undefined })
  })
})

describe('buildCreateRuleRequest', () => {
  it('includes the declared target tier and confidence and the scope file id when scoped', () => {
    const req = buildCreateRuleRequest(
      { ...base, triggerType: 'FIELD_COMBINATION', combinationFields: [{ value: 'a' }, { value: 'b' }], scope: 'THIS_FILE', targetTier: 'HIGHLY_RESTRICTED', confidence: 95 },
      { datasetId: 'ownergroup_mapping', scopeFileId: 'file-ownergroup' },
      true,
    )
    expect(req.targetTier).toBe('HIGHLY_RESTRICTED')
    expect(req.confidence).toBe(95)
    expect(req.scopeFileId).toBe('file-ownergroup')
    expect(req.datasetId).toBe('ownergroup_mapping')
    expect(req.enabled).toBe(true)
  })
})
