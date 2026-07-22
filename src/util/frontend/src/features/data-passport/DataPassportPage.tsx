import { useNavigate, useParams } from 'react-router-dom'
import { Download, FileJson, ShieldCheck } from 'lucide-react'
import { useApproveSafeVersion, useDataPassport } from '@/hooks'
import { toast } from '@/stores/toastStore'
import {
  Button,
  EmptyState,
  ErrorState,
  KeyValue,
  PageHeader,
  Panel,
  Skeleton,
  TierBadge,
} from '@/components/common'
import { formatDateTime } from '@/utils/format'

export function DataPassportPage() {
  const { datasetId } = useParams()
  const navigate = useNavigate()
  const { data: passport, isLoading, isError, refetch } = useDataPassport(datasetId)
  const approve = useApproveSafeVersion()

  const generate = () =>
    approve.mutate(datasetId ?? '', {
      onSuccess: () => toast.success('Safe version approved — Data Passport generated.'),
      onError: () => toast.error('Could not approve the safe version.'),
    })

  const download = (kind: 'pdf' | 'json') => {
    if (!passport) return
    // The backend generates the file; the frontend only starts the download.
    // In demo mode we stand in with a client-side JSON blob.
    const blob = new Blob([JSON.stringify(passport, null, 2)], { type: kind === 'json' ? 'application/json' : 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${passport.reference}.${kind === 'json' ? 'json' : 'pdf'}`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(kind === 'pdf' ? 'Data Passport PDF download started.' : 'Data Passport JSON exported.')
  }

  if (isLoading) {
    return (
      <div className="page-stack">
        <PageHeader eyebrow="Data Passport" title="Data Passport" />
        <Panel>
          <Skeleton className="skeleton-title" />
          <Skeleton className="skeleton-panel" />
        </Panel>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="page-stack">
        <PageHeader eyebrow="Data Passport" title="Data Passport" />
        <ErrorState description="The Data Passport could not be loaded." onRetry={() => void refetch()} />
      </div>
    )
  }

  if (!passport) {
    return (
      <div className="page-stack">
        <PageHeader eyebrow="Data Passport" title="Data Passport" />
        <EmptyState
          title="No Data Passport yet"
          description="A Data Passport is generated when a safe version is approved for this dataset."
          action={
            <Button onClick={generate} disabled={approve.isPending}>
              <ShieldCheck size={15} /> {approve.isPending ? 'Approving…' : 'Approve safe version'}
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Data Passport"
        title={passport.reference}
        description="A signed record of how a dataset was made safe and approved."
        actions={
          <>
            <Button variant="secondary" onClick={() => download('pdf')}>
              <Download size={15} /> Download PDF
            </Button>
            <Button variant="secondary" onClick={() => download('json')}>
              <FileJson size={15} /> Export JSON
            </Button>
            <Button variant="ghost" onClick={() => navigate('/datasets')}>
              Return to Catalogue
            </Button>
          </>
        }
      />

      <Panel className="passport-panel">
        <div className="passport-tiers">
          <div>
            <span className="eyebrow">Original</span>
            <span className="mono">{passport.originalDatasetName}</span>
            <TierBadge tier={passport.originalClassification} />
          </div>
          <div>
            <span className="eyebrow">Approved safe version</span>
            <span className="mono">{passport.safeDatasetName}</span>
            <TierBadge tier={passport.approvedClassification} />
          </div>
        </div>

        <div className="key-value-grid">
          <KeyValue label="Intended use" value={passport.intendedUse} />
          <KeyValue label="Reviewer" value={passport.reviewer} />
          <KeyValue label="Approved at" value={formatDateTime(passport.approvedAt)} />
          <KeyValue label="Audit reference" value={<span className="mono">{passport.auditReference}</span>} />
        </div>

        <PassportList title="Applied transformations" items={passport.appliedTransformations} empty="No transformations recorded." />
        <PassportList title="System rules applied" items={passport.systemRulesApplied} empty="No system rules recorded." />
        <PassportList title="Custom rules applied" items={passport.customRulesApplied} empty="No custom rules applied." />
        <PassportList title="Remaining conditions" items={passport.remainingConditions} empty="No remaining conditions." />
      </Panel>
    </div>
  )
}

function PassportList({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <div className="drawer-section">
      <span className="eyebrow">{title}</span>
      {items.length === 0 ? (
        <p className="muted">{empty}</p>
      ) : (
        <ul className="plain-list">
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
