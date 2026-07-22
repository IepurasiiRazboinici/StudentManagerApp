import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ScanLine, ShieldPlus, Trash2 } from 'lucide-react'
import { useClassificationRules, useStartScan, useUploadedFile } from '@/hooks'
import { useUiStore } from '@/stores/uiStore'
import { toast } from '@/stores/toastStore'
import { Button, ConfirmDialog, ErrorState, PageHeader, Panel, Skeleton } from '@/components/common'
import { FileProfileSummary } from '@/components/datasets/FileProfileSummary'
import { ActiveRulesList } from '@/components/rules/ActiveRulesList'

export function FileConfigurePage() {
  const { fileId } = useParams()
  const navigate = useNavigate()
  const { data: file, isLoading, isError, refetch } = useUploadedFile(fileId)
  const { data: rules } = useClassificationRules()
  const startScan = useStartScan()
  const openAddRule = useUiStore((s) => s.openAddRule)
  const [confirmRemove, setConfirmRemove] = useState(false)

  const activeRules = rules?.filter((r) => file?.activeRuleIds.includes(r.id) || r.scopeFileId === file?.id) ?? []

  const analyse = () =>
    startScan.mutate(
      { fileId },
      {
        onSuccess: (res) => navigate(`/scan/${res.scanId}`),
        onError: () => toast.error('Could not start analysis.'),
      },
    )

  if (isLoading) {
    return (
      <div className="page-stack">
        <PageHeader eyebrow="Data Sources" title="Configure file" />
        <Panel>
          <Skeleton className="skeleton-title" />
          <Skeleton className="skeleton-line" />
          <Skeleton className="skeleton-panel" />
        </Panel>
      </div>
    )
  }

  if (isError || !file) {
    return (
      <div className="page-stack">
        <PageHeader eyebrow="Data Sources" title="Configure file" />
        <ErrorState description="This file could not be loaded." onRetry={() => void refetch()} />
      </div>
    )
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Data Sources"
        title={file.filename}
        description="Review the backend-provided profile, add a rule if needed, then analyse the file."
        actions={
          <>
            <Button variant="ghost" onClick={() => setConfirmRemove(true)}>
              <Trash2 size={15} /> Remove file
            </Button>
            <Button variant="secondary" onClick={() => openAddRule({ fileId: file.id, fileName: file.filename, scope: 'THIS_FILE' })}>
              <ShieldPlus size={15} /> Add new rule
            </Button>
            <Button onClick={analyse} disabled={startScan.isPending}>
              <ScanLine size={15} /> {startScan.isPending ? 'Starting…' : 'Analyse file'}
            </Button>
          </>
        }
      />

      <Panel>
        <FileProfileSummary file={file} />
      </Panel>

      <div className="privacy-callout" role="note">
        Raw values are processed by the protected backend profiling service. The frontend displays only metadata and
        masked samples returned by the backend.
      </div>

      <Panel>
        <div className="panel-head">
          <h2>Active rules for this file</h2>
        </div>
        <ActiveRulesList rules={activeRules} />
      </Panel>

      <ConfirmDialog
        open={confirmRemove}
        title="Remove file?"
        message={
          <>
            This removes <strong>{file.filename}</strong> from the source. It will not be scanned.
          </>
        }
        confirmLabel="Remove file"
        destructive
        onConfirm={() => {
          setConfirmRemove(false)
          toast.success('File removed.')
          navigate('/sources')
        }}
        onCancel={() => setConfirmRemove(false)}
      />
    </div>
  )
}
