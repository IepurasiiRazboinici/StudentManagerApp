import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { Toaster } from '@/components/common'
import { AddRuleDrawer } from '@/components/rules/AddRuleDrawer'
import { RuleDetailsDrawer } from '@/components/rules/RuleDetailsDrawer'
import { EvidenceDrawer } from '@/components/classification/EvidenceDrawer'
import { PolicySideSheet } from '@/components/policies/PolicySideSheet'
import { useUiStore } from '@/stores/uiStore'
import { cn } from '@/utils/cn'

export function AppShell() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  return (
    <div className={cn('app-shell', collapsed && 'app-shell-collapsed')}>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <Sidebar />
      <div className="workspace">
        <Topbar />
        <main className="page" id="main-content">
          <Outlet />
        </main>
      </div>

      {/* Global overlays driven by the UI store */}
      <AddRuleDrawer />
      <RuleDetailsDrawer />
      <EvidenceDrawer />
      <PolicySideSheet />
      <Toaster />
    </div>
  )
}
