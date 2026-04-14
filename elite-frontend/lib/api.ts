export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? (process.env.NODE_ENV === 'production' ? 'https://api.ethiohijra.com' : 'http://127.0.0.1:8000')

export const AUTH_STORAGE_KEY = 'hijra_auth'
const GET_CACHE_PREFIX = 'hijra_get_cache_v1:'
const memoryGetCache = new Map<string, CacheEntry>()
const inFlightGetRequests = new Map<string, Promise<any>>()

type CacheEntry = {
  timestamp: number
  data: any
}

export type AuthPayload = {
  access_token: string
  token_type?: string
  expires_in?: number
}

export function saveAuth(auth: AuthPayload) {
  if (typeof window === 'undefined') return
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth))
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(AUTH_STORAGE_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as AuthPayload
    return parsed.access_token ?? null
  } catch {
    return null
  }
}

export function clearAuth() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(AUTH_STORAGE_KEY)
}

function getCacheStorage() {
  if (typeof window === 'undefined') return null
  return localStorage
}

function buildGetCacheKey(path: string, useAuth: boolean) {
  const token = useAuth ? (getAccessToken() ?? '') : ''
  const tokenSuffix = token ? token.slice(-12) : 'public'
  return `${GET_CACHE_PREFIX}${tokenSuffix}:${path}`
}

function readGetCache<T>(path: string, useAuth: boolean, ttlMs: number): T | null {
  const key = buildGetCacheKey(path, useAuth)
  const mem = memoryGetCache.get(key)
  if (mem?.timestamp && Date.now() - mem.timestamp <= ttlMs) {
    return mem.data as T
  }

  const storage = getCacheStorage()
  if (!storage) return null

  try {
    const raw = storage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CacheEntry
    if (!parsed?.timestamp || Date.now() - parsed.timestamp > ttlMs) return null
    memoryGetCache.set(key, parsed)
    return parsed.data as T
  } catch {
    return null
  }
}

function writeGetCache(path: string, useAuth: boolean, data: any) {
  const storage = getCacheStorage()
  const key = buildGetCacheKey(path, useAuth)
  const entry: CacheEntry = { timestamp: Date.now(), data }
  memoryGetCache.set(key, entry)
  if (!storage) return

  try {
    storage.setItem(key, JSON.stringify(entry))
  } catch {
    // ignore cache write errors
  }
}

function clearAllGetCache() {
  const storage = getCacheStorage()
  memoryGetCache.clear()
  inFlightGetRequests.clear()
  if (!storage) return

  try {
    const keysToRemove: string[] = []
    for (let i = 0; i < storage.length; i += 1) {
      const key = storage.key(i)
      if (key && key.startsWith(GET_CACHE_PREFIX)) {
        keysToRemove.push(key)
      }
    }
    for (const key of keysToRemove) {
      storage.removeItem(key)
    }
  } catch {
    // ignore cache clear errors
  }
}

function isReadRequest(method?: string) {
  const normalized = (method ?? 'GET').toUpperCase()
  return normalized === 'GET' || normalized === 'HEAD'
}

async function cachedGet<T>(path: string, ttlMs: number, useAuth = false): Promise<T> {
  const key = buildGetCacheKey(path, useAuth)
  const cached = readGetCache<T>(path, useAuth, ttlMs)

  if (cached !== null) {
    // Serve instantly from cache and refresh in background.
    if (!inFlightGetRequests.has(key)) {
      const refreshPromise = apiRequest<T>(path, {}, useAuth)
        .then((fresh) => {
          writeGetCache(path, useAuth, fresh)
          return fresh
        })
        .catch(() => cached)
        .finally(() => {
          inFlightGetRequests.delete(key)
        })
      inFlightGetRequests.set(key, refreshPromise)
    }
    return cached
  }

  const existing = inFlightGetRequests.get(key)
  if (existing) {
    return existing as Promise<T>
  }

  const requestPromise = apiRequest<T>(path, {}, useAuth)
    .then((fresh) => {
      writeGetCache(path, useAuth, fresh)
      return fresh
    })
    .finally(() => {
      inFlightGetRequests.delete(key)
    })

  inFlightGetRequests.set(key, requestPromise)
  return requestPromise
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  useAuth = false
): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase()
  const headers = new Headers(options.headers)
  // Ensure the server returns JSON error responses for API requests
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json')
  }

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  if (useAuth) {
    const token = getAccessToken()
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    })
  } catch (fetchErr: any) {
    throw new Error(fetchErr?.message ?? 'Network request failed')
  }

  let data: any = {}
  try {
    data = await response.json()
  } catch {
    data = {}
  }

  if (response.status === 401 && useAuth) {
    clearAuth()
    if (typeof window !== 'undefined') {
      window.location.href = '/Login'
    }
    throw new Error('Unauthorized')
  }

  if (!response.ok) {
    const message = (data as { message?: string }).message ?? 'Request failed'
    throw new Error(message)
  }

  if (!isReadRequest(method)) {
    clearAllGetCache()
  }

  return data as T
}

// High-level API wrappers
export const Auth = {
  login: (payload: any) => apiRequest('/api/login', { method: 'POST', body: JSON.stringify(payload) }),
  register: (payload: any) => apiRequest('/api/register', { method: 'POST', body: JSON.stringify(payload) }),
  registerPartner: (formData: FormData) => apiRequest('/api/partner/register', { method: 'POST', body: formData }),
  refresh: () => apiRequest('/api/refresh', { method: 'POST' }),
  logout: () => apiRequest('/api/logout', { method: 'POST' }, true),
  me: () => cachedGet('/api/me', 15 * 1000, true),
}

export const Jobs = {
  list: async () => {
    const res = await cachedGet<any>('/api/jobs', 60 * 1000)
    return (res && (res.data ?? res)) as any[]
  },
  show: (id: string | number) => cachedGet(`/api/jobs/${id}`, 60 * 1000),
  apply: (jobId: string | number, payload: any) => apiRequest(`/api/jobs/${jobId}/apply`, { method: 'POST', body: JSON.stringify(payload) }, true),
  partnerCreate: (form: any) => apiRequest('/api/partner/jobs', { method: 'POST', body: JSON.stringify(form) }, true),
  partnerUpdate: (id: string | number, form: any) => apiRequest(`/api/partner/jobs/${id}`, { method: 'PATCH', body: JSON.stringify(form) }, true),
  adminCreate: (form: any) => apiRequest('/api/admin/jobs', { method: 'POST', body: JSON.stringify(form) }, true),
  adminUpdate: (id: string | number, form: any) => apiRequest(`/api/admin/jobs/${id}`, { method: 'PATCH', body: JSON.stringify(form) }, true),
  adminPublish: (id: string | number) => apiRequest(`/api/admin/jobs/${id}/publish`, { method: 'PATCH' }, true),
  adminClose: (id: string | number) => apiRequest(`/api/admin/jobs/${id}/close`, { method: 'PATCH' }, true),
}

export const Profile = {
  get: () => cachedGet('/api/profile', 20 * 1000, true),
  update: (payload: any) => apiRequest('/api/profile', { method: 'PUT', body: JSON.stringify(payload) }, true),
}

export const Documents = {
  upload: (formData: FormData) => apiRequest('/api/documents/upload', { method: 'POST', body: formData }, true),
  update: (id: number | string, payload: any) => apiRequest(`/api/documents/${id}`, { method: 'PUT', body: JSON.stringify(payload) }, true),
  destroy: (id: number | string) => apiRequest(`/api/documents/${id}`, { method: 'DELETE' }, true),
}

export const Applications = {
  myApplications: () => cachedGet('/api/my-applications', 20 * 1000, true),
  respond: (id: string | number, payload: any) => apiRequest(`/api/applications/${id}/respond`, { method: 'POST', body: JSON.stringify(payload) }, true),
}

export const Admin = {
  stats: () => cachedGet('/api/admin/stats', 20 * 1000, true),
  roles: () => cachedGet('/api/admin/roles', 20 * 1000, true),
  users: () => cachedGet('/api/admin/users', 20 * 1000, true),
  adminApplications: () => cachedGet('/api/admin/applications', 20 * 1000, true),
  updateApplicationStatus: (id: string | number, payload: any) => apiRequest(`/api/admin/applications/${id}/status`, { method: 'PATCH', body: JSON.stringify(payload) }, true),
  documents: () => cachedGet('/api/admin/documents', 20 * 1000, true),
  updateDocumentStatus: (id: string | number, payload: any) => apiRequest(`/api/admin/documents/${id}/status`, { method: 'PATCH', body: JSON.stringify(payload) }, true),
  services: () => cachedGet('/api/admin/services', 30 * 1000, true),
  createService: (payload: any) => apiRequest('/api/admin/services', { method: 'POST', body: JSON.stringify(payload) }, true),
  updateService: (id: string | number, payload: any) => apiRequest(`/api/admin/services/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }, true),
  deleteService: (id: string | number) => apiRequest(`/api/admin/services/${id}`, { method: 'DELETE' }, true),
  policies: () => cachedGet('/api/admin/policies', 30 * 1000, true),
  createPolicy: (payload: any) => apiRequest('/api/admin/policies', { method: 'POST', body: JSON.stringify(payload) }, true),
  updatePolicy: (id: string | number, payload: any) => apiRequest(`/api/admin/policies/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }, true),
  deletePolicy: (id: string | number) => apiRequest(`/api/admin/policies/${id}`, { method: 'DELETE' }, true),
}

export const Partner = {
  shortlisted: () => cachedGet('/api/partner/applications/shortlisted', 15 * 1000, true),
  action: (id: string | number, payload: any) => apiRequest(`/api/partner/applications/${id}/action`, { method: 'PATCH', body: JSON.stringify(payload) }, true),
}

export const Services = {
  list: () => cachedGet('/api/services', 60 * 1000),
}

export const HomePage = {
  get: () => cachedGet('/api/homepage', 60 * 1000),
}

export const AboutPage = {
  get: () => cachedGet('/api/about-page', 60 * 1000),
}

export const Policies = {
  list: () => cachedGet('/api/policies', 60 * 1000),
  getByType: (type: string) => cachedGet(`/api/policies/${type}`, 60 * 1000),
}

export const Faqs = {
  list: () => cachedGet('/api/faqs', 60 * 1000),
  ask: (payload: any) => apiRequest('/api/faqs', { method: 'POST', body: JSON.stringify(payload) }),
}

export const Messages = {
  my: () => cachedGet('/api/my-contacts', 15 * 1000, true),
  reply: (contactId: string | number, payload: any) =>
    apiRequest(`/api/my-contacts/${contactId}/reply`, { method: 'POST', body: JSON.stringify(payload) }, true),
  delete: (contactId: string | number) =>
    apiRequest(`/api/my-contacts/${contactId}`, { method: 'DELETE' }, true),
}

// Download helper for binary endpoints (document download, agency license)
export async function downloadFile(path: string, useAuth = true) {
  const headers = new Headers()
  if (useAuth) {
    const token = getAccessToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }

  const res = await fetch(`${API_BASE_URL}${path}`, { headers })
  if (!res.ok) throw new Error('Failed to download file')
  const blob = await res.blob()
  const disposition = res.headers.get('Content-Disposition') || ''
  return { blob, disposition }
}
