/* eslint-disable react-refresh/only-export-components -- test helpers, not app modules */
import type { ReactElement, ReactNode } from 'react'
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  })
}

function Providers({ children }: { children: ReactNode }) {
  const client = createTestQueryClient()
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

/** Render a component at a route so useParams / useSearchParams resolve. */
export function renderRoute(
  element: ReactElement,
  { path = '/', initialEntries = ['/'] }: { path?: string; initialEntries?: string[] } = {},
) {
  return render(
    <Providers>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path={path} element={element} />
        </Routes>
      </MemoryRouter>
    </Providers>,
  )
}

/** Render a component with providers and a plain MemoryRouter. */
export function renderWithProviders(ui: ReactElement, initialEntries: string[] = ['/']) {
  return render(
    <Providers>
      <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
    </Providers>,
  )
}
