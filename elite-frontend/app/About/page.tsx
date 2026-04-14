'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { AboutPage } from '@/lib/api'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '@/components/language-provider'
import { getLocalizedContentArray, getLocalizedContentText, getLocalizedText } from '@/lib/localization'

type SectionBlock = {
  key: string
  title: string | null
  description: string | null
  content: Record<string, any> | null
  is_active: boolean
}

type AboutPayload = {
  company_background: SectionBlock | null
  mission: SectionBlock | null
  vision: SectionBlock | null
  legal_compliance: SectionBlock | null
  recruitment_standards: SectionBlock | null
  certifications: SectionBlock | null
}

export default function AboutPageView() {
  const ABOUT_CACHE_KEY = 'hijra_about_cache_v2'
  const ABOUT_CACHE_TTL_MS = 60 * 60 * 1000
  const { t } = useTranslation()
  const { language } = useLanguage()

  const readCachedAbout = (): AboutPayload | null => {
    if (typeof window === 'undefined') return null
    try {
      const raw = localStorage.getItem(ABOUT_CACHE_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw) as { timestamp: number; data: AboutPayload }
      if (!parsed?.data) return null
      if (Date.now() - parsed.timestamp >= ABOUT_CACHE_TTL_MS) return null
      return parsed.data
    } catch {
      return null
    }
  }

  const [data, setData] = useState<AboutPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    const cached = readCachedAbout()
    if (cached) {
      setData(cached)
      setLoading(false)
    }

    ;(async () => {
      try {
        const response = await AboutPage.get()
        const payload = (response as any)?.data as AboutPayload
        if (mounted) {
          setData(payload)
          try {
            localStorage.setItem(ABOUT_CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data: payload }))
          } catch {
            // ignore cache write errors
          }
        }
      } catch (e: any) {
        if (mounted) setError(e?.message ?? t('about.loadError'))
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [])

  const certifications = useMemo(() => {
    return getLocalizedContentArray(data?.certifications?.content, 'items', language)
  }, [data?.certifications?.content, language])

  const legalCompliancePoints = useMemo(() => {
    return getLocalizedContentArray(data?.legal_compliance?.content, 'compliance_points', language)
  }, [data?.legal_compliance?.content, language])

  const recruitmentStandards = useMemo(() => {
    return getLocalizedContentArray(data?.recruitment_standards?.content, 'standards', language)
  }, [data?.recruitment_standards?.content, language])

  return (
    <main className="min-h-screen flex flex-col bg-background" data-no-auto-i18n="true">
      <Navbar />

      <section className="relative isolate overflow-hidden border-b border-border px-4 py-14">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-br from-primary/15 via-background to-primary/20" />
        <div className="pointer-events-none absolute -top-24 -left-16 -z-10 h-56 w-56 rounded-full bg-primary/12 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-8 -z-10 h-56 w-56 rounded-full bg-amber-300/18 blur-3xl" />
        <div className="max-w-6xl mx-auto">
          <p className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{t('about.badge')}</p>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mt-4 mb-4">{t('about.title')}</h1>
          <p className="text-lg text-foreground/75 max-w-3xl">{t('about.subtitle')}</p>
        </div>
      </section>

      <section className="flex-1 max-w-7xl mx-auto w-full px-4 py-12 space-y-8">
        {loading && <p className="text-xs text-foreground/50">{t('about.loading')}</p>}
        {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        {!error && (
          <>
            <article className="rounded-3xl border border-border/80 bg-card/90 p-7 shadow-sm transition hover:shadow-md">
              <h2 className="text-2xl font-bold text-foreground">{getLocalizedContentText(data?.company_background?.content, 'title', language, getLocalizedText(data?.company_background?.title, language, t('about.companyBackground')))}</h2>
              <p className="mt-3 text-foreground/75 leading-relaxed">{getLocalizedContentText(data?.company_background?.content, 'description', language, getLocalizedText(data?.company_background?.description, language, t('about.companyBackgroundFallback')))}</p>
            </article>

            <div className="grid md:grid-cols-2 gap-6">
              <article className="rounded-3xl border border-border/80 bg-card/90 p-7 shadow-sm transition hover:shadow-md">
                <h2 className="text-2xl font-bold text-foreground">{getLocalizedContentText(data?.mission?.content, 'title', language, getLocalizedText(data?.mission?.title, language, t('about.mission')))}</h2>
                <p className="mt-3 text-foreground/75 leading-relaxed">{getLocalizedContentText(data?.mission?.content, 'description', language, getLocalizedText(data?.mission?.description, language, t('about.missionFallback')))}</p>
              </article>
              <article className="rounded-3xl border border-border/80 bg-card/90 p-7 shadow-sm transition hover:shadow-md">
                <h2 className="text-2xl font-bold text-foreground">{getLocalizedContentText(data?.vision?.content, 'title', language, getLocalizedText(data?.vision?.title, language, t('about.vision')))}</h2>
                <p className="mt-3 text-foreground/75 leading-relaxed">{getLocalizedContentText(data?.vision?.content, 'description', language, getLocalizedText(data?.vision?.description, language, t('about.visionFallback')))}</p>
              </article>
            </div>

            <article className="rounded-3xl border border-border/80 bg-card/90 p-7 shadow-sm transition hover:shadow-md">
              <h2 className="text-2xl font-bold text-foreground">{getLocalizedContentText(data?.legal_compliance?.content, 'title', language, getLocalizedText(data?.legal_compliance?.title, language, t('about.legalCompliance')))}</h2>
              <p className="mt-3 text-foreground/75 leading-relaxed">{getLocalizedContentText(data?.legal_compliance?.content, 'description', language, getLocalizedText(data?.legal_compliance?.description, language, t('about.legalComplianceFallback')))}</p>
              {legalCompliancePoints.length > 0 && (
                <ul className="mt-4 space-y-2 text-foreground/80">
                  {legalCompliancePoints.map((point) => (
                    <li key={point} className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              )}
            </article>

            <article className="rounded-3xl border border-border/80 bg-card/90 p-7 shadow-sm transition hover:shadow-md">
              <h2 className="text-2xl font-bold text-foreground">{getLocalizedContentText(data?.recruitment_standards?.content, 'title', language, getLocalizedText(data?.recruitment_standards?.title, language, t('about.recruitmentStandards')))}</h2>
              <p className="mt-3 text-foreground/75 leading-relaxed">{getLocalizedContentText(data?.recruitment_standards?.content, 'description', language, getLocalizedText(data?.recruitment_standards?.description, language, t('about.recruitmentStandardsFallback')))}</p>
              {recruitmentStandards.length > 0 && (
                <ul className="mt-4 space-y-2 text-foreground/80">
                  {recruitmentStandards.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </article>

            <article className="rounded-3xl border border-border/80 bg-card/90 p-7 shadow-sm transition hover:shadow-md">
              <h2 className="text-2xl font-bold text-foreground">{getLocalizedContentText(data?.certifications?.content, 'title', language, getLocalizedText(data?.certifications?.title, language, t('about.certifications')))}</h2>
              <p className="mt-3 text-foreground/75 leading-relaxed">{getLocalizedContentText(data?.certifications?.content, 'description', language, getLocalizedText(data?.certifications?.description, language, t('about.certificationsFallback')))}</p>
              {certifications.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {certifications.map((item) => (
                    <span key={item} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      {item}
                    </span>
                  ))}
                </div>
              )}
            </article>
          </>
        )}
      </section>

      <Footer />
    </main>
  )
}
