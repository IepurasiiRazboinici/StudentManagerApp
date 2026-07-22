import { useNavigate } from 'react-router-dom'
import { Database, Plus } from 'lucide-react'
import { useDataSources, useUploadFile } from '@/hooks'
import { toast } from '@/stores/toastStore'
import {
  Button,
  EmptyState,
  ErrorState,
  PageHeader,
  Panel,
  StatusBadge,
  TableSkeleton,
} from '@/components/common'
import { UploadDropzone } from '@/components/datasets/UploadDropzone'
import type { AcceptedFile } from '@/components/datasets/UploadDropzone'
import { formatDate, formatNumber } from '@/utils/format'

const SOURCE_STATUS_TONE = { CONNECTED: 'green', SCANNING: 'blue', ERROR: 'red', IDLE: 'neutral' } as const

export function SourcesPage() {
  const navigate = useNavigate()
  const { data, isLoading, isError, refetch } = useDataSources()
  const upload = useUploadFile()

  const onAccepted = (file: AcceptedFile) => {
    upload.mutate(file, {
      onSuccess: (created) => {
        toast.success('File uploaded — configure it before scanning.')
        navigate(`/sources/file/${created.id}/configure`)
      },
      onError: () => toast.error('Upload failed. Try again.'),
    })
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="Data Sources"
        description="Upload files or connect a PostgreSQL source. The frontend only uploads the selected file — it never parses it."
        actions={
          <Button onClick={() => navigate('/sources/new')}>
            <Plus size={16} /> Add source
          </Button>
        }
      />

      <div className="source-cards">
        <Panel className="source-card">
          <h2>Upload a file</h2>
          <UploadDropzone onAccepted={onAccepted} />
        </Panel>
        <Panel className="source-card">
          <div className="pg-card-head">
            <Database size={18} aria-hidden />
            <h2>Connect PostgreSQL</h2>
          </div>
          <p className="muted">Discover schemas, tables and fields from a governed database connection.</p>
          <ul className="pg-facts">
            <li>Read-only governance credentials</li>
            <li>Schema and field discovery</li>
            <li>Scheduled or on-demand scans</li>
          </ul>
          <Button variant="secondary" onClick={() => navigate('/sources/new')}>
            Configure connection
          </Button>
        </Panel>
      </div>

      <Panel>
        <div className="panel-head">
          <h2>Connected sources</h2>
        </div>
        {isLoading ? (
          <TableSkeleton rows={3} cols={5} />
        ) : isError ? (
          <ErrorState description="Sources could not be loaded." onRetry={() => void refetch()} />
        ) : !data || data.length === 0 ? (
          <EmptyState title="No sources yet" description="Add a data source to begin discovering and classifying data." />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Locator</th>
                  <th>Status</th>
                  <th className="num">Datasets</th>
                  <th>Last scan</th>
                </tr>
              </thead>
              <tbody>
                {data.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <span className="source-cell">
                        <Database size={14} aria-hidden />
                        {s.name}
                      </span>
                    </td>
                    <td className="mono muted">{s.locator}</td>
                    <td>
                      <StatusBadge tone={SOURCE_STATUS_TONE[s.status]}>{s.status}</StatusBadge>
                    </td>
                    <td className="num">{formatNumber(s.datasetsDiscovered)}</td>
                    <td className="muted">{formatDate(s.lastScan)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  )
}
