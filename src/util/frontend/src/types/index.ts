/**
 * Cache Flow — shared API models.
 *
 * These types describe the shapes the *backend* returns and accepts. The frontend
 * only sends typed requests and renders typed responses; it never derives a
 * classification, confidence or remediation result locally.
 *
 * NOTE: enums are expressed as string-literal unions (not `enum`) because the
 * project's tsconfig sets `erasableSyntaxOnly`, which forbids emit-producing
 * TypeScript constructs.
 */

/* ------------------------------------------------------------------ */
/* Enumerations                                                        */
/* ------------------------------------------------------------------ */

export type ClassificationTier =
  | 'PUBLIC'
  | 'CORPORATE'
  | 'RESTRICTED'
  | 'HIGHLY_RESTRICTED'
  | 'UNKNOWN'

export type ReviewStatus = 'AUTO' | 'CONFIRMED' | 'OVERRIDDEN' | 'REVIEW_REQUIRED'

export type UsageStatus =
  | 'ALLOWED'
  | 'CONDITIONALLY_ALLOWED'
  | 'BLOCKED'
  | 'REVIEW_REQUIRED'

export type EvidenceKind =
  | 'EXPLICIT_MARKER'
  | 'DETECTOR'
  | 'POLICY'
  | 'CONTEXT'
  | 'AGGREGATION'
  | 'CUSTOM_RULE'
  | 'HUMAN'

export type RuleSource = 'SYSTEM' | 'CUSTOM'

export type RuleTriggerType =
  | 'EXPLICIT_MARKER'
  | 'FILE_NAME'
  | 'FIELD_NAME'
  | 'CONTENT_PATTERN'
  | 'FIELD_COMBINATION'
  | 'DOCUMENT_TYPE'
  | 'METADATA_STATUS'

export type RulePriority = 'NORMAL' | 'HIGH' | 'CRITICAL'

export type RuleScope = 'THIS_FILE' | 'ALL_FILES'

export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

export type SourceKind = 'FILE' | 'POSTGRESQL'

export type SourceStatus = 'CONNECTED' | 'SCANNING' | 'ERROR' | 'IDLE'

export type FileType = 'CSV' | 'JSON' | 'TXT' | 'MARKDOWN' | 'XLSX'

export type UploadStatus = 'PENDING' | 'PROFILED' | 'READY' | 'ERROR'

export type ScanStageStatus = 'PENDING' | 'ACTIVE' | 'COMPLETE'

export type ScanState = 'RUNNING' | 'COMPLETE' | 'FAILED'

export type TransformationKind =
  | 'REMOVE_FIELD'
  | 'MASK_VALUE'
  | 'PSEUDONYMISE'
  | 'BUCKET_NUMERIC'
  | 'AGGREGATE_RECORDS'
  | 'REMOVE_LICENSED_DERIVED'
  | 'STRIP_UNPUBLISHED'
  | 'VERIFY_ANONYMISATION'
  | 'REQUEST_OWNER_CONFIRMATION'

export type IntendedUsePurpose =
  | 'INTERNAL_ANALYTICS'
  | 'SHARE_INTERNAL_TEAM'
  | 'SHARE_EXTERNAL_PARTNER'
  | 'AI_MODEL_TRAINING'
  | 'PUBLIC_EXPORT'
  | 'TESTING'

export type ReviewDecisionKind =
  | 'APPROVE'
  | 'OVERRIDE'
  | 'REQUEST_CHANGES'
  | 'REJECT_USAGE'
  | 'ESCALATE'

/* ------------------------------------------------------------------ */
/* Policy                                                              */
/* ------------------------------------------------------------------ */

export interface PolicyReference {
  policyId: string
  code: string
  section: string
  title: string
}

export interface PolicySection {
  id: string
  reference: string
  title: string
  body: string
  datasetsUsing: string[]
}

export interface PolicyDocument {
  id: string
  name: string
  version: string
  status: 'ACTIVE' | 'DRAFT' | 'SUPERSEDED'
  classificationsUsing: number
  ingestedAt: string
  coverage: number
  sections: PolicySection[]
}

/* ------------------------------------------------------------------ */
/* Evidence & fields                                                   */
/* ------------------------------------------------------------------ */

export interface EvidenceSignal {
  id: string
  kind: EvidenceKind
  label: string
  explanation: string
  weight: number
  reference?: string
  matchedMaskedValue?: string
  confidence?: number
  timestamp?: string
  actor?: string
}

export interface DataField {
  id: string
  name: string
  dataType: string
  classification: ClassificationTier
  confidence: number
  matchedRuleIds: string[]
  matchedRuleNames: string[]
  maskedSample: string
  reviewStatus: ReviewStatus
  evidence: EvidenceSignal[]
  whyThisTier: string
  whatReducesTier: string
}

export interface ExplicitMarker {
  id: string
  marker: string
  resultingTier: ClassificationTier
  confidence: number
  conflict: boolean
}

export interface MatchedRule {
  ruleId: string
  name: string
  source: RuleSource
  targetTier: ClassificationTier
  priority: RulePriority
  explanation: string
  matchedFields: string[]
}

export interface ReviewHistoryEntry {
  id: string
  action: string
  actor: string
  note?: string
  timestamp: string
}

/* ------------------------------------------------------------------ */
/* Datasets                                                            */
/* ------------------------------------------------------------------ */

export interface DatasetSummary {
  id: string
  name: string
  sourceKind: SourceKind
  sourceName: string
  sourceLocation: string
  rowCount: number
  fieldCount: number
  classification: ClassificationTier
  confidence: number
  reviewStatus: ReviewStatus
  usageStatus: UsageStatus
  matchedRuleCount: number
  hasCustomRule: boolean
  canBeMadeSafe: boolean
  lastAnalysed: string
  attentionReason?: string
}

export interface DatasetDetails extends DatasetSummary {
  protectionSummary: string
  whyThisTier: string
  owner: string
  retention: string
  explicitMarkers: ExplicitMarker[]
  matchedRules: MatchedRule[]
  fields: DataField[]
  reviewHistory: ReviewHistoryEntry[]
  policyReferences: PolicyReference[]
  reclassifying?: boolean
}

/* ------------------------------------------------------------------ */
/* Sources, files, scans                                               */
/* ------------------------------------------------------------------ */

export interface DataSource {
  id: string
  name: string
  kind: SourceKind
  locator: string
  status: SourceStatus
  datasetsDiscovered: number
  lastScan: string | null
  createdAt: string
}

export interface UploadedFile {
  id: string
  filename: string
  fileType: FileType
  sizeBytes: number
  estimatedRows: number
  detectedFields: string[]
  explicitMarkers: ExplicitMarker[]
  activeRuleIds: string[]
  uploadStatus: UploadStatus
  sourceId: string
}

export interface ScanStage {
  key: string
  label: string
  status: ScanStageStatus
}

export interface ScanEvent {
  id: string
  timestamp: string
  stageKey: string
  message: string
}

export interface ScanProvisionalResult {
  datasetId: string
  datasetName: string
  classification: ClassificationTier
  confidence: number
  reviewStatus: ReviewStatus
}

export interface ScanStatus {
  id: string
  state: ScanState
  progress: number
  currentStageKey: string
  fileName: string
  fieldsAnalysed: number
  matchedRuleCount: number
  stages: ScanStage[]
  events: ScanEvent[]
  provisionalResult: ScanProvisionalResult | null
}

/* ------------------------------------------------------------------ */
/* Classification rules                                                */
/* ------------------------------------------------------------------ */

export interface FileNameTrigger {
  type: 'FILE_NAME'
  operator: 'contains' | 'starts_with' | 'ends_with' | 'regex' | 'equals'
  value: string
}

export interface FieldNameTrigger {
  type: 'FIELD_NAME'
  aliases: string[]
  useRegex: boolean
  pattern?: string
}

export interface FieldCombinationTrigger {
  type: 'FIELD_COMBINATION'
  fields: string[]
}

export interface ExplicitMarkerTrigger {
  type: 'EXPLICIT_MARKER'
  markerText: string
  statusValue?: string
}

export interface ContentPatternTrigger {
  type: 'CONTENT_PATTERN'
  pattern: string
  mode: 'plain' | 'regex'
  caseSensitive: boolean
}

export interface DocumentTypeTrigger {
  type: 'DOCUMENT_TYPE'
  documentType: string
  metadataCondition?: string
}

export interface MetadataStatusTrigger {
  type: 'METADATA_STATUS'
  key: string
  expectedValue: string
}

export type RuleTrigger =
  | FileNameTrigger
  | FieldNameTrigger
  | FieldCombinationTrigger
  | ExplicitMarkerTrigger
  | ContentPatternTrigger
  | DocumentTypeTrigger
  | MetadataStatusTrigger

export interface ClassificationRule {
  id: string
  name: string
  description: string
  source: RuleSource
  scope: RuleScope
  scopeFileId?: string
  scopeLabel: string
  triggerType: RuleTriggerType
  triggerSummary: string
  trigger?: RuleTrigger
  targetTier: ClassificationTier
  confidence: number
  priority: RulePriority
  requireHumanReview: boolean
  explanationTemplate: string
  enabled: boolean
  protected: boolean
  matchedFiles: number
  matchStatus: 'MATCHED' | 'NOT_MATCHED' | 'UNKNOWN'
  updatedAt: string
}

export interface CreateRuleRequest {
  name: string
  description: string
  scope: RuleScope
  scopeFileId?: string
  datasetId?: string
  triggerType: RuleTriggerType
  trigger: RuleTrigger
  targetTier: ClassificationTier
  confidence: number
  priority: RulePriority
  requireHumanReview: boolean
  explanationTemplate: string
  enabled: boolean
}

export interface RulePreviewRequest extends CreateRuleRequest {
  datasetId?: string
}

export interface RulePreviewResult {
  matches: boolean
  matchedFields: string[]
  currentClassification: ClassificationTier
  currentConfidence: number
  predictedClassification: ClassificationTier
  predictedConfidence: number
  requiresHumanReview: boolean
  explanation: string
}

/* ------------------------------------------------------------------ */
/* Usage checks                                                        */
/* ------------------------------------------------------------------ */

export interface UsageCheckRequest {
  purpose: IntendedUsePurpose
  consumerType: string
  destinationRegion: string
  businessPurpose: string
  retentionPeriod: string
}

export interface UsageCheckResult {
  status: UsageStatus
  summary: string
  reasons: string[]
  conditions: string[]
  policyReferences: PolicyReference[]
  canBeMadeSafe: boolean
}

/* ------------------------------------------------------------------ */
/* Remediation                                                         */
/* ------------------------------------------------------------------ */

export interface RiskContributor {
  id: string
  field: string
  severity: Severity
  reason: string
  relatedRuleOrPolicy: string
}

export interface RemediationTransformation {
  id: string
  kind: TransformationKind
  title: string
  field: string
  description: string
  recommended: boolean
}

export interface RemediationMetrics {
  classification: ClassificationTier
  riskScore: number
  usageStatus: UsageStatus
  remainingSensitiveFields: string[]
  utilityRetained: number
}

export interface MaskedPreviewRow {
  id: string
  cells: Array<{
    field: string
    original: string
    transformed: string
    changed: boolean
  }>
}

export interface RemediationPlan {
  id: string
  datasetId: string
  datasetName: string
  riskContributors: RiskContributor[]
  transformations: RemediationTransformation[]
  original: RemediationMetrics
  proposed: RemediationMetrics
  createdAt: string
}

export interface RemediationPreviewRequest {
  transformationIds: string[]
}

export interface RemediationPreview {
  planId: string
  selectedTransformationIds: string[]
  proposed: RemediationMetrics
  maskedPreview: MaskedPreviewRow[]
}

/* ------------------------------------------------------------------ */
/* Reviews                                                             */
/* ------------------------------------------------------------------ */

export type ReviewCategory =
  | 'LOW_CONFIDENCE'
  | 'POLICY_GAP'
  | 'AMBIGUOUS_PROVENANCE'
  | 'MARKER_CONFLICT'
  | 'HIGHLY_RESTRICTED_AUTO'
  | 'CUSTOM_RULE_CHANGE'
  | 'PROPOSED_SAFE_VERSION'

export interface ReviewItem {
  id: string
  classificationId: string
  datasetId: string
  datasetName: string
  category: ReviewCategory
  confidence: number
  currentClassification: ClassificationTier
  proposedClassification?: ClassificationTier
  reason: string
  intendedUse?: string
  evidence: EvidenceSignal[]
  recommendedAction: string
  policyReferences: PolicyReference[]
}

export interface ReviewDecision {
  id: string
  reviewItemId: string
  datasetName: string
  decision: ReviewDecisionKind
  reviewer: string
  note?: string
  timestamp: string
}

export interface SubmitReviewRequest {
  decision: ReviewDecisionKind
  note?: string
}

/* ------------------------------------------------------------------ */
/* Audit & dashboard                                                   */
/* ------------------------------------------------------------------ */

export type AuditEventType =
  | 'SOURCE_CREATED'
  | 'FILE_UPLOADED'
  | 'SCAN_STARTED'
  | 'CLASSIFICATION_COMPLETED'
  | 'CUSTOM_RULE_CREATED'
  | 'CUSTOM_RULE_UPDATED'
  | 'CUSTOM_RULE_DISABLED'
  | 'RECLASSIFICATION_REQUESTED'
  | 'CLASSIFICATION_OVERRIDDEN'
  | 'REMEDIATION_PLAN_GENERATED'
  | 'SAFE_VERSION_APPROVED'
  | 'DATA_PASSPORT_GENERATED'

export interface AuditEvent {
  id: string
  type: AuditEventType
  summary: string
  detail: string
  actor: string
  datasetId?: string
  reference?: string
  timestamp: string
}

export interface DashboardStats {
  datasetsAnalysed: number
  highlyRestricted: number
  awaitingReview: number
  activeCustomRules: number
  safeVersionsCreated: number
  policyGaps: number
  distribution: Record<ClassificationTier, number>
  protectionOpportunities: {
    count: number
    message: string
  }
  priorityReviewItems: Array<{
    datasetId: string
    datasetName: string
    classification: ClassificationTier
    reviewStatus: ReviewStatus
    note: string
  }>
  recentActivity: AuditEvent[]
}

/* ------------------------------------------------------------------ */
/* Data passport                                                       */
/* ------------------------------------------------------------------ */

export interface DataPassport {
  reference: string
  originalDatasetId: string
  originalDatasetName: string
  safeDatasetName: string
  originalClassification: ClassificationTier
  approvedClassification: ClassificationTier
  intendedUse: string
  appliedTransformations: string[]
  systemRulesApplied: string[]
  customRulesApplied: string[]
  remainingConditions: string[]
  reviewer: string
  approvedAt: string
  auditReference: string
}

/* ------------------------------------------------------------------ */
/* Generic response envelopes                                          */
/* ------------------------------------------------------------------ */

export interface CreatedRuleResponse {
  rule: ClassificationRule
}

export interface ReclassifyResponse {
  jobId: string
  datasetId: string
  state: 'RUNNING' | 'COMPLETE'
  progress: number
}
