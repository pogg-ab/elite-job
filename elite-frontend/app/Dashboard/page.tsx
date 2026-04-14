 'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Profile, Partner } from '@/lib/api'
import { calculateProfileCompletion } from '@/lib/profileCompletion'

const DashboardPage: React.FC = () => {
  const [user, setUser] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openRearrangeId, setOpenRearrangeId] = useState<number | null>(null)
  const [partnerApplicants, setPartnerApplicants] = useState<any[]>([])
  const { t } = useTranslation()

  useEffect(() => {
    let mounted = true
    async function loadProfile() {
      setLoading(true)
      setError(null)
      try {
        const data = await Profile.get()
        if (mounted) setUser(data)
        // if partner, also load partner applications/shortlisted
        try {
          const role = data?.role ?? data?.profile?.role ?? null
          const isPartner = role === 'partner' || role === 'agency' || data?.is_partner || data?.profile?.is_partner
          if (isPartner) {
            const apps = await Partner.shortlisted()
            if (mounted) setPartnerApplicants(Array.isArray(apps) ? apps : (apps.data ?? []))
          }
        } catch (e) {
          // ignore partner fetch errors
        }
      } catch (err: any) {
        if (mounted) setError(err?.message ?? t('dashboard.loadProfileFailed'))
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadProfile()
    return () => { mounted = false }
  }, [])

  const documents = useMemo(() => {
    if (!user) return []
    const list = Array.isArray(user.documents)
      ? user.documents
      : (Array.isArray(user.documents?.data) ? user.documents.data : (Array.isArray(user.profile?.documents) ? user.profile.documents : (Array.isArray(user.profile?.documents?.data) ? user.profile.documents.data : [])))

    return list.map((d: any) => ({
      name: d.document_type ?? d.name ?? t('dashboard.document'),
      status: d.status ?? t('dashboard.notUploaded'),
      icon: d.document_type === 'Passport' ? '🛂' : '📄'
    }))
  }, [user])

  const applications = useMemo(() => {
    if (!user) return []
    const apps = Array.isArray(user.applications) ? user.applications : (user.applications?.data ?? [])
    return apps.map((a: any) => {
      const job = a.job ?? {}
      const title = typeof job.title === 'string'
        ? job.title
        : Array.isArray(job.title) ? job.title[0] : (job.title && Object.values(job.title)[0]) || t('dashboard.job')

      return {
        raw: a,
        id: a.id,
        title,
        company: job.company_name ?? job.foreign_agency?.name ?? job.created_by_user_id ?? '',
        country: job.country ?? '',
        status: a.workflow_status ?? a.status ?? t('dashboard.pending'),
        statusColor: a.workflow_status === 'interview_requested' ? 'badge-interview' : (a.workflow_status === 'shortlisted' ? 'badge-shortlisted' : 'badge-pending'),
        appliedDate: a.created_at ? new Date(a.created_at).toLocaleDateString() : '',
        lastUpdate: a.updated_at ? t('dashboard.updated') : '',
        coverLetter: a.cover_letter ?? null,
        interviewDatetime: a.interview_datetime ? new Date(a.interview_datetime) : null,
        interviewResponse: a.interview_response ?? null,
      }
    })
  }, [user, t])

  const stats = useMemo(() => {
    const totalDocs = documents.length
    const verifiedDocs = documents.filter((d: any) => d.status === 'verified').length
    const completion = calculateProfileCompletion(user)
    const role = user?.role ?? user?.profile?.role ?? null
    const isPartner = role === 'partner' || role === 'agency' || user?.is_partner || user?.profile?.is_partner

    if (isPartner) {
      const activeApplicants = partnerApplicants.length
      return [
        { label: t('dashboard.activeApplicants'), value: String(activeApplicants), icon: '📋', color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-950' },
        { label: t('dashboard.verifiedDocuments'), value: `${verifiedDocs} ${t('dashboard.of')} ${totalDocs}`, icon: '✅', color: 'from-primary to-primary/70', bgColor: 'bg-primary/10 dark:bg-primary/20' },
        { label: t('dashboard.profileComplete'), value: `${completion.percent}%`, icon: '📈', color: 'from-amber-500 to-orange-600', bgColor: 'bg-amber-50 dark:bg-amber-950' },
        { label: t('dashboard.messages'), value: '0', icon: '💬', color: 'from-purple-500 to-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-950' }
      ]
    }

    const activeApplications = applications.length
    return [
      { label: t('dashboard.activeApplications'), value: String(activeApplications), icon: '📋', color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-950' },
      { label: t('dashboard.verifiedDocuments'), value: `${verifiedDocs} ${t('dashboard.of')} ${totalDocs}`, icon: '✅', color: 'from-primary to-primary/70', bgColor: 'bg-primary/10 dark:bg-primary/20' },
      { label: t('dashboard.profileComplete'), value: `${completion.percent}%`, icon: '📈', color: 'from-amber-500 to-orange-600', bgColor: 'bg-amber-50 dark:bg-amber-950' },
      { label: t('dashboard.messages'), value: '0', icon: '💬', color: 'from-purple-500 to-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-950' }
    ]
  }, [applications, documents, user, partnerApplicants, t])

  return (
    <main className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Header */}
      <section className="relative isolate overflow-hidden border-b border-border px-4 py-10">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-br from-primary/14 via-background to-primary/20" />
        <div className="pointer-events-none absolute -left-16 -top-20 -z-10 h-56 w-56 rounded-full bg-primary/12 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-0 -z-10 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">{
              loading ? t('dashboard.welcome_back') : `${t('dashboard.welcome_back')}, ${user?.profile?.full_name ?? user?.name ?? t('dashboard.user')}`
            }</h1>
          </div>
          <p className="text-foreground/70 max-w-2xl">{t('dashboard.overview')}</p>
        </div>
      </section>

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-12">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {stats.map((stat, idx) => (
            <div key={idx} className={`${stat.bgColor} group relative overflow-hidden rounded-2xl border border-border/80 p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg`}>
              <div className="pointer-events-none absolute right-2 top-2 h-14 w-14 rounded-full bg-white/30 blur-2xl" />
              <div className="flex items-start justify-between mb-4">
                <span className="text-3xl transition-transform duration-300 group-hover:scale-110">{stat.icon}</span>
              </div>
              <div className="text-sm text-foreground/70 mb-1">{stat.label}</div>
              <div className={`text-3xl font-bold bg-linear-to-r ${stat.color} bg-clip-text text-transparent`}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Applications Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">{t('dashboard.my_applications')}</h2>
              <Link href="/Jobs">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                  {t('dashboard.browse_more_jobs')}
                </Button>
              </Link>
            </div>

            <div className="space-y-4">
              {applications.map(app => (
                <div key={app.id} className="rounded-2xl border border-border/80 bg-card/90 p-6 shadow-sm transition-all duration-300 hover:border-primary/25 hover:shadow-md">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground">{app.title}</h3>
                      <p className="text-foreground/60 text-sm">{app.company} • {app.country}</p>
                    </div>
                    <span className={`${app.statusColor} px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-4`}>
                      {app.status}
                    </span>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-3 border-t border-border/50">
                    <div className="text-xs text-foreground/60 mb-3 sm:mb-0">
                      <p>{t('dashboard.applied')}: <span className="font-medium">{app.appliedDate}</span></p>
                      <p>{t('dashboard.last_update')}: <span className="font-medium">{app.lastUpdate}</span></p>
                    </div>
                    <div className="flex gap-2 flex-wrap items-center">
                      <Link href={`/Jobs/${app.raw?.job?.id ?? app.id}`}>
                        <Button variant="outline" className="text-sm border-primary/20 hover:bg-primary/5">
                          {t('dashboard.view_details')}
                        </Button>
                      </Link>
                      {app.status === 'interview_requested' && app.interviewDatetime && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="text-sm">{t('dashboard.interview')}: <span className="font-medium">{app.interviewDatetime.toLocaleString()}</span></div>
                          <Button onClick={async () => {
                            // accept
                            try {
                              await (await import('@/lib/api')).Applications.respond(app.id, { action: 'accept' })
                              location.reload()
                            } catch (e) { console.error(e) }
                          }} className="bg-primary hover:bg-primary/90 text-primary-foreground">{t('dashboard.accept')}</Button>
                          {/* disable rearrange if applicant already requested rearrange and waiting for partner */}
                          <Button onClick={() => setOpenRearrangeId(openRearrangeId === app.id ? null : app.id)} variant="outline" className="bg-yellow-400" disabled={app.interviewResponse === 'rearrange_requested'}>{t('dashboard.ask_rearrange')}</Button>

                          {openRearrangeId === app.id && app.interviewResponse !== 'rearrange_requested' && (
                            <div className="mt-2 sm:mt-0 sm:flex sm:items-center sm:gap-2 w-full sm:w-auto z-10">
                              <input
                                id={`rearrange-input-${app.id}`}
                                type="datetime-local"
                                className="px-2 py-1 border rounded mr-2 w-full sm:w-auto"
                                aria-label={t('dashboard.proposeDatetime')}
                              />
                              <Button onClick={async () => {
                                const v = (document.getElementById(`rearrange-input-${app.id}`) as HTMLInputElement).value
                                if (!v) return alert(t('dashboard.enter_datetime'))
                                const iso = new Date(v)
                                if (isNaN(iso.getTime())) return alert(t('dashboard.invalid_datetime'))
                                try {
                                  await (await import('@/lib/api')).Applications.respond(app.id, { action: 'rearrange', new_datetime: iso.toISOString() })
                                  location.reload()
                                } catch (e) { console.error(e) }
                              }} className="ml-2">{t('dashboard.send_proposal')}</Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Documents & Quick Actions */}
          <div className="space-y-8">
            {/* Documents */}
            <div className="rounded-2xl border border-border/80 bg-card/90 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-foreground">{t('dashboard.documents')}</h3>
              </div>
              
              <div className="space-y-3">
                {documents.map((doc, idx) => (
                  <div key={idx} className="rounded-xl border border-border bg-background/80 p-4 transition hover:border-primary/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{doc.icon}</span>
                        <div>
                          <p className="font-semibold text-foreground text-sm">{doc.name}</p>
                          <p className="text-xs text-foreground/60">
                            {String(doc.status).toLowerCase() === 'verified' ? '✓ ' : ''}
                            {doc.status}
                          </p>
                        </div>
                      </div>
                      {String(doc.status).toLowerCase() === 'not uploaded' && (
                        <Button variant="ghost" className="text-primary text-xs hover:bg-primary/10">
                          {t('dashboard.upload')}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <Button className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                {t('dashboard.manageAllDocuments')}
              </Button>
            </div>

            {/* Quick Actions */}
            <div className="rounded-2xl border border-border/80 bg-card/90 p-5 shadow-sm">
              <h3 className="text-xl font-bold text-foreground mb-6">{t('dashboard.quickActions')}</h3>
              
              <div className="space-y-3">
                <Link href="/Jobs">
                  <Button variant="outline" className="w-full justify-start text-foreground border-border hover:bg-primary/5 hover:border-primary/20">
                    <span className="mr-3">🔍</span> {t('dashboard.searchNewJobs')}
                  </Button>
                </Link>
                <Button variant="outline" className="w-full justify-start text-foreground border-border hover:bg-primary/5 hover:border-primary/20">
                  <span className="mr-3">📝</span> {t('dashboard.updateProfile')}
                </Button>
                <Button variant="outline" className="w-full justify-start text-foreground border-border hover:bg-primary/5 hover:border-primary/20">
                  <span className="mr-3">❤️</span> {t('dashboard.viewSavedJobs')}
                </Button>
                <Button variant="outline" className="w-full justify-start text-foreground border-border hover:bg-primary/5 hover:border-primary/20">
                  <span className="mr-3">📞</span> {t('dashboard.contactSupport')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}

export default DashboardPage
