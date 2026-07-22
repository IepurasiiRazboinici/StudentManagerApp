/**
 * In-memory mock database.
 *
 * Holds mutable copies of the seed fixtures and implements the *stateful* demo
 * behaviour (create custom rule -> request reclassification -> updated dataset +
 * audit entries). This is deliberately kept out of the UI and the typed API
 * modules: it is the only place the mock "backend" keeps state.
 *
 * Nothing here infers a classification from data. Reclassification simply applies
 * the *declared* target tier of a saved rule — exactly the predefined behaviour
 * the brief permits for the mock backend.
 */

import type {
  AuditEvent,
  ClassificationRule,
  CreateRuleRequest,
  DataPassport,
  DataSource,
  DatasetDetails,
  DatasetSummary,
  EvidenceSignal,
  MatchedRule,
  MaskedPreviewRow,
  RemediationMetrics,
  RemediationPlan,
  RemediationPreview,
  ReviewDecision,
  ReviewItem,
  RulePreviewRequest,
  RulePreviewResult,
  RuleTrigger,
  SubmitReviewRequest,
  UploadedFile,
} from '@/types'
import {
  auditEvents as seedAudit,
  buildDashboard,
  dataPassports as seedPassports,
  dataSources as seedSources,
  datasetDetailSeeds,
  policyDocuments,
  remediationPlans as seedPlans,
  reviewDecisions as seedDecisions,
  reviewItems as seedReviews,
  scanStageTemplate,
  seedCustomRules,
  systemRules,
  uploadedFiles as seedFiles,
} from './data'

const clone = <T>(value: T): T => structuredClone(value)

const TIER_ORDER: Record<DatasetSummary['classification'], number> = {
  PUBLIC: 0,
  CORPORATE: 1,
  RESTRICTED: 2,
  UNKNOWN: 2,
  HIGHLY_RESTRICTED: 3,
}

const PRIORITY_ORDER = { NORMAL: 0, HIGH: 1, CRITICAL: 2 } as const

interface MockState {
  details: DatasetDetails[]
  rules: ClassificationRule[]
  sources: DataSource[]
  files: UploadedFile[]
  reviews: ReviewItem[]
  decisions: ReviewDecision[]
  audit: AuditEvent[]
  plans: RemediationPlan[]
  passports: Record<string, DataPassport>
}

function seed(): MockState {
  return {
    details: clone(datasetDetailSeeds),
    rules: [...clone(systemRules), ...clone(seedCustomRules)],
    sources: clone(seedSources),
    files: clone(seedFiles),
    reviews: clone(seedReviews),
    decisions: clone(seedDecisions),
    audit: clone(seedAudit),
    plans: clone(seedPlans),
    passports: clone(seedPassports),
  }
}

let state: MockState = seed()

let idSeq = 1000
function nextId(prefix: string): string {
  idSeq += 1
  return `${prefix}-${idSeq}`
}

function now(): string {
  return new Date().toISOString()
}

function toSummary(detail: DatasetDetails): DatasetSummary {
  return {
    id: detail.id,
    name: detail.name,
    sourceKind: detail.sourceKind,
    sourceName: detail.sourceName,
    sourceLocation: detail.sourceLocation,
    rowCount: detail.rowCount,
    fieldCount: detail.fieldCount,
    classification: detail.classification,
    confidence: detail.confidence,
    reviewStatus: detail.reviewStatus,
    usageStatus: detail.usageStatus,
    matchedRuleCount: detail.matchedRuleCount,
    hasCustomRule: detail.hasCustomRule,
    canBeMadeSafe: detail.canBeMadeSafe,
    lastAnalysed: detail.lastAnalysed,
    attentionReason: detail.attentionReason,
  }
}

function pushAudit(event: Omit<AuditEvent, 'id' | 'timestamp'>): void {
  state.audit = [{ id: nextId('aud'), timestamp: now(), ...event }, ...state.audit]
}

/** Whether a rule's trigger matches a dataset, and which fields matched. */
function ruleMatchesDataset(
  trigger: RuleTrigger | undefined,
  detail: DatasetDetails,
): { matches: boolean; matchedFields: string[] } {
  const fieldNames = detail.fields.map((f) => f.name)
  if (!trigger) return { matches: false, matchedFields: [] }

  switch (trigger.type) {
    case 'FIELD_COMBINATION': {
      const matchedFields = trigger.fields.filter((f) => fieldNames.includes(f))
      return { matches: trigger.fields.length > 0 && matchedFields.length === trigger.fields.length, matchedFields }
    }
    case 'FIELD_NAME': {
      const matchedFields = fieldNames.filter((name) => trigger.aliases.includes(name))
      return { matches: matchedFields.length > 0, matchedFields }
    }
    case 'FILE_NAME': {
      const name = detail.name.toLowerCase()
      const value = trigger.value.toLowerCase()
      const matches =
        trigger.operator === 'contains'
          ? name.includes(value)
          : trigger.operator === 'starts_with'
            ? name.startsWith(value)
            : trigger.operator === 'ends_with'
              ? name.endsWith(value)
              : trigger.operator === 'equals'
                ? name === value
                : value.length > 0 && name.includes(value)
      return { matches, matchedFields: [] }
    }
    case 'EXPLICIT_MARKER': {
      const matches = detail.explicitMarkers.some((m) =>
        m.marker.toLowerCase().includes(trigger.markerText.toLowerCase()),
      )
      return { matches, matchedFields: [] }
    }
    default:
      // CONTENT_PATTERN / DOCUMENT_TYPE / METADATA_STATUS — the mock cannot inspect
      // raw content, so it reports "no local match" and defers to the backend.
      return { matches: false, matchedFields: [] }
  }
}

/* ------------------------------------------------------------------ */
/* Public mock operations                                             */
/* ------------------------------------------------------------------ */

export const mockDb = {
  reset(): void {
    state = seed()
    idSeq = 1000
  },

  /* datasets */
  listDatasets(): DatasetSummary[] {
    return state.details.map(toSummary)
  },
  getDataset(id: string): DatasetDetails {
    const detail = state.details.find((d) => d.id === id)
    if (!detail) throw new Error(`Dataset ${id} not found`)
    return clone(detail)
  },
  getFields(id: string): DatasetDetails['fields'] {
    return clone(this.getDataset(id).fields)
  },

  /* rules */
  listRules(): ClassificationRule[] {
    return clone(state.rules)
  },
  createRule(req: CreateRuleRequest): ClassificationRule {
    const rule: ClassificationRule = {
      id: nextId('custom'),
      name: req.name,
      description: req.description,
      source: 'CUSTOM',
      scope: req.scope,
      scopeFileId: req.scopeFileId,
      scopeLabel: req.scope === 'THIS_FILE' ? 'This file' : 'All files',
      triggerType: req.triggerType,
      triggerSummary: summariseTrigger(req.trigger),
      trigger: req.trigger,
      targetTier: req.targetTier,
      confidence: req.confidence,
      priority: req.priority,
      requireHumanReview: req.requireHumanReview,
      explanationTemplate: req.explanationTemplate,
      enabled: req.enabled,
      protected: false,
      matchedFiles: 0,
      matchStatus: 'UNKNOWN',
      updatedAt: now(),
    }
    state.rules = [rule, ...state.rules]
    pushAudit({
      type: 'CUSTOM_RULE_CREATED',
      summary: `Custom rule "${rule.name}" created`,
      detail: `Target tier ${rule.targetTier}, confidence ${rule.confidence}%.`,
      actor: 'You',
      reference: rule.id,
      datasetId: req.datasetId,
    })
    return clone(rule)
  },
  updateRule(id: string, patch: Partial<ClassificationRule>): ClassificationRule {
    const rule = state.rules.find((r) => r.id === id)
    if (!rule) throw new Error(`Rule ${id} not found`)
    if (rule.protected) throw new Error('System rules are read-only')
    Object.assign(rule, patch, { updatedAt: now() })
    pushAudit({
      type: patch.enabled === false ? 'CUSTOM_RULE_DISABLED' : 'CUSTOM_RULE_UPDATED',
      summary: `Custom rule "${rule.name}" ${patch.enabled === false ? 'disabled' : 'updated'}`,
      detail: 'Rule state changed via the console.',
      actor: 'You',
      reference: rule.id,
    })
    return clone(rule)
  },
  deleteRule(id: string): void {
    const rule = state.rules.find((r) => r.id === id)
    if (rule?.protected) throw new Error('System rules cannot be deleted')
    state.rules = state.rules.filter((r) => r.id !== id)
  },
  previewRule(req: RulePreviewRequest): RulePreviewResult {
    const detail = req.datasetId ? state.details.find((d) => d.id === req.datasetId) : undefined
    const match = detail ? ruleMatchesDataset(req.trigger, detail) : { matches: true, matchedFields: [] }
    return {
      matches: match.matches,
      matchedFields: match.matchedFields,
      currentClassification: detail?.classification ?? 'UNKNOWN',
      currentConfidence: detail?.confidence ?? 0,
      predictedClassification: match.matches ? req.targetTier : detail?.classification ?? 'UNKNOWN',
      predictedConfidence: match.matches ? req.confidence : detail?.confidence ?? 0,
      requiresHumanReview: req.requireHumanReview,
      explanation:
        req.explanationTemplate ||
        'The backend evaluated the draft rule against the current dataset profile.',
    }
  },

  /* reclassification */
  reclassify(datasetId: string): DatasetDetails {
    const detail = state.details.find((d) => d.id === datasetId)
    if (!detail) throw new Error(`Dataset ${datasetId} not found`)

    pushAudit({
      type: 'RECLASSIFICATION_REQUESTED',
      summary: `Reclassification requested for ${detail.name}`,
      detail: 'Custom rule change triggered reclassification.',
      actor: 'You',
      datasetId,
    })

    const applicable = state.rules
      .filter((r) => r.source === 'CUSTOM' && r.enabled)
      .map((r) => ({ rule: r, ...ruleMatchesDataset(r.trigger, detail) }))
      .filter((r) => r.matches)
      .sort((a, b) => {
        const p = PRIORITY_ORDER[b.rule.priority] - PRIORITY_ORDER[a.rule.priority]
        if (p !== 0) return p
        return TIER_ORDER[b.rule.targetTier] - TIER_ORDER[a.rule.targetTier]
      })

    const top = applicable[0]
    if (top && TIER_ORDER[top.rule.targetTier] >= TIER_ORDER[detail.classification]) {
      detail.classification = top.rule.targetTier
      detail.confidence = top.rule.confidence
      detail.hasCustomRule = true
      detail.matchedRuleCount = detail.matchedRules.length + 1
      detail.reviewStatus = top.rule.requireHumanReview ? 'REVIEW_REQUIRED' : 'CONFIRMED'
      detail.usageStatus = top.rule.targetTier === 'HIGHLY_RESTRICTED' ? 'BLOCKED' : detail.usageStatus
      detail.canBeMadeSafe = true

      const matchedRule: MatchedRule = {
        ruleId: top.rule.id,
        name: top.rule.name,
        source: 'CUSTOM',
        targetTier: top.rule.targetTier,
        priority: top.rule.priority,
        explanation: top.rule.explanationTemplate,
        matchedFields: top.matchedFields,
      }
      if (!detail.matchedRules.some((m) => m.ruleId === top.rule.id)) {
        detail.matchedRules = [matchedRule, ...detail.matchedRules]
      }

      const customEvidence: EvidenceSignal = {
        id: nextId('ev'),
        kind: 'CUSTOM_RULE',
        label: top.rule.name,
        explanation: top.rule.explanationTemplate,
        weight: top.rule.confidence / 100,
        reference: top.rule.id,
        confidence: top.rule.confidence,
      }
      for (const f of detail.fields) {
        if (top.matchedFields.includes(f.name)) {
          f.classification = top.rule.targetTier
          f.confidence = top.rule.confidence
          f.reviewStatus = top.rule.requireHumanReview ? 'REVIEW_REQUIRED' : f.reviewStatus
          f.matchedRuleIds = [...new Set([top.rule.id, ...f.matchedRuleIds])]
          f.matchedRuleNames = [...new Set([top.rule.name, ...f.matchedRuleNames])]
          f.evidence = [customEvidence, ...f.evidence]
          f.whatReducesTier = 'Remove or pseudonymise the fields that trigger the custom rule.'
        }
      }
      detail.protectionSummary = `${detail.protectionSummary} A custom rule ("${top.rule.name}") now applies and raised the tier to ${top.rule.targetTier}.`
      detail.reviewHistory = [
        { id: nextId('rh'), action: `Reclassified to ${top.rule.targetTier} by custom rule`, actor: 'System', note: top.rule.name, timestamp: now() },
        ...detail.reviewHistory,
      ]

      if (top.rule.requireHumanReview && !state.reviews.some((r) => r.datasetId === datasetId && r.category === 'CUSTOM_RULE_CHANGE')) {
        state.reviews = [
          {
            id: nextId('rev'),
            classificationId: nextId('cls'),
            datasetId,
            datasetName: detail.name,
            category: 'CUSTOM_RULE_CHANGE',
            confidence: top.rule.confidence,
            currentClassification: top.rule.targetTier,
            reason: `Custom rule "${top.rule.name}" raised the tier and requires human review.`,
            evidence: [customEvidence],
            recommendedAction: 'Confirm the new classification or override.',
            policyReferences: detail.policyReferences,
          },
          ...state.reviews,
        ]
      }
    }

    detail.lastAnalysed = now()
    pushAudit({
      type: 'CLASSIFICATION_COMPLETED',
      summary: `${detail.name} classified ${detail.classification}`,
      detail: `Confidence ${detail.confidence}% after reclassification.`,
      actor: 'System',
      datasetId,
    })

    return clone(detail)
  },

  /* usage & remediation */
  getRemediationPlan(datasetId: string): RemediationPlan {
    const existing = state.plans.find((p) => p.datasetId === datasetId)
    if (existing) return clone(existing)
    const detail = this.getDataset(datasetId)
    const plan: RemediationPlan = {
      id: nextId('plan'),
      datasetId,
      datasetName: detail.name,
      riskContributors: detail.fields
        .filter((f) => f.classification === 'HIGHLY_RESTRICTED' || f.classification === 'RESTRICTED')
        .map((f, i) => ({ id: `rc-${datasetId}-${i}`, field: f.name, severity: f.classification === 'HIGHLY_RESTRICTED' ? 'CRITICAL' : 'HIGH', reason: f.whyThisTier, relatedRuleOrPolicy: f.matchedRuleNames[0] ?? 'System rules' })),
      transformations: detail.fields
        .filter((f) => f.classification === 'HIGHLY_RESTRICTED' || f.classification === 'RESTRICTED')
        .map((f, i) => ({ id: `tr-${datasetId}-${i}`, kind: 'REMOVE_FIELD', title: `Remove ${f.name}`, field: f.name, description: `Drop ${f.name} for lower-tier use.`, recommended: f.classification === 'HIGHLY_RESTRICTED' })),
      original: { classification: detail.classification, riskScore: 70, usageStatus: detail.usageStatus, remainingSensitiveFields: detail.fields.filter((f) => f.classification === 'HIGHLY_RESTRICTED').map((f) => f.name), utilityRetained: 100 },
      proposed: { classification: 'CORPORATE', riskScore: 24, usageStatus: 'CONDITIONALLY_ALLOWED', remainingSensitiveFields: [], utilityRetained: 70 },
      createdAt: now(),
    }
    state.plans = [plan, ...state.plans]
    pushAudit({ type: 'REMEDIATION_PLAN_GENERATED', summary: `Remediation plan generated for ${detail.name}`, detail: 'Backend produced recommended transformations.', actor: 'System', datasetId })
    return clone(plan)
  },
  previewRemediation(planId: string, transformationIds: string[]): RemediationPreview {
    const plan = state.plans.find((p) => p.id === planId)
    if (!plan) throw new Error(`Plan ${planId} not found`)
    const detail = state.details.find((d) => d.id === plan.datasetId)

    const recommended = plan.transformations.filter((t) => t.recommended).map((t) => t.id)
    const selected = plan.transformations.filter((t) => transformationIds.includes(t.id))
    const selectedRecommended = recommended.filter((id) => transformationIds.includes(id))
    const fraction = recommended.length ? selectedRecommended.length / recommended.length : transformationIds.length ? 1 : 0

    const addressedFields = new Set(selected.map((t) => t.field))
    const remaining = plan.original.remainingSensitiveFields.filter((f) => !addressedFields.has(f))

    const round = (a: number, b: number) => Math.round(a - (a - b) * fraction)
    const proposed: RemediationMetrics = {
      classification: remaining.length === 0 && fraction >= 1 ? plan.proposed.classification : fraction > 0 ? 'CORPORATE' : plan.original.classification,
      riskScore: round(plan.original.riskScore, plan.proposed.riskScore),
      usageStatus: remaining.length === 0 && fraction >= 1 ? plan.proposed.usageStatus : fraction > 0 ? 'CONDITIONALLY_ALLOWED' : plan.original.usageStatus,
      remainingSensitiveFields: remaining,
      utilityRetained: round(plan.original.utilityRetained, plan.proposed.utilityRetained),
    }

    const fields = detail?.fields ?? []
    const maskedPreview: MaskedPreviewRow[] = [0, 1, 2, 3].map((row) => ({
      id: `prev-${row}`,
      cells: fields.map((f) => {
        const t = selected.find((tr) => tr.field === f.name)
        let transformed = f.maskedSample
        let changed = false
        if (t) {
          changed = true
          if (t.kind === 'REMOVE_FIELD') transformed = '—'
          else if (t.kind === 'PSEUDONYMISE') transformed = `PSD-${row}${row}${row}`
          else if (t.kind === 'MASK_VALUE') transformed = '••••••'
          else if (t.kind === 'BUCKET_NUMERIC') transformed = '10k–50k'
          else transformed = '(transformed)'
        }
        return { field: f.name, original: `${f.maskedSample}`, transformed, changed }
      }),
    }))

    return { planId, selectedTransformationIds: transformationIds, proposed, maskedPreview }
  },
  submitPlanReview(planId: string, req: SubmitReviewRequest): ReviewDecision {
    const plan = state.plans.find((p) => p.id === planId)
    const decision: ReviewDecision = {
      id: nextId('dec'),
      reviewItemId: planId,
      datasetName: plan ? `${plan.datasetName} (safe)` : 'Safe version',
      decision: req.decision,
      reviewer: 'You',
      note: req.note,
      timestamp: now(),
    }
    state.decisions = [decision, ...state.decisions]
    if (plan && !state.reviews.some((r) => r.datasetId === plan.datasetId && r.category === 'PROPOSED_SAFE_VERSION')) {
      state.reviews = [
        {
          id: nextId('rev'),
          classificationId: nextId('cls'),
          datasetId: plan.datasetId,
          datasetName: `${plan.datasetName} (safe)`,
          category: 'PROPOSED_SAFE_VERSION',
          confidence: 92,
          currentClassification: plan.original.classification,
          proposedClassification: plan.proposed.classification,
          reason: 'Proposed safe version submitted for approval.',
          evidence: [{ id: nextId('ev'), kind: 'HUMAN', label: 'Remediation plan submitted', explanation: 'Analyst submitted a safe version for approval.', weight: 0.4, actor: 'You' }],
          recommendedAction: 'Approve the safe version to generate a Data Passport.',
          policyReferences: [],
        },
        ...state.reviews,
      ]
    }
    pushAudit({ type: 'REMEDIATION_PLAN_GENERATED', summary: `Safe version submitted for review`, detail: plan ? plan.datasetName : planId, actor: 'You', datasetId: plan?.datasetId })
    return clone(decision)
  },

  /* reviews */
  listReviews(): ReviewItem[] {
    return clone(state.reviews)
  },
  listReviewDecisions(): ReviewDecision[] {
    return clone(state.decisions)
  },
  submitReview(reviewItemId: string, req: SubmitReviewRequest): ReviewDecision {
    const item = state.reviews.find((r) => r.id === reviewItemId)
    const decision: ReviewDecision = {
      id: nextId('dec'),
      reviewItemId,
      datasetName: item?.datasetName ?? 'Unknown dataset',
      decision: req.decision,
      reviewer: 'You',
      note: req.note,
      timestamp: now(),
    }
    state.decisions = [decision, ...state.decisions]
    state.reviews = state.reviews.filter((r) => r.id !== reviewItemId)
    if (req.decision === 'OVERRIDE') {
      pushAudit({ type: 'CLASSIFICATION_OVERRIDDEN', summary: `Classification overridden for ${decision.datasetName}`, detail: req.note ?? 'Reviewer override.', actor: 'You', datasetId: item?.datasetId })
    } else if (req.decision === 'APPROVE' && item?.category === 'PROPOSED_SAFE_VERSION') {
      pushAudit({ type: 'SAFE_VERSION_APPROVED', summary: `Safe version approved for ${decision.datasetName}`, detail: 'Reviewer approved the proposed safe version.', actor: 'You', datasetId: item?.datasetId })
    }
    return clone(decision)
  },
  approveSafeVersion(datasetId: string): DataPassport {
    const detail = this.getDataset(datasetId)
    const plan = state.plans.find((p) => p.datasetId === datasetId)
    const passport: DataPassport = state.passports[datasetId]
      ? clone(state.passports[datasetId])
      : {
          reference: nextId('CF-PASS'),
          originalDatasetId: datasetId,
          originalDatasetName: detail.name,
          safeDatasetName: detail.name.replace(/\.(\w+)$/, '.safe.$1'),
          originalClassification: detail.classification,
          approvedClassification: plan?.proposed.classification ?? 'CORPORATE',
          intendedUse: 'Share with an external partner',
          appliedTransformations: plan?.transformations.filter((t) => t.recommended).map((t) => t.title) ?? [],
          systemRulesApplied: detail.matchedRules.filter((m) => m.source === 'SYSTEM').map((m) => m.name),
          customRulesApplied: detail.matchedRules.filter((m) => m.source === 'CUSTOM').map((m) => m.name),
          remainingConditions: plan?.proposed.remainingSensitiveFields.length ? ['Residual fields require review.'] : [],
          reviewer: 'You',
          approvedAt: now(),
          auditReference: nextId('aud-ref'),
        }
    state.passports[datasetId] = passport
    pushAudit({ type: 'SAFE_VERSION_APPROVED', summary: `Safe version approved for ${detail.name}`, detail: `Approved as ${passport.approvedClassification}.`, actor: 'You', datasetId })
    pushAudit({ type: 'DATA_PASSPORT_GENERATED', summary: `Data Passport ${passport.reference} generated`, detail: `For ${passport.safeDatasetName}.`, actor: 'System', datasetId, reference: passport.reference })
    return clone(passport)
  },
  getPassport(datasetId: string): DataPassport | null {
    return state.passports[datasetId] ? clone(state.passports[datasetId]) : null
  },

  /* sources, files, scans */
  listSources(): DataSource[] {
    return clone(state.sources)
  },
  createSource(input: { name: string; kind: DataSource['kind']; locator: string }): DataSource {
    const source: DataSource = { id: nextId('src'), name: input.name, kind: input.kind, locator: input.locator, status: 'CONNECTED', datasetsDiscovered: 0, lastScan: null, createdAt: now() }
    state.sources = [source, ...state.sources]
    pushAudit({ type: 'SOURCE_CREATED', summary: `${input.name} source created`, detail: `${input.kind} source connected.`, actor: 'You', reference: source.id })
    return clone(source)
  },
  uploadFile(input: { filename: string; fileType: UploadedFile['fileType']; sizeBytes: number }): UploadedFile {
    const file: UploadedFile = {
      id: nextId('file'),
      filename: input.filename,
      fileType: input.fileType,
      sizeBytes: input.sizeBytes,
      estimatedRows: 640,
      detectedFields: ['ownergroup', 'internal_code', 'entity_alias'],
      explicitMarkers: [],
      activeRuleIds: ['sys-8', 'sys-9'],
      uploadStatus: 'PROFILED',
      sourceId: 'src-uploads',
    }
    state.files = [file, ...state.files]
    pushAudit({ type: 'FILE_UPLOADED', summary: `${input.filename} uploaded`, detail: `${file.detectedFields.length} fields detected.`, actor: 'You' })
    return clone(file)
  },
  getFile(id: string): UploadedFile {
    const file = state.files.find((f) => f.id === id) ?? state.files[0]
    if (!file) throw new Error('No uploaded files')
    return clone(file)
  },
  buildScan(scanId: string): import('@/types').ScanStatus {
    // A fully-progressed, backend-shaped scan snapshot for the mock.
    const stages = clone(scanStageTemplate).map((s) => ({ ...s, status: 'COMPLETE' as const }))
    return {
      id: scanId,
      state: 'COMPLETE',
      progress: 100,
      currentStageKey: 'completed',
      fileName: 'mixed_market_client_log.csv',
      fieldsAnalysed: 8,
      matchedRuleCount: 2,
      stages,
      events: [
        { id: 'se-1', timestamp: '2026-07-21T16:59:00Z', stageKey: 'received', message: 'File received: mixed_market_client_log.csv (8.7 MB).' },
        { id: 'se-2', timestamp: '2026-07-21T16:59:04Z', stageKey: 'structure', message: 'Structure profiled: 8 fields, ~88,400 rows.' },
        { id: 'se-3', timestamp: '2026-07-21T16:59:07Z', stageKey: 'markers', message: 'Explicit markers checked: none found.' },
        { id: 'se-4', timestamp: '2026-07-21T16:59:12Z', stageKey: 'fields', message: 'Fields analysed: client_id, account_number flagged.' },
        { id: 'se-5', timestamp: '2026-07-21T16:59:16Z', stageKey: 'system_rules', message: 'System rules evaluated: 2 matched (highest-sensitivity, account identifiers).' },
        { id: 'se-6', timestamp: '2026-07-21T16:59:18Z', stageKey: 'custom_rules', message: 'Custom rules evaluated: 0 matched.' },
        { id: 'se-7', timestamp: '2026-07-21T16:59:20Z', stageKey: 'classification', message: 'Classification created: Highly Restricted (96%).' },
        { id: 'se-8', timestamp: '2026-07-21T16:59:22Z', stageKey: 'review', message: 'Review requirements evaluated: automated Highly Restricted flagged.' },
        { id: 'se-9', timestamp: '2026-07-21T16:59:25Z', stageKey: 'remediation', message: 'Remediation opportunities generated: 3 fields recommended for removal.' },
        { id: 'se-10', timestamp: '2026-07-21T16:59:26Z', stageKey: 'completed', message: 'Scan completed.' },
      ],
      provisionalResult: { datasetId: 'mixed_market_client_log', datasetName: 'mixed_market_client_log.csv', classification: 'HIGHLY_RESTRICTED', confidence: 96, reviewStatus: 'AUTO' },
    }
  },

  /* policies, audit, dashboard */
  listPolicies() {
    return clone(policyDocuments)
  },
  getPolicy(id: string) {
    return clone(policyDocuments.find((p) => p.id === id) ?? policyDocuments[0])
  },
  listAudit(): AuditEvent[] {
    return clone(state.audit)
  },
  dashboard() {
    return buildDashboard(this.listDatasets(), state.rules, state.reviews, state.audit)
  },
}

function summariseTrigger(trigger: RuleTrigger): string {
  switch (trigger.type) {
    case 'FIELD_COMBINATION':
      return `All present: ${trigger.fields.join(', ')}`
    case 'FIELD_NAME':
      return `Field name in: ${trigger.aliases.join(', ')}`
    case 'FILE_NAME':
      return `File name ${trigger.operator.replace('_', ' ')} "${trigger.value}"`
    case 'EXPLICIT_MARKER':
      return `Marker "${trigger.markerText}"`
    case 'CONTENT_PATTERN':
      return `Content ${trigger.mode} pattern "${trigger.pattern}"`
    case 'DOCUMENT_TYPE':
      return `Document type ${trigger.documentType}`
    case 'METADATA_STATUS':
      return `${trigger.key} = ${trigger.expectedValue}`
  }
}
