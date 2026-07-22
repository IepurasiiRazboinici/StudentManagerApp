/**
 * Base API client.
 *
 * A single place that decides whether a request is served by the in-memory mock
 * API or the real backend. UI code and hooks never branch on this — they call
 * the typed `*Api` modules, which call `request()`.
 *
 * Switching to the real backend requires only setting `VITE_USE_MOCK_API=false`
 * (and a reachable `VITE_API_BASE_URL`). No component changes are needed.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false'

export function isMockApi(): boolean {
  return USE_MOCK_API
}

export function apiBaseUrl(): string {
  return API_BASE_URL
}

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })

export interface RequestConfig<T> {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT'
  body?: unknown
  /** Mock resolver used when `VITE_USE_MOCK_API` is not `false`. */
  mock: () => T | Promise<T>
  /** Simulated latency for the mock path (ms). */
  delay?: number
}

/**
 * Perform a typed request. In mock mode the `mock` resolver is used; otherwise a
 * real `fetch` against `${VITE_API_BASE_URL}${path}` is issued.
 */
export async function request<T>(path: string, config: RequestConfig<T>): Promise<T> {
  if (isMockApi()) {
    await wait(config.delay ?? 260)
    return config.mock()
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: config.method ?? 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: config.body === undefined ? undefined : JSON.stringify(config.body),
  })

  if (!response.ok) {
    throw new ApiError(`Request to ${path} failed`, response.status)
  }

  // 204 No Content
  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
