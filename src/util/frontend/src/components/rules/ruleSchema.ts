import { z } from 'zod'
import type { CreateRuleRequest, RuleTrigger, RuleTriggerType } from '@/types'

export const TRIGGER_TYPES: RuleTriggerType[] = [
  'EXPLICIT_MARKER',
  'FILE_NAME',
  'FIELD_NAME',
  'CONTENT_PATTERN',
  'FIELD_COMBINATION',
  'DOCUMENT_TYPE',
  'METADATA_STATUS',
]

export const ruleFormSchema = z
  .object({
    name: z.string().min(3, 'Give the rule a clear name.'),
    description: z.string().min(8, 'Add a short description.'),
    scope: z.enum(['THIS_FILE', 'ALL_FILES']),
    triggerType: z.enum([
      'EXPLICIT_MARKER',
      'FILE_NAME',
      'FIELD_NAME',
      'CONTENT_PATTERN',
      'FIELD_COMBINATION',
      'DOCUMENT_TYPE',
      'METADATA_STATUS',
    ]),

    // FILE_NAME
    fileNameOperator: z.enum(['contains', 'starts_with', 'ends_with', 'regex', 'equals']),
    fileNameValue: z.string(),

    // FIELD_NAME
    fieldAliases: z.string(),
    fieldUseRegex: z.boolean(),
    fieldPattern: z.string(),

    // FIELD_COMBINATION
    combinationFields: z.array(z.object({ value: z.string() })),

    // EXPLICIT_MARKER
    markerText: z.string(),
    statusValue: z.string(),

    // CONTENT_PATTERN
    contentPattern: z.string(),
    contentMode: z.enum(['plain', 'regex']),
    contentCaseSensitive: z.boolean(),

    // DOCUMENT_TYPE
    documentType: z.string(),
    metadataCondition: z.string(),

    // METADATA_STATUS
    metadataKey: z.string(),
    metadataExpected: z.string(),

    targetTier: z.enum(['PUBLIC', 'CORPORATE', 'RESTRICTED', 'HIGHLY_RESTRICTED']),
    confidence: z.number().min(50, 'Minimum 50%').max(100, 'Maximum 100%'),
    priority: z.enum(['NORMAL', 'HIGH', 'CRITICAL']),
    requireHumanReview: z.boolean(),
    explanationTemplate: z.string(),
  })
  .superRefine((values, ctx) => {
    switch (values.triggerType) {
      case 'FILE_NAME':
        if (!values.fileNameValue.trim())
          ctx.addIssue({ code: 'custom', message: 'Enter a value to match.', path: ['fileNameValue'] })
        break
      case 'FIELD_NAME':
        if (!values.fieldAliases.trim())
          ctx.addIssue({ code: 'custom', message: 'Add at least one field alias.', path: ['fieldAliases'] })
        break
      case 'FIELD_COMBINATION': {
        const filled = values.combinationFields.filter((f) => f.value.trim())
        if (filled.length < 2)
          ctx.addIssue({ code: 'custom', message: 'Add at least two fields.', path: ['combinationFields'] })
        break
      }
      case 'EXPLICIT_MARKER':
        if (!values.markerText.trim())
          ctx.addIssue({ code: 'custom', message: 'Enter the marker text.', path: ['markerText'] })
        break
      case 'CONTENT_PATTERN':
        if (!values.contentPattern.trim())
          ctx.addIssue({ code: 'custom', message: 'Enter a pattern.', path: ['contentPattern'] })
        break
      case 'DOCUMENT_TYPE':
        if (!values.documentType.trim())
          ctx.addIssue({ code: 'custom', message: 'Select a document type.', path: ['documentType'] })
        break
      case 'METADATA_STATUS':
        if (!values.metadataKey.trim())
          ctx.addIssue({ code: 'custom', message: 'Enter a metadata key.', path: ['metadataKey'] })
        if (!values.metadataExpected.trim())
          ctx.addIssue({ code: 'custom', message: 'Enter an expected value.', path: ['metadataExpected'] })
        break
    }
  })

export type RuleFormValues = z.infer<typeof ruleFormSchema>

export const defaultRuleFormValues: RuleFormValues = {
  name: '',
  description: '',
  scope: 'ALL_FILES',
  triggerType: 'FIELD_COMBINATION',
  fileNameOperator: 'contains',
  fileNameValue: '',
  fieldAliases: '',
  fieldUseRegex: false,
  fieldPattern: '',
  combinationFields: [{ value: '' }, { value: '' }],
  markerText: '',
  statusValue: '',
  contentPattern: '',
  contentMode: 'plain',
  contentCaseSensitive: false,
  documentType: '',
  metadataCondition: '',
  metadataKey: '',
  metadataExpected: '',
  targetTier: 'RESTRICTED',
  confidence: 90,
  priority: 'NORMAL',
  requireHumanReview: false,
  explanationTemplate: '',
}

/** Build the typed trigger union from flat form values. */
export function buildTrigger(values: RuleFormValues): RuleTrigger {
  switch (values.triggerType) {
    case 'FILE_NAME':
      return { type: 'FILE_NAME', operator: values.fileNameOperator, value: values.fileNameValue.trim() }
    case 'FIELD_NAME':
      return {
        type: 'FIELD_NAME',
        aliases: values.fieldAliases
          .split(',')
          .map((a) => a.trim())
          .filter(Boolean),
        useRegex: values.fieldUseRegex,
        pattern: values.fieldUseRegex ? values.fieldPattern.trim() : undefined,
      }
    case 'FIELD_COMBINATION':
      return { type: 'FIELD_COMBINATION', fields: values.combinationFields.map((f) => f.value.trim()).filter(Boolean) }
    case 'EXPLICIT_MARKER':
      return { type: 'EXPLICIT_MARKER', markerText: values.markerText.trim(), statusValue: values.statusValue.trim() || undefined }
    case 'CONTENT_PATTERN':
      return { type: 'CONTENT_PATTERN', pattern: values.contentPattern.trim(), mode: values.contentMode, caseSensitive: values.contentCaseSensitive }
    case 'DOCUMENT_TYPE':
      return { type: 'DOCUMENT_TYPE', documentType: values.documentType.trim(), metadataCondition: values.metadataCondition.trim() || undefined }
    case 'METADATA_STATUS':
      return { type: 'METADATA_STATUS', key: values.metadataKey.trim(), expectedValue: values.metadataExpected.trim() }
  }
}

/** Build the API request payload from form values + context. */
export function buildCreateRuleRequest(
  values: RuleFormValues,
  context: { datasetId?: string; scopeFileId?: string },
  enabled: boolean,
): CreateRuleRequest {
  return {
    name: values.name.trim(),
    description: values.description.trim(),
    scope: values.scope,
    scopeFileId: values.scope === 'THIS_FILE' ? context.scopeFileId : undefined,
    datasetId: context.datasetId,
    triggerType: values.triggerType,
    trigger: buildTrigger(values),
    targetTier: values.targetTier,
    confidence: values.confidence,
    priority: values.priority,
    requireHumanReview: values.requireHumanReview,
    explanationTemplate: values.explanationTemplate.trim(),
    enabled,
  }
}
