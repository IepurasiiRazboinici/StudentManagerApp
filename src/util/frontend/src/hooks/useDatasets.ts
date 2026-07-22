import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { datasetsApi } from '@/api'
import type { UsageCheckRequest } from '@/types'
import { qk } from './queryKeys'

export function useDatasets() {
  return useQuery({ queryKey: qk.datasets, queryFn: datasetsApi.listDatasets })
}

export function useDatasetDetails(datasetId: string | undefined) {
  return useQuery({
    queryKey: datasetId ? qk.dataset(datasetId) : ['dataset', 'none'],
    queryFn: () => datasetsApi.getDataset(datasetId as string),
    enabled: Boolean(datasetId),
  })
}

export function useDatasetFields(datasetId: string | undefined) {
  return useQuery({
    queryKey: datasetId ? qk.fields(datasetId) : ['dataset', 'none', 'fields'],
    queryFn: () => datasetsApi.getFields(datasetId as string),
    enabled: Boolean(datasetId),
  })
}

export function useReclassifyDataset(datasetId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => datasetsApi.reclassify(datasetId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.dataset(datasetId) })
      void qc.invalidateQueries({ queryKey: qk.fields(datasetId) })
      void qc.invalidateQueries({ queryKey: qk.datasets })
      void qc.invalidateQueries({ queryKey: qk.reviews })
      void qc.invalidateQueries({ queryKey: qk.dashboard })
      void qc.invalidateQueries({ queryKey: qk.audit })
    },
  })
}

export function useCheckIntendedUse(datasetId: string) {
  return useMutation({
    mutationFn: (req: UsageCheckRequest) => datasetsApi.usageCheck(datasetId, req),
  })
}
