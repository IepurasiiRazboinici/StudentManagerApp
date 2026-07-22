import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sourcesApi } from '@/api'
import type { CreateSourceInput, UploadFileInput } from '@/api/sourcesApi'
import { qk } from './queryKeys'

export function useDataSources() {
  return useQuery({ queryKey: qk.sources, queryFn: sourcesApi.listSources })
}

export function useUploadedFile(fileId: string | undefined) {
  return useQuery({
    queryKey: fileId ? qk.file(fileId) : ['file', 'none'],
    queryFn: () => sourcesApi.getFile(fileId as string),
    enabled: Boolean(fileId),
  })
}

export function useCreateSource() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateSourceInput) => sourcesApi.createSource(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.sources })
      void qc.invalidateQueries({ queryKey: qk.dashboard })
      void qc.invalidateQueries({ queryKey: qk.audit })
    },
  })
}

export function useUploadFile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UploadFileInput) => sourcesApi.uploadFile(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.sources })
      void qc.invalidateQueries({ queryKey: qk.audit })
    },
  })
}
