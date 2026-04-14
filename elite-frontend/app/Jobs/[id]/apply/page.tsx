"use client"

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Jobs, Applications, Profile as ProfileApi, Auth, API_BASE_URL, getAccessToken } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { useTranslation } from 'react-i18next'

export default function JobApplyPage() {
  const { t } = useTranslation()
  const params = useParams() as { id?: string }
  const router = useRouter()
  const id = params?.id

  const [job, setJob] = useState<any | null>(null)
  const [profile, setProfile] = useState<any | null>(null)
  const [applied, setApplied] = useState(false)
  const [coverLetter, setCoverLetter] = useState('')
  const [confirmDetails, setConfirmDetails] = useState(false)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [profileReady, setProfileReady] = useState(false)

  const normalizeProfilePayload = (payload: any) => {
    if (!payload) return null
    if (payload.user) return payload.user
    if (payload.data) return payload.data
    return payload
  }

  const extractUserPayload = (payload: any) => {
    if (!payload) return null
    if (payload?.profile) return payload
    if (payload?.user?.profile) return payload.user
    if (payload?.data?.profile) return payload.data
    if (payload?.data?.user?.profile) return payload.data.user
    if (payload?.data?.user) return payload.data.user
    if (payload?.user) return payload.user
    return payload
  }

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!id) return

      const token = getAccessToken()
      if (!token) {
        router.push(`/Login?next=/Jobs/${id}/apply`)
        return
      }

      // Load profile first and independently so apply gating works even if job fetch fails.
      try {
        const token2 = getAccessToken()
        const res = await fetch(`${API_BASE_URL}/api/profile`, {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token2}`,
          },
        })

        if (!res.ok) throw new Error('Failed to load profile')

        const raw = await res.json()
        const normalized = normalizeProfilePayload(raw)
        const userPayload = extractUserPayload(normalized)
        if (mounted) setProfile(userPayload)
      } catch {
        // Fallback to existing wrappers.
        try {
          const p = await ProfileApi.get()
          const normalized = normalizeProfilePayload(p)
          const userPayload = extractUserPayload(normalized)
          if (mounted) setProfile(userPayload)
        } catch {
          try {
            const p2 = await Auth.me()
            const normalized = normalizeProfilePayload(p2)
            const userPayload = extractUserPayload(normalized)
            if (mounted) setProfile(userPayload)
          } catch {
            if (mounted) setProfile(null)
          }
        }
      } finally {
        if (mounted) setProfileReady(true)
      }

      try {
        const myApps = await Applications.myApplications()
        const apps = myApps?.data ?? myApps
        if (mounted) setApplied(Array.isArray(apps) ? apps.some((a: any) => String(a.job_id) === String(id)) : false)
      } catch {
        // ignore
      }

      try {
        const data = await Jobs.show(id)
        if (mounted) setJob(data)
      } catch (err: any) {
        if (mounted) setError(err?.message ?? t('jobApply.loadError'))
      }
    }
    load()
    return () => { mounted = false }
  }, [id, router, t])

  const resolvedUser = extractUserPayload(profile)
  const resolvedProfile = resolvedUser?.profile ?? resolvedUser?.data?.profile ?? null

  const fullName = resolvedProfile?.full_name || resolvedUser?.name || ''
  const phone = resolvedUser?.phone || resolvedProfile?.phone || ''
  const gender = resolvedProfile?.gender || ''
  const age = resolvedProfile?.age || ''
  const education = resolvedProfile?.education_level || resolvedProfile?.education || ''
  const experience = resolvedProfile?.experience_summary || resolvedProfile?.experience || ''
  const passportStatus = resolvedProfile?.passport_status || ''

  const missingProfileFields = [
    !fullName && t('jobApply.fullName'),
    !phone && t('jobApply.phone'),
    !gender && t('jobApply.gender'),
    !age && t('jobApply.age'),
    !education && t('jobApply.education'),
    !experience && t('jobApply.workExperience'),
    !passportStatus && t('jobApply.passportStatus'),
  ].filter(Boolean) as string[]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    if (!id) return setError(t('jobApply.missingJobId'))
    if (!confirmDetails) return setError(t('jobApply.confirmRequired'))
    if (missingProfileFields.length > 0) return setError(t('jobApply.completeProfileRequired'))
    // No document verification gating; users may apply if the job is published.
    setLoading(true)
    try {
      await Jobs.apply(id, { cover_letter: coverLetter })
      setSuccess(t('jobApply.successSubmitted'))
      setTimeout(() => router.push('/Dashboard'), 1200)
    } catch (err: any) {
      setError(err?.message ?? t('jobApply.submitFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-12">
        <Button onClick={() => router.back()} className="mb-6">← {t('jobApply.back')}</Button>

        {job && (
          <div className="mb-6">
            <h1 className="text-2xl font-bold">{(typeof job.title === 'string') ? job.title : (job.title?.en ?? Object.values(job.title || {})[0] ?? '')}</h1>
            <p className="text-foreground/60">{job.country ?? ''} • {job.vacancies_total ?? ''} {t('jobDetail.vacancies').toLowerCase()} • {((job.vacancies_total ?? 0) - (job.vacancies_filled ?? 0))} {t('jobDetail.remaining').toLowerCase()}</p>
          </div>
        )}

        {error && <div className="text-destructive mb-4">{t('jobApply.errorPrefix')}: {error}</div>}
        
        {success && <div className="text-success mb-4">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-4 space-y-3">
            <h2 className="text-lg font-semibold">{t('jobApply.confirmProfileDetails')}</h2>

            {!profileReady && (
              <div className="text-sm text-foreground/60">Loading profile details...</div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <p><span className="font-medium">{t('jobApply.fullName')}:</span> {fullName || t('jobApply.notSet')}</p>
              <p><span className="font-medium">{t('jobApply.phone')}:</span> {phone || t('jobApply.notSet')}</p>
              <p><span className="font-medium">{t('jobApply.gender')}:</span> {gender || t('jobApply.notSet')}</p>
              <p><span className="font-medium">{t('jobApply.age')}:</span> {age || t('jobApply.notSet')}</p>
              <p><span className="font-medium">{t('jobApply.education')}:</span> {education || t('jobApply.notSet')}</p>
              <p><span className="font-medium">{t('jobApply.passportStatus')}:</span> {passportStatus || t('jobApply.notSet')}</p>
            </div>
            <p className="text-sm"><span className="font-medium">{t('jobApply.workExperience')}:</span> {experience || t('jobApply.notSet')}</p>

            {missingProfileFields.length > 0 && (
              <div className="text-sm text-destructive">
                {t('jobApply.missingDetailsPrefix')}: {missingProfileFields.join(', ')}. {t('jobApply.missingDetailsSuffix')}
                <div className="mt-2">
                  <Button type="button" variant="outline" onClick={() => router.push('/Profile')}>{t('jobApply.goToProfile')}</Button>
                </div>
              </div>
            )}

            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={confirmDetails}
                onChange={(e) => setConfirmDetails(e.target.checked)}
                className="mt-1"
              />
              <span>{t('jobApply.confirmCheckbox')}</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium">{t('jobApply.coverLetter')}</label>
            <textarea value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} required className="mt-1 block w-full rounded-md border px-3 py-2" rows={8} />
          </div>

          <div>
            {applied ? (
              <div className="text-muted">{t('jobApply.alreadyApplied')}</div>
            ) : missingProfileFields.length > 0 ? (
              <div className="text-destructive">{t('jobApply.completeProfileBeforeApply')}</div>
            ) : ((job?.vacancies_total ?? 0) - (job?.vacancies_filled ?? 0)) <= 0 ? (
              <div className="text-destructive">{t('jobApply.noVacancies')}</div>
            ) : (
              <button
                type="submit"
                disabled={loading || !confirmDetails}
                aria-disabled={loading || !confirmDetails}
                title={loading ? t('jobApply.submitting') : (!confirmDetails ? t('jobApply.confirmBeforeSubmitting') : '')}
                className={`inline-flex items-center px-4 py-2 rounded-md text-white ${(loading || !confirmDetails) ? 'bg-primary/60 opacity-50 cursor-not-allowed' : 'bg-primary hover:bg-primary/90'}`}
              >
                {loading ? t('jobApply.submitting') : t('jobApply.submitApplication')}
              </button>
            )}
          </div>
        </form>
      </div>

      <Footer />
    </main>
  )
}
