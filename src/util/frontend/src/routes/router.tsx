import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { NotFound } from './NotFound'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { SourcesPage } from '@/features/sources/SourcesPage'
import { NewSourcePage } from '@/features/sources/NewSourcePage'
import { FileConfigurePage } from '@/features/sources/FileConfigurePage'
import { ScanProgressPage } from '@/features/scans/ScanProgressPage'
import { CataloguePage } from '@/features/datasets/CataloguePage'
import { DatasetDetailsPage } from '@/features/datasets/DatasetDetailsPage'
import { IntendedUsePage } from '@/features/datasets/IntendedUsePage'
import { MakeSafePage } from '@/features/datasets/MakeSafePage'
import { ReviewQueuePage } from '@/features/reviews/ReviewQueuePage'
import { RulesPage } from '@/features/rules/RulesPage'
import { PoliciesPage } from '@/features/policies/PoliciesPage'
import { AuditTrailPage } from '@/features/audit/AuditTrailPage'
import { DataPassportPage } from '@/features/data-passport/DataPassportPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'sources', element: <SourcesPage /> },
      { path: 'sources/new', element: <NewSourcePage /> },
      { path: 'sources/file/:fileId/configure', element: <FileConfigurePage /> },
      { path: 'scan/:scanId', element: <ScanProgressPage /> },
      { path: 'datasets', element: <CataloguePage /> },
      { path: 'datasets/:datasetId', element: <DatasetDetailsPage /> },
      { path: 'datasets/:datasetId/intended-use', element: <IntendedUsePage /> },
      { path: 'datasets/:datasetId/make-safe', element: <MakeSafePage /> },
      { path: 'reviews', element: <ReviewQueuePage /> },
      { path: 'rules', element: <RulesPage /> },
      { path: 'policies', element: <PoliciesPage /> },
      { path: 'audit', element: <AuditTrailPage /> },
      { path: 'data-passport/:datasetId', element: <DataPassportPage /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])
