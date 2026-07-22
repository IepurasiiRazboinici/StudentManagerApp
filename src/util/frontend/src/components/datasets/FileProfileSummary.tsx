import { FileText } from 'lucide-react'
import type { UploadedFile } from '@/types'
import { KeyValue, StatusBadge } from '@/components/common'
import { formatBytes, formatNumber } from '@/utils/format'

export function FileProfileSummary({ file }: { file: UploadedFile }) {
  return (
    <div className="file-profile">
      <div className="file-profile-head">
        <FileText size={18} aria-hidden />
        <span className="mono">{file.filename}</span>
        <StatusBadge tone={file.uploadStatus === 'PROFILED' || file.uploadStatus === 'READY' ? 'green' : 'amber'}>
          {file.uploadStatus}
        </StatusBadge>
      </div>
      <div className="key-value-grid">
        <KeyValue label="File type" value={file.fileType} />
        <KeyValue label="File size" value={formatBytes(file.sizeBytes)} />
        <KeyValue label="Estimated rows" value={formatNumber(file.estimatedRows)} />
        <KeyValue label="Detected fields" value={file.detectedFields.length} />
      </div>
      <div className="drawer-section">
        <span className="eyebrow">Detected fields</span>
        <div className="rule-pills">
          {file.detectedFields.map((field) => (
            <span key={field} className="badge badge-neutral mono">
              {field}
            </span>
          ))}
        </div>
      </div>
      {file.explicitMarkers.length > 0 ? (
        <div className="drawer-section">
          <span className="eyebrow">Explicit markers</span>
          <div className="rule-pills">
            {file.explicitMarkers.map((m) => (
              <span key={m.id} className="badge badge-violet">
                {m.marker}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
