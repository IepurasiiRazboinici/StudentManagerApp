import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import type { PolicyReference } from '../types'
import { AppContext, type AppContextValue, type Toast } from './appContextValue'

export function AppProvider({ children }: { children: ReactNode }) {
  const [addSourceOpen, setAddSourceOpen] = useState(false)
  const [classifierRuleOpen, setClassifierRuleOpen] = useState(false)
  const [classifierRuleVersion, setClassifierRuleVersion] = useState(0)
  const [scanOpen, setScanOpen] = useState(false)
  const [policy, setPolicy] = useState<PolicyReference | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const toastIdRef = useRef(0)

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback<AppContextValue['showToast']>(
    (message, options) => {
      toastIdRef.current += 1
      const id = toastIdRef.current
      setToasts((current) => [
        ...current.slice(-2),
        {
          id,
          message,
          actionLabel: options?.actionLabel,
          onAction: options?.onAction,
        },
      ])
      window.setTimeout(() => dismissToast(id), 5200)
    },
    [dismissToast],
  )

  const value = useMemo<AppContextValue>(
    () => ({
      addSourceOpen,
      classifierRuleOpen,
      classifierRuleVersion,
      scanOpen,
      policy,
      toasts,
      openAddSource: () => setAddSourceOpen(true),
      closeAddSource: () => setAddSourceOpen(false),
      openClassifierRule: () => setClassifierRuleOpen(true),
      closeClassifierRule: () => setClassifierRuleOpen(false),
      markClassifierRuleCreated: () => setClassifierRuleVersion((current) => current + 1),
      startScanPanel: () => setScanOpen(true),
      closeScanPanel: () => setScanOpen(false),
      openPolicy: setPolicy,
      closePolicy: () => setPolicy(null),
      showToast,
      dismissToast,
    }),
    [addSourceOpen, classifierRuleOpen, classifierRuleVersion, dismissToast, policy, scanOpen, showToast, toasts],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
