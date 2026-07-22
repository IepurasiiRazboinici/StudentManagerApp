import { EmptyState } from '@/components/common'

export function NotFound() {
  return (
    <div className="page-stack">
      <EmptyState title="Page not found" description="The page you were looking for does not exist." />
    </div>
  )
}
