import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  CheckCircle2,
  Database,
  FileText,
  FileUp,
  Maximize2,
  Minimize2,
  ShieldPlus,
  ShieldCheck,
  Upload,
} from 'lucide-react'
import { cacheFlowApi } from '../api/services/cacheFlow'
import { useApp } from '../app/appContextValue'
import { Button, Drawer, IconButton, Modal, ProgressBar, StatusBadge, TabButton } from './ui'

const postgresSchema = z.object({
  connectionName: z.string().min(2, 'Use a recognizable connection name.'),
  host: z.string().min(2, 'Host is required.'),
  port: z.coerce.number().int().min(1).max(65535),
  database: z.string().min(1, 'Database is required.'),
  username: z.string().min(1, 'Username is required.'),
  password: z.string().min(1, 'Password is required.'),
})

const classifierRuleSchema = z.object({
  name: z.string().min(3, 'Give the rule a clear name.'),
  signal: z.string().min(3, 'Describe the detector signal.'),
  targetField: z.string().min(2, 'Add the field or pattern to watch.'),
  classification: z.enum(['Public', 'Corporate', 'Restricted', 'Highly Restricted', 'Unknown']),
  sensitivity: z.enum(['Critical', 'High', 'Medium', 'Low']),
  action: z.enum(['Flag for review', 'Auto classify', 'Require policy match']),
  description: z.string().min(8, 'Add a short privacy reason.'),
})

type SourceMode = 'upload' | 'postgres' | 'policy'
type PostgresFormValues = z.input<typeof postgresSchema>
type PostgresForm = z.output<typeof postgresSchema>
type ClassifierRuleForm = z.infer<typeof classifierRuleSchema>

const sourceOptions: Array<{
  mode: SourceMode
  icon: typeof FileUp
  title: string
  description: string
}> = [
  {
    mode: 'upload',
    icon: FileUp,
    title: 'Upload data',
    description: 'CSV, JSON or TXT',
  },
  {
    mode: 'postgres',
    icon: Database,
    title: 'Connect PostgreSQL',
    description: 'Discover schemas, tables and fields',
  },
  {
    mode: 'policy',
    icon: ShieldCheck,
    title: 'Add governance policy',
    description: 'TXT or Markdown guidance',
  },
]

function isValidFile(file: File | null, mode: SourceMode) {
  if (!file) {
    return false
  }

  const validData = ['csv', 'json', 'txt']
  const validPolicy = ['txt', 'md', 'markdown']
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''

  return mode === 'policy' ? validPolicy.includes(extension) : validData.includes(extension)
}

export function AddSourceModal() {
  const {
    addSourceOpen,
    classifierRuleVersion,
    closeAddSource,
    openClassifierRule,
    startScanPanel,
    showToast,
  } = useApp()
  const [mode, setMode] = useState<SourceMode>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [policyFile, setPolicyFile] = useState<File | null>(null)
  const [connectionTested, setConnectionTested] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PostgresFormValues, unknown, PostgresForm>({
    resolver: zodResolver(postgresSchema),
    defaultValues: {
      connectionName: 'Privacy Warehouse',
      host: 'warehouse.internal',
      port: 5432,
      database: 'risk',
      username: 'governance_reader',
      password: 'demo-password',
    },
  })

  const selectedFile = mode === 'policy' ? policyFile : file
  const validSelectedFile = isValidFile(selectedFile, mode)

  const addAndScan = async () => {
    if (!validSelectedFile) {
      showToast(mode === 'policy' ? 'Add a TXT or Markdown policy document.' : 'Add a CSV, JSON or TXT file.')
      return
    }

    setSubmitting(true)
    await cacheFlowApi.addSource({ mode, fileName: selectedFile?.name })
    setSubmitting(false)
    closeAddSource()

    if (mode === 'policy') {
      showToast('Policy added — 1 document queued for matching.')
    } else {
      startScanPanel()
    }
  }

  const onPostgresSubmit = async (values: PostgresForm) => {
    setSubmitting(true)
    await cacheFlowApi.addSource(values)
    setSubmitting(false)
    closeAddSource()
    startScanPanel()
  }

  return (
    <Modal open={addSourceOpen} title="Add Source" onClose={closeAddSource}>
      <div className="source-modal">
        <div className="source-options" role="tablist" aria-label="Source type">
          {sourceOptions.map((option) => {
            const Icon = option.icon

            return (
              <button
                key={option.mode}
                type="button"
                className={mode === option.mode ? 'source-option source-option-active' : 'source-option'}
                onClick={() => setMode(option.mode)}
              >
                <Icon size={18} />
                <span>
                  <strong>{option.title}</strong>
                  <small>{option.description}</small>
                </span>
              </button>
            )
          })}
        </div>

        {mode === 'upload' ? (
          <div className="source-flow">
            <FileDropZone file={file} mode={mode} onFile={setFile} />
            {validSelectedFile ? (
              <div className="upload-rule-step">
                <div>
                  <strong>Optional classifier rule for this file</strong>
                  <p>
                    Add a deterministic rule before classification if this file has a field or pattern that must be
                    protected.
                  </p>
                </div>
                <Button variant="secondary" type="button" onClick={openClassifierRule}>
                  <ShieldPlus size={16} /> Add new rule
                </Button>
                {classifierRuleVersion > 0 ? (
                  <StatusBadge tone="teal">Custom rule queued for next scan</StatusBadge>
                ) : null}
              </div>
            ) : null}
            <Button onClick={addAndScan} disabled={submitting}>
              <Upload size={16} /> Add and classify
            </Button>
          </div>
        ) : null}

        {mode === 'postgres' ? (
          <form className="source-form" onSubmit={handleSubmit(onPostgresSubmit)}>
            <label>
              Connection name
              <input {...register('connectionName')} />
              {errors.connectionName ? <small>{errors.connectionName.message}</small> : null}
            </label>
            <div className="form-grid">
              <label>
                Host
                <input {...register('host')} />
                {errors.host ? <small>{errors.host.message}</small> : null}
              </label>
              <label>
                Port
                <input type="number" {...register('port')} />
                {errors.port ? <small>{errors.port.message}</small> : null}
              </label>
            </div>
            <label>
              Database
              <input {...register('database')} />
              {errors.database ? <small>{errors.database.message}</small> : null}
            </label>
            <div className="form-grid">
              <label>
                Username
                <input {...register('username')} />
                {errors.username ? <small>{errors.username.message}</small> : null}
              </label>
              <label>
                Password
                <input type="password" {...register('password')} />
                {errors.password ? <small>{errors.password.message}</small> : null}
              </label>
            </div>
            <div className="form-actions">
              <Button type="button" variant="secondary" onClick={() => setConnectionTested(true)}>
                Test Connection
              </Button>
              <Button type="submit" disabled={submitting}>
                Add and Scan
              </Button>
            </div>
            {connectionTested ? (
              <div className="connection-success">
                <CheckCircle2 size={18} />
                <div>
                  <strong>Connection verified</strong>
                  <p>Discovered 3 schemas, 11 tables and 86 fields.</p>
                </div>
              </div>
            ) : null}
          </form>
        ) : null}

        {mode === 'policy' ? (
          <div className="source-flow">
            <FileDropZone file={policyFile} mode={mode} onFile={setPolicyFile} />
            {policyFile ? (
              <div className="ingestion-state">
                <FileText size={16} />
                <span>{policyFile.name} ready for ingestion</span>
              </div>
            ) : null}
            <Button onClick={addAndScan} disabled={submitting}>
              Add Policy
            </Button>
          </div>
        ) : null}
      </div>
    </Modal>
  )
}

export function AddClassifierRuleModal() {
  const { classifierRuleOpen, closeClassifierRule, markClassifierRuleCreated, showToast } = useApp()
  const [submitting, setSubmitting] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClassifierRuleForm>({
    resolver: zodResolver(classifierRuleSchema),
    defaultValues: {
      name: 'Personal data in free text',
      signal: 'Names, email markers or phone-like values',
      targetField: 'feedback_text',
      classification: 'Restricted',
      sensitivity: 'Medium',
      action: 'Flag for review',
      description: 'Routes unstructured text to privacy review before the dataset can be shared.',
    },
  })

  const onSubmit = async (values: ClassifierRuleForm) => {
    setSubmitting(true)
    await cacheFlowApi.createClassifierRule({ ...values, status: 'Draft' })
    setSubmitting(false)
    markClassifierRuleCreated()
    showToast('Classifier rule added — it will run on the next scan.')
    closeClassifierRule()
    reset(values)
  }

  return (
    <Modal open={classifierRuleOpen} title="Add classifier rule" onClose={closeClassifierRule}>
      <form className="classifier-rule-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="rule-intro">
          <ShieldPlus size={20} />
          <div>
            <strong>Protect personal data earlier in the scan.</strong>
            <p>Rules are deterministic guardrails that run before policy matching and review.</p>
          </div>
        </div>
        <label>
          Rule name
          <input {...register('name')} />
          {errors.name ? <small>{errors.name.message}</small> : null}
        </label>
        <label>
          Detector signal
          <input {...register('signal')} />
          {errors.signal ? <small>{errors.signal.message}</small> : null}
        </label>
        <div className="form-grid">
          <label>
            Field or pattern
            <input {...register('targetField')} />
            {errors.targetField ? <small>{errors.targetField.message}</small> : null}
          </label>
          <label>
            Sensitivity
            <select {...register('sensitivity')}>
              <option>Critical</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </label>
        </div>
        <div className="form-grid">
          <label>
            Classification
            <select {...register('classification')}>
              <option>Highly Restricted</option>
              <option>Restricted</option>
              <option>Corporate</option>
              <option>Public</option>
              <option>Unknown</option>
            </select>
          </label>
          <label>
            Action
            <select {...register('action')}>
              <option>Flag for review</option>
              <option>Auto classify</option>
              <option>Require policy match</option>
            </select>
          </label>
        </div>
        <label>
          Privacy reason
          <textarea {...register('description')} />
          {errors.description ? <small>{errors.description.message}</small> : null}
        </label>
        <div className="rule-note">
          Example: if `feedback_text` contains personal contact markers, classify as Restricted and request review
          before external processing.
        </div>
        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={closeClassifierRule}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            Add rule
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function FileDropZone({
  file,
  mode,
  onFile,
}: {
  file: File | null
  mode: SourceMode
  onFile: (file: File | null) => void
}) {
  const valid = isValidFile(file, mode)

  return (
    <label
      className="file-drop"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault()
        onFile(event.dataTransfer.files.item(0))
      }}
    >
      <Upload size={22} />
      <span>{mode === 'policy' ? 'Drop a policy document' : 'Drop a dataset file'}</span>
      <small>{mode === 'policy' ? 'TXT or Markdown' : 'CSV, JSON or TXT'}</small>
      <input
        type="file"
        accept={mode === 'policy' ? '.txt,.md,.markdown' : '.csv,.json,.txt'}
        onChange={(event) => onFile(event.target.files?.item(0) ?? null)}
      />
      {file ? (
        <div className={valid ? 'selected-file' : 'selected-file selected-file-error'}>
          <strong>{file.name}</strong>
          <span>{valid ? `${Math.ceil(file.size / 1024)} KB selected` : 'Unsupported file type'}</span>
        </div>
      ) : null}
    </label>
  )
}

export function ScanProgressPanel() {
  const { scanOpen } = useApp()

  if (!scanOpen) {
    return null
  }

  return <ScanProgressPanelContent />
}

function ScanProgressPanelContent() {
  const { closeScanPanel, showToast } = useApp()
  const [minimised, setMinimised] = useState(false)
  const [progress, setProgress] = useState(8)

  useEffect(() => {
    const interval = window.setInterval(() => {
      setProgress((current) => {
        const next = Math.min(current + 11, 100)
        if (next === 100 && current !== 100) {
          window.setTimeout(
            () =>
              showToast('Scan complete — 4 datasets classified, 2 require review and 1 policy gap was detected.'),
            150,
          )
        }
        return next
      })
    }, 650)

    return () => window.clearInterval(interval)
  }, [showToast])

  const stages = useMemo(
    () => [
      { label: 'Discovering structure', threshold: 15 },
      { label: 'Profiling data', threshold: 35 },
      { label: 'Applying classifier rules', threshold: 50 },
      { label: 'Detecting sensitive patterns', threshold: 66 },
      { label: 'Matching governance policies', threshold: 84 },
      { label: 'Generating classifications', threshold: 100 },
    ],
    [],
  )

  return (
    <aside className={minimised ? 'scan-panel scan-panel-min' : 'scan-panel'} aria-label="Scan progress">
      <div className="scan-header">
        <div>
          <strong>{progress === 100 ? 'Scan complete' : 'Scan running'}</strong>
          <span>{progress === 100 ? 'client_positions classified' : 'Processing client_positions'}</span>
        </div>
        <div className="scan-controls">
          <IconButton label={minimised ? 'Expand scan panel' : 'Minimise scan panel'} onClick={() => setMinimised(!minimised)}>
            {minimised ? <Maximize2 size={15} /> : <Minimize2 size={15} />}
          </IconButton>
          <IconButton label="Close scan panel" onClick={closeScanPanel}>
            <CheckCircle2 size={15} />
          </IconButton>
        </div>
      </div>
      <ProgressBar value={progress} label={`${progress}%`} />
      {!minimised ? (
        <>
          <ul className="scan-stages">
            {stages.map((stage, index) => {
              const complete = progress >= stage.threshold
              const active = !complete && (index === 0 || progress >= stages[index - 1].threshold)

              return (
                <li key={stage.label} className={complete ? 'complete' : active ? 'active' : undefined}>
                  <span />
                  {stage.label}
                </li>
              )
            })}
          </ul>
          <div className="privacy-notes">
            <span>Rows profiled locally</span>
            <span>Representative samples analysed</span>
            <span>Sensitive values masked before AI analysis</span>
          </div>
        </>
      ) : null}
    </aside>
  )
}

export function PolicySheet() {
  const { policy, closePolicy } = useApp()

  return (
    <Drawer open={Boolean(policy)} title={policy ? `${policy.name} ${policy.section}` : 'Policy'} onClose={closePolicy}>
      {policy ? (
        <div className="policy-sheet">
          <StatusBadge tone={policy.name === 'Policy gap' ? 'neutral' : 'violet'} dashed={policy.name === 'Policy gap'}>
            Governance policy
          </StatusBadge>
          <h3>{policy.title}</h3>
          <p className="muted">Document version: 2026.4</p>
          <p className="muted">Ingested: 2026-07-22 08:30</p>
          <blockquote>{policy.excerpt}</blockquote>
          <div className="policy-facts">
            <div>
              <strong>7</strong>
              <span>classifications using this section</span>
            </div>
            <div>
              <strong>2</strong>
              <span>affected datasets require review</span>
            </div>
          </div>
          <button className="text-link" type="button">
            View affected datasets
          </button>
        </div>
      ) : null}
    </Drawer>
  )
}

export function ToastHost() {
  const { toasts, dismissToast } = useApp()

  return (
    <div className="toast-host" aria-live="polite">
      {toasts.map((toast) => (
        <div className="toast" key={toast.id}>
          <span>{toast.message}</span>
          {toast.actionLabel ? (
            <button
              type="button"
              onClick={() => {
                toast.onAction?.()
                dismissToast(toast.id)
              }}
            >
              {toast.actionLabel}
            </button>
          ) : null}
        </div>
      ))}
    </div>
  )
}

export function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="step-indicator" aria-label={`Step ${step} of 3`}>
      {(['Intended Use', 'Safe Plan', 'Review'] as const).map((label, index) => (
        <TabButton key={label} active={step === index + 1} tabIndex={-1}>
          <span>{index + 1}</span>
          {label}
        </TabButton>
      ))}
    </div>
  )
}
