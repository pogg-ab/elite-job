'use client'

import React, { useMemo, useState } from 'react'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { AdminApi } from '@/lib/api'
import { showAlert } from '@/lib/popup'

const JobsPage: React.FC = () => {
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    country: '',
    employer_name: '',
    job_type: 'Full-time',
    vacancies_total: 1,
    salary_range: '',
    application_deadline: '',
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('All')
  const [selectedType, setSelectedType] = useState('All')

  const [jobs, setJobs] = React.useState<any[]>([])
  const [loadingJobs, setLoadingJobs] = React.useState(false)

  React.useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoadingJobs(true)
      try {
        const res = await AdminApi.adminJobs()
        const list = Array.isArray(res) ? res : (res.data ?? [])
        // Exclude closed jobs from admin listing
        const visible = list.filter((j: any) => ((j.job_status ?? j.status) !== 'closed'))
        if (mounted) setJobs(visible)
      } catch (err) {
        // ignore for now
      } finally {
        if (mounted) setLoadingJobs(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const createJob = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.title.trim() || !form.description.trim() || !form.category.trim() || !form.country.trim()) {
      await showAlert('Please fill title, description, category, and country.', 'Validation')
      return
    }

    if (!Number.isFinite(form.vacancies_total) || Number(form.vacancies_total) < 1) {
      await showAlert('Vacancies must be at least 1.', 'Validation')
      return
    }

    setCreating(true)
    try {
      const payload = {
        title: { en: form.title.trim() },
        description: { en: form.description.trim() },
        category: form.category.trim(),
        country: form.country.trim(),
        employer_name: form.employer_name.trim() || undefined,
        job_type: form.job_type,
        vacancies_total: Number(form.vacancies_total),
        salary_range: form.salary_range.trim() || undefined,
        application_deadline: form.application_deadline || undefined,
        required_qualifications: [],
      }

      if (editingId) {
        const response = await AdminApi.updateJob(editingId, payload)
        const updated = response?.job ?? response?.data?.job ?? null
        if (updated) {
          setJobs((prev) => prev.map((j) => (j.id === editingId ? updated : j)))
        }
        await showAlert('Job updated successfully.', 'Success')
      } else {
        const response = await AdminApi.createJob(payload)
        const created = response?.job ?? response?.data?.job ?? null
        if (created) {
          setJobs((prev) => [created, ...prev])
        }
        await showAlert('Job created successfully.', 'Success')
      }

      setForm({
        title: '',
        description: '',
        category: '',
        country: '',
        employer_name: '',
        job_type: 'Full-time',
        vacancies_total: 1,
        salary_range: '',
        application_deadline: '',
      })
      setCreateModalOpen(false)
      setEditingId(null)
    } catch (err: any) {
      await showAlert(err?.message ?? (editingId ? 'Failed to update job' : 'Failed to create job'), 'Error')
    } finally {
      setCreating(false)
    }
  }

  const closeJob = async (id: number) => {
    try {
      await AdminApi.closeJob(id)
      // Remove closed job from admin listing
      setJobs((s) => s.filter(j => j.id !== id))
    } catch (err) {
      await showAlert('Failed to close job', 'Error')
    }
  }

  const countries = ['All', ...new Set(jobs.map(j => j.country).filter(Boolean))]
  const types = ['All', 'Full-time', 'Part-time', 'Contract']

  const filteredJobs = useMemo(() => jobs
    // ensure closed jobs are not shown
    .filter((job) => ((job.job_status ?? job.status) !== 'closed'))
    .filter((job) => {
    const titleText = typeof job?.title === 'string' ? job.title : (job?.title?.en ?? '')
    const employerText = job?.employer_name ?? job?.foreign_agency?.company_name ?? ''
    const typeText = job?.job_type ?? 'Full-time'

    const matchesSearch =
      titleText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employerText.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCountry = selectedCountry === 'All' || job.country === selectedCountry
    const matchesType = selectedType === 'All' || typeText === selectedType
    return matchesSearch && matchesCountry && matchesType
  }), [jobs, searchQuery, selectedCountry, selectedType])

  return (
    <main className="min-h-screen flex flex-col bg-background">
      {/* Page Header */}
      <section className="bg-linear-to-br from-primary/10 to-secondary/10 border-b border-border px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Admin Jobs</h1>
          <p className="text-lg text-foreground/60 max-w-2xl">
            Superadmin and staff can create, publish, and close jobs from here.
          </p>
        </div>
      </section>

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-12">
        <section className="mb-8 rounded-2xl border border-border bg-card p-5 shadow-sm flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Create New Job</h2>
            <p className="text-sm text-foreground/60">Open the popup form to publish a new job posting.</p>
          </div>
          <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground">Create Job</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Job</DialogTitle>
                <DialogDescription>
                  Fill the required job details. Title, description, category, and country are mandatory.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={createJob} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  value={form.title}
                  onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
                  placeholder="Job title"
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
                />
                <input
                  value={form.employer_name}
                  onChange={(e) => setForm((s) => ({ ...s, employer_name: e.target.value }))}
                  placeholder="Employer name (optional)"
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
                />
                <input
                  value={form.category}
                  onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))}
                  placeholder="Category"
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
                />
                <input
                  value={form.country}
                  onChange={(e) => setForm((s) => ({ ...s, country: e.target.value }))}
                  placeholder="Country"
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
                />
                <select
                  value={form.job_type}
                  onChange={(e) => setForm((s) => ({ ...s, job_type: e.target.value }))}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                </select>
                <input
                  type="number"
                  min={1}
                  value={form.vacancies_total}
                  onChange={(e) => setForm((s) => ({ ...s, vacancies_total: Number(e.target.value) }))}
                  placeholder="Vacancies"
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
                />
                <input
                  value={form.salary_range}
                  onChange={(e) => setForm((s) => ({ ...s, salary_range: e.target.value }))}
                  placeholder="Salary range (optional)"
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
                />
                <input
                  type="date"
                  value={form.application_deadline}
                  onChange={(e) => setForm((s) => ({ ...s, application_deadline: e.target.value }))}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
                />
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                  placeholder="Job description"
                  className="md:col-span-2 w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
                  rows={4}
                />
                <div className="md:col-span-2 flex justify-end">
                  <Button type="submit" className="bg-primary text-primary-foreground" disabled={creating}>
                    {creating ? 'Creating...' : 'Create Job'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </section>

        {/* Filters */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-foreground mb-2">Search Jobs</label>
            <input
              type="text"
              placeholder="Job title or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-card text-foreground placeholder:text-foreground/40 focus:ring-2 focus:ring-primary focus:border-transparent transition outline-none"
            />
          </div>

          {/* Country Filter */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Country</label>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition outline-none"
            >
              {countries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>

          {/* Job Type Filter */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Job Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition outline-none"
            >
              {types.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-sm text-foreground/60">
            {loadingJobs
              ? 'Loading jobs...'
              : <>Showing <span className="font-semibold text-foreground">{filteredJobs.length}</span> of <span className="font-semibold text-foreground">{jobs.length}</span> jobs</>}
          </p>
        </div>

        {/* Job Listings */}
        <div className="grid md:grid-cols-2 gap-6">
          {filteredJobs.map((job) => {
            const titleText = typeof job?.title === 'string' ? job.title : (job?.title?.en ?? 'Untitled Job')
            const descriptionText = typeof job?.description === 'string' ? job.description : (job?.description?.en ?? '')
            const employerText = job?.employer_name ?? job?.foreign_agency?.company_name ?? 'Employer not specified'
            const statusText = job?.job_status ?? job?.status ?? 'pending'

            return (
              <div key={job.id} className="bg-card border border-border rounded-lg p-6 hover:shadow-lg hover:border-primary/30 transition-all duration-300 group">
                <div className="mb-4">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-foreground">{titleText}</h3>
                      <p className="text-foreground/60 font-medium">{employerText}</p>
                    </div>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${((job?.job_type||'').toString() === 'Part-time') ? 'bg-blue-100 text-blue-800' : ((job?.job_type||'').toString() === 'Contract') ? 'bg-purple-100 text-purple-800' : 'bg-primary/10 text-primary'}`}>
                      {job?.job_type ?? 'Full-time'}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-4 mb-4">
                    <div className="flex items-center gap-1 text-foreground/60">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-sm">{job?.country ?? 'N/A'}</span>
                    </div>
                    {job?.salary_range && (
                      <div className="flex items-center gap-1 text-primary font-semibold">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1" />
                        </svg>
                        <span className="text-sm">{job?.salary_range}</span>
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-foreground/70 text-sm leading-relaxed mb-4 line-clamp-2">{descriptionText}</p>

                <div className="mb-6">
                  <p className="text-xs font-semibold text-foreground/60 mb-2 uppercase tracking-wide">REQUIREMENTS</p>
                  <div className="flex flex-wrap gap-2">
                    {/* show small badges for any simple requirement tags if present */}
                    {(job?.required_qualifications || []).slice(0,3).map((rq: any, idx: number) => (
                      <span key={idx} className="inline-block bg-secondary/50 text-secondary-foreground text-xs px-2.5 py-1 rounded-full">{rq}</span>
                    ))}
                    {(job?.required_qualifications || []).length > 3 && (
                      <span className="inline-block text-xs text-foreground/60 px-2.5 py-1">+{(job?.required_qualifications||[]).length - 3} more</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    className="w-full rounded-lg"
                    onClick={() => {
                      // open edit modal
                      setForm({
                        title: titleText,
                        description: descriptionText,
                        category: job?.category ?? '',
                        country: job?.country ?? '',
                        employer_name: job?.employer_name ?? '',
                        job_type: job?.job_type ?? 'Full-time',
                        vacancies_total: job?.vacancies_total ?? 1,
                        salary_range: job?.salary_range ?? '',
                        application_deadline: job?.application_deadline ?? '',
                      })
                      setEditingId(job.id)
                      setCreateModalOpen(true)
                    }}
                  >
                    Edit
                  </Button>
                  <Button onClick={() => closeJob(job.id)} variant="outline">Close</Button>
                </div>
              </div>
            )
          })}
        </div>

        {/* No Results */}
        {filteredJobs.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-semibold text-foreground mb-2">No jobs found</h3>
            <p className="text-foreground/60 mb-6">Try adjusting your search filters</p>
            <Button
              onClick={() => {
                setSearchQuery('')
                setSelectedCountry('All')
                setSelectedType('All')
              }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      <Footer />
    </main>
  )
}

export default JobsPage
