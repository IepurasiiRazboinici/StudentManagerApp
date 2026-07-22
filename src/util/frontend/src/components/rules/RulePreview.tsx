import { ArrowRight, CircleCheck, CircleSlash } from 'lucide-react'
import type { RulePreviewResult } from '@/types'
import { TierBadge, ConfidenceIndicator, Skeleton } from '@/components/common'

export function RulePreview({
  result,
  isLoading,
  isError,
  onRetry,
}: {
  result: RulePreviewResult | undefined
  isLoading: boolean
  isError: boolean
  onRetry: () => void
}) {
  if (isLoading) {
    return (
      <div className="rule-preview" data-testid="rule-preview-loading">
        <span className="eyebrow">Rule match preview</span>
        <Skeleton className="skeleton-line" />
        <Skeleton className="skeleton-line" />
        <Skeleton className="skeleton-panel" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rule-preview inline-error" role="alert" data-testid="rule-preview-error">
        <p>The rule preview could not be generated.</p>
        <button type="button" className="text-link" onClick={onRetry}>
          Try again
        </button>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="rule-preview rule-preview-empty">
        <span className="eyebrow">Rule match preview</span>
        <p className="muted">
          Preview the rule to see how the backend would classify the current dataset. The result comes from the
          backend — nothing is computed in the browser.
        </p>
      </div>
    )
  }

  return (
    <div className="rule-preview" data-testid="rule-preview-result">
      <div className="rule-preview-head">
        <span className="eyebrow">Rule match preview</span>
        <span className={result.matches ? 'match-flag match-yes' : 'match-flag match-no'}>
          {result.matches ? <CircleCheck size={14} /> : <CircleSlash size={14} />}
          {result.matches ? 'Rule matches' : 'No match'}
        </span>
      </div>

      {result.matchedFields.length > 0 ? (
        <div className="preview-block">
          <span className="preview-label">Matched fields</span>
          <div className="rule-pills">
            {result.matchedFields.map((f) => (
              <span key={f} className="badge badge-neutral mono">
                {f}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="before-after preview-compare">
        <div className="preview-original">
          <span className="preview-label">Current result</span>
          <TierBadge tier={result.currentClassification} />
          <ConfidenceIndicator value={result.currentConfidence} size="sm" />
        </div>
        <ArrowRight size={18} className="preview-arrow" aria-hidden />
        <div className="preview-proposed">
          <span className="preview-label">Predicted result</span>
          <TierBadge tier={result.predictedClassification} />
          <ConfidenceIndicator value={result.predictedConfidence} size="sm" />
        </div>
      </div>

      <dl className="preview-facts-list">
        <div>
          <dt>Human review</dt>
          <dd>{result.requiresHumanReview ? 'Required' : 'Not required'}</dd>
        </div>
        <div>
          <dt>Explanation</dt>
          <dd>{result.explanation}</dd>
        </div>
      </dl>
      <p className="preview-note muted">This result is returned by the backend, not derived locally.</p>
    </div>
  )
}
