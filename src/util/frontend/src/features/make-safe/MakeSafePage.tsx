import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { CheckCircle2, Download, Eye, FileJson, FileText, SlidersHorizontal } from 'lucide-react'
import { cacheFlowApi } from '../../api/services/cacheFlow'
import { useApp } from '../../app/appContextValue'
import { StepIndicator } from '../../components/overlays'
import {
  Button,
  ClassificationBadge,
  Drawer,
  EmptyState,
  InlineError,
  KeyValue,
  Panel,
  ProgressBar,
  SectionHeader,
  Skeleton,
  StatusBadge,
  UsageBadge,
} from '../../components/ui'
import type { PlanPreset, PreviewRow, RemediationPlan, Transformation, UsageAssessment } from '../../types'

const intendedUses = [
  {
    id: 'Internal analysis',
    title: 'Internal analysis',
    description: 'Analysis by approved employees inside the controlled environment.',
  },
  {
    id: 'Internal sharing',
    title: 'Internal sharing',
    description: 'Share with another internal team under existing access controls.',
  },
  {
    id: 'External processing',
    title: 'External processing',
    description: 'Send a privacy-safe version to an approved external processor.',
  },
  {
    id: 'AI model training',
    title: 'AI model training',
    description: 'Use representative rows for model training or fine-tuning workflows.',
  },
  {
    id: 'Public export',
    title: 'Public export',
    description: 'Create an export that can leave controlled enterprise environments.',
  },
]

const presetOrder: PlanPreset[] = ['quick', 'balanced', 'maximum']

export function MakeSafePage() {
  const { datasetId = 'client_market_analysis' } = useParams()
  const { showToast, openPolicy } = useApp()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [intendedUse, setIntendedUse] = useState('External processing')
  const [access, setAccess] = useState('Approved external processor')
  const [processingLocation, setProcessingLocation] = useState('Controlled external environment')
  const [assessment, setAssessment] = useState<UsageAssessment | null>(null)
  const [preset, setPreset] = useState<PlanPreset>('balanced')
  const [customising, setCustomising] = useState(false)
  const [selectedTransformations, setSelectedTransformations] = useState<string[] | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [passportOpen, setPassportOpen] = useState(false)
  const [safeOnly, setSafeOnly] = useState(false)
  const [reviewerNote, setReviewerNote] = useState('Approved for the named processor under access logging.')
  const [approved, setApproved] = useState(false)

  const datasetQuery = useQuery({
    queryKey: ['dataset', datasetId],
    queryFn: () => cacheFlowApi.getDataset(datasetId),
  })
  const transformationsQuery = useQuery({
    queryKey: ['transformations', datasetId],
    queryFn: () => cacheFlowApi.getTransformations(datasetId),
  })
  const plansQuery = useQuery({
    queryKey: ['remediation-plans', datasetId],
    queryFn: () => cacheFlowApi.getRemediationPlans(datasetId),
  })
  const previewQuery = useQuery({
    queryKey: ['preview', datasetId],
    queryFn: () => cacheFlowApi.getDatasetPreview(datasetId),
  })
  const passportQuery = useQuery({
    queryKey: ['passport', datasetId],
    queryFn: cacheFlowApi.getPassport,
  })

  const plans = plansQuery.data
  const activePlan = plans?.[preset]
  const transformations = useMemo(() => transformationsQuery.data ?? [], [transformationsQuery.data])
  const selectedIds = useMemo(
    () => selectedTransformations ?? activePlan?.transformationIds ?? [],
    [activePlan, selectedTransformations],
  )

  const usageMutation = useMutation({
    mutationFn: () =>
      cacheFlowApi.usageCheck(datasetId, {
        intendedUse,
        access,
        processingLocation,
      }),
    onSuccess: setAssessment,
  })

  const reviewMutation = useMutation({
    mutationFn: () =>
      cacheFlowApi.submitReview(datasetId, {
        reviewerNote,
        selectedTransformations: selectedIds,
        intendedUse,
      }),
    onSuccess: () => {
      setApproved(true)
      showToast('Safe version approved.')
    },
  })

  const impact = useMemo(() => {
    if (!activePlan) {
      return null
    }

    const isPresetPlan =
      selectedIds.length === activePlan.transformationIds.length &&
      selectedIds.every((id) => activePlan.transformationIds.includes(id))

    if (isPresetPlan) {
      return activePlan
    }

    const selected = transformations.filter((transformation) => selectedIds.includes(transformation.id))
    const riskAfter = Math.max(30, activePlan.before.risk - selected.reduce((sum, item) => sum + item.riskReduction, 0))
    const utilityRetained = Math.max(58, 100 - selected.reduce((sum, item) => sum + item.utilityCost, 0))

    return {
      ...activePlan,
      after: {
        ...activePlan.after,
        risk: riskAfter,
        classification: riskAfter <= 35 ? 'Corporate' : riskAfter <= 62 ? 'Restricted' : 'Highly Restricted',
        usage: riskAfter <= 62 ? 'Conditional' : 'Blocked',
      },
      riskReduction: Math.round(((activePlan.before.risk - riskAfter) / activePlan.before.risk) * 100),
      utilityRetained,
    } satisfies RemediationPlan
  }, [activePlan, selectedIds, transformations])

  if (datasetQuery.isLoading || transformationsQuery.isLoading || plansQuery.isLoading) {
    return <MakeSafeSkeleton />
  }

  if (datasetQuery.isError || transformationsQuery.isError || plansQuery.isError) {
    return (
      <InlineError
        action={
          <Button
            variant="secondary"
            onClick={() => {
              void datasetQuery.refetch()
              void transformationsQuery.refetch()
              void plansQuery.refetch()
            }}
          >
            Retry classification
          </Button>
        }
      />
    )
  }

  if (!datasetQuery.data || !activePlan || !impact) {
    return (
      <EmptyState
        title="No remediation plan available"
        description="The dataset profile is available, but no privacy-safe plan has been generated yet."
      />
    )
  }

  const dataset = datasetQuery.data

  if (approved && passportQuery.data) {
    return (
      <>
        <section className="success-state">
          <StatusBadge tone="green">Safe version approved</StatusBadge>
          <h1>Safe version approved</h1>
          <p>The dataset is approved for external processing under the listed privacy conditions.</p>
          <div className="approval-grid">
            <KeyValue label="Data Passport reference" value={passportQuery.data.reference} mono />
            <KeyValue label="Original classification" value={<ClassificationBadge value={passportQuery.data.originalClassification} />} />
            <KeyValue label="Approved classification" value={<ClassificationBadge value={passportQuery.data.approvedClassification} />} />
            <KeyValue label="Approved use" value={passportQuery.data.intendedUse} />
            <KeyValue label="Reviewer" value={passportQuery.data.reviewer} />
            <KeyValue label="Timestamp" value={passportQuery.data.approvalTimestamp} mono />
          </div>
          <div className="section-actions">
            <Button variant="secondary" onClick={() => showToast('Safe CSV export prepared.')}>
              <Download size={16} /> Export Safe CSV
            </Button>
            <Button onClick={() => setPassportOpen(true)}>
              <FileText size={16} /> View Data Passport
            </Button>
          </div>
        </section>
        <DataPassportSheet open={passportOpen} onClose={() => setPassportOpen(false)} />
      </>
    )
  }

  return (
    <div className="make-safe-page">
      <SectionHeader
        eyebrow="Make it Safe"
        title={dataset.name}
        description="Recommend the minimum privacy transformations required for the intended use."
      />
      <StepIndicator step={step} />

      {step === 1 ? (
        <Panel className="make-safe-step">
          <h2>How do you want to use this dataset?</h2>
          <div className="selection-list">
            {intendedUses.map((option) => (
              <button
                key={option.id}
                className={intendedUse === option.id ? 'select-row selected' : 'select-row'}
                onClick={() => {
                  setIntendedUse(option.id)
                  setAssessment(null)
                }}
              >
                <strong>{option.title}</strong>
                <span>{option.description}</span>
              </button>
            ))}
          </div>

          {intendedUse === 'External processing' ? (
            <div className="conditional-questions">
              <label>
                Who will access it?
                <select value={access} onChange={(event) => setAccess(event.target.value)}>
                  <option>Approved external processor</option>
                  <option>Unapproved third party</option>
                  <option>Regulator</option>
                </select>
              </label>
              <label>
                Where will it be processed?
                <select value={processingLocation} onChange={(event) => setProcessingLocation(event.target.value)}>
                  <option>Controlled external environment</option>
                  <option>Partner cloud environment</option>
                  <option>Public workspace</option>
                </select>
              </label>
            </div>
          ) : null}

          <div className="section-actions">
            <Button onClick={() => usageMutation.mutate()} disabled={usageMutation.isPending}>
              Check usage
            </Button>
          </div>

          {assessment ? (
            <div className="assessment-result">
              <StatusBadge tone="red">{assessment.status}</StatusBadge>
              <h3>Currently blocked</h3>
              <p>{assessment.description}</p>
              <ul>
                {assessment.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
              <div className="citation-row">
                {assessment.citations.map((citation) => (
                  <button key={`${citation.name}-${citation.section}`} className="text-link" onClick={() => openPolicy(citation)}>
                    {citation.name} {citation.section}
                  </button>
                ))}
              </div>
              <Button onClick={() => setStep(2)}>Generate privacy plan</Button>
            </div>
          ) : null}
        </Panel>
      ) : null}

      {step === 2 ? (
        <Panel className="make-safe-step">
          <div className="compact-heading">
            <div>
              <h2>Recommended privacy plan</h2>
              <p>A balanced plan reduces identifiability while preserving useful analysis.</p>
            </div>
          </div>
          <div className="plan-tabs">
            {presetOrder.map((presetKey) => {
              const plan = plans?.[presetKey]
              return (
                <button
                  key={presetKey}
                  className={preset === presetKey ? 'plan-tab selected' : 'plan-tab'}
                  onClick={() => {
                    setPreset(presetKey)
                    setSelectedTransformations(plans?.[presetKey]?.transformationIds ?? [])
                    setCustomising(false)
                  }}
                >
                  <strong>{plan?.title}</strong>
                  <span>{plan?.description}</span>
                </button>
              )
            })}
          </div>

          <div className="safe-plan-grid">
            <section>
              <div className="compact-heading">
                <h3>Selected transformations</h3>
                <Button variant="secondary" onClick={() => setCustomising(!customising)}>
                  <SlidersHorizontal size={16} /> Customize plan
                </Button>
              </div>
              <TransformationList
                transformations={transformations}
                selectedTransformations={selectedIds}
                setSelectedTransformations={(ids) => setSelectedTransformations(ids)}
                customising={customising}
              />
            </section>

            <section className="impact-panel">
              <h3>Impact</h3>
              <div className="before-after">
                <div>
                  <span>Before</span>
                  <ClassificationBadge value={impact.before.classification} />
                  <strong>Exposure {impact.before.risk}</strong>
                  <UsageBadge value={impact.before.usage} />
                </div>
                <div>
                  <span>After</span>
                  <ClassificationBadge value={impact.after.classification} />
                  <strong>Exposure {impact.after.risk}</strong>
                  <UsageBadge value={impact.after.usage} />
                </div>
              </div>
              <div className="impact-indicators">
                <KeyValue label="Exposure reduction" value={`${impact.riskReduction}%`} />
                <KeyValue label="Data utility retained" value={`${impact.utilityRetained}%`} />
              </div>
              <ProgressBar value={impact.riskReduction} label="Exposure reduction" />
              <div className="remaining-conditions">
                <strong>Remaining conditions</strong>
                {impact.remainingConditions.map((condition) => (
                  <StatusBadge key={condition} tone="teal">
                    {condition}
                  </StatusBadge>
                ))}
              </div>
              <Button onClick={() => setPreviewOpen(true)}>
                <Eye size={16} /> Preview privacy-safe version
              </Button>
            </section>
          </div>
        </Panel>
      ) : null}

      {step === 3 ? (
        <Panel className="make-safe-step review-step">
          <h2>Review privacy-safe version</h2>
          <div className="review-summary-grid">
            <KeyValue label="Requested use" value="External processing" />
            <KeyValue label="Approved processor" value={access} />
            <KeyValue label="Proposed result" value={<ClassificationBadge value={impact.after.classification} />} />
            <KeyValue label="Usage" value={<UsageBadge value="Conditionally allowed" />} />
          </div>
          <section className="drawer-section">
            <h3>Transformations</h3>
            <ul className="plain-list">
              <li>protected account reference removed</li>
              <li>client name pseudonymised</li>
              <li>email masked</li>
            </ul>
          </section>
          <section className="drawer-section">
            <h3>Remaining conditions</h3>
            <div className="condition-row">
              {impact.remainingConditions.map((condition) => (
                <StatusBadge key={condition} tone="teal">
                  {condition}
                </StatusBadge>
              ))}
            </div>
          </section>
          <label className="review-note">
            Reviewer note
            <textarea value={reviewerNote} onChange={(event) => setReviewerNote(event.target.value)} />
          </label>
          <div className="section-actions">
            <Button onClick={() => reviewMutation.mutate()} disabled={reviewMutation.isPending}>
              <CheckCircle2 size={16} /> Approve privacy-safe version
            </Button>
            <button type="button" className="text-link" onClick={() => showToast('Change request recorded.')}>
              Request changes
            </button>
          </div>
        </Panel>
      ) : null}

      <SafePreviewDrawer
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        rows={previewQuery.data ?? []}
        safeOnly={safeOnly}
        setSafeOnly={setSafeOnly}
        onUsePlan={() => {
          setPreviewOpen(false)
          setStep(3)
        }}
      />
    </div>
  )
}

function TransformationList({
  transformations,
  selectedTransformations,
  setSelectedTransformations,
  customising,
}: {
  transformations: Transformation[]
  selectedTransformations: string[]
  setSelectedTransformations: (ids: string[]) => void
  customising: boolean
}) {
  const visible = customising
    ? transformations
    : transformations.filter((transformation) => selectedTransformations.includes(transformation.id))

  return (
    <div className="transformation-list">
      {visible.map((transformation) => {
        const selected = selectedTransformations.includes(transformation.id)

        return (
          <label key={transformation.id} className={selected ? 'transformation-row selected' : 'transformation-row'}>
            {customising ? (
              <input
                type="checkbox"
                checked={selected}
                onChange={(event) => {
                  setSelectedTransformations(
                    event.target.checked
                      ? [...selectedTransformations, transformation.id]
                      : selectedTransformations.filter((id) => id !== transformation.id),
                  )
                }}
              />
            ) : null}
            <span>
              <strong>{transformation.title}</strong>
              <small>{transformation.description}</small>
            </span>
          </label>
        )
      })}
    </div>
  )
}

function SafePreviewDrawer({
  open,
  onClose,
  rows,
  safeOnly,
  setSafeOnly,
  onUsePlan,
}: {
  open: boolean
  onClose: () => void
  rows: PreviewRow[]
  safeOnly: boolean
  setSafeOnly: (value: boolean) => void
  onUsePlan: () => void
}) {
  return (
    <Drawer open={open} title="Privacy-safe preview" onClose={onClose} wide>
      <div className="preview-drawer">
        <p className="muted">Displayed data is synthetic or masked. Raw sensitive values are not shown to AI systems.</p>
        <div className="preview-toggles">
          <label>
            <input type="checkbox" checked={!safeOnly} onChange={(event) => setSafeOnly(!event.target.checked)} />
            Side-by-side
          </label>
          <label>
            <input type="checkbox" checked={safeOnly} onChange={(event) => setSafeOnly(event.target.checked)} />
            Privacy-safe only
          </label>
        </div>
        <div className="preview-table-wrap">
          <table className="preview-table">
            <thead>
              <tr>
                <th>Client name</th>
                <th>Email</th>
                <th>Account</th>
                <th>Portfolio value</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <PreviewCell value={row.clientName} safeOnly={safeOnly} />
                  <PreviewCell value={row.clientEmail} safeOnly={safeOnly} />
                  <PreviewCell value={row.accountNumber} safeOnly={safeOnly} />
                  <PreviewCell value={row.portfolioValue} safeOnly={safeOnly} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="capability-grid">
          <div>
            <h3>Preserved</h3>
            <ul>
              <li>aggregate trend analysis</li>
              <li>stable client grouping</li>
              <li>email-domain statistics</li>
            </ul>
          </div>
          <div>
            <h3>Removed</h3>
            <ul>
              <li>direct client identification</li>
              <li>account-level reconciliation</li>
            </ul>
          </div>
        </div>
        <Button onClick={onUsePlan}>Use this plan</Button>
      </div>
    </Drawer>
  )
}

function PreviewCell({
  value,
  safeOnly,
}: {
  value: {
    original: string
    transformed: string
  }
  safeOnly: boolean
}) {
  return (
    <td>
      {!safeOnly ? <span className="preview-original">{value.original}</span> : null}
      <strong>{value.transformed}</strong>
    </td>
  )
}

function DataPassportSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { showToast } = useApp()
  const { data } = useQuery({
    queryKey: ['passport'],
    queryFn: cacheFlowApi.getPassport,
  })

  return (
    <Drawer open={open} title="Data Passport" onClose={onClose}>
      {data ? (
        <div className="passport-sheet">
          <StatusBadge tone="green">{data.reference}</StatusBadge>
          <div className="drawer-summary-grid">
            <KeyValue label="Dataset" value={data.dataset} mono />
            <KeyValue label="Original classification" value={<ClassificationBadge value={data.originalClassification} />} />
            <KeyValue label="Approved classification" value={<ClassificationBadge value={data.approvedClassification} />} />
            <KeyValue label="Intended use" value={data.intendedUse} />
            <KeyValue label="Reviewer" value={data.reviewer} />
            <KeyValue label="Approval timestamp" value={data.approvalTimestamp} mono />
          </div>
          <section className="drawer-section">
            <h3>Transformations</h3>
            <ul className="plain-list">
              {data.transformations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
          <section className="drawer-section">
            <h3>Policy citations</h3>
            <div className="citation-row">
              {data.policyCitations.map((citation) => (
                <StatusBadge key={citation} tone="violet">
                  {citation}
                </StatusBadge>
              ))}
            </div>
          </section>
          <ol className="timeline">
            {data.auditTimeline.map((item) => (
              <li key={item.id}>
                <span />
                <div>
                  <strong>{item.label}</strong>
                  <small>
                    {item.timestamp} / {item.actor}
                  </small>
                </div>
              </li>
            ))}
          </ol>
          <div className="section-actions">
            <Button variant="secondary" onClick={() => showToast('Passport JSON export prepared.')}>
              <FileJson size={16} /> Export JSON
            </Button>
            <Button onClick={() => showToast('Passport PDF export prepared.')}>
              <FileText size={16} /> Export PDF
            </Button>
          </div>
        </div>
      ) : null}
    </Drawer>
  )
}

function MakeSafeSkeleton() {
  return (
    <div className="make-safe-page">
      <Skeleton className="skeleton-title" />
      <Skeleton className="skeleton-line" />
      <Skeleton className="skeleton-panel" />
    </div>
  )
}
