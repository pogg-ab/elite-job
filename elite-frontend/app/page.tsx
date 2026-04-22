'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { HomePage, AboutPage } from '@/lib/api'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '@/components/language-provider'
import { getLocalizedContentText, getLocalizedText } from '@/lib/localization'

type SectionBlock = {
  key: string
  title: string | null
  subtitle: string | null
  description: string | null
  content: Record<string, any> | null
  is_active: boolean
}

type ServiceItem = {
  id: number
  title: string
  description: string | null
}

type CountryItem = {
  id: number
  country_name: string
}

type TestimonialItem = {
  id: number
  author_name: string
  author_role: string | null
  quote: string
}

type JobItem = {
  id: number
  title: string | Record<string, string>
  description: string | Record<string, string> | null
  category: string | null
  country: string | null
  salary_range: string | null
}

type HomePayload = {
  company_introduction: SectionBlock | null
  mission_vision: SectionBlock | null
  featured_services: ServiceItem[]
  quick_job_search: SectionBlock | null
  latest_job_listings: {
    config: SectionBlock | null
    items: JobItem[]
  }
  partner_countries: CountryItem[]
  testimonials: TestimonialItem[]
  contact_section: SectionBlock | null
  stats?: {
    latest_open_jobs?: number
    partner_countries?: number
    featured_services?: number
  }
}

const DEFAULT_CONTACT_EMAIL = 'ethioeliteagency@gmail.com'
const DEFAULT_CONTACT_PHONE = '+251920156360'

const Home: React.FC = () => {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState<HomePayload | null>(null)
  const [aboutData, setAboutData] = useState<any | null>(null)
  const [quickKeyword, setQuickKeyword] = useState('')
  const [quickCountry, setQuickCountry] = useState('')
  const [searchApplied, setSearchApplied] = useState(false)

  useEffect(() => {
    let mounted = true

      ; (async () => {
        try {
          const [homeRes, aboutRes] = await Promise.all([HomePage.get(), AboutPage.get()])
          const homePayload = (homeRes as any)?.data as HomePayload
          const aboutPayload = (aboutRes as any)?.data
          if (mounted) {
            setData(homePayload)
            setAboutData(aboutPayload)
          }
        } catch (e: any) {
          if (mounted) setError(e?.message ?? 'Failed to load homepage')
        } finally {
          if (mounted) setLoading(false)
        }
      })()

    return () => {
      mounted = false
    }
  }, [])

  const intro = data?.company_introduction
  const missionVision = aboutData
    ? {
      content: {
        mission_title: aboutData?.mission?.title ?? aboutData?.mission?.content?.title ?? '',
        mission_text: aboutData?.mission?.description ?? aboutData?.mission?.content?.description ?? '',
        vision_title: aboutData?.vision?.title ?? aboutData?.vision?.content?.title ?? '',
        vision_text: aboutData?.vision?.description ?? aboutData?.vision?.content?.description ?? '',
      },
      is_active: true,
    }
    : data?.mission_vision
  const quickSearch = data?.quick_job_search
  const latestConfig = data?.latest_job_listings?.config
  const latestJobs = data?.latest_job_listings?.items ?? []
  const featuredServices = data?.featured_services ?? []
  const countries = data?.partner_countries ?? []
  const testimonials = data?.testimonials ?? []
  const contact = data?.contact_section

  const filteredLatestJobs = useMemo(() => {
    const keyword = quickKeyword.trim().toLowerCase()
    const country = quickCountry.trim().toLowerCase()

    return latestJobs.filter((job) => {
      const titleText = getLocalizedText(job.title, language).toLowerCase()
      const descText = getLocalizedText(job.description, language).toLowerCase()
      const jobCountry = (job.country ?? '').toLowerCase()

      const keywordMatch = !keyword || titleText.includes(keyword) || descText.includes(keyword)
      const countryMatch = !country || jobCountry.includes(country)

      return keywordMatch && countryMatch
    })
  }, [latestJobs, quickKeyword, quickCountry, language])

  const handleQuickSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchApplied(true)

    const latestSection = document.getElementById('latest-job-listings')
    if (latestSection) {
      latestSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const highlights = useMemo(() => {
    const jobsCount = data?.stats?.latest_open_jobs ?? latestJobs.length
    const countriesCount = data?.stats?.partner_countries ?? countries.length
    const servicesCount = data?.stats?.featured_services ?? featuredServices.length

    return [
      { value: `${jobsCount}`, label: t('home.latestOpenJobs') },
      { value: `${countriesCount}`, label: t('home.partnerCountries') },
      { value: `${servicesCount}`, label: t('home.featuredServices') },
      { value: '24/7', label: t('home.supportDesk') },
    ]
  }, [data?.stats?.latest_open_jobs, data?.stats?.partner_countries, data?.stats?.featured_services, latestJobs.length, countries.length, featuredServices.length, t])

  const introTitleText = getLocalizedContentText(intro?.content, 'title', language, getLocalizedText(intro?.title, language, t('home.introFallbackTitle')))
  const introDescriptionText = getLocalizedContentText(intro?.content, 'description', language, getLocalizedText(intro?.description, language, t('home.introFallbackDescription')))

  return (
    <main className="min-h-screen flex flex-col bg-background" data-no-auto-i18n="true">
      <Navbar />

      {error && (
        <div className="mx-auto mt-6 w-full max-w-6xl px-4">
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        </div>
      )}

      <section className="relative overflow-hidden px-4 pt-16 pb-20 md:pt-24 md:pb-28 bg-linear-to-b from-primary/10 via-background to-background">
        <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-secondary/10 blur-3xl" />

        <div className="relative max-w-6xl mx-auto grid gap-10 md:grid-cols-2 items-center">
          <div>
            <p className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold tracking-wide text-primary">
              {t('home.badge')}
            </p>
            <h1 className="mt-5 text-4xl md:text-5xl font-bold leading-tight text-foreground">
              {introTitleText}
            </h1>
            <p className="mt-5 text-lg text-foreground/75 leading-relaxed">
              {introDescriptionText}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={(intro?.content?.primary_cta_link as string) || '/Jobs'}>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  {getLocalizedContentText(intro?.content, 'primary_cta_text', language, t('home.exploreJobs'))}
                </Button>
              </Link>
              <Link href={(intro?.content?.secondary_cta_link as string) || '/RegisterMultiStep'}>
                <Button variant="outline" className="border-primary/30 hover:bg-primary/5">
                  {getLocalizedContentText(intro?.content, 'secondary_cta_text', language, t('home.createProfile'))}
                </Button>
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-6 md:p-8 shadow-lg">
            <h2 className="text-lg font-semibold text-foreground">{t('home.highlightsTitle')}</h2>
            <div className="mt-6 grid grid-cols-2 gap-4">
              {highlights.map((item) => (
                <div key={item.label} className="rounded-xl border border-border bg-background p-4">
                  <p className="text-2xl font-bold text-primary">{item.value}</p>
                  <p className="text-sm text-foreground/70">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 bg-background">
        <div className="max-w-6xl mx-auto grid gap-6 md:grid-cols-2">
          <article className="rounded-2xl border border-border bg-card p-7 shadow-sm">
            <h2 className="text-2xl font-bold text-foreground">
              {getLocalizedContentText(missionVision?.content, 'mission_title', language, t('home.mission'))}
            </h2>
            <p className="mt-3 text-foreground/75 leading-relaxed">
              {getLocalizedContentText(missionVision?.content, 'mission_text', language, t('home.missionFallback'))}
            </p>
          </article>
          <article className="rounded-2xl border border-border bg-card p-7 shadow-sm">
            <h2 className="text-2xl font-bold text-foreground">
              {getLocalizedContentText(missionVision?.content, 'vision_title', language, t('home.vision'))}
            </h2>
            <p className="mt-3 text-foreground/75 leading-relaxed">
              {getLocalizedContentText(missionVision?.content, 'vision_text', language, t('home.visionFallback'))}
            </p>
          </article>
        </div>
      </section>

      <section className="px-4 py-24 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-black mb-4">
              {t('home.showcaseTitle')}
            </h2>
            <div className="h-1.5 w-24 bg-accent mx-auto mb-8 rounded-full" />
            <p className="text-foreground/70 text-lg max-w-3xl mx-auto leading-relaxed">
              {t('home.showcaseSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-4">
            {[
              { img: '/images/workforce.jpeg', titleKey: 'home.showcase.card1.title', descKey: 'home.showcase.card1.desc' },
              { img: '/images/business-woman.jpg', titleKey: 'home.showcase.card2.title', descKey: 'home.showcase.card2.desc' },
              { img: '/images/interview.jpg', titleKey: 'home.showcase.card3.title', descKey: 'home.showcase.card3.desc' },
              { img: '/images/verifiedresults.jpeg', titleKey: 'home.showcase.card4.title', descKey: 'home.showcase.card4.desc' },
            ].map((card, idx) => (
              <div key={idx} className="group relative aspect-[3/4.5] rounded-[2rem] overflow-hidden shadow-xl border-2 border-white/5 transition-all duration-500 hover:border-accent/40">
                <img
                  src={card.img}
                  alt={t(card.titleKey)}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 brightness-[0.9] group-hover:brightness-100"
                />
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-100 transition-opacity duration-500" />
                <div className="absolute bottom-6 left-6 right-6 text-white transform transition-all duration-500">
                  <h3 className="text-lg font-bold mb-1 text-accent transform group-hover:-translate-y-1 transition-transform">{t(card.titleKey)}</h3>
                  <p className="text-white/80 text-xs leading-tight opacity-0 group-hover:opacity-100 transition-all duration-500 line-clamp-2">{t(card.descKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 bg-surface">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground text-center">{t('home.featuredServicesTitle')}</h2>
          

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {featuredServices.map((service, index) => (
              <article key={service.id ?? index} className="rounded-2xl border border-border bg-card p-6 transition hover:shadow-md hover:-translate-y-0.5">
                <h3 className="mt-4 text-xl font-semibold text-foreground">{getLocalizedText(service.title, language)}</h3>
                <p className="mt-2 text-foreground/70 leading-relaxed">{getLocalizedText(service.description, language)}</p>
              </article>
            ))}
            {featuredServices.length === 0 && (
              <p className="md:col-span-3 rounded-xl border border-dashed border-border bg-card p-6 text-center text-foreground/70">
                {t('home.noFeaturedServices')}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 bg-background">
        <div className="max-w-5xl mx-auto rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm">
          <h2 className="text-3xl font-bold text-foreground">{getLocalizedText(quickSearch?.title, language, t('home.quickSearchTitle'))}</h2>
          <p className="mt-2 text-foreground/70">{getLocalizedText(quickSearch?.description, language, t('home.quickSearchDescription'))}</p>
          <form onSubmit={handleQuickSearchSubmit} className="mt-6 grid gap-4 md:grid-cols-4">
            <input
              value={quickKeyword}
              onChange={(e) => setQuickKeyword(e.target.value)}
              placeholder={getLocalizedContentText(quickSearch?.content, 'placeholder_keyword', language, t('home.keywordPlaceholder'))}
              className="md:col-span-2 rounded-lg border border-border bg-background px-4 py-3"
            />
            <input
              value={quickCountry}
              onChange={(e) => setQuickCountry(e.target.value)}
              placeholder={getLocalizedContentText(quickSearch?.content, 'placeholder_country', language, t('home.countryPlaceholder'))}
              className="rounded-lg border border-border bg-background px-4 py-3"
            />
            <button type="submit" className="rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground hover:bg-primary/90">
              {getLocalizedContentText(quickSearch?.content, 'search_button_text', language, t('home.search'))}
            </button>
          </form>
        </div>
      </section>

      <section id="latest-job-listings" className="px-4 py-16 bg-surface">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-3xl font-bold text-foreground">{getLocalizedText(latestConfig?.title, language, t('home.latestListingsTitle'))}</h2>
            <Link href={(latestConfig?.content?.view_all_link as string) || '/Jobs'} className="text-sm font-semibold text-primary hover:underline">
              {getLocalizedContentText(latestConfig?.content, 'view_all_text', language, t('home.viewAll'))}
            </Link>
          </div>

          {searchApplied && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <p className="text-sm text-foreground/70">
                {t('home.showingResultsFor')}
                {quickKeyword.trim() ? ` keyword: "${quickKeyword.trim()}"` : ` ${t('home.allKeywords')}`}
                {quickCountry.trim() ? `, country: "${quickCountry.trim()}"` : ''}
              </p>
              <button
                type="button"
                onClick={() => {
                  setQuickKeyword('')
                  setQuickCountry('')
                  setSearchApplied(false)
                }}
                className="text-sm font-semibold text-primary hover:underline"
              >
                {t('home.clearSearch')}
              </button>
            </div>
          )}

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {filteredLatestJobs.map((job) => (
              <article key={job.id} className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition">
                <h3 className="text-2xl font-bold text-foreground mb-3">{getLocalizedText(job.title, language)}</h3>

                <p className="text-sm text-foreground/70 leading-relaxed mb-6 line-clamp-3">{getLocalizedText(job.description, language) || job.category || t('home.general')}</p>

                <div className="mt-auto flex items-center justify-between">
                  <span className="inline-block rounded-md bg-primary/10 text-primary px-3 py-1 text-sm font-semibold">{job.country || t('home.na')}</span>

                  <span className="text-sm font-semibold text-foreground/80">{job.salary_range || t('home.negotiable')}</span>
                </div>
              </article>
            ))}
            {filteredLatestJobs.length === 0 && (
              <p className="md:col-span-3 rounded-xl border border-dashed border-border bg-card p-6 text-center text-foreground/70">
                {t('home.noQuickSearchMatches')}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 bg-background">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-foreground">{t('home.partnerCountries')}</h2>
          <div className="mt-8">
            {countries.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-foreground/70">
                No partner countries added yet.
              </p>
            ) : countries.length === 3 ? (
              <div className="flex justify-center">
                <div className="inline-grid grid-cols-3 gap-4">
                  {countries.map((country) => (
                    <div key={country.id} className="rounded-xl border border-border bg-card px-4 py-5 text-center font-medium text-foreground/80">
                      {country.country_name}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                {countries.map((country) => (
                  <div key={country.id} className="rounded-xl border border-border bg-card px-4 py-5 text-center font-medium text-foreground/80">
                    {country.country_name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 bg-surface">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-foreground">{t('home.testimonialsTitle', 'Testimonials')}</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {testimonials.map((item) => (
              <blockquote key={item.id} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <p className="text-foreground/80 leading-relaxed">{getLocalizedText(item.quote, language)}</p>
                <footer className="mt-4 text-sm font-semibold text-primary">
                  {getLocalizedText(item.author_name, language)}
                  {item.author_role ? `, ${getLocalizedText(item.author_role, language)}` : ''}
                </footer>
              </blockquote>
            ))}
            {testimonials.length === 0 && (
              <p className="md:col-span-3 rounded-xl border border-dashed border-border bg-card p-6 text-center text-foreground/70">
                No testimonials available yet.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 bg-background">
        <div className="max-w-6xl mx-auto grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold text-foreground">{getLocalizedText(contact?.title, language, 'Contact Section')}</h2>
            <p className="mt-3 text-foreground/75 leading-relaxed">
              {getLocalizedText(contact?.description, language, 'Reach our team for inquiries about recruitment, partnership, and candidate onboarding.')}
            </p>
            <div className="mt-6 space-y-2 text-foreground/80">
              <p>Email: {DEFAULT_CONTACT_EMAIL}</p>
              <p>Phone: {DEFAULT_CONTACT_PHONE}</p>
              <p>Address: {(contact?.content?.address as string) || 'Addis Ababa, Ethiopia'}</p>
            </div>
          </div>

          <form className="rounded-2xl border border-border bg-card p-6 shadow-sm grid gap-4">
            <input placeholder={t('contactForm.fullNamePlaceholder', 'Full name')} className="rounded-lg border border-border bg-background px-4 py-3" />
            <input placeholder={t('contactForm.emailPlaceholder', 'Email address')} className="rounded-lg border border-border bg-background px-4 py-3" />
            <textarea placeholder={t('contactForm.messagePlaceholder', 'Write your message')} className="h-32 rounded-lg border border-border bg-background px-4 py-3" />
            <button type="button" className="rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground hover:bg-primary/90">
              {getLocalizedContentText(contact?.content, 'submit_button_text', language, t('contactForm.submit', 'Send Message'))}
            </button>
          </form>
        </div>
      </section>

      {loading && <p className="mx-auto mb-8 text-sm text-foreground/70">Loading homepage content...</p>}

      <Footer />
    </main>
  )
}

export default Home
