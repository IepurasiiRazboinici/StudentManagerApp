import { useRef, useState } from 'react'
import { UploadCloud } from 'lucide-react'
import type { FileType } from '@/types'
import { cn } from '@/utils/cn'

const EXT_TO_TYPE: Record<string, FileType> = {
  csv: 'CSV',
  json: 'JSON',
  txt: 'TXT',
  md: 'MARKDOWN',
  markdown: 'MARKDOWN',
  xlsx: 'XLSX',
}

export interface AcceptedFile {
  filename: string
  fileType: FileType
  sizeBytes: number
}

/**
 * Drag-and-drop / browse upload. The frontend only reads the file's name, type
 * and size to send to the backend — it never parses the contents.
 */
export function UploadDropzone({ onAccepted }: { onAccepted: (file: AcceptedFile) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handle = (file: File | null | undefined) => {
    if (!file) return
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    const fileType = EXT_TO_TYPE[ext]
    if (!fileType) {
      setError('Unsupported file type. Use CSV, JSON, TXT, Markdown or XLSX.')
      return
    }
    setError(null)
    onAccepted({ filename: file.name, fileType, sizeBytes: file.size })
  }

  return (
    <div>
      <div
        className={cn('file-drop', dragging && 'file-drop-active')}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          handle(e.dataTransfer.files.item(0))
        }}
      >
        <UploadCloud size={24} aria-hidden />
        <span>Drag and drop a dataset file</span>
        <small>CSV, JSON, TXT, Markdown or XLSX — contents are not read in the browser</small>
        <button type="button" className="button button-secondary button-sm" onClick={() => inputRef.current?.click()}>
          Browse files
        </button>
        <input
          ref={inputRef}
          type="file"
          className="visually-hidden"
          accept=".csv,.json,.txt,.md,.markdown,.xlsx"
          onChange={(e) => handle(e.target.files?.item(0))}
        />
      </div>
      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : null}
      <p className="muted upload-hint">Files are sent to the protected backend profiling service. Only metadata and masked samples are returned.</p>
    </div>
  )
}
