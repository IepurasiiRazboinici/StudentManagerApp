import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { scansApi } from '@/api'
import type { StartScanInput } from '@/api/scansApi'
import { qk } from './queryKeys'

export function useScanStatus(scanId: string | undefined) {
  return useQuery({
    queryKey: scanId ? qk.scan(scanId) : ['scan', 'none'],
    queryFn: () => scansApi.getScan(scanId as string),
    enabled: Boolean(scanId),
  })
}

export function useStartScan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: StartScanInput) => scansApi.startScan(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.audit })
    },
  })
}
