import { createContext, useContext } from 'react'
import type { PolicyReference } from '../types'

export interface Toast {
  id: number
  message: string
  actionLabel?: string
  onAction?: () => void
}

export interface AppContextValue {
  addSourceOpen: boolean
  classifierRuleOpen: boolean
  classifierRuleVersion: number
  scanOpen: boolean
  policy: PolicyReference | null
  toasts: Toast[]
  openAddSource: () => void
  closeAddSource: () => void
  openClassifierRule: () => void
  closeClassifierRule: () => void
  markClassifierRuleCreated: () => void
  startScanPanel: () => void
  closeScanPanel: () => void
  openPolicy: (policy: PolicyReference) => void
  closePolicy: () => void
  showToast: (message: string, options?: { actionLabel?: string; onAction?: () => void }) => void
  dismissToast: (id: number) => void
}

export const AppContext = createContext<AppContextValue | null>(null)

export function useApp() {
  const context = useContext(AppContext)

  if (!context) {
    throw new Error('useApp must be used inside AppProvider')
  }

  return context
}
