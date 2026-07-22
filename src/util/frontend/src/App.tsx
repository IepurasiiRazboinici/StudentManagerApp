import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { lazy, Suspense } from 'react'
import type { ReactNode } from 'react'
import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom'
import { AppProvider } from './app/AppContext'
import { AppShell } from './app/AppShell'
import './App.css'

const OverviewPage = lazy(() =>
  import('./features/overview/OverviewPage').then((module) => ({ default: module.OverviewPage })),
)
const DataExplorerPage = lazy(() =>
  import('./features/data-explorer/DataExplorerPage').then((module) => ({ default: module.DataExplorerPage })),
)
const MakeSafePage = lazy(() =>
  import('./features/make-safe/MakeSafePage').then((module) => ({ default: module.MakeSafePage })),
)
const ReviewCenterPage = lazy(() =>
  import('./features/review/ReviewCenterPage').then((module) => ({ default: module.ReviewCenterPage })),
)

function RouteFallback() {
  return (
    <div className="route-fallback">
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-line" />
      <div className="skeleton skeleton-panel" />
    </div>
  )
}

function withSuspense(element: ReactNode) {
  return <Suspense fallback={<RouteFallback />}>{element}</Suspense>
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
    },
  },
})

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/overview" replace /> },
      { path: 'overview', element: withSuspense(<OverviewPage />) },
      { path: 'data', element: withSuspense(<DataExplorerPage />) },
      { path: 'review', element: withSuspense(<ReviewCenterPage />) },
      { path: 'data/:datasetId/make-safe', element: withSuspense(<MakeSafePage />) },
    ],
  },
])

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <RouterProvider router={router} />
      </AppProvider>
    </QueryClientProvider>
  )
}

export default App
