import type { MaskedPreviewRow } from '@/types'
import { cn } from '@/utils/cn'

export function MaskedPreviewTable({ rows }: { rows: MaskedPreviewRow[] }) {
  if (rows.length === 0) {
    return <p className="muted">No preview rows returned.</p>
  }
  const columns = rows[0].cells.map((c) => c.field)

  return (
    <div className="table-wrap">
      <table className="data-table masked-preview">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c} className="mono">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {row.cells.map((cell) => (
                <td key={cell.field} className={cn('mono', cell.changed && 'cell-changed')}>
                  {cell.changed ? (
                    <span className="cell-transform">
                      <span className="cell-original">{cell.original}</span>
                      <span className="cell-arrow" aria-hidden>
                        →
                      </span>
                      <span className="cell-new">{cell.transformed}</span>
                    </span>
                  ) : (
                    cell.transformed
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="masked-note muted">Only masked or synthetic values returned by the backend are shown. Raw values never reach the browser.</p>
    </div>
  )
}
