import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { z } from 'zod'
import { CheckCircle2, Database, FileUp } from 'lucide-react'
import { sourcesApi } from '@/api'
import type { PostgresTestResult } from '@/api/sourcesApi'
import { useCreateSource, useUploadFile } from '@/hooks'
import { toast } from '@/stores/toastStore'
import { Button, PageHeader, Panel, TabButton } from '@/components/common'
import { UploadDropzone } from '@/components/datasets/UploadDropzone'
import type { AcceptedFile } from '@/components/datasets/UploadDropzone'

const postgresSchema = z.object({
  name: z.string().min(2, 'Use a recognisable connection name.'),
  host: z.string().min(2, 'Host is required.'),
  port: z.number().int().min(1).max(65535),
  database: z.string().min(1, 'Database is required.'),
  username: z.string().min(1, 'Username is required.'),
  password: z.string().min(1, 'Password is required.'),
})
type PostgresValues = z.infer<typeof postgresSchema>

export function NewSourcePage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'upload' | 'postgres'>('upload')
  const upload = useUploadFile()
  const createSource = useCreateSource()
  const [testResult, setTestResult] = useState<PostgresTestResult | null>(null)

  const form = useForm<PostgresValues>({
    resolver: zodResolver(postgresSchema),
    defaultValues: { name: 'Risk warehouse', host: 'warehouse.internal', port: 5432, database: 'risk', username: 'governance_reader', password: '' },
  })

  const testConnection = useMutation({
    mutationFn: (values: PostgresValues) => sourcesApi.testPostgres(values),
    onSuccess: (res) => setTestResult(res),
    onError: () => toast.error('Connection test failed.'),
  })

  const onAccepted = (file: AcceptedFile) =>
    upload.mutate(file, {
      onSuccess: (created) => {
        toast.success('File uploaded.')
        navigate(`/sources/file/${created.id}/configure`)
      },
      onError: () => toast.error('Upload failed. Try again.'),
    })

  const onCreatePostgres = form.handleSubmit((values) => {
    createSource.mutate(
      { name: values.name, kind: 'POSTGRESQL', locator: `${values.host}:${values.port}/${values.database}` },
      {
        onSuccess: () => {
          toast.success('PostgreSQL source connected.')
          navigate('/sources')
        },
        onError: () => toast.error('Could not create the source.'),
      },
    )
  })

  return (
    <div className="page-stack">
      <PageHeader eyebrow="Data Sources" title="Add a data source" description="Upload a file or connect a PostgreSQL database." />

      <div className="tabs" role="tablist" aria-label="Source type">
        <TabButton active={mode === 'upload'} onClick={() => setMode('upload')}>
          <FileUp size={15} /> Upload file
        </TabButton>
        <TabButton active={mode === 'postgres'} onClick={() => setMode('postgres')}>
          <Database size={15} /> PostgreSQL
        </TabButton>
      </div>

      {mode === 'upload' ? (
        <Panel className="source-card">
          <h2>Upload a file</h2>
          <UploadDropzone onAccepted={onAccepted} />
        </Panel>
      ) : (
        <Panel className="source-card">
          <form className="source-form" onSubmit={onCreatePostgres}>
            <label className="cf-field">
              <span className="cf-label">Connection name</span>
              <input className="cf-input" {...form.register('name')} />
              {form.formState.errors.name ? <small className="field-error">{form.formState.errors.name.message}</small> : null}
            </label>
            <div className="form-grid">
              <label className="cf-field">
                <span className="cf-label">Host</span>
                <input className="cf-input mono" {...form.register('host')} />
                {form.formState.errors.host ? <small className="field-error">{form.formState.errors.host.message}</small> : null}
              </label>
              <label className="cf-field">
                <span className="cf-label">Port</span>
                <input className="cf-input mono" type="number" {...form.register('port', { valueAsNumber: true })} />
                {form.formState.errors.port ? <small className="field-error">{form.formState.errors.port.message}</small> : null}
              </label>
            </div>
            <label className="cf-field">
              <span className="cf-label">Database</span>
              <input className="cf-input mono" {...form.register('database')} />
              {form.formState.errors.database ? <small className="field-error">{form.formState.errors.database.message}</small> : null}
            </label>
            <div className="form-grid">
              <label className="cf-field">
                <span className="cf-label">Username</span>
                <input className="cf-input mono" {...form.register('username')} />
                {form.formState.errors.username ? <small className="field-error">{form.formState.errors.username.message}</small> : null}
              </label>
              <label className="cf-field">
                <span className="cf-label">Password</span>
                <input className="cf-input" type="password" {...form.register('password')} />
                {form.formState.errors.password ? <small className="field-error">{form.formState.errors.password.message}</small> : null}
              </label>
            </div>
            <div className="form-actions">
              <Button type="button" variant="secondary" onClick={() => form.handleSubmit((v) => testConnection.mutate(v))()} disabled={testConnection.isPending}>
                {testConnection.isPending ? 'Testing…' : 'Test connection'}
              </Button>
              <Button type="submit" disabled={createSource.isPending}>
                {createSource.isPending ? 'Connecting…' : 'Add source'}
              </Button>
            </div>
            {testResult ? (
              <div className="connection-success" role="status">
                <CheckCircle2 size={18} />
                <div>
                  <strong>Connection verified</strong>
                  <p>
                    Discovered {testResult.schemas} schemas, {testResult.tables} tables and {testResult.fields} fields.
                  </p>
                </div>
              </div>
            ) : null}
          </form>
        </Panel>
      )}
    </div>
  )
}
