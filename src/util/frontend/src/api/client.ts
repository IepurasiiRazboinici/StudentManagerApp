const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? ''
const demoMode = import.meta.env.VITE_DEMO_MODE !== 'false'

type RequestOptions<T> = RequestInit & {
  fallback: T
}

const wait = (ms = 180) => new Promise((resolve) => window.setTimeout(resolve, ms))

export const isDemoMode = () => demoMode || !apiBaseUrl

export async function request<T>(path: string, options: RequestOptions<T>): Promise<T> {
  if (isDemoMode()) {
    await wait()
    return options.fallback
  }

  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      throw new Error(`Request failed with ${response.status}`)
    }

    return (await response.json()) as T
  } catch (error) {
    console.info('Using demo fallback because the live API is unavailable.', error)
    await wait(120)
    return options.fallback
  }
}
