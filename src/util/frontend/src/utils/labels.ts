import type {
  AuditEventType,
  ClassificationTier,
  EvidenceKind,
  IntendedUsePurpose,
  ReviewCategory,
  ReviewDecisionKind,
  ReviewStatus,
  RulePriority,
  RuleScope,
  RuleTriggerType,
  Severity,
  TransformationKind,
  UsageStatus,
} from '@/types'

/** Visual tone shared across badges — maps to `.badge-*` classes in App.css. */
export type Tone = 'neutral' | 'blue' | 'amber' | 'red' | 'green' | 'violet' | 'teal'

export const TIER_LABEL: Record<ClassificationTier, string> = {
  PUBLIC: 'Public',
  CORPORATE: 'Corporate',
  RESTRICTED: 'Restricted',
  HIGHLY_RESTRICTED: 'Highly Restricted',
  UNKNOWN: 'Unknown',
}

export const TIER_TONE: Record<ClassificationTier, Tone> = {
  PUBLIC: 'neutral',
  CORPORATE: 'blue',
  RESTRICTED: 'amber',
  HIGHLY_RESTRICTED: 'red',
  UNKNOWN: 'neutral',
}

export const REVIEW_STATUS_LABEL: Record<ReviewStatus, string> = {
  AUTO: 'Auto',
  CONFIRMED: 'Confirmed',
  OVERRIDDEN: 'Overridden',
  REVIEW_REQUIRED: 'Review required',
}

export const REVIEW_STATUS_TONE: Record<ReviewStatus, Tone> = {
  AUTO: 'neutral',
  CONFIRMED: 'green',
  OVERRIDDEN: 'violet',
  REVIEW_REQUIRED: 'amber',
}

export const USAGE_STATUS_LABEL: Record<UsageStatus, string> = {
  ALLOWED: 'Allowed',
  CONDITIONALLY_ALLOWED: 'Conditionally allowed',
  BLOCKED: 'Blocked',
  REVIEW_REQUIRED: 'Review required',
}

export const USAGE_STATUS_TONE: Record<UsageStatus, Tone> = {
  ALLOWED: 'green',
  CONDITIONALLY_ALLOWED: 'amber',
  BLOCKED: 'red',
  REVIEW_REQUIRED: 'amber',
}

export const EVIDENCE_KIND_LABEL: Record<EvidenceKind, string> = {
  EXPLICIT_MARKER: 'Explicit marker',
  DETECTOR: 'Detector',
  POLICY: 'Policy',
  CONTEXT: 'Context',
  AGGREGATION: 'Aggregation',
  CUSTOM_RULE: 'Custom rule',
  HUMAN: 'Human review',
}

export const EVIDENCE_KIND_TONE: Record<EvidenceKind, Tone> = {
  EXPLICIT_MARKER: 'violet',
  DETECTOR: 'green',
  POLICY: 'violet',
  CONTEXT: 'blue',
  AGGREGATION: 'amber',
  CUSTOM_RULE: 'teal',
  HUMAN: 'teal',
}

export const TRIGGER_TYPE_LABEL: Record<RuleTriggerType, string> = {
  EXPLICIT_MARKER: 'Explicit marker',
  FILE_NAME: 'File name',
  FIELD_NAME: 'Field name',
  CONTENT_PATTERN: 'Content pattern',
  FIELD_COMBINATION: 'Field combination',
  DOCUMENT_TYPE: 'Document type',
  METADATA_STATUS: 'Metadata status',
}

export const PRIORITY_LABEL: Record<RulePriority, string> = {
  NORMAL: 'Normal',
  HIGH: 'High',
  CRITICAL: 'Critical',
}

export const PRIORITY_TONE: Record<RulePriority, Tone> = {
  NORMAL: 'neutral',
  HIGH: 'amber',
  CRITICAL: 'red',
}

export const SCOPE_LABEL: Record<RuleScope, string> = {
  THIS_FILE: 'This file',
  ALL_FILES: 'All files',
}

export const SEVERITY_LABEL: Record<Severity, string> = {
  CRITICAL: 'Critical',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
}

export const SEVERITY_TONE: Record<Severity, Tone> = {
  CRITICAL: 'red',
  HIGH: 'amber',
  MEDIUM: 'blue',
  LOW: 'neutral',
}

export const INTENDED_USE_LABEL: Record<IntendedUsePurpose, string> = {
  INTERNAL_ANALYTICS: 'Internal analytics',
  SHARE_INTERNAL_TEAM: 'Share with another internal team',
  SHARE_EXTERNAL_PARTNER: 'Share with an external partner',
  AI_MODEL_TRAINING: 'AI model training',
  PUBLIC_EXPORT: 'Public export',
  TESTING: 'Testing',
}

export const REVIEW_CATEGORY_LABEL: Record<ReviewCategory, string> = {
  LOW_CONFIDENCE: 'Low-confidence classification',
  POLICY_GAP: 'Policy gap',
  AMBIGUOUS_PROVENANCE: 'Ambiguous provenance',
  MARKER_CONFLICT: 'Explicit marker conflict',
  HIGHLY_RESTRICTED_AUTO: 'Highly Restricted (automated)',
  CUSTOM_RULE_CHANGE: 'Custom rule change',
  PROPOSED_SAFE_VERSION: 'Proposed safe version',
}

export const REVIEW_DECISION_LABEL: Record<ReviewDecisionKind, string> = {
  APPROVE: 'Approved',
  OVERRIDE: 'Overridden',
  REQUEST_CHANGES: 'Changes requested',
  REJECT_USAGE: 'Usage rejected',
  ESCALATE: 'Escalated',
}

export const AUDIT_EVENT_LABEL: Record<AuditEventType, string> = {
  SOURCE_CREATED: 'Source created',
  FILE_UPLOADED: 'File uploaded',
  SCAN_STARTED: 'Scan started',
  CLASSIFICATION_COMPLETED: 'Classification completed',
  CUSTOM_RULE_CREATED: 'Custom rule created',
  CUSTOM_RULE_UPDATED: 'Custom rule updated',
  CUSTOM_RULE_DISABLED: 'Custom rule disabled',
  RECLASSIFICATION_REQUESTED: 'Reclassification requested',
  CLASSIFICATION_OVERRIDDEN: 'Classification overridden',
  REMEDIATION_PLAN_GENERATED: 'Remediation plan generated',
  SAFE_VERSION_APPROVED: 'Safe version approved',
  DATA_PASSPORT_GENERATED: 'Data Passport generated',
}

export const TRANSFORMATION_LABEL: Record<TransformationKind, string> = {
  REMOVE_FIELD: 'Remove field',
  MASK_VALUE: 'Mask value',
  PSEUDONYMISE: 'Pseudonymise identifier',
  BUCKET_NUMERIC: 'Bucket numeric value',
  AGGREGATE_RECORDS: 'Aggregate records',
  REMOVE_LICENSED_DERIVED: 'Remove licensed derived fields',
  STRIP_UNPUBLISHED: 'Strip unpublished sections',
  VERIFY_ANONYMISATION: 'Verify anonymisation',
  REQUEST_OWNER_CONFIRMATION: 'Request data-owner confirmation',
}
