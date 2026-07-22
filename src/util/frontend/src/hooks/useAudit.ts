import { useQuery } from '@tanstack/react-query'
import { auditApi } from '@/api'
import { qk } from './queryKeys'

export function useAuditEvents() {
  return useQuery({ queryKey: qk.audit, queryFn: auditApi.listAuditEvents })
}
