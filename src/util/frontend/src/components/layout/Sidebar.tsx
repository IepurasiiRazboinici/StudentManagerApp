import { NavLink } from 'react-router-dom'
import {
  ClipboardList,
  Database,
  FileText,
  History,
  LayoutDashboard,
  Library,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
} from 'lucide-react'
import { isMockApi } from '@/api'
import { useDashboardStats } from '@/hooks'
import { useUiStore } from '@/stores/uiStore'
import { cn } from '@/utils/cn'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/sources', label: 'Data Sources', icon: Database },
  { to: '/datasets', label: 'Data Catalogue', icon: Library },
  { to: '/reviews', label: 'Review Queue', icon: ClipboardList },
  { to: '/rules', label: 'Classification Rules', icon: ShieldCheck },
  { to: '/policies', label: 'Policies', icon: FileText },
  { to: '/audit', label: 'Audit Trail', icon: History },
] as const

export function Sidebar() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  const toggle = useUiStore((s) => s.toggleSidebar)
  const { data } = useDashboardStats()

  return (
    <aside className={cn('sidebar', collapsed && 'sidebar-collapsed')} aria-label="Primary navigation">
      <div className="sidebar-top">
        <div className="wordmark">
          <span aria-hidden>CF</span>
          {!collapsed ? <strong>Cache Flow</strong> : null}
        </div>
        <button
          type="button"
          className="icon-button sidebar-toggle"
          onClick={toggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {NAV.map((item) => {
          const Icon = item.icon
          const showBadge = item.to === '/reviews' && data?.awaitingReview
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => cn('nav-link', isActive && 'active')}
              title={item.label}
            >
              <Icon size={17} aria-hidden />
              {!collapsed ? <span>{item.label}</span> : null}
              {showBadge ? <em>{data?.awaitingReview}</em> : null}
            </NavLink>
          )
        })}
      </nav>

      <div className="sidebar-footer">
        <span className={cn('badge', isMockApi() ? 'badge-blue' : 'badge-green')}>
          {isMockApi() ? 'Demo Mode' : 'Live API'}
        </span>
        {!collapsed ? (
          <>
            <div className="workspace-line">
              <span className="eyebrow">Workspace</span>
              <strong>LSEG Governance</strong>
            </div>
            <div className="user-chip">
              <span className="avatar" aria-hidden>
                DV
              </span>
              <span className="user-meta">
                <strong>Data Vance</strong>
                <small>Data Steward</small>
              </span>
            </div>
          </>
        ) : (
          <span className="avatar" aria-hidden>
            DV
          </span>
        )}
      </div>
    </aside>
  )
}
