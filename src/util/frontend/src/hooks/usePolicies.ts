import { useQuery } from '@tanstack/react-query'
import { policiesApi } from '@/api'
import { qk } from './queryKeys'

export function usePolicies() {
  return useQuery({ queryKey: qk.policies, queryFn: policiesApi.listPolicies })
}

export function usePolicy(policyId: string | undefined) {
  return useQuery({
    queryKey: policyId ? qk.policy(policyId) : ['policy', 'none'],
    queryFn: () => policiesApi.getPolicy(policyId as string),
    enabled: Boolean(policyId),
  })
}
