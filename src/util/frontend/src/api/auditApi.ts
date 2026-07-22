import type { AuditEvent } from '@/types'
import { mockDb } from '@/mocks/db'
import { request } from './apiClient'

export const auditApi = {
  listAuditEvents: () =>
    request<AuditEvent[]>('/audit-events', {
      mock: () => mockDb.listAudit(),
    }),
}
