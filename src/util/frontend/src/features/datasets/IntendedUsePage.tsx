import { Link, useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { SlidersHorizontal } from 'lucide-react'
import type { IntendedUsePurpose, UsageCheckRequest } from '@/types'
import { useCheckIntendedUse, useDatasetDetails } from '@/hooks'
import { useUiStore } from '@/stores/uiStore'
import { Button, PageHeader, Panel, UsageStatusBadge } from '@/components/common'
import { INTENDED_USE_LABEL } from '@/utils/labels'

const PURPOSES: IntendedUsePurpose[] = [
  'INTERNAL_ANALYTICS',
  'SHARE_INTERNAL_TEAM',
  'SHARE_EXTERNAL_PARTNER',
  'AI_MODEL_TRAINING',
  'PUBLIC_EXPORT',
  'TESTING',
]

export function IntendedUsePage() {
  const { datasetId } = useParams()
  const navigate = useNavigate()
  const { data: dataset } = useDatasetDetails(datasetId)
  const check = useCheckIntendedUse(datasetId ?? '')
  const openPolicy = useUiStore((s) => s.openPolicy)

  const { register, handleSubmit } = useForm<UsageCheckRequest>({
    defaultValues: {
      purpose: 'SHARE_EXTERNAL_PARTNER',
      consumerType: 'External partner',
      destinationRegion: 'EU',
      businessPurpose: '',
      retentionPeriod: '90 days',
    },
  })

  const onSubmit = handleSubmit((values) => check.mutate(values))
  const result = check.data

  return (
    <div className="page-stack">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/datasets">Data Catalogue</Link>
        <span aria-hidden>/</span>
        {dataset ? <Link to={`/datasets/${dataset.id}`} className="mono">{dataset.name}</Link> : null}
        <span aria-hidden>/</span>
        <span>Intended use</span>
      </nav>

      <PageHeader title="What do you want to do with this dataset?" description="The backend decides whether the intended use is allowed." />

      <div className="intended-use-grid">
        <Panel>
          <form className="stack" onSubmit={onSubmit}>
            <label className="cf-field">
              <span className="cf-label">Intended use</span>
              <select className="cf-input" {...register('purpose')}>
                {PURPOSES.map((p) => (
                  <option key={p} value={p}>
                    {INTENDED_USE_LABEL[p]}
                  </option>
                ))}
              </select>
            </label>
            <div className="form-grid">
              <label className="cf-field">
                <span className="cf-label">Consumer type</span>
                <input className="cf-input" {...register('consumerType')} />
              </label>
              <label className="cf-field">
                <span className="cf-label">Destination region</span>
                <input className="cf-input" {...register('destinationRegion')} />
              </label>
            </div>
            <label className="cf-field">
              <span className="cf-label">Business purpose</span>
              <textarea className="cf-input" {...register('businessPurpose')} placeholder="Describe why this data is needed." />
            </label>
            <label className="cf-field">
              <span className="cf-label">Retention period</span>
              <input className="cf-input" {...register('retentionPeriod')} />
            </label>
            <Button type="submit" disabled={check.isPending}>
              {check.isPending ? 'Checking…' : 'Check intended use'}
            </Button>
          </form>
        </Panel>

        <Panel className="usage-result-panel">
          {check.isPending ? (
            <p className="muted">Checking with the backend…</p>
          ) : check.isError ? (
            <div className="inline-error" role="alert">
              <p>The usage check failed. Try again.</p>
            </div>
          ) : result ? (
            <div className="usage-result">
              <UsageStatusBadge status={result.status} />
              <p className="usage-summary">{result.summary}</p>
              {result.reasons.length > 0 ? (
                <div className="drawer-section">
                  <span className="eyebrow">Reasons</span>
                  <ul className="plain-list">
                    {result.reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {result.conditions.length > 0 ? (
                <div className="drawer-section">
                  <span className="eyebrow">Conditions</span>
                  <ul className="plain-list">
                    {result.conditions.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {result.policyReferences.length > 0 ? (
                <div className="drawer-section">
                  <span className="eyebrow">Policy references</span>
                  <div className="rule-pills">
                    {result.policyReferences.map((p) => (
                      <button key={p.policyId} type="button" className="badge badge-violet policy-chip" onClick={() => openPolicy(p.policyId)}>
                        {p.code} {p.section}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              {result.canBeMadeSafe ? (
                <Button variant="secondary" onClick={() => navigate(`/datasets/${datasetId}/make-safe`)}>
                  <SlidersHorizontal size={15} /> Make it Safe
                </Button>
              ) : null}
            </div>
          ) : (
            <p className="muted">Submit the form to see whether this use is allowed, conditionally allowed, blocked, or needs review.</p>
          )}
        </Panel>
      </div>
    </div>
  )
}
