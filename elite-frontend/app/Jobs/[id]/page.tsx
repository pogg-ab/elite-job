"use client"

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Jobs } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { useTranslation } from 'react-i18next'

function localizedText(value: any): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object') return value.en ?? Object.values(value)[0] ?? ''
  return String(value)
}

function formatDate(dateValue: string | null | undefined): string {
  if (!dateValue) return ''
  const parsed = new Date(dateValue)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function JobDetailPage() {
  const { t } = useTranslation()
  const params = useParams() as { id?: string }
  const router = useRouter()
  const id = params?.id

  const [job, setJob] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!id) return
      setLoading(true)
      setError(null)
      try {
        const data = await Jobs.show(id)
        if (mounted) setJob(data)
      } catch (err: any) {
        if (mounted) setError(err?.message ?? t('jobDetail.loadError'))
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [id, t])

  return (
    <main className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-12">
        <Button onClick={() => router.back()} className="mb-6">← {t('jobDetail.back')}</Button>

        {loading && <p>{t('jobDetail.loading')}</p>}
        {error && <p className="text-destructive">{t('jobDetail.error')}: {error}</p>}

        {job && (
          <article className="space-y-6">
            <header className="rounded-2xl border border-border bg-card p-6 md:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{localizedText(job.title)}</h1>
                  <p className="text-foreground/70">
                    {job.employer_name || job.foreign_agency?.company_name || t('jobDetail.employerNotSpecified')}
                  </p>
                </div>

                <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {job.job_type || 'Full-time'}
                </span>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3 text-sm">
                <div className="rounded-lg bg-background px-3 py-2 border border-border">
                  <p className="text-foreground/60">{t('jobDetail.country')}</p>
                  <p className="font-medium text-foreground">{job.country || t('jobDetail.notSpecified')}</p>
                </div>
                <div className="rounded-lg bg-background px-3 py-2 border border-border">
                  <p className="text-foreground/60">{t('jobDetail.salaryRange')}</p>
                  <p className="font-medium text-foreground">{job.salary_range || t('jobDetail.negotiable')}</p>
                </div>
                <div className="rounded-lg bg-background px-3 py-2 border border-border">
                  <p className="text-foreground/60">{t('jobDetail.applicationDeadline')}</p>
                  <p className="font-medium text-foreground">{formatDate(job.application_deadline) || t('jobDetail.notSpecified')}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex rounded-full bg-secondary/50 px-3 py-1 text-xs font-medium text-secondary-foreground">
                  {t('jobDetail.skill')}: {job.skill_category || job.category || t('jobDetail.general')}
                </span>
                <span className="inline-flex rounded-full bg-secondary/50 px-3 py-1 text-xs font-medium text-secondary-foreground">
                  {t('jobDetail.vacancies')}: {job.vacancies_total ?? 0}
                </span>
                <span className="inline-flex rounded-full bg-secondary/50 px-3 py-1 text-xs font-medium text-secondary-foreground">
                  {t('jobDetail.remaining')}: {(job.vacancies_total ?? 0) - (job.vacancies_filled ?? 0)}
                </span>
              </div>
            </header>

            <section className="rounded-2xl border border-border bg-card p-6 md:p-8">
              <h2 className="text-xl font-semibold text-foreground mb-3">{t('jobDetail.jobDescription')}</h2>
              <p className="text-foreground/80 leading-relaxed whitespace-pre-line">
                {localizedText(job.description) || t('jobDetail.noDescription')}
              </p>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 md:p-8">
              <h2 className="text-xl font-semibold text-foreground mb-3">{t('jobDetail.requiredQualifications')}</h2>
              {Array.isArray(job.required_qualifications) && job.required_qualifications.length > 0 ? (
                <ul className="space-y-2 text-foreground/80">
                  {job.required_qualifications.map((item: string, idx: number) => (
                    <li key={`${item}-${idx}`} className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-foreground/60">{t('jobDetail.noQualifications')}</p>
              )}
            </section>

            <div className="pt-2">
              {((job.vacancies_total ?? 0) - (job.vacancies_filled ?? 0)) <= 0 ? (
                <Button disabled className="opacity-60">{t('jobDetail.noVacancies')}</Button>
              ) : (
                <Button onClick={() => router.push(`/Jobs/${job.id}/apply`)}>{t('jobDetail.apply')}</Button>
              )}
            </div>
          </article>
        )}
      </div>

      <Footer />
    </main>
  )
}
