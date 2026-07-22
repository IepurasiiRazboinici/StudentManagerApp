import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Check, Loader2 } from 'lucide-react'
import { useScanStatus } from '@/hooks'
import {
  Button,
  ConfidenceIndicator,
  ErrorState,
  PageHeader,
  Panel,
  ProgressBar,
  Skeleton,
  TierBadge,
} from '@/components/common'
import { cn } from '@/utils/cn'
import { formatDateTime } from '@/utils/format'

export function ScanProgressPage() {
  const { scanId } = useParams()
  const navigate = useNavigate()
  const { data, isLoading, isError, refetch } = useScanStatus(scanId)
  const [step, setStep] = useState(0)

  const total = data?.stages.length ?? 0

  useEffect(() => {
    if (!data) return
    const interval = setInterval(() => {
      setStep((s) => {
        if (s >= total) {
          clearInterval(interval)
          return s
        }
        return s + 1
      })
    }, 480)
    return () => clearInterval(interval)
  }, [data, total])

  if (isLoading) {
    return (
      <div className="page-stack">
        <PageHeader eyebrow="Scan" title="Scan in progress" />
        <Panel>
          <Skeleton className="skeleton-line" />
          <Skeleton className="skeleton-panel" />
        </Panel>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="page-stack">
        <PageHeader eyebrow="Scan" title="Scan" />
        <ErrorState description="The scan status could not be loaded." onRetry={() => void refetch()} />
      </div>
    )
  }

  const done = step >= total
  const progress = total === 0 ? 0 : Math.round((step / total) * 100)
  const currentStage = done ? data.stages[total - 1] : data.stages[Math.min(step, total - 1)]
  const revealedEvents = data.events.slice(0, Math.max(1, step))

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Scan"
        title={done ? 'Scan completed' : 'Scan in progress'}
        description={
          <>
            File <span className="mono">{data.fileName}</span>
          </>
        }
        actions={
          done ? (
            <>
              <Button variant="secondary" onClick={() => navigate('/datasets')}>
                Open Data Catalogue
              </Button>
              {data.provisionalResult ? (
                <Button onClick={() => navigate(`/datasets/${data.provisionalResult?.datasetId}`)}>Open dataset</Button>
              ) : null}
            </>
          ) : undefined
        }
      />

      <Panel>
        <div className="scan-progress-head">
          <div>
            <span className="eyebrow">{done ? 'Complete' : 'Current stage'}</span>
            <strong>{currentStage?.label}</strong>
          </div>
          <span className="scan-progress-pct">{progress}%</span>
        </div>
        <ProgressBar value={progress} label={`Scan ${progress}%`} />

        <div className="scan-progress-grid">
          <ol className="scan-stage-list">
            {data.stages.map((stage, index) => {
              const complete = index < step
              const active = index === step && !done
              return (
                <li key={stage.key} className={cn(complete && 'complete', active && 'active')}>
                  <span className="scan-stage-icon" aria-hidden>
                    {complete ? <Check size={13} /> : active ? <Loader2 size={13} className="spin" /> : null}
                  </span>
                  {stage.label}
                </li>
              )
            })}
          </ol>

          <div className="scan-side">
            <div className="scan-metrics">
              <div>
                <strong>{data.fieldsAnalysed}</strong>
                <span>Fields analysed</span>
              </div>
              <div>
                <strong>{data.matchedRuleCount}</strong>
                <span>Matched rules</span>
              </div>
            </div>

            {done && data.provisionalResult ? (
              <div className="provisional-result">
                <span className="eyebrow">Provisional result</span>
                <span className="mono">{data.provisionalResult.datasetName}</span>
                <div className="provisional-badges">
                  <TierBadge tier={data.provisionalResult.classification} />
                  <ConfidenceIndicator value={data.provisionalResult.confidence} size="sm" />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </Panel>

      <Panel>
        <div className="panel-head">
          <h2>Live event log</h2>
        </div>
        <ul className="event-log" aria-live="polite">
          {revealedEvents.map((event) => (
            <li key={event.id}>
              <span className="event-time mono">{formatDateTime(event.timestamp)}</span>
              <span>{event.message}</span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  )
}
