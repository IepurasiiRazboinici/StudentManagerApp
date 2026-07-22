import type { DataSource, FileType, UploadedFile } from '@/types'
import { mockDb } from '@/mocks/db'
import { request } from './apiClient'

export interface CreateSourceInput {
  name: string
  kind: DataSource['kind']
  locator: string
}

export interface UploadFileInput {
  filename: string
  fileType: FileType
  sizeBytes: number
}

export interface PostgresTestInput {
  host: string
  port: number
  database: string
  username: string
  password: string
}

export interface PostgresTestResult {
  ok: boolean
  schemas: number
  tables: number
  fields: number
}

export const sourcesApi = {
  listSources: () =>
    request<DataSource[]>('/sources', {
      mock: () => mockDb.listSources(),
    }),

  createSource: (input: CreateSourceInput) =>
    request<DataSource>('/sources/postgresql', {
      method: 'POST',
      body: input,
      mock: () => mockDb.createSource(input),
    }),

  testPostgres: (input: PostgresTestInput) =>
    request<PostgresTestResult>('/sources/postgresql/test', {
      method: 'POST',
      body: input,
      mock: () => ({ ok: true, schemas: 3, tables: 11, fields: 86 }),
      delay: 500,
    }),

  uploadFile: (input: UploadFileInput) =>
    request<UploadedFile>('/sources/files', {
      method: 'POST',
      body: input,
      mock: () => mockDb.uploadFile(input),
    }),

  getFile: (fileId: string) =>
    request<UploadedFile>(`/sources/files/${fileId}`, {
      mock: () => mockDb.getFile(fileId),
    }),
}
