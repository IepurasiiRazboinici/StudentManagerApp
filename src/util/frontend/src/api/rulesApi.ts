import type {
  ClassificationRule,
  CreateRuleRequest,
  RulePreviewRequest,
  RulePreviewResult,
} from '@/types'
import { mockDb } from '@/mocks/db'
import { request } from './apiClient'

export const rulesApi = {
  listRules: () =>
    request<ClassificationRule[]>('/classification-rules', {
      mock: () => mockDb.listRules(),
    }),

  createRule: (req: CreateRuleRequest) =>
    request<ClassificationRule>('/classification-rules', {
      method: 'POST',
      body: req,
      mock: () => mockDb.createRule(req),
      delay: 500,
    }),

  previewRule: (req: RulePreviewRequest) =>
    request<RulePreviewResult>('/classification-rules/preview', {
      method: 'POST',
      body: req,
      mock: () => mockDb.previewRule(req),
      delay: 650,
    }),

  updateRule: (ruleId: string, patch: Partial<ClassificationRule>) =>
    request<ClassificationRule>(`/classification-rules/${ruleId}`, {
      method: 'PATCH',
      body: patch,
      mock: () => mockDb.updateRule(ruleId, patch),
    }),

  deleteRule: (ruleId: string) =>
    request<{ ok: true }>(`/classification-rules/${ruleId}`, {
      method: 'DELETE',
      mock: () => {
        mockDb.deleteRule(ruleId)
        return { ok: true }
      },
    }),
}
