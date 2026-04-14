'use client'

import React, { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Partner as PartnerApi, downloadFile } from '@/lib/api'
import { Button } from '@/components/ui/button'
import SimpleModal from '@/components/SimpleModal'
import { useTranslation } from 'react-i18next'

const PartnerPage: React.FC = () => {
  const { t } = useTranslation()
  const [apps, setApps] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actioning, setActioning] = useState<number | null>(null)
  const [expandedById, setExpandedById] = useState<Record<number, boolean>>({})
  const [openModal, setOpenModal] = useState(false)
  const [modalApp, setModalApp] = useState<any | null>(null)
  const [proposedDatetime, setProposedDatetime] = useState('')

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await PartnerApi.shortlisted()
        const list = (res && (res.data ?? res)) as any[]
        if (mounted) setApps(list)
      } catch (err: any) {
        if (mounted) setError(err?.message ?? t('partnerPage.loadError'))
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()

    // poll every 10 seconds so partners see updates (e.g., rearranged times)
    const iv = setInterval(() => { load().catch(() => {}) }, 10000)
    return () => { mounted = false; clearInterval(iv) }
  }, [])

  const doAction = async (
    id: number,
    action: 'request_interview' | 'select_candidate' | 'shortlist' | 'decline' | 'accept_proposal' | 'decline_proposal'
  ) => {
    setActioning(id)
    try {
      await PartnerApi.action(id, { action })
      const res = await PartnerApi.shortlisted()
      setApps((res && (res.data ?? res)) as any[])
    } catch (err: any) {
      setError(err?.message ?? t('partnerPage.actionFailed'))
    } finally {
      setActioning(null)
    }
  }

  const renderApp = (a: any) => {
    const job = a.job ?? {}
    const jobTitle = typeof job.title === 'string'
      ? job.title
      : (Array.isArray(job.title) ? job.title[0] : (job.title?.en ?? Object.values(job.title || {})[0] ?? 'Job'))

    const applicantName = a.user?.name ?? a.user?.profile?.full_name ?? t('partnerPage.applicant')
    const profile = a.applicant_profile ?? a.user?.profile ?? {}
    const profileSkills = Array.isArray(profile?.skills) ? profile.skills : []
    const documentsSource = a.applicant_documents ?? a.user?.documents

    const docs = Array.isArray(documentsSource)
      ? documentsSource
      : (Array.isArray(documentsSource?.data) ? documentsSource.data : [])

    const valueOrFallback = (value: any) => {
      if (value === null || value === undefined) return t('partnerPage.notProvided')
      if (typeof value === 'string' && value.trim() === '') return t('partnerPage.notProvided')
      return value
    }

    const isExpanded = Boolean(expandedById[a.id])

    return (
      <div key={a.id} className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-start justify-between flex-wrap">
          <div>
            <h3 className="text-lg font-semibold">{jobTitle}</h3>
            <p className="text-sm text-foreground/60">{t('partnerPage.applicant')}: {applicantName}</p>
          </div>
          <div className="text-sm w-full sm:w-auto">
            <div className="mb-2">{t('partnerPage.status')}: <span className="font-semibold">{a.workflow_status}</span></div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                onClick={() => setExpandedById((prev) => ({ ...prev, [a.id]: !prev[a.id] }))}
              >
                {isExpanded ? t('partnerPage.hideDetails', { defaultValue: 'Hide details' }) : t('partnerPage.details', { defaultValue: 'Details' })}
              </Button>

              {a.workflow_status === 'applied' && (
                <>
                  <Button onClick={() => doAction(a.id, 'shortlist')} disabled={actioning === a.id} className="bg-primary hover:bg-primary/90 text-primary-foreground">{t('partnerPage.shortlist')}</Button>
                  <Button onClick={() => doAction(a.id, 'decline')} disabled={actioning === a.id} variant="outline" className="bg-red-600 text-white">{t('partnerPage.decline')}</Button>
                </>
              )}

              {a.workflow_status === 'shortlisted' && (
                <>
                  <Button onClick={() => { setOpenModal(true); setModalApp(a) }} disabled={actioning === a.id} className="bg-yellow-400">{t('partnerPage.requestInterview')}</Button>
                  <Button onClick={() => doAction(a.id, 'decline')} disabled={actioning === a.id} variant="outline" className="bg-red-600 text-white">{t('partnerPage.decline')}</Button>
                </>
              )}

              {a.workflow_status === 'interview_requested' && (
                <>
                  <Button onClick={() => doAction(a.id, 'select_candidate')} disabled={actioning === a.id} className="bg-primary hover:bg-primary/90 text-primary-foreground">{t('partnerPage.select')}</Button>
                  <Button onClick={() => doAction(a.id, 'decline')} disabled={actioning === a.id} variant="outline" className="bg-red-600 text-white">{t('partnerPage.decline')}</Button>
                </>
              )}

              {a.interview_response === 'rearrange_requested' && (
                <>
                  <Button onClick={() => doAction(a.id, 'accept_proposal')} disabled={actioning === a.id} className="bg-primary hover:bg-primary/90 text-primary-foreground">{t('partnerPage.acceptProposal')}</Button>
                  <Button onClick={() => doAction(a.id, 'decline_proposal')} disabled={actioning === a.id} variant="outline" className="bg-red-600 text-white">{t('partnerPage.declineProposal')}</Button>
                </>
              )}

              {['selected','rejected','hired','placed'].includes(a.workflow_status) && (
                <div className="text-xs text-foreground/60">{t('partnerPage.noActions')}</div>
              )}
            </div>
          </div>
        </div>

        {isExpanded && (
          <>
            <div className="mt-4">
              <h4 className="font-semibold mb-2">{t('partnerPage.coverLetter', { defaultValue: 'Cover Letter' })}</h4>
              <div className="bg-background border border-border rounded p-3 text-sm whitespace-pre-wrap">
                {valueOrFallback(a.cover_letter ?? t('partnerPage.noCoverLetter'))}
              </div>
            </div>

            <div className="mt-4">
              <h4 className="font-semibold mb-2">{t('partnerPage.profileDetails')}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div className="bg-background border border-border rounded p-2"><span className="font-medium">{t('partnerPage.fullName')}:</span> {valueOrFallback(profile?.full_name ?? a.user?.name)}</div>
                <div className="bg-background border border-border rounded p-2"><span className="font-medium">{t('partnerPage.email')}:</span> {valueOrFallback(a.user?.email)}</div>
                <div className="bg-background border border-border rounded p-2"><span className="font-medium">{t('partnerPage.phone')}:</span> {valueOrFallback(a.user?.phone)}</div>
                <div className="bg-background border border-border rounded p-2"><span className="font-medium">{t('partnerPage.gender')}:</span> {valueOrFallback(profile?.gender)}</div>
                <div className="bg-background border border-border rounded p-2"><span className="font-medium">{t('partnerPage.age')}:</span> {valueOrFallback(profile?.age)}</div>
                <div className="bg-background border border-border rounded p-2"><span className="font-medium">{t('partnerPage.dateOfBirth')}:</span> {valueOrFallback(profile?.date_of_birth)}</div>
                <div className="bg-background border border-border rounded p-2"><span className="font-medium">{t('partnerPage.nationality')}:</span> {valueOrFallback(profile?.nationality)}</div>
                <div className="bg-background border border-border rounded p-2"><span className="font-medium">{t('partnerPage.preferredCountry')}:</span> {valueOrFallback(profile?.preferred_country)}</div>
                <div className="bg-background border border-border rounded p-2 sm:col-span-2"><span className="font-medium">{t('partnerPage.address')}:</span> {valueOrFallback(profile?.address)}</div>
                <div className="bg-background border border-border rounded p-2 sm:col-span-2"><span className="font-medium">{t('partnerPage.education')}:</span> {valueOrFallback(profile?.education_level)}</div>
                <div className="bg-background border border-border rounded p-2 sm:col-span-2"><span className="font-medium">{t('partnerPage.experience')}:</span> {valueOrFallback(profile?.experience_summary)}</div>
                <div className="bg-background border border-border rounded p-2 sm:col-span-2"><span className="font-medium">{t('partnerPage.skills')}:</span> {profileSkills.length > 0 ? profileSkills.join(', ') : t('partnerPage.notProvided')}</div>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="font-semibold mb-2">{t('partnerPage.applicantDocs')}</h4>
              <div className="space-y-2">
                {docs.map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between bg-background border border-border rounded p-2">
                    <div>
                      <div className="font-medium">{d.document_type}</div>
                      <div className="text-xs text-foreground/60">{t('partnerPage.uploaded')}</div>
                    </div>
                    <div>
                      <Button onClick={async () => {
                        try {
                          const { blob } = await downloadFile(`/api/documents/${d.id}/download`, true)
                          const url = URL.createObjectURL(blob)
                          window.open(url, '_blank')
                          // revoke after short delay
                          setTimeout(() => URL.revokeObjectURL(url), 10000)
                        } catch (e: any) {
                          console.error('View failed', e)
                        }
                      }} className="mr-2">{t('partnerPage.view')}</Button>
                    </div>
                  </div>
                ))}
                {(!docs || docs.length === 0) && <p className="text-foreground/60">{t('partnerPage.noDocs')}</p>}
              </div>
            </div>

            {/* show interview info if present */}
            {a.interview_datetime && (
              <div className="mt-4 text-sm">
                <div>{t('partnerPage.interviewProposed')}: <span className="font-medium">{new Date(a.interview_datetime).toLocaleString()}</span></div>
                <div className="text-xs text-foreground/60">{t('partnerPage.response')}: {a.interview_response ?? t('partnerPage.pending')}</div>
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  const submitInterview = async () => {
    if (!modalApp || !proposedDatetime) return alert(t('partnerPage.dateRequired'))
    const iso = new Date(proposedDatetime)
    if (isNaN(iso.getTime())) return alert(t('partnerPage.invalidDate'))
    setActioning(modalApp.id)
    try {
      await PartnerApi.action(modalApp.id, { action: 'request_interview', interview_datetime: iso.toISOString() })
      const res = await PartnerApi.shortlisted()
      setApps((res && (res.data ?? res)) as any[])
      setOpenModal(false)
      setModalApp(null)
      setProposedDatetime('')
    } catch (e) {
      console.error(e)
      alert(t('partnerPage.submitFailed'))
    } finally { setActioning(null) }
  }

  return (
    <main className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto w-full px-4 py-12">
        <h1 className="text-3xl font-bold mb-6">{t('partnerPage.title')}</h1>
        {loading && <p>{t('partnerPage.loading')}</p>}
        {error && <p className="text-red-600">{error}</p>}

        <div className="space-y-4">
          {apps.map(renderApp)}

          {apps.length === 0 && !loading && <p className="text-foreground/60">{t('partnerPage.noShortlisted')}</p>}
        </div>
      </div>
      <SimpleModal open={openModal} title={t('partnerPage.requestInterviewModal')} onClose={() => setOpenModal(false)}>
        <div className="space-y-3">
          <p className="text-sm text-foreground/60">{t('partnerPage.proposeDateTime')}</p>
          <input type="datetime-local" value={proposedDatetime} onChange={(e) => setProposedDatetime(e.target.value)} className="w-full px-3 py-2 border rounded" />
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => { setOpenModal(false); setModalApp(null); setProposedDatetime('') }}>{t('partnerPage.cancel')}</Button>
            <Button onClick={submitInterview} className="bg-primary hover:bg-primary/90 text-primary-foreground">{t('partnerPage.sendRequest')}</Button>
          </div>
        </div>
      </SimpleModal>
      <Footer />
    </main>
  )
}

export default PartnerPage
