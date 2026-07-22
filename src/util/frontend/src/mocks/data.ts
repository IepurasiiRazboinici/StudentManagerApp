/**
 * Static seed fixtures for the mock API.
 *
 * This module contains *predefined, API-shaped* responses only. It performs no
 * classification, confidence or remediation calculation — every value here is a
 * fixed sample that stands in for what the backend would return. The mutable
 * demo behaviour (create rule -> reclassify) lives in `db.ts`, which starts from
 * deep copies of these seeds.
 */

import type {
  AuditEvent,
  ClassificationRule,
  DashboardStats,
  DataField,
  DataPassport,
  DataSource,
  DatasetDetails,
  DatasetSummary,
  EvidenceSignal,
  PolicyDocument,
  RemediationPlan,
  ReviewDecision,
  ReviewItem,
  ScanStatus,
  UploadedFile,
} from '@/types'

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

let evidenceSeq = 0
function ev(partial: Omit<EvidenceSignal, 'id'>): EvidenceSignal {
  evidenceSeq += 1
  return { id: `ev-${evidenceSeq}`, ...partial }
}

let fieldSeq = 0
function field(input: {
  name: string
  dataType: string
  classification: DataField['classification']
  confidence: number
  maskedSample: string
  reviewStatus?: DataField['reviewStatus']
  matchedRuleIds?: string[]
  matchedRuleNames?: string[]
  evidence?: EvidenceSignal[]
  whyThisTier?: string
  whatReducesTier?: string
}): DataField {
  fieldSeq += 1
  return {
    id: `fld-${fieldSeq}`,
    name: input.name,
    dataType: input.dataType,
    classification: input.classification,
    confidence: input.confidence,
    matchedRuleIds: input.matchedRuleIds ?? [],
    matchedRuleNames: input.matchedRuleNames ?? [],
    maskedSample: input.maskedSample,
    reviewStatus: input.reviewStatus ?? 'AUTO',
    evidence: input.evidence ?? [],
    whyThisTier:
      input.whyThisTier ?? 'The backend assigned this tier from the evidence signals shown below.',
    whatReducesTier:
      input.whatReducesTier ?? 'No remediation is required for this field at the current tier.',
  }
}

/* ------------------------------------------------------------------ */
/* Policies                                                            */
/* ------------------------------------------------------------------ */

export const policyDocuments: PolicyDocument[] = [
  {
    id: 'pol-fin-04',
    name: 'FIN-04 Market & Client Data Handling',
    version: '2026.4',
    status: 'ACTIVE',
    classificationsUsing: 7,
    ingestedAt: '2026-06-30T08:30:00Z',
    coverage: 92,
    sections: [
      {
        id: 'FIN-04-3.2',
        reference: 'FIN-04 §3.2',
        title: 'Account & position identifiers',
        body: 'Account, client, fund allocation, position and execution identifiers are Highly Restricted by default. A filename containing "sample" or "test" does not reduce the tier unless anonymisation is independently verified.',
        datasetsUsing: ['client_positions_sample', 'mixed_market_client_log'],
      },
      {
        id: 'FIN-04-5.1',
        reference: 'FIN-04 §5.1',
        title: 'Licensed and derived vendor fields',
        body: 'Vendor-derived or internally calculated fields (VWAP, theoretical price, liquidity scores, proprietary benchmarks) are Restricted for external distribution unless licensing permissions are confirmed.',
        datasetsUsing: ['vendor_market_derived'],
      },
    ],
  },
  {
    id: 'pol-fin-07',
    name: 'FIN-07 Pre-release Financial Content',
    version: '2026.2',
    status: 'ACTIVE',
    classificationsUsing: 3,
    ingestedAt: '2026-05-18T10:00:00Z',
    coverage: 88,
    sections: [
      {
        id: 'FIN-07-2.4',
        reference: 'FIN-07 §2.4',
        title: 'Embargoed and unpublished results',
        body: 'Draft earnings, forecasts, guidance and unpublished results remain Highly Restricted until official public release. Explicit distribution markers take precedence over inferred content signals.',
        datasetsUsing: ['draft_earnings_forecast', 'published_earnings_release'],
      },
    ],
  },
  {
    id: 'pol-gov-01',
    name: 'GOV-01 Reference & Schema Documents',
    version: '2026.1',
    status: 'ACTIVE',
    classificationsUsing: 2,
    ingestedAt: '2026-04-02T09:15:00Z',
    coverage: 74,
    sections: [
      {
        id: 'GOV-01-1.1',
        reference: 'GOV-01 §1.1',
        title: 'Schema and dictionary documents',
        body: 'Documents describing schemas, fields, governance or internal structure without real sensitive values are Corporate. A document containing a direct de-anonymisation mapping may require a higher tier and human review.',
        datasetsUsing: ['data_dictionary', 'ownergroup_mapping'],
      },
    ],
  },
]

/* ------------------------------------------------------------------ */
/* System classification rules (read-only, protected)                 */
/* ------------------------------------------------------------------ */

export const systemRules: ClassificationRule[] = [
  {
    id: 'sys-1',
    name: 'Explicit distribution or status markers always win',
    description:
      'If a document explicitly states "public", "internal only", "draft", "not yet published", "pre-release" or another clear distribution status, that marker takes precedence over content-based inference. Conflicting evidence requires review.',
    source: 'SYSTEM',
    scope: 'ALL_FILES',
    scopeLabel: 'All files',
    triggerType: 'EXPLICIT_MARKER',
    triggerSummary: 'Explicit distribution / status marker present',
    targetTier: 'UNKNOWN',
    confidence: 99,
    priority: 'CRITICAL',
    requireHumanReview: false,
    explanationTemplate: 'An explicit distribution marker was found and takes precedence over inferred content.',
    enabled: true,
    protected: true,
    matchedFiles: 2,
    matchStatus: 'UNKNOWN',
    updatedAt: '2026-06-01T00:00:00Z',
  },
  {
    id: 'sys-2',
    name: 'Highest sensitivity wins for mixed content',
    description:
      'When one file contains elements with different sensitivity levels, the whole file receives the tier of its most sensitive element. The system can recommend stripping sensitive elements for lower-tier use cases.',
    source: 'SYSTEM',
    scope: 'ALL_FILES',
    scopeLabel: 'All files',
    triggerType: 'CONTENT_PATTERN',
    triggerSummary: 'Mixed-sensitivity content detected',
    targetTier: 'HIGHLY_RESTRICTED',
    confidence: 95,
    priority: 'HIGH',
    requireHumanReview: false,
    explanationTemplate: 'The file mixes sensitivity levels; the most sensitive element sets the tier.',
    enabled: true,
    protected: true,
    matchedFiles: 1,
    matchStatus: 'UNKNOWN',
    updatedAt: '2026-06-01T00:00:00Z',
  },
  {
    id: 'sys-3',
    name: 'Account, client, fund, position or execution identifiers are Highly Restricted',
    description:
      'Individual account information, client identifiers, fund allocations, position sizes, holdings and execution-level trading data are Highly Restricted by default. A filename containing "sample" or "test" does not reduce the tier unless anonymisation is verified.',
    source: 'SYSTEM',
    scope: 'ALL_FILES',
    scopeLabel: 'All files',
    triggerType: 'FIELD_NAME',
    triggerSummary: 'Account / client / position identifiers',
    targetTier: 'HIGHLY_RESTRICTED',
    confidence: 97,
    priority: 'CRITICAL',
    requireHumanReview: false,
    explanationTemplate: 'Account or position-level identifiers were detected.',
    enabled: true,
    protected: true,
    matchedFiles: 2,
    matchStatus: 'UNKNOWN',
    updatedAt: '2026-06-01T00:00:00Z',
  },
  {
    id: 'sys-4',
    name: 'Unpublished or pre-release financial results are Highly Restricted',
    description:
      'Draft earnings, forecasts, guidance, unpublished results, embargoed information and pre-release financial content remain Highly Restricted until official public release.',
    source: 'SYSTEM',
    scope: 'ALL_FILES',
    scopeLabel: 'All files',
    triggerType: 'EXPLICIT_MARKER',
    triggerSummary: 'Draft / pre-release financial content',
    targetTier: 'HIGHLY_RESTRICTED',
    confidence: 96,
    priority: 'CRITICAL',
    requireHumanReview: false,
    explanationTemplate: 'Pre-release financial content stays Highly Restricted until public release.',
    enabled: true,
    protected: true,
    matchedFiles: 1,
    matchStatus: 'UNKNOWN',
    updatedAt: '2026-06-01T00:00:00Z',
  },
  {
    id: 'sys-5',
    name: 'Published and externally released financial content is Public',
    description:
      'Content explicitly marked as published, audited and released, distributed through a press release, or available on an investor relations website is Public. Conflicting sensitive evidence must still be shown for review.',
    source: 'SYSTEM',
    scope: 'ALL_FILES',
    scopeLabel: 'All files',
    triggerType: 'EXPLICIT_MARKER',
    triggerSummary: 'Published / externally released content',
    targetTier: 'PUBLIC',
    confidence: 94,
    priority: 'HIGH',
    requireHumanReview: false,
    explanationTemplate: 'Content marked as published and externally released is Public.',
    enabled: true,
    protected: true,
    matchedFiles: 1,
    matchStatus: 'UNKNOWN',
    updatedAt: '2026-06-01T00:00:00Z',
  },
  {
    id: 'sys-6',
    name: 'Licensed or derived vendor data is Restricted',
    description:
      'Vendor-derived or internally calculated fields such as VWAP, theoretical price, theoretical volume, liquidity scores, proprietary benchmarks or calculated indicators are Restricted for external distribution unless licensing permissions are confirmed.',
    source: 'SYSTEM',
    scope: 'ALL_FILES',
    scopeLabel: 'All files',
    triggerType: 'FIELD_NAME',
    triggerSummary: 'Licensed / derived vendor fields',
    targetTier: 'RESTRICTED',
    confidence: 90,
    priority: 'HIGH',
    requireHumanReview: false,
    explanationTemplate: 'Licensed or derived vendor fields are Restricted for external distribution.',
    enabled: true,
    protected: true,
    matchedFiles: 1,
    matchStatus: 'UNKNOWN',
    updatedAt: '2026-06-01T00:00:00Z',
  },
  {
    id: 'sys-7',
    name: 'Schema, reference, dictionary and internal policy documents are Corporate',
    description:
      'Documents describing schemas, fields, governance, policy, licensing or internal data structure without containing real sensitive values are Corporate. A document containing a direct de-anonymisation mapping may require a higher tier.',
    source: 'SYSTEM',
    scope: 'ALL_FILES',
    scopeLabel: 'All files',
    triggerType: 'DOCUMENT_TYPE',
    triggerSummary: 'Schema / reference / policy document',
    targetTier: 'CORPORATE',
    confidence: 88,
    priority: 'NORMAL',
    requireHumanReview: false,
    explanationTemplate: 'Reference and schema documents without sensitive values are Corporate.',
    enabled: true,
    protected: true,
    matchedFiles: 1,
    matchStatus: 'UNKNOWN',
    updatedAt: '2026-06-01T00:00:00Z',
  },
  {
    id: 'sys-8',
    name: 'Ambiguity or missing documentation requires human review',
    description:
      'Terms such as "not fully documented", "tribal knowledge", "unknown owner", "not sure if maintained", "unclear provenance" or "needs confirmation" require a human data steward review.',
    source: 'SYSTEM',
    scope: 'ALL_FILES',
    scopeLabel: 'All files',
    triggerType: 'METADATA_STATUS',
    triggerSummary: 'Ambiguous / undocumented provenance',
    targetTier: 'UNKNOWN',
    confidence: 60,
    priority: 'HIGH',
    requireHumanReview: true,
    explanationTemplate: 'Ambiguous provenance requires a human data steward review.',
    enabled: true,
    protected: true,
    matchedFiles: 1,
    matchStatus: 'UNKNOWN',
    updatedAt: '2026-06-01T00:00:00Z',
  },
  {
    id: 'sys-9',
    name: 'Default to the conservative tier when uncertain',
    description:
      'When filename, content, provenance or intended use is unclear, the backend should use the same or a higher tier than the closest known equivalent and require review. Terms such as "sample", "test", "copy" or "demo" must not automatically reduce sensitivity.',
    source: 'SYSTEM',
    scope: 'ALL_FILES',
    scopeLabel: 'All files',
    triggerType: 'CONTENT_PATTERN',
    triggerSummary: 'Uncertain provenance — conservative default',
    targetTier: 'RESTRICTED',
    confidence: 65,
    priority: 'NORMAL',
    requireHumanReview: true,
    explanationTemplate: 'When uncertain, the conservative tier is applied and review is required.',
    enabled: true,
    protected: true,
    matchedFiles: 3,
    matchStatus: 'UNKNOWN',
    updatedAt: '2026-06-01T00:00:00Z',
  },
]

/* ------------------------------------------------------------------ */
/* Seed custom rules                                                   */
/* ------------------------------------------------------------------ */

export const seedCustomRules: ClassificationRule[] = [
  {
    id: 'custom-feedback-pii',
    name: 'Personal data in free-text feedback',
    description: 'Routes unstructured feedback text to privacy review before external processing.',
    source: 'CUSTOM',
    scope: 'ALL_FILES',
    scopeLabel: 'All files',
    triggerType: 'CONTENT_PATTERN',
    triggerSummary: 'Contact markers in free-text fields',
    trigger: { type: 'CONTENT_PATTERN', pattern: '@|phone|contact', mode: 'plain', caseSensitive: false },
    targetTier: 'RESTRICTED',
    confidence: 85,
    priority: 'HIGH',
    requireHumanReview: true,
    explanationTemplate: 'Free-text field may contain personal contact details.',
    enabled: true,
    protected: false,
    matchedFiles: 0,
    matchStatus: 'NOT_MATCHED',
    updatedAt: '2026-07-10T14:20:00Z',
  },
  {
    id: 'custom-instrument-ref',
    name: 'Internal instrument reference codes',
    description: 'Flags internal instrument reference codes for corporate handling.',
    source: 'CUSTOM',
    scope: 'ALL_FILES',
    scopeLabel: 'All files',
    triggerType: 'FIELD_NAME',
    triggerSummary: 'Field name matches internal_ref*',
    trigger: { type: 'FIELD_NAME', aliases: ['internal_ref', 'instrument_ref'], useRegex: false },
    targetTier: 'CORPORATE',
    confidence: 80,
    priority: 'NORMAL',
    requireHumanReview: false,
    explanationTemplate: 'Internal instrument reference codes are handled as Corporate.',
    enabled: true,
    protected: false,
    matchedFiles: 0,
    matchStatus: 'NOT_MATCHED',
    updatedAt: '2026-07-05T09:00:00Z',
  },
]

/* ------------------------------------------------------------------ */
/* Dataset details                                                     */
/* ------------------------------------------------------------------ */

function summaryFrom(detail: DatasetDetails): DatasetSummary {
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

export const datasetDetailSeeds: DatasetDetails[] = [
  {
    id: 'market_ticks',
    name: 'market_ticks.csv',
    sourceKind: 'FILE',
    sourceName: 'Market data upload',
    sourceLocation: 'uploads/market_ticks.csv',
    rowCount: 48200,
    fieldCount: 5,
    classification: 'PUBLIC',
    confidence: 93,
    reviewStatus: 'AUTO',
    usageStatus: 'ALLOWED',
    matchedRuleCount: 1,
    hasCustomRule: false,
    canBeMadeSafe: false,
    lastAnalysed: '2026-07-21T16:05:00Z',
    protectionSummary:
      'Standard market tick data with no account, client or licensed derived fields. Classified Public and cleared for internal and external analytics.',
    whyThisTier: 'Only public market observations are present; no sensitive identifiers or licensed derivations were detected.',
    owner: 'Market Data Team',
    retention: '2 years',
    explicitMarkers: [],
    matchedRules: [],
    fields: [
      field({ name: 'symbol', dataType: 'string', classification: 'PUBLIC', confidence: 96, maskedSample: 'VOD.L' }),
      field({ name: 'bid', dataType: 'number', classification: 'PUBLIC', confidence: 95, maskedSample: '72.14' }),
      field({ name: 'ask', dataType: 'number', classification: 'PUBLIC', confidence: 95, maskedSample: '72.18' }),
      field({ name: 'last', dataType: 'number', classification: 'PUBLIC', confidence: 95, maskedSample: '72.16' }),
      field({ name: 'volume', dataType: 'integer', classification: 'PUBLIC', confidence: 94, maskedSample: '1,240' }),
    ],
    reviewHistory: [],
    policyReferences: [],
  },
  {
    id: 'vendor_market_derived',
    name: 'vendor_market_derived.csv',
    sourceKind: 'FILE',
    sourceName: 'Market data upload',
    sourceLocation: 'uploads/vendor_market_derived.csv',
    rowCount: 31875,
    fieldCount: 8,
    classification: 'RESTRICTED',
    confidence: 89,
    reviewStatus: 'AUTO',
    usageStatus: 'CONDITIONALLY_ALLOWED',
    matchedRuleCount: 1,
    hasCustomRule: false,
    canBeMadeSafe: true,
    lastAnalysed: '2026-07-21T16:20:00Z',
    attentionReason: 'Licensed derived fields detected',
    protectionSummary:
      'Contains vendor-derived and internally calculated fields (VWAP, theoretical price, liquidity score). Restricted for external distribution until licensing is confirmed.',
    whyThisTier: 'Licensed / derived vendor fields were detected, which are Restricted for external distribution unless licensing permissions are confirmed.',
    owner: 'Quant Research',
    retention: '3 years',
    explicitMarkers: [],
    matchedRules: [
      {
        ruleId: 'sys-6',
        name: 'Licensed or derived vendor data is Restricted',
        source: 'SYSTEM',
        targetTier: 'RESTRICTED',
        priority: 'HIGH',
        explanation: 'Derived fields (vwap, theoretical_price, liquidity_score) are licensed and Restricted for external distribution.',
        matchedFields: ['vwap', 'theoretical_price', 'liquidity_score'],
      },
    ],
    fields: [
      field({ name: 'symbol', dataType: 'string', classification: 'PUBLIC', confidence: 96, maskedSample: 'VOD.L' }),
      field({ name: 'bid', dataType: 'number', classification: 'PUBLIC', confidence: 95, maskedSample: '72.14' }),
      field({ name: 'ask', dataType: 'number', classification: 'PUBLIC', confidence: 95, maskedSample: '72.18' }),
      field({ name: 'last', dataType: 'number', classification: 'PUBLIC', confidence: 95, maskedSample: '72.16' }),
      field({ name: 'volume', dataType: 'integer', classification: 'PUBLIC', confidence: 94, maskedSample: '1,240' }),
      field({
        name: 'vwap',
        dataType: 'number',
        classification: 'RESTRICTED',
        confidence: 90,
        maskedSample: '7█.██',
        matchedRuleIds: ['sys-6'],
        matchedRuleNames: ['Licensed or derived vendor data is Restricted'],
        whyThisTier: 'VWAP is a licensed derived value, Restricted for external distribution.',
        whatReducesTier: 'Remove the licensed derived fields, or confirm licensing permissions for the destination.',
        evidence: [
          ev({ kind: 'DETECTOR', label: 'Derived calculation detector', explanation: 'Field name and value distribution match a volume-weighted average price calculation.', weight: 0.6 }),
          ev({ kind: 'POLICY', label: 'FIN-04 §5.1', explanation: 'Licensed and derived vendor fields are Restricted for external distribution.', weight: 0.4, reference: 'FIN-04 §5.1' }),
        ],
      }),
      field({
        name: 'theoretical_price',
        dataType: 'number',
        classification: 'RESTRICTED',
        confidence: 88,
        maskedSample: '7█.██',
        matchedRuleIds: ['sys-6'],
        matchedRuleNames: ['Licensed or derived vendor data is Restricted'],
        whyThisTier: 'Theoretical price is a proprietary derived value.',
        whatReducesTier: 'Remove the licensed derived fields for external use cases.',
        evidence: [
          ev({ kind: 'DETECTOR', label: 'Proprietary benchmark detector', explanation: 'Values match a proprietary theoretical pricing model output.', weight: 0.6 }),
          ev({ kind: 'POLICY', label: 'FIN-04 §5.1', explanation: 'Derived vendor fields are Restricted.', weight: 0.4, reference: 'FIN-04 §5.1' }),
        ],
      }),
      field({
        name: 'liquidity_score',
        dataType: 'number',
        classification: 'RESTRICTED',
        confidence: 87,
        maskedSample: '0.█',
        matchedRuleIds: ['sys-6'],
        matchedRuleNames: ['Licensed or derived vendor data is Restricted'],
        whyThisTier: 'Liquidity score is a proprietary calculated indicator.',
        whatReducesTier: 'Remove or aggregate the score for lower-tier use.',
        evidence: [
          ev({ kind: 'DETECTOR', label: 'Calculated indicator detector', explanation: 'Bounded 0–1 score consistent with a proprietary liquidity indicator.', weight: 0.5 }),
          ev({ kind: 'CONTEXT', label: 'Sibling derived fields', explanation: 'Appears alongside other derived vendor fields.', weight: 0.2 }),
        ],
      }),
    ],
    reviewHistory: [],
    policyReferences: [{ policyId: 'pol-fin-04', code: 'FIN-04', section: '§5.1', title: 'Licensed and derived vendor fields' }],
  },
  {
    id: 'client_positions_sample',
    name: 'client_positions_sample.csv',
    sourceKind: 'FILE',
    sourceName: 'Risk warehouse export',
    sourceLocation: 'uploads/client_positions_sample.csv',
    rowCount: 5000,
    fieldCount: 6,
    classification: 'HIGHLY_RESTRICTED',
    confidence: 98,
    reviewStatus: 'AUTO',
    usageStatus: 'BLOCKED',
    matchedRuleCount: 1,
    hasCustomRule: false,
    canBeMadeSafe: true,
    lastAnalysed: '2026-07-21T16:40:00Z',
    attentionReason: 'Account-level position information',
    protectionSummary:
      'Account and client-level position data. Highly Restricted; the "sample" filename does not reduce the tier because anonymisation is not verified.',
    whyThisTier: 'Account, client and position identifiers are Highly Restricted by default. The "sample" suffix does not reduce the tier without verified anonymisation.',
    owner: 'Risk Office',
    retention: '7 years',
    explicitMarkers: [],
    matchedRules: [
      {
        ruleId: 'sys-3',
        name: 'Account, client, fund, position or execution identifiers are Highly Restricted',
        source: 'SYSTEM',
        targetTier: 'HIGHLY_RESTRICTED',
        priority: 'CRITICAL',
        explanation: 'acct_id, client_id, fund_allocation and position_size are account/position-level identifiers.',
        matchedFields: ['acct_id', 'client_id', 'fund_allocation', 'position_size'],
      },
    ],
    fields: [
      field({
        name: 'acct_id',
        dataType: 'string',
        classification: 'HIGHLY_RESTRICTED',
        confidence: 98,
        maskedSample: 'AC-█████',
        matchedRuleIds: ['sys-3'],
        matchedRuleNames: ['Account, client, fund, position or execution identifiers are Highly Restricted'],
        whyThisTier: 'Account identifiers are Highly Restricted by default.',
        whatReducesTier: 'Pseudonymise or remove the account identifier and verify anonymisation.',
        evidence: [
          ev({ kind: 'DETECTOR', label: 'Account identifier detector', explanation: 'Format matches internal account identifiers.', weight: 0.6, matchedMaskedValue: 'AC-█████' }),
          ev({ kind: 'POLICY', label: 'FIN-04 §3.2', explanation: 'Account identifiers are Highly Restricted.', weight: 0.4, reference: 'FIN-04 §3.2' }),
        ],
      }),
      field({
        name: 'client_id',
        dataType: 'string',
        classification: 'HIGHLY_RESTRICTED',
        confidence: 98,
        maskedSample: 'CL-█████',
        matchedRuleIds: ['sys-3'],
        matchedRuleNames: ['Account, client, fund, position or execution identifiers are Highly Restricted'],
        whyThisTier: 'Client identifiers are Highly Restricted.',
        whatReducesTier: 'Pseudonymise the client identifier.',
        evidence: [ev({ kind: 'DETECTOR', label: 'Client identifier detector', explanation: 'Matches client id format.', weight: 0.6 })],
      }),
      field({ name: 'fund_allocation', dataType: 'number', classification: 'HIGHLY_RESTRICTED', confidence: 96, maskedSample: '██.█%', matchedRuleIds: ['sys-3'], matchedRuleNames: ['Account, client, fund, position or execution identifiers are Highly Restricted'] }),
      field({ name: 'position_size', dataType: 'number', classification: 'HIGHLY_RESTRICTED', confidence: 96, maskedSample: '██,███', matchedRuleIds: ['sys-3'], matchedRuleNames: ['Account, client, fund, position or execution identifiers are Highly Restricted'] }),
      field({ name: 'instrument', dataType: 'string', classification: 'PUBLIC', confidence: 90, maskedSample: 'VOD.L' }),
      field({ name: 'market_value', dataType: 'number', classification: 'RESTRICTED', confidence: 84, maskedSample: '██,███' }),
    ],
    reviewHistory: [],
    policyReferences: [{ policyId: 'pol-fin-04', code: 'FIN-04', section: '§3.2', title: 'Account & position identifiers' }],
  },
  {
    id: 'draft_earnings_forecast',
    name: 'draft_earnings_forecast.csv',
    sourceKind: 'FILE',
    sourceName: 'Finance upload',
    sourceLocation: 'uploads/draft_earnings_forecast.csv',
    rowCount: 12,
    fieldCount: 6,
    classification: 'HIGHLY_RESTRICTED',
    confidence: 97,
    reviewStatus: 'AUTO',
    usageStatus: 'BLOCKED',
    matchedRuleCount: 1,
    hasCustomRule: false,
    canBeMadeSafe: true,
    lastAnalysed: '2026-07-20T11:10:00Z',
    attentionReason: 'Pre-release financial results',
    protectionSummary:
      'Draft, pre-release earnings forecast. The explicit "draft — not yet published" marker keeps this Highly Restricted until official release.',
    whyThisTier: 'The explicit "draft — not yet published" marker and pre-release financial content keep this Highly Restricted until official public release.',
    owner: 'Investor Relations',
    retention: 'Until publication + 7 years',
    explicitMarkers: [
      { id: 'em-draft', marker: 'draft — not yet published', resultingTier: 'HIGHLY_RESTRICTED', confidence: 97, conflict: false },
    ],
    matchedRules: [
      {
        ruleId: 'sys-4',
        name: 'Unpublished or pre-release financial results are Highly Restricted',
        source: 'SYSTEM',
        targetTier: 'HIGHLY_RESTRICTED',
        priority: 'CRITICAL',
        explanation: 'Explicit draft marker and pre-release financial content.',
        matchedFields: ['status', 'draft_revenue', 'draft_eps'],
      },
    ],
    fields: [
      field({ name: 'company', dataType: 'string', classification: 'PUBLIC', confidence: 92, maskedSample: 'Acme plc' }),
      field({ name: 'reporting_period', dataType: 'string', classification: 'PUBLIC', confidence: 92, maskedSample: 'Q3 2026' }),
      field({
        name: 'draft_revenue',
        dataType: 'number',
        classification: 'HIGHLY_RESTRICTED',
        confidence: 97,
        maskedSample: '███.█M',
        matchedRuleIds: ['sys-4'],
        matchedRuleNames: ['Unpublished or pre-release financial results are Highly Restricted'],
        evidence: [ev({ kind: 'EXPLICIT_MARKER', label: 'draft — not yet published', explanation: 'Explicit distribution marker present in the file.', weight: 0.7, matchedMaskedValue: 'draft — not yet published' })],
      }),
      field({ name: 'draft_eps', dataType: 'number', classification: 'HIGHLY_RESTRICTED', confidence: 97, maskedSample: '█.██', matchedRuleIds: ['sys-4'], matchedRuleNames: ['Unpublished or pre-release financial results are Highly Restricted'] }),
      field({ name: 'release_date', dataType: 'date', classification: 'CORPORATE', confidence: 80, maskedSample: '2026-08-05' }),
      field({ name: 'status', dataType: 'string', classification: 'HIGHLY_RESTRICTED', confidence: 97, maskedSample: 'draft', evidence: [ev({ kind: 'EXPLICIT_MARKER', label: 'status = draft', explanation: 'Distribution status marker.', weight: 0.6 })] }),
    ],
    reviewHistory: [],
    policyReferences: [{ policyId: 'pol-fin-07', code: 'FIN-07', section: '§2.4', title: 'Embargoed and unpublished results' }],
  },
  {
    id: 'published_earnings_release',
    name: 'published_earnings_release.csv',
    sourceKind: 'FILE',
    sourceName: 'Finance upload',
    sourceLocation: 'uploads/published_earnings_release.csv',
    rowCount: 12,
    fieldCount: 5,
    classification: 'PUBLIC',
    confidence: 95,
    reviewStatus: 'AUTO',
    usageStatus: 'ALLOWED',
    matchedRuleCount: 1,
    hasCustomRule: false,
    canBeMadeSafe: false,
    lastAnalysed: '2026-07-20T11:15:00Z',
    protectionSummary:
      'Audited, externally released earnings. The explicit "published on investor relations website" marker classifies this Public.',
    whyThisTier: 'The explicit "published on investor relations website" marker indicates externally released, audited content, which is Public.',
    owner: 'Investor Relations',
    retention: '10 years',
    explicitMarkers: [
      { id: 'em-pub', marker: 'published on investor relations website', resultingTier: 'PUBLIC', confidence: 95, conflict: false },
    ],
    matchedRules: [
      {
        ruleId: 'sys-5',
        name: 'Published and externally released financial content is Public',
        source: 'SYSTEM',
        targetTier: 'PUBLIC',
        priority: 'HIGH',
        explanation: 'Explicit published marker; audited and externally released.',
        matchedFields: ['publication_status'],
      },
    ],
    fields: [
      field({ name: 'company', dataType: 'string', classification: 'PUBLIC', confidence: 95, maskedSample: 'Acme plc' }),
      field({ name: 'reporting_period', dataType: 'string', classification: 'PUBLIC', confidence: 95, maskedSample: 'Q2 2026' }),
      field({ name: 'audited_revenue', dataType: 'number', classification: 'PUBLIC', confidence: 94, maskedSample: '412.0M' }),
      field({ name: 'audited_eps', dataType: 'number', classification: 'PUBLIC', confidence: 94, maskedSample: '1.24' }),
      field({ name: 'publication_status', dataType: 'string', classification: 'PUBLIC', confidence: 95, maskedSample: 'published', evidence: [ev({ kind: 'EXPLICIT_MARKER', label: 'published on investor relations website', explanation: 'Explicit external-release marker.', weight: 0.7 })] }),
    ],
    reviewHistory: [
      { id: 'rh-pub-1', action: 'Confirmed Public', actor: 'A. Okafor', note: 'Verified against IR website release.', timestamp: '2026-07-20T12:00:00Z' },
    ],
    policyReferences: [{ policyId: 'pol-fin-07', code: 'FIN-07', section: '§2.4', title: 'Embargoed and unpublished results' }],
  },
  {
    id: 'data_dictionary',
    name: 'data_dictionary.md',
    sourceKind: 'FILE',
    sourceName: 'Governance upload',
    sourceLocation: 'uploads/data_dictionary.md',
    rowCount: 0,
    fieldCount: 0,
    classification: 'CORPORATE',
    confidence: 86,
    reviewStatus: 'AUTO',
    usageStatus: 'CONDITIONALLY_ALLOWED',
    matchedRuleCount: 1,
    hasCustomRule: false,
    canBeMadeSafe: false,
    lastAnalysed: '2026-07-19T09:30:00Z',
    protectionSummary:
      'A schema and field dictionary describing internal data structures. No real sensitive values are present, so it is Corporate.',
    whyThisTier: 'Schema and dictionary documents without real sensitive values are Corporate.',
    owner: 'Data Governance',
    retention: 'Indefinite',
    explicitMarkers: [],
    matchedRules: [
      {
        ruleId: 'sys-7',
        name: 'Schema, reference, dictionary and internal policy documents are Corporate',
        source: 'SYSTEM',
        targetTier: 'CORPORATE',
        priority: 'NORMAL',
        explanation: 'Describes schema and fields without sensitive values.',
        matchedFields: [],
      },
    ],
    fields: [],
    reviewHistory: [],
    policyReferences: [{ policyId: 'pol-gov-01', code: 'GOV-01', section: '§1.1', title: 'Schema and dictionary documents' }],
  },
  {
    id: 'ownergroup_mapping',
    name: 'ownergroup_mapping.csv',
    sourceKind: 'FILE',
    sourceName: 'Governance upload',
    sourceLocation: 'uploads/ownergroup_mapping.csv',
    rowCount: 640,
    fieldCount: 3,
    classification: 'RESTRICTED',
    confidence: 72,
    reviewStatus: 'REVIEW_REQUIRED',
    usageStatus: 'REVIEW_REQUIRED',
    matchedRuleCount: 1,
    hasCustomRule: false,
    canBeMadeSafe: true,
    lastAnalysed: '2026-07-19T10:05:00Z',
    attentionReason: 'Undocumented identity mapping',
    protectionSummary:
      'An owner-group mapping with undocumented provenance ("not fully documented", "not sure if still maintained"). Currently Restricted at low confidence and flagged for human review.',
    whyThisTier: 'The mapping has unclear provenance and undocumented maintenance status, so the conservative tier (Restricted) was applied at low confidence pending human review.',
    owner: 'Unknown owner',
    retention: 'Under review',
    explicitMarkers: [],
    matchedRules: [
      {
        ruleId: 'sys-8',
        name: 'Ambiguity or missing documentation requires human review',
        source: 'SYSTEM',
        targetTier: 'UNKNOWN',
        priority: 'HIGH',
        explanation: 'Notes indicate "not fully documented" and "not sure if still maintained".',
        matchedFields: [],
      },
    ],
    fields: [
      field({
        name: 'ownergroup',
        dataType: 'string',
        classification: 'RESTRICTED',
        confidence: 70,
        maskedSample: 'OG-███',
        reviewStatus: 'REVIEW_REQUIRED',
        whyThisTier: 'Owner-group values may map to client entities but provenance is undocumented.',
        whatReducesTier: 'Confirm the mapping is not a de-anonymisation path, or pseudonymise the values.',
        evidence: [
          ev({ kind: 'CONTEXT', label: 'Undocumented provenance', explanation: 'File notes state "not fully documented" and "not sure if still maintained".', weight: 0.5 }),
          ev({ kind: 'AGGREGATION', label: 'Potential linkage', explanation: 'Combination of ownergroup, internal_code and entity_alias could form an identity mapping.', weight: 0.3 }),
        ],
      }),
      field({ name: 'internal_code', dataType: 'string', classification: 'RESTRICTED', confidence: 71, maskedSample: 'IC-███', reviewStatus: 'REVIEW_REQUIRED' }),
      field({ name: 'entity_alias', dataType: 'string', classification: 'RESTRICTED', confidence: 70, maskedSample: '████ Ltd', reviewStatus: 'REVIEW_REQUIRED' }),
    ],
    reviewHistory: [
      { id: 'rh-og-1', action: 'Flagged for review', actor: 'System', note: 'Undocumented provenance.', timestamp: '2026-07-19T10:05:00Z' },
    ],
    policyReferences: [{ policyId: 'pol-gov-01', code: 'GOV-01', section: '§1.1', title: 'Schema and dictionary documents' }],
  },
  {
    id: 'mixed_market_client_log',
    name: 'mixed_market_client_log.csv',
    sourceKind: 'FILE',
    sourceName: 'Trading systems export',
    sourceLocation: 'uploads/mixed_market_client_log.csv',
    rowCount: 88400,
    fieldCount: 8,
    classification: 'HIGHLY_RESTRICTED',
    confidence: 96,
    reviewStatus: 'AUTO',
    usageStatus: 'BLOCKED',
    matchedRuleCount: 2,
    hasCustomRule: false,
    canBeMadeSafe: true,
    lastAnalysed: '2026-07-21T17:00:00Z',
    attentionReason: 'Mixed market + client-level data',
    protectionSummary:
      'A mixed log combining public market data with client and account identifiers. The most sensitive elements (client_id, account_number, position_size) set the whole file to Highly Restricted.',
    whyThisTier: 'The file mixes public market data with account and client identifiers. Under the highest-sensitivity-wins rule, the whole file is Highly Restricted.',
    owner: 'Trading Systems',
    retention: '7 years',
    explicitMarkers: [],
    matchedRules: [
      {
        ruleId: 'sys-2',
        name: 'Highest sensitivity wins for mixed content',
        source: 'SYSTEM',
        targetTier: 'HIGHLY_RESTRICTED',
        priority: 'HIGH',
        explanation: 'Mixed sensitivity levels present; most sensitive element sets the tier.',
        matchedFields: ['client_id', 'account_number', 'position_size'],
      },
      {
        ruleId: 'sys-3',
        name: 'Account, client, fund, position or execution identifiers are Highly Restricted',
        source: 'SYSTEM',
        targetTier: 'HIGHLY_RESTRICTED',
        priority: 'CRITICAL',
        explanation: 'client_id, account_number and position_size are account/position-level identifiers.',
        matchedFields: ['client_id', 'account_number', 'position_size'],
      },
    ],
    fields: [
      field({ name: 'symbol', dataType: 'string', classification: 'PUBLIC', confidence: 96, maskedSample: 'VOD.L' }),
      field({ name: 'bid', dataType: 'number', classification: 'PUBLIC', confidence: 95, maskedSample: '72.14' }),
      field({ name: 'ask', dataType: 'number', classification: 'PUBLIC', confidence: 95, maskedSample: '72.18' }),
      field({ name: 'last', dataType: 'number', classification: 'PUBLIC', confidence: 95, maskedSample: '72.16' }),
      field({ name: 'volume', dataType: 'integer', classification: 'PUBLIC', confidence: 94, maskedSample: '1,240' }),
      field({
        name: 'client_id',
        dataType: 'string',
        classification: 'HIGHLY_RESTRICTED',
        confidence: 97,
        maskedSample: 'CL-█████',
        matchedRuleIds: ['sys-3'],
        matchedRuleNames: ['Account, client, fund, position or execution identifiers are Highly Restricted'],
        whyThisTier: 'Client identifiers are Highly Restricted.',
        whatReducesTier: 'Remove or pseudonymise client_id.',
        evidence: [ev({ kind: 'DETECTOR', label: 'Client identifier detector', explanation: 'Matches client id format.', weight: 0.6 }), ev({ kind: 'POLICY', label: 'FIN-04 §3.2', explanation: 'Client identifiers are Highly Restricted.', weight: 0.4, reference: 'FIN-04 §3.2' })],
      }),
      field({
        name: 'account_number',
        dataType: 'string',
        classification: 'HIGHLY_RESTRICTED',
        confidence: 97,
        maskedSample: '████-████',
        matchedRuleIds: ['sys-3'],
        matchedRuleNames: ['Account, client, fund, position or execution identifiers are Highly Restricted'],
        whyThisTier: 'Account numbers are Highly Restricted.',
        whatReducesTier: 'Remove the account number.',
        evidence: [ev({ kind: 'DETECTOR', label: 'Account number detector', explanation: 'Matches account number format.', weight: 0.6 })],
      }),
      field({
        name: 'position_size',
        dataType: 'number',
        classification: 'HIGHLY_RESTRICTED',
        confidence: 95,
        maskedSample: '██,███',
        matchedRuleIds: ['sys-3'],
        matchedRuleNames: ['Account, client, fund, position or execution identifiers are Highly Restricted'],
        whyThisTier: 'Position sizes are execution-level data and Highly Restricted.',
        whatReducesTier: 'Remove or bucket position_size.',
        evidence: [ev({ kind: 'AGGREGATION', label: 'Position exposure', explanation: 'Position sizes reveal client exposure.', weight: 0.5 })],
      }),
    ],
    reviewHistory: [],
    policyReferences: [{ policyId: 'pol-fin-04', code: 'FIN-04', section: '§3.2', title: 'Account & position identifiers' }],
  },
]

export const datasetSummaries: DatasetSummary[] = datasetDetailSeeds.map(summaryFrom)

/* ------------------------------------------------------------------ */
/* Sources & uploaded files                                            */
/* ------------------------------------------------------------------ */

export const dataSources: DataSource[] = [
  {
    id: 'src-uploads',
    name: 'Governance file uploads',
    kind: 'FILE',
    locator: 'uploads/',
    status: 'CONNECTED',
    datasetsDiscovered: 6,
    lastScan: '2026-07-21T17:00:00Z',
    createdAt: '2026-06-15T09:00:00Z',
  },
  {
    id: 'src-riskdb',
    name: 'Risk warehouse (PostgreSQL)',
    kind: 'POSTGRESQL',
    locator: 'warehouse.internal:5432/risk',
    status: 'CONNECTED',
    datasetsDiscovered: 2,
    lastScan: '2026-07-21T16:40:00Z',
    createdAt: '2026-06-18T11:30:00Z',
  },
  {
    id: 'src-trading',
    name: 'Trading systems export',
    kind: 'FILE',
    locator: 'uploads/trading/',
    status: 'IDLE',
    datasetsDiscovered: 1,
    lastScan: '2026-07-21T17:00:00Z',
    createdAt: '2026-07-01T08:00:00Z',
  },
]

export const uploadedFiles: UploadedFile[] = [
  {
    id: 'file-ownergroup',
    filename: 'ownergroup_mapping.csv',
    fileType: 'CSV',
    sizeBytes: 48210,
    estimatedRows: 640,
    detectedFields: ['ownergroup', 'internal_code', 'entity_alias'],
    explicitMarkers: [],
    activeRuleIds: ['sys-8', 'sys-9'],
    uploadStatus: 'PROFILED',
    sourceId: 'src-uploads',
  },
  {
    id: 'file-mixed',
    filename: 'mixed_market_client_log.csv',
    fileType: 'CSV',
    sizeBytes: 9120400,
    estimatedRows: 88400,
    detectedFields: ['symbol', 'bid', 'ask', 'last', 'volume', 'client_id', 'account_number', 'position_size'],
    explicitMarkers: [],
    activeRuleIds: ['sys-2', 'sys-3'],
    uploadStatus: 'PROFILED',
    sourceId: 'src-trading',
  },
]

/* ------------------------------------------------------------------ */
/* Scan status template                                                */
/* ------------------------------------------------------------------ */

export const scanStageTemplate: ScanStatus['stages'] = [
  { key: 'received', label: 'File received', status: 'PENDING' },
  { key: 'structure', label: 'Structure profiled', status: 'PENDING' },
  { key: 'markers', label: 'Explicit markers checked', status: 'PENDING' },
  { key: 'fields', label: 'Fields analysed', status: 'PENDING' },
  { key: 'system_rules', label: 'System rules evaluated', status: 'PENDING' },
  { key: 'custom_rules', label: 'Custom rules evaluated', status: 'PENDING' },
  { key: 'classification', label: 'Classification created', status: 'PENDING' },
  { key: 'review', label: 'Review requirements evaluated', status: 'PENDING' },
  { key: 'remediation', label: 'Remediation opportunities generated', status: 'PENDING' },
  { key: 'completed', label: 'Scan completed', status: 'PENDING' },
]

/* ------------------------------------------------------------------ */
/* Remediation plans                                                   */
/* ------------------------------------------------------------------ */

export const remediationPlans: RemediationPlan[] = [
  {
    id: 'plan-mixed',
    datasetId: 'mixed_market_client_log',
    datasetName: 'mixed_market_client_log.csv',
    riskContributors: [
      { id: 'rc-1', field: 'client_id', severity: 'CRITICAL', reason: 'Direct client identifier enabling re-identification.', relatedRuleOrPolicy: 'FIN-04 §3.2' },
      { id: 'rc-2', field: 'account_number', severity: 'CRITICAL', reason: 'Account number is account-level sensitive data.', relatedRuleOrPolicy: 'FIN-04 §3.2' },
      { id: 'rc-3', field: 'position_size', severity: 'HIGH', reason: 'Position sizes reveal client exposure.', relatedRuleOrPolicy: 'Highest sensitivity wins' },
    ],
    transformations: [
      { id: 'tr-remove-client', kind: 'REMOVE_FIELD', title: 'Remove client_id', field: 'client_id', description: 'Drop the direct client identifier entirely.', recommended: true },
      { id: 'tr-remove-account', kind: 'REMOVE_FIELD', title: 'Remove account_number', field: 'account_number', description: 'Drop the account number.', recommended: true },
      { id: 'tr-remove-position', kind: 'REMOVE_FIELD', title: 'Remove position_size', field: 'position_size', description: 'Drop position sizes, or bucket them for coarse analytics.', recommended: true },
      { id: 'tr-bucket-position', kind: 'BUCKET_NUMERIC', title: 'Bucket position_size', field: 'position_size', description: 'Replace exact position sizes with ranges.', recommended: false },
      { id: 'tr-aggregate', kind: 'AGGREGATE_RECORDS', title: 'Aggregate records by symbol', field: '*', description: 'Aggregate to symbol-level records to remove row-level exposure.', recommended: false },
    ],
    original: {
      classification: 'HIGHLY_RESTRICTED',
      riskScore: 86,
      usageStatus: 'BLOCKED',
      remainingSensitiveFields: ['client_id', 'account_number', 'position_size'],
      utilityRetained: 100,
    },
    proposed: {
      classification: 'PUBLIC',
      riskScore: 14,
      usageStatus: 'ALLOWED',
      remainingSensitiveFields: [],
      utilityRetained: 78,
    },
    createdAt: '2026-07-21T17:05:00Z',
  },
  {
    id: 'plan-ownergroup',
    datasetId: 'ownergroup_mapping',
    datasetName: 'ownergroup_mapping.csv',
    riskContributors: [
      { id: 'rc-og-1', field: 'ownergroup ↔ entity_alias', severity: 'HIGH', reason: 'Direct mapping may connect internal identifiers to client entities (de-anonymisation path).', relatedRuleOrPolicy: 'Owner group identity mappings' },
    ],
    transformations: [
      { id: 'tr-remove-mapping', kind: 'REMOVE_FIELD', title: 'Remove entity_alias', field: 'entity_alias', description: 'Remove the direct client-entity alias that creates the mapping.', recommended: true },
      { id: 'tr-pseudo-owner', kind: 'PSEUDONYMISE', title: 'Pseudonymise ownergroup', field: 'ownergroup', description: 'Replace owner-group values with stable pseudonyms.', recommended: true },
      { id: 'tr-verify-anon', kind: 'VERIFY_ANONYMISATION', title: 'Verify anonymisation', field: '*', description: 'Independently verify the mapping cannot be reversed.', recommended: true },
      { id: 'tr-owner-confirm', kind: 'REQUEST_OWNER_CONFIRMATION', title: 'Request data-owner confirmation', field: '*', description: 'Confirm provenance and maintenance status with the data owner.', recommended: false },
    ],
    original: {
      classification: 'HIGHLY_RESTRICTED',
      riskScore: 74,
      usageStatus: 'BLOCKED',
      remainingSensitiveFields: ['ownergroup', 'entity_alias'],
      utilityRetained: 100,
    },
    proposed: {
      classification: 'CORPORATE',
      riskScore: 22,
      usageStatus: 'CONDITIONALLY_ALLOWED',
      remainingSensitiveFields: [],
      utilityRetained: 65,
    },
    createdAt: '2026-07-19T10:30:00Z',
  },
]

/* ------------------------------------------------------------------ */
/* Reviews                                                             */
/* ------------------------------------------------------------------ */

export const reviewItems: ReviewItem[] = [
  {
    id: 'rev-ownergroup',
    classificationId: 'cls-ownergroup',
    datasetId: 'ownergroup_mapping',
    datasetName: 'ownergroup_mapping.csv',
    category: 'LOW_CONFIDENCE',
    confidence: 72,
    currentClassification: 'RESTRICTED',
    reason: 'Undocumented provenance and low confidence. Provenance notes indicate the mapping may not be maintained.',
    evidence: [
      ev({ kind: 'CONTEXT', label: 'Undocumented provenance', explanation: '"not fully documented", "not sure if still maintained".', weight: 0.5 }),
      ev({ kind: 'AGGREGATION', label: 'Potential linkage', explanation: 'ownergroup + internal_code + entity_alias could form an identity mapping.', weight: 0.3 }),
    ],
    recommendedAction: 'Confirm whether the mapping is a de-anonymisation path; consider a custom rule.',
    policyReferences: [{ policyId: 'pol-gov-01', code: 'GOV-01', section: '§1.1', title: 'Schema and dictionary documents' }],
  },
  {
    id: 'rev-mixed',
    classificationId: 'cls-mixed',
    datasetId: 'mixed_market_client_log',
    datasetName: 'mixed_market_client_log.csv',
    category: 'HIGHLY_RESTRICTED_AUTO',
    confidence: 96,
    currentClassification: 'HIGHLY_RESTRICTED',
    reason: 'Automated Highly Restricted classification on mixed market + client data. Confirm before blocking downstream analytics.',
    evidence: [ev({ kind: 'DETECTOR', label: 'Client & account identifiers', explanation: 'client_id, account_number detected.', weight: 0.6 })],
    recommendedAction: 'Confirm classification, or open Make it Safe to produce a shareable version.',
    policyReferences: [{ policyId: 'pol-fin-04', code: 'FIN-04', section: '§3.2', title: 'Account & position identifiers' }],
  },
  {
    id: 'rev-policygap',
    classificationId: 'cls-vendor',
    datasetId: 'vendor_market_derived',
    datasetName: 'vendor_market_derived.csv',
    category: 'POLICY_GAP',
    confidence: 89,
    currentClassification: 'RESTRICTED',
    reason: 'No licensing confirmation on record for derived vendor fields. Policy coverage gap for external distribution.',
    evidence: [ev({ kind: 'POLICY', label: 'FIN-04 §5.1', explanation: 'Licensing permissions not confirmed.', weight: 0.5, reference: 'FIN-04 §5.1' })],
    recommendedAction: 'Attach a licensing confirmation policy, or remove derived fields for external use.',
    policyReferences: [{ policyId: 'pol-fin-04', code: 'FIN-04', section: '§5.1', title: 'Licensed and derived vendor fields' }],
  },
  {
    id: 'rev-safe-mixed',
    classificationId: 'cls-mixed-safe',
    datasetId: 'mixed_market_client_log',
    datasetName: 'mixed_market_client_log.csv (safe)',
    category: 'PROPOSED_SAFE_VERSION',
    confidence: 92,
    currentClassification: 'HIGHLY_RESTRICTED',
    proposedClassification: 'PUBLIC',
    reason: 'Proposed safe version removes client_id, account_number and position_size. Awaiting approval.',
    intendedUse: 'Share with an external partner',
    evidence: [ev({ kind: 'HUMAN', label: 'Remediation plan submitted', explanation: 'Analyst submitted a safe version for approval.', weight: 0.4, actor: 'M. Reyes' })],
    recommendedAction: 'Approve the safe version to generate a Data Passport.',
    policyReferences: [{ policyId: 'pol-fin-04', code: 'FIN-04', section: '§3.2', title: 'Account & position identifiers' }],
  },
]

export const reviewDecisions: ReviewDecision[] = [
  { id: 'dec-1', reviewItemId: 'rev-published', datasetName: 'published_earnings_release.csv', decision: 'APPROVE', reviewer: 'A. Okafor', note: 'Confirmed Public against IR website.', timestamp: '2026-07-20T12:00:00Z' },
]

/* ------------------------------------------------------------------ */
/* Audit events                                                        */
/* ------------------------------------------------------------------ */

export const auditEvents: AuditEvent[] = [
  { id: 'aud-1', type: 'SOURCE_CREATED', summary: 'Risk warehouse source created', detail: 'PostgreSQL source warehouse.internal:5432/risk connected.', actor: 'D. Vance', reference: 'src-riskdb', timestamp: '2026-06-18T11:30:00Z' },
  { id: 'aud-2', type: 'FILE_UPLOADED', summary: 'mixed_market_client_log.csv uploaded', detail: '8 fields detected, 88,400 estimated rows.', actor: 'M. Reyes', datasetId: 'mixed_market_client_log', timestamp: '2026-07-21T16:58:00Z' },
  { id: 'aud-3', type: 'SCAN_STARTED', summary: 'Scan started for Trading systems export', detail: '1 file queued.', actor: 'M. Reyes', timestamp: '2026-07-21T16:59:00Z' },
  { id: 'aud-4', type: 'CLASSIFICATION_COMPLETED', summary: 'mixed_market_client_log.csv classified Highly Restricted', detail: 'Confidence 96%. 2 rules matched.', actor: 'System', datasetId: 'mixed_market_client_log', timestamp: '2026-07-21T17:00:00Z' },
  { id: 'aud-5', type: 'REMEDIATION_PLAN_GENERATED', summary: 'Remediation plan generated for mixed_market_client_log.csv', detail: 'Recommends removing client_id, account_number, position_size.', actor: 'System', datasetId: 'mixed_market_client_log', timestamp: '2026-07-21T17:05:00Z' },
  { id: 'aud-6', type: 'CUSTOM_RULE_CREATED', summary: 'Custom rule "Personal data in free-text feedback" created', detail: 'Target tier Restricted, human review required.', actor: 'D. Vance', reference: 'custom-feedback-pii', timestamp: '2026-07-10T14:20:00Z' },
  { id: 'aud-7', type: 'CLASSIFICATION_COMPLETED', summary: 'ownergroup_mapping.csv classified Restricted', detail: 'Low confidence (72%), review required.', actor: 'System', datasetId: 'ownergroup_mapping', timestamp: '2026-07-19T10:05:00Z' },
]

/* ------------------------------------------------------------------ */
/* Data passport                                                       */
/* ------------------------------------------------------------------ */

export const dataPassports: Record<string, DataPassport> = {
  mixed_market_client_log: {
    reference: 'CF-PASS-2026-041',
    originalDatasetId: 'mixed_market_client_log',
    originalDatasetName: 'mixed_market_client_log.csv',
    safeDatasetName: 'mixed_market_client_log.safe.csv',
    originalClassification: 'HIGHLY_RESTRICTED',
    approvedClassification: 'PUBLIC',
    intendedUse: 'Share with an external partner',
    appliedTransformations: ['Remove client_id', 'Remove account_number', 'Remove position_size'],
    systemRulesApplied: ['Highest sensitivity wins for mixed content', 'Account, client, fund, position or execution identifiers are Highly Restricted'],
    customRulesApplied: [],
    remainingConditions: ['Partner data-sharing agreement must reference CF-PASS-2026-041.'],
    reviewer: 'A. Okafor',
    approvedAt: '2026-07-21T18:00:00Z',
    auditReference: 'aud-5',
  },
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */

export function buildDashboard(summaries: DatasetSummary[], rules: ClassificationRule[], reviews: ReviewItem[], activity: AuditEvent[]): DashboardStats {
  const distribution: Record<DatasetSummary['classification'], number> = {
    PUBLIC: 0,
    CORPORATE: 0,
    RESTRICTED: 0,
    HIGHLY_RESTRICTED: 0,
    UNKNOWN: 0,
  }
  for (const s of summaries) distribution[s.classification] += 1

  return {
    datasetsAnalysed: summaries.length,
    highlyRestricted: distribution.HIGHLY_RESTRICTED,
    awaitingReview: reviews.length,
    activeCustomRules: rules.filter((r) => r.source === 'CUSTOM' && r.enabled).length,
    safeVersionsCreated: 1,
    policyGaps: reviews.filter((r) => r.category === 'POLICY_GAP').length,
    distribution,
    protectionOpportunities: {
      count: summaries.filter((s) => s.canBeMadeSafe).length,
      message: `${summaries.filter((s) => s.canBeMadeSafe).length} datasets could be used at a lower tier after recommended transformations.`,
    },
    priorityReviewItems: [
      { datasetId: 'client_positions_sample', datasetName: 'client_positions_sample.csv', classification: 'HIGHLY_RESTRICTED', reviewStatus: 'AUTO', note: 'Account-level position information' },
      { datasetId: 'vendor_market_derived', datasetName: 'vendor_market_derived.csv', classification: 'RESTRICTED', reviewStatus: 'AUTO', note: 'Licensed derived fields detected' },
      { datasetId: 'ownergroup_mapping', datasetName: 'ownergroup_mapping.csv', classification: 'RESTRICTED', reviewStatus: 'REVIEW_REQUIRED', note: 'Undocumented identity mapping' },
    ],
    recentActivity: activity.slice(0, 6),
  }
}
