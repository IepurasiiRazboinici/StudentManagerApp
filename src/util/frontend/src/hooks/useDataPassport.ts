import { useQuery } from '@tanstack/react-query'
import { dataPassportApi } from '@/api'
import { qk } from './queryKeys'

export function useDataPassport(datasetId: string | undefined) {
  return useQuery({
    queryKey: datasetId ? qk.passport(datasetId) : ['passport', 'none'],
    queryFn: () => dataPassportApi.getPassport(datasetId as string),
    enabled: Boolean(datasetId),
  })
}
