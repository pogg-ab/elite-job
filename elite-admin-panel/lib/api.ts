export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? (process.env.NODE_ENV === 'production' ? 'https://api.eliteemplyment.com' : 'http://127.0.0.1:8000')

export const ADMIN_AUTH_STORAGE_KEY = 'Elite_admin_auth'
const GET_CACHE_PREFIX = 'Elite_admin_get_cache_v1:'
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

export function saveAdminAuth(auth: AuthPayload) {
  if (typeof window === 'undefined') return
  localStorage.setItem(ADMIN_AUTH_STORAGE_KEY, JSON.stringify(auth))
}

export function clearAdminAuth() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY)
}

export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(ADMIN_AUTH_STORAGE_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as AuthPayload
    return parsed.access_token ?? null
  } catch {
    return null
  }
}

function getCacheStorage() {
  if (typeof window === 'undefined') return null
  return localStorage
}

function buildGetCacheKey(path: string, useAuth: boolean) {
  const token = useAuth ? (getAdminToken() ?? '') : ''
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

async function cachedGet<T>(path: string, ttlMs: number, useAuth = true): Promise<T> {
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
  useAuth = true
): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase()
  const headers = new Headers(options.headers)

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  if (useAuth) {
    const token = getAdminToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  const data = await response.json().catch(() => ({}))

  if (response.status === 401 && useAuth) {
    clearAdminAuth()
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

// Admin high-level wrappers
export const Auth = {
  login: (payload: any) => apiRequest('/api/login', { method: 'POST', body: JSON.stringify(payload) }, false),
  logout: () => apiRequest('/api/logout', { method: 'POST' }, true),
  me: () => cachedGet('/api/me', 15 * 1000, true),
}

export const AdminApi: any = {
  stats: () => cachedGet('/api/admin/stats', 20 * 1000, true),
  roles: () => cachedGet('/api/admin/roles', 20 * 1000, true),
  users: (query = '') => cachedGet(`/api/admin/users${query}`, 20 * 1000, true),
  updateUser: (id: string | number, payload: any) => apiRequest(`/api/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }, true),
  approveCandidate: (id: string | number) => apiRequest(`/api/admin/users/${id}/approve-candidate`, { method: 'PATCH' }, true),
  deleteUser: (id: string | number) => apiRequest(`/api/admin/users/${id}`, { method: 'DELETE' }, true),
  adminJobs: () => cachedGet('/api/admin/jobs', 20 * 1000, true),
  createJob: (form: any) => apiRequest('/api/admin/jobs', { method: 'POST', body: JSON.stringify(form) }, true),
  updateJob: (id: string | number, form: any) => apiRequest(`/api/admin/jobs/${id}`, { method: 'PATCH', body: JSON.stringify(form) }, true),
  publishJob: (id: string | number) => apiRequest(`/api/admin/jobs/${id}/publish`, { method: 'PATCH' }, true),
  closeJob: (id: string | number) => apiRequest(`/api/admin/jobs/${id}/close`, { method: 'PATCH' }, true),

  applications: () => cachedGet('/api/admin/applications', 20 * 1000, true),
  updateApplicationStatus: (id: string | number, payload: any) => apiRequest(`/api/admin/applications/${id}/status`, { method: 'PATCH', body: JSON.stringify(payload) }, true),

  documents: () => cachedGet('/api/admin/documents', 20 * 1000, true),
  updateDocumentStatus: (id: string | number, payload: any) => apiRequest(`/api/admin/documents/${id}/status`, { method: 'PATCH', body: JSON.stringify(payload) }, true),
  downloadDocument: async (id: string | number) => {
    const token = getAdminToken()
    const headers = new Headers()
    if (token) headers.set('Authorization', `Bearer ${token}`)
    const res = await fetch(`${API_BASE_URL}/api/admin/documents/${id}/download`, { headers })
    if (!res.ok) throw new Error('Failed to download document')
    const blob = await res.blob()
    return { blob, disposition: res.headers.get('Content-Disposition') || '' }
  },
}

// Services management for admin panel
AdminApi.services = () => cachedGet('/api/admin/services', 30 * 1000, true)
AdminApi.createService = (payload: any) => apiRequest('/api/admin/services', { method: 'POST', body: JSON.stringify(payload) }, true)
AdminApi.updateService = (id: string | number, payload: any) => apiRequest(`/api/admin/services/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }, true)
AdminApi.deleteService = (id: string | number) => apiRequest(`/api/admin/services/${id}`, { method: 'DELETE' }, true)
// Policies management for admin panel
AdminApi.policies = () => cachedGet('/api/admin/policies', 30 * 1000, true)
AdminApi.createPolicy = (payload: any) => apiRequest('/api/admin/policies', { method: 'POST', body: JSON.stringify(payload) }, true)
// Accept FormData for file uploads
AdminApi.createPolicyForm = (form: FormData) => apiRequest('/api/admin/policies', { method: 'POST', body: form }, true)
AdminApi.updatePolicy = (id: string | number, payload: any) => apiRequest(`/api/admin/policies/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }, true)
AdminApi.deletePolicy = (id: string | number) => apiRequest(`/api/admin/policies/${id}`, { method: 'DELETE' }, true)
// Accept FormData for policy update with file
AdminApi.updatePolicyForm = (id: string | number, form: FormData) => apiRequest(`/api/admin/policies/${id}`, { method: 'PATCH', body: form }, true)

// Contacts / Messages
AdminApi.contacts = () => cachedGet('/api/admin/contacts', 15 * 1000, true)
AdminApi.getContact = (id: string | number) => cachedGet(`/api/admin/contacts/${id}`, 15 * 1000, true)
AdminApi.markContactRead = (id: string | number) => apiRequest(`/api/admin/contacts/${id}/read`, { method: 'PATCH' }, true)
AdminApi.markContactResolved = (id: string | number, resolved = true) => apiRequest(`/api/admin/contacts/${id}/resolve`, { method: 'PATCH', body: JSON.stringify({ resolved }) }, true)
AdminApi.replyContact = (id: string | number, payload: any) => apiRequest(`/api/admin/contacts/${id}/reply`, { method: 'POST', body: JSON.stringify(payload) }, true)
AdminApi.deleteContact = (id: string | number) => apiRequest(`/api/admin/contacts/${id}`, { method: 'DELETE' }, true)

// FAQs (admin)
AdminApi.faqs = () => cachedGet('/api/admin/faqs', 30 * 1000, true)
AdminApi.createFaq = (payload: any) => apiRequest('/api/admin/faqs', { method: 'POST', body: JSON.stringify(payload) }, true)
AdminApi.updateFaq = (id: string | number, payload: any) => apiRequest(`/api/admin/faqs/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }, true)
AdminApi.deleteFaq = (id: string | number) => apiRequest(`/api/admin/faqs/${id}`, { method: 'DELETE' }, true)

// Homepage content management (admin)
AdminApi.homepageSections = () => cachedGet('/api/admin/homepage/sections', 30 * 1000, true)
AdminApi.updateHomepageSection = (key: string, payload: any) =>
  apiRequest(`/api/admin/homepage/sections/${key}`, { method: 'PUT', body: JSON.stringify(payload) }, true)

AdminApi.homepageCountries = () => cachedGet('/api/admin/homepage/countries', 30 * 1000, true)
AdminApi.createHomepageCountry = (payload: any) =>
  apiRequest('/api/admin/homepage/countries', { method: 'POST', body: JSON.stringify(payload) }, true)
AdminApi.updateHomepageCountry = (id: string | number, payload: any) =>
  apiRequest(`/api/admin/homepage/countries/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }, true)
AdminApi.deleteHomepageCountry = (id: string | number) =>
  apiRequest(`/api/admin/homepage/countries/${id}`, { method: 'DELETE' }, true)

AdminApi.homepageTestimonials = () => cachedGet('/api/admin/homepage/testimonials', 30 * 1000, true)
AdminApi.createHomepageTestimonial = (payload: any) =>
  apiRequest('/api/admin/homepage/testimonials', { method: 'POST', body: JSON.stringify(payload) }, true)
AdminApi.updateHomepageTestimonial = (id: string | number, payload: any) =>
  apiRequest(`/api/admin/homepage/testimonials/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }, true)
AdminApi.deleteHomepageTestimonial = (id: string | number) =>
  apiRequest(`/api/admin/homepage/testimonials/${id}`, { method: 'DELETE' }, true)

// About page content management (admin)
// Employer requests (admin)
AdminApi.employerRequests = (query = '') => cachedGet(`/api/admin/employer-requests${query}`, 20 * 1000, true)
AdminApi.getEmployerRequest = (id: string | number) => cachedGet(`/api/admin/employer-requests/${id}`, 20 * 1000, true)
AdminApi.deleteEmployerRequest = (id: string | number) => apiRequest(`/api/admin/employer-requests/${id}`, { method: 'DELETE' }, true)
AdminApi.updateEmployerRequestStatus = (id: string | number, payload: any) => apiRequest(`/api/admin/employer-requests/${id}/status`, { method: 'PATCH', body: JSON.stringify(payload) }, true)

AdminApi.aboutPageSections = () => cachedGet('/api/admin/about-page/sections', 30 * 1000, true)
AdminApi.updateAboutPageSection = (key: string, payload: any) =>
  apiRequest(`/api/admin/about-page/sections/${key}`, { method: 'PUT', body: JSON.stringify(payload) }, true)

export const SuperAdmin = {
  createStaff: (payload: any) => apiRequest('/api/super-admin/staff', { method: 'POST', body: JSON.stringify(payload) }, true),
  pendingAgencies: () => cachedGet('/api/super-admin/foreign-agencies/pending', 15 * 1000, true),
  reviewAgency: (id: string | number, payload: any) => apiRequest(`/api/super-admin/foreign-agencies/${id}/review`, { method: 'PATCH', body: JSON.stringify(payload) }, true),
  downloadAgencyLicense: async (id: string | number) => {
    const token = getAdminToken()
    const headers = new Headers()
    if (token) headers.set('Authorization', `Bearer ${token}`)
    const res = await fetch(`${API_BASE_URL}/api/super-admin/foreign-agencies/${id}/license`, { headers })
    if (!res.ok) throw new Error('Failed to download license')
    const blob = await res.blob()
    return { blob, disposition: res.headers.get('Content-Disposition') || '' }
  },
}

