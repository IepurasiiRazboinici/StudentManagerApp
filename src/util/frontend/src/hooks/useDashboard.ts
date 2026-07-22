import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '@/api'
import { qk } from './queryKeys'

export function useDashboardStats() {
  return useQuery({ queryKey: qk.dashboard, queryFn: dashboardApi.getOverview })
}
