import type { DataPassport } from '@/types'
import { mockDb } from '@/mocks/db'
import { request } from './apiClient'

export const dataPassportApi = {
  getPassport: (datasetId: string) =>
    request<DataPassport | null>(`/datasets/${datasetId}/data-passport`, {
      mock: () => mockDb.getPassport(datasetId),
    }),
}
