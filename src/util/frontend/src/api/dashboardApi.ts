import type { DashboardStats } from '@/types'
import { mockDb } from '@/mocks/db'
import { request } from './apiClient'

export const dashboardApi = {
  getOverview: () =>
    request<DashboardStats>('/stats/overview', {
      mock: () => mockDb.dashboard(),
    }),
}
