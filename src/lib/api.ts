const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

export const SESION_STORAGE_KEY = 'goram_clinic_sesion'

export interface ApiErrorBody {
  timestamp: string
  status: number
  error: string
  message: string
  path: string
}

export class ApiRequestError extends Error {
  status: number
  body?: ApiErrorBody

  constructor(status: number, body?: ApiErrorBody) {
    super(body?.message ?? `Error HTTP ${status}`)
    this.status = status
    this.body = body
  }
}

function getToken(): string | null {
  const raw = localStorage.getItem(SESION_STORAGE_KEY)
  if (!raw) return null
  try {
    return (JSON.parse(raw) as { token?: string }).token ?? null
  } catch {
    return null
  }
}

interface ApiFetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  /** false para endpoints publicos (registro, login) */
  auth?: boolean
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (auth) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    let apiError: ApiErrorBody | undefined
    try {
      apiError = await response.json()
    } catch {
      // respuesta sin cuerpo JSON (p.ej. 403 sin autenticacion de Spring Security)
    }

    if (response.status === 401) {
      window.dispatchEvent(new CustomEvent('goram:unauthorized'))
    }

    throw new ApiRequestError(response.status, apiError)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
