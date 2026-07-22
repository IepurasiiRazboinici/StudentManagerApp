/** Central TanStack Query keys so invalidation stays consistent. */
export const qk = {
  dashboard: ['dashboard'] as const,
  sources: ['sources'] as const,
  file: (id: string) => ['file', id] as const,
  scan: (id: string) => ['scan', id] as const,
  datasets: ['datasets'] as const,
  dataset: (id: string) => ['dataset', id] as const,
  fields: (id: string) => ['dataset', id, 'fields'] as const,
  rules: ['rules'] as const,
  reviews: ['reviews', 'queue'] as const,
  decisions: ['reviews', 'decisions'] as const,
  policies: ['policies'] as const,
  policy: (id: string) => ['policy', id] as const,
  audit: ['audit'] as const,
  remediationPlan: (datasetId: string) => ['remediation', datasetId] as const,
  passport: (datasetId: string) => ['passport', datasetId] as const,
}
