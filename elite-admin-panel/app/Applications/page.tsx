'use client'

import React, { useEffect, useState } from 'react'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { AdminApi } from '@/lib/api'
import { showAlert } from '@/lib/popup'
import { useTranslation } from 'react-i18next'

const AdminApplicationsPage: React.FC = () => {
  const { t } = useTranslation()
  const [apps, setApps] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actioning, setActioning] = useState<number | null>(null)
  const [expandedById, setExpandedById] = useState<Record<number, boolean>>({})
  const [search, setSearch] = useState('')

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await AdminApi.applications()
      const list = (Array.isArray(res) ? res : (res.data ?? [])) as any[]
      setApps(list)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load applications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const updateStatus = async (id: number, status: string) => {
    setActioning(id)
    try {
      await AdminApi.updateApplicationStatus(id, { status })
      await load()
    } catch (err: any) {
      await showAlert(err?.message ?? 'Action failed', 'Error')
    } finally {
      setActioning(null)
    }
  }

  const filteredApps = apps.filter(a => {
    const term = search.toLowerCase()
    const applicantName = (a.user?.name ?? a.user?.profile?.full_name ?? '').toLowerCase()
    const jobTitle = (a.job?.title ?? '').toLowerCase()
    const agencyName = (a.job?.company_name ?? a.job?.foreign_agency?.name ?? '').toLowerCase()
    return applicantName.includes(term) || jobTitle.includes(term) || agencyName.includes(term)
  })

  const renderApp = (a: any) => {
    const job = a.job ?? {}
    const jobTitle = typeof job.title === 'string'
      ? job.title
      : (Array.isArray(job.title) ? job.title[0] : (job.title?.en ?? Object.values(job.title || {})[0] ?? 'Job'))

    const applicantName = a.user?.name ?? a.user?.profile?.full_name ?? 'Applicant'
    const profile = a.applicant_profile ?? a.user?.profile ?? {}
    const documentsSource = a.applicant_documents ?? a.user?.documents
    const docs = Array.isArray(documentsSource) ? documentsSource : (documentsSource?.data ?? [])
    
    const isExpanded = Boolean(expandedById[a.id])

    return (
      <div key={a.id} className="bg-card border border-border rounded-lg p-4 shadow-sm">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <h3 className="text-lg font-semibold">{jobTitle}</h3>
            <p className="text-sm text-foreground/70">
              <span className="font-medium">Applicant:</span> {applicantName}
            </p>
            <p className="text-xs text-foreground/60 mt-1">
              <span className="font-medium">Agency/Partner:</span> {job.company_name ?? job.foreign_agency?.name ?? 'N/A'}
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <div className="text-sm">
              Status: <span className="font-bold px-2 py-0.5 rounded bg-primary/10 text-primary uppercase text-[10px]">{a.workflow_status || a.status}</span>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setExpandedById(prev => ({ ...prev, [a.id]: !prev[a.id] }))}
              >
                {isExpanded ? 'Hide' : 'Details'}
              </Button>
              
              <select 
                className="text-xs border rounded px-2 h-9 bg-background"
                value={a.workflow_status || a.status}
                disabled={actioning === a.id}
                onChange={(e) => updateStatus(a.id, e.target.value)}
              >
                <option value="applied">Applied</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="interview_requested">Interview Requested</option>
                <option value="selected">Selected</option>
                <option value="rejected">Rejected</option>
                <option value="hired">Hired</option>
                <option value="placed">Placed</option>
              </select>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-border grid md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2">
            <div>
              <h4 className="font-bold text-sm mb-3 text-primary uppercase tracking-wider">Applicant Profile</h4>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium text-foreground/60">Gender:</span> {profile?.gender ?? 'N/A'}</p>
                <p><span className="font-medium text-foreground/60">Age:</span> {profile?.age ?? 'N/A'}</p>
                <p><span className="font-medium text-foreground/60">Education:</span> {profile?.education_level ?? 'N/A'}</p>
                <p><span className="font-medium text-foreground/60">Experience:</span> {profile?.experience_summary ?? 'N/A'}</p>
                <p><span className="font-medium text-foreground/60">Address:</span> {profile?.address ?? 'N/A'}</p>
              </div>
              
              <div className="mt-4">
                <h4 className="font-bold text-sm mb-2 text-primary uppercase tracking-wider">Cover Letter</h4>
                <div className="p-3 bg-muted/30 rounded text-xs whitespace-pre-wrap italic">
                  {a.cover_letter ?? 'No cover letter provided.'}
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-sm mb-3 text-primary uppercase tracking-wider">Documents</h4>
              <div className="space-y-2">
                {docs.map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between p-2 bg-muted/20 rounded border border-border/50">
                    <span className="text-xs font-medium">{d.document_type}</span>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-7 text-[10px]"
                      onClick={async () => {
                        try {
                          const { blob } = await AdminApi.downloadDocument(d.id)
                          const url = URL.createObjectURL(blob)
                          window.open(url, '_blank')
                          setTimeout(() => URL.revokeObjectURL(url), 10000)
                        } catch (e) { await showAlert('Download failed', 'Error') }
                      }}
                    >
                      View
                    </Button>
                  </div>
                ))}
                {docs.length === 0 && <p className="text-xs text-foreground/50">No documents uploaded.</p>}
              </div>
              
              {(a.interview_datetime || a.interview_date) && (
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded">
                  <h4 className="font-bold text-xs text-yellow-800 dark:text-yellow-500 mb-1">Interview Scheduled</h4>
                  <p className="text-xs">{new Date(a.interview_datetime || a.interview_date).toLocaleString()}</p>
                  <p className="text-[10px] text-foreground/60 mt-1 italic">Response: {a.interview_response ?? 'Pending'}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <main className="min-h-screen flex flex-col bg-background">
      <div className="max-w-7xl mx-auto w-full px-4 py-10 flex-1">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Global Applications</h1>
            <p className="text-foreground/60 text-sm">Manage and track all candidate applications across the platform.</p>
          </div>
          <div className="w-full md:w-80">
            <input 
              type="text"
              placeholder="Search by name, job, or agency..."
              className="w-full px-4 py-2 rounded-full border border-border bg-card shadow-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-100">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-4">
            {filteredApps.map(renderApp)}
            {filteredApps.length === 0 && (
              <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed border-border">
                <p className="text-foreground/50">No applications found matching your criteria.</p>
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </main>
  )
}

export default AdminApplicationsPage
