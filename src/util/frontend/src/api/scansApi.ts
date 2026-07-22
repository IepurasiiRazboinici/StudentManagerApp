import type { ScanStatus } from '@/types'
import { mockDb } from '@/mocks/db'
import { request } from './apiClient'

export interface StartScanInput {
  sourceId?: string
  fileId?: string
}

export const scansApi = {
  startScan: (input: StartScanInput) =>
    request<{ scanId: string }>('/scans', {
      method: 'POST',
      body: input,
      mock: () => ({ scanId: 'scan-2026-07-22' }),
    }),

  getScan: (scanId: string) =>
    request<ScanStatus>(`/scans/${scanId}`, {
      mock: () => mockDb.buildScan(scanId),
    }),
}
