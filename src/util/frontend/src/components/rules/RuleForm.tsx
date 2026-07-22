import { useState } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Sparkle, Trash2, Wand2 } from 'lucide-react'
import type { AddRuleContext } from '@/stores/uiStore'
import type { RulePreviewRequest } from '@/types'
import { useCreateRule, usePreviewRule, useReclassifyDataset } from '@/hooks'
import { toast } from '@/stores/toastStore'
import { Button } from '@/components/common'
import { TIER_LABEL, TRIGGER_TYPE_LABEL } from '@/utils/labels'
import { RulePreview } from './RulePreview'
import {
  buildCreateRuleRequest,
  defaultRuleFormValues,
  ruleFormSchema,
  TRIGGER_TYPES,
  type RuleFormValues,
} from './ruleSchema'

type SavePhase = 'idle' | 'saving' | 'reclassifying'

const TIER_OPTIONS: RuleFormValues['targetTier'][] = ['PUBLIC', 'CORPORATE', 'RESTRICTED', 'HIGHLY_RESTRICTED']

export function RuleForm({ context, onClose }: { context: AddRuleContext; onClose: () => void }) {
  const [phase, setPhase] = useState<SavePhase>('idle')

  const form = useForm<RuleFormValues>({
    resolver: zodResolver(ruleFormSchema),
    defaultValues: {
      ...defaultRuleFormValues,
      scope: context.scope ?? (context.fileId ? 'THIS_FILE' : 'ALL_FILES'),
    },
    mode: 'onBlur',
  })

  const {
    register,
    control,
    handleSubmit,
    trigger,
    getValues,
    formState: { errors },
  } = form

  const combination = useFieldArray({ control, name: 'combinationFields' })
  const triggerType = useWatch({ control, name: 'triggerType' })
  const confidence = useWatch({ control, name: 'confidence' })
  const fieldUseRegex = useWatch({ control, name: 'fieldUseRegex' })

  const previewRule = usePreviewRule()
  const createRule = useCreateRule()
  const reclassify = useReclassifyDataset(context.datasetId ?? '')

  const runPreview = async () => {
    const ok = await trigger()
    if (!ok) return
    const req: RulePreviewRequest = buildCreateRuleRequest(getValues(), context, true)
    previewRule.mutate(req)
  }

  const save = (enabled: boolean) =>
    handleSubmit(async (values) => {
      const req = buildCreateRuleRequest(values, context, enabled)
      try {
        setPhase('saving')
        await createRule.mutateAsync(req)
        if (enabled && context.datasetId) {
          setPhase('reclassifying')
          toast.info('The custom rule was saved. Reclassification is now running.')
          await reclassify.mutateAsync()
          toast.success('Reclassification complete — the dataset was updated by the backend.')
        } else {
          toast.success(enabled ? 'Custom rule saved and applied.' : 'Custom rule saved as disabled.')
        }
        onClose()
      } catch {
        toast.error('The rule could not be saved. Please try again.')
      } finally {
        setPhase('idle')
      }
    })

  const busy = phase !== 'idle'

  return (
    <form className="rule-form" onSubmit={save(true)} aria-label="Add classification rule">
      <div className="rule-intro">
        <Sparkle size={18} aria-hidden />
        <div>
          <strong>Deterministic guardrail</strong>
          <p>The rule is sent to the backend for preview and classification. React never computes the result.</p>
        </div>
      </div>

      <label className="cf-field">
        <span className="cf-label">Rule name</span>
        <input className="cf-input" {...register('name')} placeholder="Owner group identity mappings" />
        {errors.name ? <small className="field-error">{errors.name.message}</small> : null}
      </label>

      <label className="cf-field">
        <span className="cf-label">Description</span>
        <textarea className="cf-input" {...register('description')} placeholder="What this rule protects and why." />
        {errors.description ? <small className="field-error">{errors.description.message}</small> : null}
      </label>

      <fieldset className="cf-fieldset">
        <legend className="cf-label">Scope</legend>
        <label className="radio-row">
          <input type="radio" value="THIS_FILE" {...register('scope')} disabled={!context.fileId} />
          <span>Apply only to this file{context.fileName ? <em className="mono"> · {context.fileName}</em> : null}</span>
        </label>
        <label className="radio-row">
          <input type="radio" value="ALL_FILES" {...register('scope')} />
          <span>Apply to all files</span>
        </label>
      </fieldset>

      <label className="cf-field">
        <span className="cf-label">Trigger type</span>
        <select className="cf-input" {...register('triggerType')}>
          {TRIGGER_TYPES.map((t) => (
            <option key={t} value={t}>
              {TRIGGER_TYPE_LABEL[t]}
            </option>
          ))}
        </select>
      </label>

      {/* Dynamic trigger configuration */}
      <div className="trigger-config" data-testid={`trigger-${triggerType}`}>
        {triggerType === 'FILE_NAME' ? (
          <div className="form-grid">
            <label className="cf-field">
              <span className="cf-label">Operator</span>
              <select className="cf-input" {...register('fileNameOperator')}>
                <option value="contains">contains</option>
                <option value="starts_with">starts with</option>
                <option value="ends_with">ends with</option>
                <option value="regex">regular expression</option>
                <option value="equals">match value</option>
              </select>
            </label>
            <label className="cf-field">
              <span className="cf-label">Value</span>
              <input className="cf-input mono" {...register('fileNameValue')} placeholder="mapping" />
              {errors.fileNameValue ? <small className="field-error">{errors.fileNameValue.message}</small> : null}
            </label>
          </div>
        ) : null}

        {triggerType === 'FIELD_NAME' ? (
          <div className="stack">
            <label className="cf-field">
              <span className="cf-label">Field aliases (comma separated)</span>
              <input className="cf-input mono" {...register('fieldAliases')} placeholder="ownergroup, internal_code" />
              {errors.fieldAliases ? <small className="field-error">{errors.fieldAliases.message}</small> : null}
            </label>
            <label className="switch-row">
              <input type="checkbox" {...register('fieldUseRegex')} />
              <span>Match with regular expression</span>
            </label>
            {fieldUseRegex ? (
              <label className="cf-field">
                <span className="cf-label">Pattern</span>
                <input className="cf-input mono" {...register('fieldPattern')} placeholder="^owner.*" />
              </label>
            ) : null}
          </div>
        ) : null}

        {triggerType === 'FIELD_COMBINATION' ? (
          <div className="stack">
            <span className="cf-label">Fields (all must be present)</span>
            {combination.fields.map((f, index) => (
              <div key={f.id} className="combination-row">
                <input
                  className="cf-input mono"
                  {...register(`combinationFields.${index}.value` as const)}
                  placeholder="field name"
                  aria-label={`Field ${index + 1}`}
                />
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`Remove field ${index + 1}`}
                  onClick={() => combination.remove(index)}
                  disabled={combination.fields.length <= 1}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            {errors.combinationFields ? (
              <small className="field-error">{errors.combinationFields.message as string}</small>
            ) : null}
            <Button type="button" variant="secondary" size="sm" onClick={() => combination.append({ value: '' })}>
              <Plus size={14} /> Add field
            </Button>
          </div>
        ) : null}

        {triggerType === 'EXPLICIT_MARKER' ? (
          <div className="form-grid">
            <label className="cf-field">
              <span className="cf-label">Marker text</span>
              <input className="cf-input" {...register('markerText')} placeholder="draft — not yet published" />
              {errors.markerText ? <small className="field-error">{errors.markerText.message}</small> : null}
            </label>
            <label className="cf-field">
              <span className="cf-label">Status value (optional)</span>
              <input className="cf-input" {...register('statusValue')} placeholder="draft" />
            </label>
          </div>
        ) : null}

        {triggerType === 'CONTENT_PATTERN' ? (
          <div className="stack">
            <label className="cf-field">
              <span className="cf-label">Pattern text</span>
              <input className="cf-input mono" {...register('contentPattern')} placeholder="account|position" />
              {errors.contentPattern ? <small className="field-error">{errors.contentPattern.message}</small> : null}
            </label>
            <div className="form-grid">
              <label className="cf-field">
                <span className="cf-label">Mode</span>
                <select className="cf-input" {...register('contentMode')}>
                  <option value="plain">Plain text</option>
                  <option value="regex">Regular expression</option>
                </select>
              </label>
              <label className="switch-row switch-row-aligned">
                <input type="checkbox" {...register('contentCaseSensitive')} />
                <span>Case sensitive</span>
              </label>
            </div>
          </div>
        ) : null}

        {triggerType === 'DOCUMENT_TYPE' ? (
          <div className="form-grid">
            <label className="cf-field">
              <span className="cf-label">Document type</span>
              <select className="cf-input" {...register('documentType')}>
                <option value="">Select…</option>
                <option value="schema">Schema</option>
                <option value="dictionary">Data dictionary</option>
                <option value="policy">Policy</option>
                <option value="report">Report</option>
              </select>
              {errors.documentType ? <small className="field-error">{errors.documentType.message}</small> : null}
            </label>
            <label className="cf-field">
              <span className="cf-label">Metadata condition (optional)</span>
              <input className="cf-input" {...register('metadataCondition')} placeholder="contains_mapping = true" />
            </label>
          </div>
        ) : null}

        {triggerType === 'METADATA_STATUS' ? (
          <div className="form-grid">
            <label className="cf-field">
              <span className="cf-label">Metadata key</span>
              <input className="cf-input mono" {...register('metadataKey')} placeholder="provenance" />
              {errors.metadataKey ? <small className="field-error">{errors.metadataKey.message}</small> : null}
            </label>
            <label className="cf-field">
              <span className="cf-label">Expected value</span>
              <input className="cf-input mono" {...register('metadataExpected')} placeholder="verified" />
              {errors.metadataExpected ? <small className="field-error">{errors.metadataExpected.message}</small> : null}
            </label>
          </div>
        ) : null}
      </div>

      <div className="form-grid">
        <label className="cf-field">
          <span className="cf-label">Resulting classification</span>
          <select className="cf-input" {...register('targetTier')}>
            {TIER_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {TIER_LABEL[t]}
              </option>
            ))}
          </select>
        </label>
        <label className="cf-field">
          <span className="cf-label">Priority</span>
          <select className="cf-input" {...register('priority')}>
            <option value="NORMAL">Normal</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </label>
      </div>

      <label className="cf-field">
        <span className="cf-label">Confidence sent to backend · {confidence}%</span>
        <input type="range" min={50} max={100} step={1} {...register('confidence', { valueAsNumber: true })} className="confidence-slider" />
        {errors.confidence ? <small className="field-error">{errors.confidence.message}</small> : null}
      </label>

      <label className="switch-row">
        <input type="checkbox" {...register('requireHumanReview')} />
        <span>Always require human review when this rule matches</span>
      </label>

      <label className="cf-field">
        <span className="cf-label">Explanation template</span>
        <textarea
          className="cf-input"
          {...register('explanationTemplate')}
          placeholder="This file contains an owner group mapping that may connect internal identifiers to client entities."
        />
      </label>

      <div className="rule-preview-actions">
        <Button type="button" variant="secondary" onClick={runPreview} disabled={previewRule.isPending}>
          <Wand2 size={15} /> {previewRule.isPending ? 'Previewing…' : 'Preview Rule'}
        </Button>
      </div>

      <RulePreview
        result={previewRule.data}
        isLoading={previewRule.isPending}
        isError={previewRule.isError}
        onRetry={runPreview}
      />

      {phase === 'reclassifying' ? (
        <p className="reclassify-status" role="status">
          Reclassification in progress…
        </p>
      ) : null}

      <div className="rule-save-actions">
        <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button type="button" variant="secondary" onClick={save(false)} disabled={busy}>
          Save as Disabled
        </Button>
        <Button type="submit" disabled={busy}>
          {phase === 'saving' ? 'Saving…' : phase === 'reclassifying' ? 'Reclassifying…' : 'Save and Apply'}
        </Button>
      </div>
    </form>
  )
}
