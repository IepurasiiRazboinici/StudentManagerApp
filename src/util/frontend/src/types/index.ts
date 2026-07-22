export type ClassificationTier =
  | 'Public'
  | 'Corporate'
  | 'Restricted'
  | 'Highly Restricted'
  | 'Unknown'

export type ReviewStatus =
  | 'Auto'
  | 'Needs Review'
  | 'Policy Gap'
  | 'Confirmed'
  | 'Pending'
  | 'Approved'
  | 'Completed'

export type UsageStatus =
  | 'Allowed'
  | 'Conditional'
  | 'Blocked'
  | 'Guidance Needed'
  | 'Conditionally allowed'

export type EvidenceKind = 'detector' | 'policy' | 'context' | 'aggregation' | 'human'

export type SourceType = 'PostgreSQL' | 'CSV' | 'JSON' | 'TXT' | 'Policy'

export type Sensitivity = 'Critical' | 'High' | 'Medium' | 'Low'

export type TransformationType =
  | 'remove'
  | 'mask'
  | 'pseudonymise'
  | 'bucket'
  | 'generalise'

export type PlanPreset = 'quick' | 'balanced' | 'maximum'

export interface PolicyReference {
  name: string
  section: string
  title: string
  excerpt: string
}

export interface FieldClassification {
  name: string
  dataType: string
  sensitivity: Sensitivity
  classification: ClassificationTier
  evidence: string
}

export interface EvidenceSignal {
  id: string
  kind: EvidenceKind
  title: string
  description: string
  confidence?: number
  details: string[]
  policy?: PolicyReference
}

export interface DatasetSummary {
  id: string
  name: string
  sourceType: SourceType
  sourceName: string
  sourceLocation: string
  classification: ClassificationTier
  confidence: number
  usageStatus: UsageStatus
  reviewStatus: ReviewStatus
  riskScore: number
  needsReview: boolean
  rowCount: number
  fieldCount: number
  lastScan: string
  attentionReason: string
}

export interface DatasetHistoryItem {
  id: string
  label: string
  timestamp: string
  actor: string
}

export interface DatasetDetail extends DatasetSummary {
  why: string
  owner: string
  retention: string
  fields: FieldClassification[]
  policy: PolicyReference
  evidence: EvidenceSignal[]
  history: DatasetHistoryItem[]
}

export interface OverviewStats {
  datasets: number
  fieldsClassified: number
  awaitingReview: number
  policyGaps: number
  distribution: Record<Exclude<ClassificationTier, 'Unknown'>, number>
  recentScans: Array<{
    label: string
    rowsProcessed: number
    sensitiveFields: number
    llmPayloadKb: number
  }>
}

export interface UsageAssessment {
  status: UsageStatus
  description: string
  reasons: string[]
  citations: PolicyReference[]
}

export interface Transformation {
  id: string
  field: string
  title: string
  description: string
  type: TransformationType
  riskReduction: number
  utilityCost: number
  includedIn: PlanPreset[]
}

export interface RemediationPlan {
  preset: PlanPreset
  title: string
  description: string
  transformationIds: string[]
  before: {
    classification: ClassificationTier
    risk: number
    usage: UsageStatus
  }
  after: {
    classification: ClassificationTier
    risk: number
    usage: UsageStatus
  }
  riskReduction: number
  utilityRetained: number
  remainingConditions: string[]
}

export interface PreviewRow {
  id: string
  clientName: {
    original: string
    transformed: string
  }
  clientEmail: {
    original: string
    transformed: string
  }
  accountNumber: {
    original: string
    transformed: string
  }
  portfolioValue: {
    original: string
    transformed: string
  }
}

export interface ReviewItem {
  id: string
  datasetId: string
  datasetName: string
  category: 'High Risk' | 'Privacy Risk' | 'Aggregation Risk' | 'Re-identification Risk' | 'Safe Plan Approval' | 'Policy Gap'
  confidence: number
  currentClassification: ClassificationTier
  proposedClassification?: ClassificationTier
  reason: string
  intendedUse?: string
  evidence: string[]
  recommendedAction: string
}

export interface CompletedReview {
  id: string
  decision: string
  datasetName: string
  reviewer: string
  timestamp: string
}

export interface DataPassport {
  reference: string
  dataset: string
  originalClassification: ClassificationTier
  approvedClassification: ClassificationTier
  intendedUse: string
  transformations: string[]
  remainingConditions: string[]
  policyCitations: string[]
  reviewer: string
  approvalTimestamp: string
  auditTimeline: DatasetHistoryItem[]
}

export interface ScanProgress {
  id: string
  value: number
  currentDataset: string
  stages: Array<{
    label: string
    status: 'complete' | 'active' | 'pending'
  }>
}

export interface ClassifierRule {
  id: string
  name: string
  signal: string
  targetField: string
  classification: ClassificationTier
  sensitivity: Sensitivity
  action: 'Flag for review' | 'Auto classify' | 'Require policy match'
  status: 'Active' | 'Draft'
  description: string
}
