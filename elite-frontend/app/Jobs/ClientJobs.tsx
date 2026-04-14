"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import JobCard from '@/components/JobCard'
import { Button } from '@/components/ui/button'
import { Jobs, Auth, getAccessToken } from '@/lib/api'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const JobsPage: React.FC = () => {
  const JOBS_CACHE_KEY = 'hijra_jobs_cache_v2'
  const JOBS_CACHE_TTL_MS = 10 * 60 * 1000
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('All')
  const [selectedType, setSelectedType] = useState('All')
  const [selectedSkillCategory, setSelectedSkillCategory] = useState('All')

  type Job = {
    id: string | number
    title: any
    employer?: string
    location?: string
    country?: string
    salaryRange?: string
    type?: string
    skillCategory?: string
    description?: any
    requiredQualifications?: string[]
    applicationDeadline?: string | null
    created_by_user_id?: number | null
    foreign_agency_id?: number | null
  }

  const readCachedJobs = (): Job[] => {
    if (typeof window === 'undefined') return []
    try {
      const raw = localStorage.getItem(JOBS_CACHE_KEY)
      if (!raw) return []
      const parsed = JSON.parse(raw) as { timestamp: number; data: Job[] }
      if (!Array.isArray(parsed?.data)) return []
      if (Date.now() - parsed.timestamp >= JOBS_CACHE_TTL_MS) return []
      return parsed.data
    } catch {
      return []
    }
  }

  const hasWarmJobsCache = (): boolean => readCachedJobs().length > 0

  const [jobs, setJobs] = useState<Job[]>(() => readCachedJobs())
  const [loading, setLoading] = useState(() => !hasWarmJobsCache())
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<any | null>(null)
  const [postOpen, setPostOpen] = useState(false)
  const [postError, setPostError] = useState<string | null>(null)
  const [posting, setPosting] = useState(false)
  const [postTitle, setPostTitle] = useState('')
  const [postDescription, setPostDescription] = useState('')
  const [postCategory, setPostCategory] = useState('')
  const [postJobType, setPostJobType] = useState('Full-time')
  const [postSkillCategory, setPostSkillCategory] = useState('')
  const [postEmployer, setPostEmployer] = useState('')
  const [postCountry, setPostCountry] = useState('')
  const [postVacancies, setPostVacancies] = useState(1)
  const [postSalaryRange, setPostSalaryRange] = useState('')
  const [postApplicationDeadline, setPostApplicationDeadline] = useState('')
  const [postRequiredQualifications, setPostRequiredQualifications] = useState('')
  const [postIsHighLevel, setPostIsHighLevel] = useState(false)

  const sourceJobs = Array.isArray(jobs) ? jobs : []

  const standardJobTypes = ['Full-time', 'Part-time', 'Contract']

  const isPartner = useMemo(() => {
    if (!profile) return false
    const role = (profile.role || profile.type || profile.account_type || '').toString().toLowerCase()
    if (role.includes('partner') || role.includes('agency')) return true
    return profile.is_partner === true
  }, [profile])

  function normalizeJobs(data: any[]): Job[] {
    return data.map((job: any) => ({
      id: job.id,
      title: job.title,
      employer: job.employer_name || job.foreign_agency?.company_name || t('jobCard.employerNotSpecified'),
      location: job.country,
      country: job.country,
      salaryRange: job.salary_range,
      type: job.job_type || 'Full-time',
      skillCategory: job.skill_category || job.category || t('jobDetail.general'),
      description: job.description,
      requiredQualifications: Array.isArray(job.required_qualifications) ? job.required_qualifications : [],
      applicationDeadline: job.application_deadline || null,
      created_by_user_id: job.created_by_user_id ?? null,
      foreign_agency_id: job.foreign_agency_id ?? null,
    }))
  }

  const types = useMemo(() => {
    const list = sourceJobs.map((j) => j.type).filter(Boolean) as string[]
    const merged = [...standardJobTypes, ...list]
    return ['All', ...Array.from(new Set(merged))]
  }, [sourceJobs])

  const skillCategories = useMemo(() => {
    const list = sourceJobs.map((j) => j.skillCategory).filter(Boolean) as string[]
    return ['All', ...Array.from(new Set(list))]
  }, [sourceJobs])

  const countries = useMemo(() => {
    const list = sourceJobs.map(j => j.country).filter(Boolean) as string[]
    return ['All', ...Array.from(new Set(list))]
  }, [sourceJobs])

  useEffect(() => {
    const q = searchParams.get('q') ?? ''
    const country = searchParams.get('country') ?? 'All'

    setSearchQuery(q)
    setSelectedCountry(country || 'All')
  }, [searchParams])

  useEffect(() => {
    let mounted = true

    async function loadProfile() {
      if (!getAccessToken()) return
      try {
        const p = await Auth.me()
        if (mounted) setProfile(p)
      } catch (e) {
        // ignore - user not logged in
      }
    }
    loadProfile()
    async function loadJobs() {
      setLoading(sourceJobs.length === 0)
      setError(null)
      try {
        const data = await Jobs.list()
        if (mounted) {
          const normalized = normalizeJobs(Array.isArray(data) ? data : [])
          setJobs(normalized)
          try {
            localStorage.setItem(JOBS_CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data: normalized }))
          } catch {
            // ignore cache write errors
          }
        }
      } catch (err: any) {
        setError(err?.message ?? t('jobsPage.failedLoad'))
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadJobs()
    return () => {
      mounted = false
    }
  }, [])

  const filteredJobs = sourceJobs.filter(job => {
    const getTitleText = (j: any) => {
      const t = j?.title
      if (!t) return ''
      if (typeof t === 'string') return t
      if (typeof t === 'object') return (t.en ?? Object.values(t)[0] ?? '')
      return String(t)
    }

    const titleText = getTitleText(job)
    const matchesSearch = titleText.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (job.employer || '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCountry = selectedCountry === 'All' || job.country === selectedCountry
    const matchesType = selectedType === 'All' || job.type === selectedType
    const matchesSkillCategory = selectedSkillCategory === 'All' || job.skillCategory === selectedSkillCategory
    return matchesSearch && matchesCountry && matchesType && matchesSkillCategory
  })

  async function handlePartnerPostJob(e: React.FormEvent) {
    e.preventDefault()
    setPostError(null)

    if (!Number.isFinite(postVacancies) || Number(postVacancies) < 1) {
      setPostError('Vacancies is required and must be at least 1.')
      return
    }

    setPosting(true)

    try {
      const payload = {
        title: { en: postTitle },
        description: { en: postDescription },
        category: postCategory,
        job_type: postJobType,
        skill_category: postSkillCategory || postCategory,
        employer_name: postEmployer || undefined,
        country: postCountry,
        vacancies_total: Number(postVacancies),
        salary_range: postSalaryRange || undefined,
        application_deadline: postApplicationDeadline || undefined,
        required_qualifications: postRequiredQualifications
          .split(/\n|,/) 
          .map((line) => line.trim())
          .filter((line) => line.length > 0),
        is_high_level: postIsHighLevel || undefined,
      }

      const editingId = (window as any).__editing_job_id
      if (editingId) {
        await Jobs.partnerUpdate(editingId, payload)
      } else {
        await Jobs.partnerCreate(payload)
      }

      const data = await Jobs.list()
      setJobs(normalizeJobs(Array.isArray(data) ? data : []))

      if (editingId) {
        try { delete (window as any).__editing_job_id } catch {}
      }

      setPostTitle('')
      setPostDescription('')
      setPostCategory('')
      setPostJobType('Full-time')
      setPostSkillCategory('')
      setPostEmployer('')
      setPostCountry('')
      setPostVacancies(1)
      setPostSalaryRange('')
      setPostApplicationDeadline('')
      setPostRequiredQualifications('')
      setPostIsHighLevel(false)
      setPostOpen(false)
    } catch (err: any) {
      setPostError(err?.message || t('jobApply.submitFailed'))
    } finally {
      setPosting(false)
    }
  }

  useEffect(() => {
    if (!postOpen) {
      try { delete (window as any).__editing_job_id } catch {}
    }
  }, [postOpen])

  return (
    <main className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Page Header */}
      <section className="relative isolate overflow-hidden border-b border-border px-4 py-14">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-br from-primary/15 via-background to-primary/20" />
        <div className="pointer-events-none absolute -left-20 -top-12 -z-10 h-60 w-60 rounded-full bg-primary/14 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-4 -z-10 h-60 w-60 rounded-full bg-primary/18 blur-3xl" />
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">{t('jobsPage.title')}</h1>
          <p className="text-lg text-foreground/70 max-w-2xl">{t('jobsPage.subtitle')}</p>
        </div>
      </section>

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-12">
        {/* Filters */}
        <div className="mb-8 rounded-3xl border border-border/80 bg-card/90 p-5 shadow-sm">
          <div className="grid md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-foreground mb-2">{t('jobsPage.searchJobs')}</label>
            <input
              type="text"
              placeholder={t('jobsPage.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-card text-foreground placeholder:text-foreground/40 focus:ring-2 focus:ring-primary focus:border-transparent transition outline-none"
            />
          </div>

          {/* Country Filter */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">{t('jobsPage.country')}</label>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition outline-none"
            >
              {countries.map(country => (
                <option key={country} value={country}>{country === 'All' ? t('jobsPage.all') : country}</option>
              ))}
            </select>
          </div>

          {/* Job Type Filter */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">{t('jobsPage.jobType')}</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition outline-none"
            >
              {types.map(type => (
                <option key={type} value={type}>{type === 'All' ? t('jobsPage.all') : type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">{t('jobsPage.skillCategory')}</label>
            <select
              value={selectedSkillCategory}
              onChange={(e) => setSelectedSkillCategory(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition outline-none"
            >
              {skillCategories.map((category) => (
                <option key={category} value={category}>{category === 'All' ? t('jobsPage.all') : category}</option>
              ))}
            </select>
          </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-sm text-foreground/60">
            {loading ? t('jobsPage.loadingJobs') : error ? `${t('jobDetail.error')}: ${error}` : (
              <>{t('jobsPage.showing')} <span className="font-semibold text-foreground">{filteredJobs.length}</span> {t('jobsPage.of')} <span className="font-semibold text-foreground">{jobs.length}</span> {t('jobsPage.jobs')}</>
            )}
          </p>
        </div>

        {/* Partner action: Post Job */}
        {isPartner && (
          <div className="mb-6 rounded-3xl border border-primary/30 bg-linear-to-r from-primary/10 via-primary/10 to-primary/15 p-5 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-primary">{t('jobsPage.partnerQuickAction')}</p>
              <p className="text-sm text-primary/85">{t('jobsPage.partnerQuickActionDescription')}</p>
            </div>
            <Button onClick={() => { setPostError(null); setPostOpen(true) }} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {t('jobsPage.postJob')}
            </Button>
          </div>
        )}

        {/* Job Listings */}
        <div className="grid md:grid-cols-2 gap-6">
          {filteredJobs.map(job => {
            const canEdit = isPartner && profile && (
              profile.id === job.created_by_user_id || (profile.foreignAgency && profile.foreignAgency.id === job.foreign_agency_id)
            )
            return (
              <JobCard key={job.id} {...job} canEdit={canEdit} isPartner={isPartner} onEdit={() => {
                // open edit modal prefilled
                setPostTitle(typeof job.title === 'string' ? job.title : (job.title?.en ?? ''))
                setPostDescription(typeof job.description === 'string' ? job.description : (job.description?.en ?? ''))
                setPostCategory(job.skillCategory || '')
                setPostJobType(job.type || 'Full-time')
                setPostSkillCategory(job.skillCategory || '')
                setPostEmployer(job.employer || '')
                setPostCountry(job.country || '')
                setPostVacancies(job.requiredQualifications?.length ? job.requiredQualifications.length : 1)
                setPostSalaryRange(job.salaryRange || '')
                setPostApplicationDeadline(job.applicationDeadline || '')
                setPostRequiredQualifications((job.requiredQualifications || []).join(', '))
                setPostIsHighLevel(false)
                // store editing id on open
                (setPostOpen as any)(true)
                ;(setPosting as any)(false)
                ;(setPosting as any)(false)
                ;(window as any).__editing_job_id = job.id
              }} />
            )
          })}
        </div>

        {/* No Results */}
        {!loading && filteredJobs.length === 0 && (
          <div className="rounded-3xl border border-border bg-card/90 py-20 text-center shadow-sm">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-semibold text-foreground mb-2">{t('jobsPage.noJobsFound')}</h3>
            <p className="text-foreground/60 mb-6">{t('jobsPage.tryAdjustingFilters')}</p>
            <Button
              onClick={() => {
                setSearchQuery('')
                setSelectedCountry('All')
                setSelectedType('All')
                setSelectedSkillCategory('All')
              }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {t('jobsPage.clearFilters')}
            </Button>
          </div>
        )}
      </div>

      <Dialog open={postOpen} onOpenChange={setPostOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('jobsPage.postJobTitle')}</DialogTitle>
            <DialogDescription>{t('jobsPage.postJobDescription')}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePartnerPostJob} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Job Title (EN)</label>
              <input required value={postTitle} onChange={(e) => setPostTitle(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Job Description (EN)</label>
              <textarea required value={postDescription} onChange={(e) => setPostDescription(e.target.value)} rows={5} className="w-full rounded-md border border-border bg-background px-3 py-2" />
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Category</label>
                <input required value={postCategory} onChange={(e) => setPostCategory(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Job Type</label>
                <select value={postJobType} onChange={(e) => setPostJobType(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2">
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Skill Category</label>
                <input value={postSkillCategory} onChange={(e) => setPostSkillCategory(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Employer</label>
                <input value={postEmployer} onChange={(e) => setPostEmployer(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2" />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Country</label>
                <input required value={postCountry} onChange={(e) => setPostCountry(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Application Deadline</label>
                <input type="date" value={postApplicationDeadline} onChange={(e) => setPostApplicationDeadline(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2" />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Vacancies</label>
                <input required min={1} type="number" value={postVacancies} onChange={(e) => setPostVacancies(Number(e.target.value))} className="w-full rounded-md border border-border bg-background px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Salary Range</label>
                <input value={postSalaryRange} onChange={(e) => setPostSalaryRange(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2" />
              </div>
              <div className="flex items-end pb-2">
                <label className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                  <input type="checkbox" checked={postIsHighLevel} onChange={(e) => setPostIsHighLevel(e.target.checked)} />
                  High level
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Required Qualifications (one per line)</label>
              <textarea value={postRequiredQualifications} onChange={(e) => setPostRequiredQualifications(e.target.value)} rows={4} className="w-full rounded-md border border-border bg-background px-3 py-2" />
            </div>

            {postError && <p className="text-sm text-red-600">{postError}</p>}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPostOpen(false)}>{t('jobsPage.cancel')}</Button>
              <Button type="submit" disabled={posting} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                {posting ? t('jobsPage.submitting') : t('jobsPage.submitJob')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Footer />
    </main>
  )
}

export default JobsPage
