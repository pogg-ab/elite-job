'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getAccessToken, clearAuth, Auth, Services, AboutPage, Jobs } from '@/lib/api'
import { useTranslation } from 'react-i18next'
import { AppLanguage } from '@/lib/i18n'
import { useLanguage } from '@/components/language-provider'

const Navbar: React.FC = () => {
  const SERVICES_CACHE_KEY = 'hijra_services_cache_v2'
  const SERVICES_CACHE_TTL_MS = 5 * 60 * 1000
  const ABOUT_CACHE_KEY = 'hijra_about_cache_v2'
  const ABOUT_CACHE_TTL_MS = 60 * 60 * 1000
  const SERVICES_PAGE_CACHE_KEY = 'hijra_services_page_cache_v2'
  const SERVICES_PAGE_CACHE_TTL_MS = 60 * 60 * 1000
  const JOBS_CACHE_KEY = 'hijra_jobs_cache_v2'
  const JOBS_CACHE_TTL_MS = 10 * 60 * 1000
  const [isOpen, setIsOpen] = useState(false)
  const { t } = useTranslation()
  const { language, setLanguage } = useLanguage()

  const links = [
    { label: t('nav.home'), href: '/' },
    { label: t('nav.about'), href: '/About' },
    { label: t('nav.jobs'), href: '/Jobs' },
    { label: t('nav.services'), href: '/Services' },
    // Public employer request form
    { label: t('nav.employerRequests'), href: '/EmployerRequest' },
    { label: t('nav.contact'), href: '/Contact' },
  ]

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [isPartnerUser, setIsPartnerUser] = useState<boolean>(false)
  const [servicesList, setServicesList] = useState<any[]>([])

  useEffect(() => {
    // determine auth client-side only to keep server/client HTML stable
    try {
      const hasToken = !!getAccessToken()
      setIsAuthenticated(hasToken)

      if (hasToken) {
        let mounted = true
        ;(async () => {
            try {
            const me = await Auth.me() as any
            const role = me?.user?.role ?? me?.role ?? null
            if (!mounted) return
            setIsPartnerUser(role === 'partner' || role === 'agency')
          } catch {
            // on failure (401/invalid token) clear auth state
            try { clearAuth() } catch {}
            setIsAuthenticated(false)
            setIsPartnerUser(false)
          }
        })()

        return () => { mounted = false }
      }
    } catch {
      setIsAuthenticated(false)
    }
  }, [])

  useEffect(() => {
    let mounted = true

    // render instantly from short-lived cache
    try {
      const raw = localStorage.getItem(SERVICES_CACHE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as { timestamp: number; data: any[] }
        if (Array.isArray(parsed?.data) && Date.now() - parsed.timestamp < SERVICES_CACHE_TTL_MS) {
          setServicesList(parsed.data)
        }
      }
    } catch {
      // ignore cache read errors
    }

    ;(async () => {
      try {
        const res = await Services.list() as any
        const list = Array.isArray(res) ? res : (res.data ?? [])
        if (mounted) {
          setServicesList(list)
          try {
            localStorage.setItem(SERVICES_CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data: list }))
          } catch {
            // ignore cache write errors
          }
        }
      } catch {
        // ignore
      }
    })()

    // Prefetch page payloads in the background so first click feels instant.
    const runPrefetch = () => {
      const now = Date.now()
      const shouldRefresh = (key: string, ttlMs: number) => {
        try {
          const raw = localStorage.getItem(key)
          if (!raw) return true
          const parsed = JSON.parse(raw) as { timestamp: number }
          return !parsed?.timestamp || now - parsed.timestamp >= ttlMs
        } catch {
          return true
        }
      }

      if (shouldRefresh(ABOUT_CACHE_KEY, ABOUT_CACHE_TTL_MS)) {
        AboutPage.get()
          .then((response: any) => {
            const payload = response?.data ?? response
            localStorage.setItem(ABOUT_CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data: payload }))
          })
          .catch(() => {})
      }

      if (shouldRefresh(SERVICES_PAGE_CACHE_KEY, SERVICES_PAGE_CACHE_TTL_MS)) {
        Services.list()
          .then((response: any) => {
            const payload = Array.isArray(response) ? response : (response?.data ?? [])
            localStorage.setItem(SERVICES_PAGE_CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data: payload }))
          })
          .catch(() => {})
      }

      if (shouldRefresh(JOBS_CACHE_KEY, JOBS_CACHE_TTL_MS)) {
        Jobs.list()
          .then((response: any) => {
            const payload = Array.isArray(response) ? response : (response?.data ?? [])
            localStorage.setItem(JOBS_CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data: payload }))
          })
          .catch(() => {})
      }
    }

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      ;(window as any).requestIdleCallback(runPrefetch, { timeout: 1800 })
    } else {
      setTimeout(runPrefetch, 300)
    }

    return () => { mounted = false }
  }, [])

  return (
    <nav className="bg-primary border-b border-primary/20 sticky top-0 z-50 shadow-md transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.jpeg" alt="Elite" className="w-10 h-10 object-contain rounded-md border border-white/20" />
            <span className="font-bold text-xl text-white hidden sm:inline">Elite</span>
          </Link>


          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((link, idx) => {
              const href = idx === 0 && isAuthenticated ? '/Dashboard' : link.href
              const label = idx === 0 && isAuthenticated ? t('nav.dashboard') : link.label
              // Render Services as a dropdown if services exist
              if (link.href === '/Services') {
                return (
                  <div key={href + idx} className="relative group">
                    <Link href={href}>
                      <Button variant="ghost" className="text-white hover:text-accent hover:bg-white/10">{label}</Button>
                    </Link>
                    {servicesList.length > 0 && (
                      <div className="absolute left-0 mt-2 w-56 bg-card border border-border rounded shadow-md z-40 hidden group-hover:block">
                        <div className="py-2">
                          {servicesList.map(s => (
                            <Link key={s.id} href={`/Services#${s.slug ?? s.id}`} className="block px-4 py-2 text-sm text-foreground hover:bg-primary/5">{s.title}</Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              }

              return (
                <div key={href + idx} className="flex items-center gap-1">
                  <Link href={href}>
                      <Button variant="ghost" className="text-white hover:text-accent hover:bg-white/10">{label}</Button>
                  </Link>
                  {/* Insert Applications next to Jobs for partner users */}
                  {link.href === '/Jobs' && isPartnerUser && (
                    <Link href="/Partner">
                      <Button variant="ghost" className="text-white hover:text-accent hover:bg-white/10">{t('nav.applications')}</Button>
                    </Link>
                  )}
                </div>
              )
            })}
            {/* partner/register links hidden for guests per request */}
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-black/10 px-2 py-1 backdrop-blur-lg shadow-inner">

              <div className="relative">
                <select
                  aria-label="Language switcher"
                  value={language}
                  onChange={(event) => setLanguage(event.target.value as AppLanguage)}
                  className="h-9 appearance-none rounded-xl border border-white/20 bg-white/10 px-3 pr-8 text-sm font-semibold text-white outline-none transition-all hover:bg-white/15 focus:border-accent/50 focus:ring-2 focus:ring-accent/20 cursor-pointer"
                >
                  <option value="en" className="bg-primary text-white">EN</option>
                  <option value="am" className="bg-primary text-white">AM</option>
                  <option value="ar" className="bg-primary text-white">AR</option>
                  <option value="or" className="bg-primary text-white">OR</option>
                </select>
                <svg className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.169l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </div>

              {isAuthenticated ? (
                <>
                  <Link href="/Profile">
                    <Button
                      variant="ghost"
                      className="h-9 w-9 rounded-full border border-white/10 p-0 text-white hover:border-accent/40 hover:bg-white/10 hover:text-accent"
                      aria-label="Profile"
                    >
                      <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zM12 14c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5z" />
                      </svg>
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        await Auth.logout()
                      } catch {
                        // ignore
                      }
                      clearAuth()
                      window.location.href = '/Login'
                    }}
                    className="h-10 rounded-xl border-2 border-accent bg-accent/10 text-accent px-6 font-bold hover:bg-accent hover:text-primary transition-all duration-300 shadow-[0_0_15px_-3px_rgba(197,160,106,0.3)]"
                  >
                    {t('nav.logout')}
                  </Button>
                </>
              ) : (
                <Link href="/Login" className="hidden sm:block">
                  <Button variant="outline" className="h-10 rounded-xl border-2 border-accent bg-accent/10 text-accent px-6 font-bold hover:bg-accent hover:text-primary transition-all duration-300 shadow-[0_0_15px_-3px_rgba(197,160,106,0.3)]">
                    {t('nav.login')}
                  </Button>
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 hover:bg-primary/5 rounded-lg transition"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
            {isOpen && (
          <div className="md:hidden border-t border-border pb-4">
            {links.map((link, idx) => {
              const href = idx === 0 && isAuthenticated ? '/Dashboard' : link.href
              const label = idx === 0 && isAuthenticated ? t('nav.dashboard') : link.label
              return (
                <div key={href + idx}>
                  <Link href={href}>
                    <Button variant="ghost" className="w-full justify-start text-foreground hover:text-primary hover:bg-primary/5">
                      {label}
                    </Button>
                  </Link>
                  {link.href === '/Jobs' && isPartnerUser && (
                    <Link href="/Partner">
                      <Button variant="ghost" className="w-full justify-start text-foreground hover:text-primary hover:bg-primary/5">{t('nav.applications')}</Button>
                    </Link>
                  )}
                </div>
              )
            })}

            {isAuthenticated ? (
              <>
                <Link href="/Profile" className="block mt-2">
                  <Button variant="outline" className="w-full border-primary/20 text-primary hover:bg-primary/5">{t('nav.profile')}</Button>
                </Link>
                {isPartnerUser && (
                  <Link href="/Partner" className="block mt-2">
                    <Button variant="outline" className="w-full border-primary/20 text-primary hover:bg-primary/5">{t('nav.applications')}</Button>
                  </Link>
                )}
                <button
                  onClick={async () => {
                    try { await Auth.logout() } catch {}
                    clearAuth()
                    window.location.href = '/Login'
                  }}
                  className="block mt-2 w-full text-left"
                >
                  <Button variant="outline" className="w-full border-primary/20 text-primary hover:bg-primary/5">{t('nav.logout')}</Button>
                </button>
              </>
            ) : (
              <>
                <Link href="/Login" className="block mt-2">
                  <Button variant="outline" className="w-full border-primary/20 text-primary hover:bg-primary/5">
                    {t('nav.login')}
                  </Button>
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
