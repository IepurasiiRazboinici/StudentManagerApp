import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { DatabaseZap, LayoutDashboard, ListChecks, Plus, SearchCheck, ShieldPlus } from 'lucide-react'
import { cacheFlowApi } from '../api/services/cacheFlow'
import { isDemoMode } from '../api/client'
import { useApp } from './appContextValue'
import { AddClassifierRuleModal, AddSourceModal, PolicySheet, ScanProgressPanel, ToastHost } from '../components/overlays'
import { Button, StatusBadge } from '../components/ui'

const navItems = [
  { to: '/overview', label: 'Overview', icon: LayoutDashboard },
  { to: '/data', label: 'Data Explorer', icon: DatabaseZap },
  { to: '/review', label: 'Review Center', icon: ListChecks },
]

export function AppShell() {
  const location = useLocation()
  const makeSafeActive = location.pathname.includes('/make-safe')
  const { openAddSource, openClassifierRule, startScanPanel } = useApp()
  const { data } = useQuery({
    queryKey: ['overview'],
    queryFn: cacheFlowApi.getOverview,
  })

  return (
    <div className={makeSafeActive ? 'app-shell app-shell-safe' : 'app-shell'}>
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="wordmark">
          <span>CF</span>
          <strong>Cache Flow</strong>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon

            return (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                <Icon size={17} />
                <span>{item.label}</span>
                {item.to === '/review' && data?.awaitingReview ? <em>{data.awaitingReview}</em> : null}
              </NavLink>
            )
          })}
        </nav>
        <div className="sidebar-footer">
          <StatusBadge tone="blue">{isDemoMode() ? 'Demo Mode' : 'Live API'}</StatusBadge>
          <span>Enterprise Governance</span>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div>
            <span className="eyebrow">Workspace</span>
            <strong>Northstar Capital / Data Office</strong>
          </div>
          <div className="topbar-actions">
            <Button variant="secondary" onClick={openAddSource}>
              <Plus size={16} /> Add Source
            </Button>
            <Button variant="secondary" onClick={openClassifierRule}>
              <ShieldPlus size={16} /> Add Rule
            </Button>
            <Button onClick={startScanPanel}>
              <SearchCheck size={16} /> Run Scan
            </Button>
          </div>
        </header>

        <main className="page">
          <Outlet />
        </main>
      </div>

      <AddSourceModal />
      <AddClassifierRuleModal />
      <ScanProgressPanel />
      <PolicySheet />
      <ToastHost />
    </div>
  )
}
