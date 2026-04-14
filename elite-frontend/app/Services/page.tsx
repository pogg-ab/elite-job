'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Services } from '@/lib/api'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '@/components/language-provider'
import { getLocalizedStringArray, getLocalizedText } from '@/lib/localization'

export default function ServicesPage() {
  const SERVICES_CACHE_KEY = 'hijra_services_page_cache_v2'
  const SERVICES_CACHE_TTL_MS = 60 * 60 * 1000
  const { t } = useTranslation()
  const { language } = useLanguage()

  const readCachedServices = (): any[] => {
    if (typeof window === 'undefined') return []
    try {
      const raw = localStorage.getItem(SERVICES_CACHE_KEY)
      if (!raw) return []
      const parsed = JSON.parse(raw) as { timestamp: number; data: any[] }
      if (!Array.isArray(parsed?.data)) return []
      if (Date.now() - parsed.timestamp >= SERVICES_CACHE_TTL_MS) return []
      return parsed.data
    } catch {
      return []
    }
  }

  const hasWarmServicesCache = (): boolean => readCachedServices().length > 0

  const [services, setServices] = useState<any[]>(() => readCachedServices())
  const [loading, setLoading] = useState(() => !hasWarmServicesCache())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    setLoading(services.length === 0)

    ;(async () => {
      try {
        const res = await Services.list()
        const list = Array.isArray(res) ? res : (res.data ?? [])
        if (mounted) {
          setServices(list)
          try {
            localStorage.setItem(SERVICES_CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data: list }))
          } catch {
            // ignore cache write errors
          }
        }
      } catch (e: any) {
        if (mounted) setError(e?.message ?? t('servicesPage.loadError'))
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [])

  const normalizedServices = useMemo(() => {
    return services.map((item) => ({
      ...item,
      id: item.id,
      slug: item.slug,
      title: getLocalizedText(item.title, language, t('servicesPage.untitledService')),
      description: getLocalizedText(item.description, language, ''),
      qualificationRequirements: getLocalizedStringArray(item.qualification_requirements, language),
      targetCountries: getLocalizedStringArray(item.target_countries, language),
      applicationInstructions: getLocalizedStringArray(item.application_instructions, language),
    }))
  }, [services, t, language])

  return (
    <main className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <section className="relative isolate overflow-hidden border-b border-border px-4 py-14">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-br from-primary/14 via-background to-primary/20" />
        <div className="pointer-events-none absolute -left-20 top-0 -z-10 h-56 w-56 rounded-full bg-primary/12 blur-3xl" />
        <div className="pointer-events-none absolute right-0 -top-8 -z-10 h-56 w-56 rounded-full bg-primary/16 blur-3xl" />
        <div className="max-w-6xl mx-auto">
          <p className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{t('servicesPage.badge')}</p>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mt-4 mb-4">{t('servicesPage.title')}</h1>
          <p className="text-lg text-foreground/70 max-w-3xl">
            {t('servicesPage.subtitle')}
          </p>
        </div>
      </section>

      <section className="flex-1 max-w-7xl mx-auto w-full px-4 py-12">
        {loading && <p className="text-foreground/70">{t('servicesPage.loading')}</p>}
        {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        {!loading && !error && normalizedServices.length > 0 && (
          <div className="grid md:grid-cols-2 gap-6">
            {normalizedServices.map((service) => (
              <article id={service.slug ?? String(service.id)} key={service.id} className="rounded-3xl border border-border/80 bg-card/90 p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
                <h2 className="text-2xl font-semibold text-foreground">{service.title}</h2>

                <section className="mt-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">{t('servicesPage.description')}</h3>
                  <p className="mt-2 text-foreground/75 leading-relaxed">{service.description || t('servicesPage.noDescription')}</p>
                </section>

                <section className="mt-5">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">{t('servicesPage.qualificationRequirements')}</h3>
                  {service.qualificationRequirements.length > 0 ? (
                    <ul className="mt-2 space-y-1 text-foreground/75">
                      {service.qualificationRequirements.map((item: string) => (
                        <li key={item} className="flex gap-2">
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-foreground/60">{t('servicesPage.noQualifications')}</p>
                  )}
                </section>

                <section className="mt-5">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">{t('servicesPage.targetCountries')}</h3>
                  {service.targetCountries.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {service.targetCountries.map((country: string) => (
                        <span key={country} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                          {country}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-foreground/60">{t('servicesPage.noTargetCountries')}</p>
                  )}
                </section>

                <section className="mt-5">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">{t('servicesPage.applicationInstructions')}</h3>
                  {service.applicationInstructions.length > 0 ? (
                    <ol className="mt-2 space-y-1 text-foreground/75">
                      {service.applicationInstructions.map((step: string, idx: number) => (
                        <li key={step} className="flex gap-2">
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                            {idx + 1}
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="mt-2 text-foreground/60">{t('servicesPage.noInstructions')}</p>
                  )}
                </section>
              </article>
            ))}
          </div>
        )}

        {!loading && !error && normalizedServices.length === 0 && (
          <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
            <p className="text-foreground/70">{t('servicesPage.noServices')}</p>
          </div>
        )}

      </section>

      <Footer />
    </main>
  )
}
