import { useNavigate } from 'react-router-dom'
import { Plus, ScanLine } from 'lucide-react'
import { Button } from '@/components/common'
import { useStartScan } from '@/hooks'
import { toast } from '@/stores/toastStore'

export function Topbar() {
  const navigate = useNavigate()
  const startScan = useStartScan()

  const runScan = () => {
    startScan.mutate(
      { sourceId: 'src-uploads' },
      {
        onSuccess: (res) => {
          toast.info('Scan started')
          navigate(`/scan/${res.scanId}`)
        },
        onError: () => toast.error('Could not start the scan. Try again.'),
      },
    )
  }

  return (
    <header className="topbar">
      <div>
        <span className="eyebrow">Workspace</span>
        <strong>LSEG Governance / Data Office</strong>
      </div>
      <div className="topbar-actions">
        <Button variant="secondary" onClick={() => navigate('/sources/new')}>
          <Plus size={16} /> Add Data Source
        </Button>
        <Button onClick={runScan} disabled={startScan.isPending}>
          <ScanLine size={16} /> {startScan.isPending ? 'Starting…' : 'Run Scan'}
        </Button>
      </div>
    </header>
  )
}
