import type { PolicyDocument } from '@/types'
import { mockDb } from '@/mocks/db'
import { request } from './apiClient'

export const policiesApi = {
  listPolicies: () =>
    request<PolicyDocument[]>('/policies', {
      mock: () => mockDb.listPolicies(),
    }),

  getPolicy: (policyId: string) =>
    request<PolicyDocument>(`/policies/${policyId}`, {
      mock: () => mockDb.getPolicy(policyId),
    }),
}
