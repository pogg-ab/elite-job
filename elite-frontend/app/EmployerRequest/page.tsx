"use client"

import React, { useState } from 'react'
import Navbar from '@/components/Navbar'
import { useTranslation } from 'react-i18next'
import Footer from '@/components/Footer'
import { API_BASE_URL } from '@/lib/api'
import { Button } from '@/components/ui/button'
import DocumentUpload from '@/components/DocumentUpload'
import { useRouter } from 'next/navigation'

export default function EmployerRequestPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const [form, setForm] = useState({ company_name: '', contact_person: '', email: '', phone: '', country: '' })
  const [jobs, setJobs] = useState([{ job_title: '', number_of_workers: 1, job_description: '' }])
  const [duplicateError, setDuplicateError] = useState<string | null>(null)
  const [licenseFile, setLicenseFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  function updateJob(idx: number, key: string, value: any) {
    setJobs((prev) => {
      const next = prev.map((j, i) => i === idx ? { ...j, [key]: value } : j)
      // check duplicates after update
      const titles = next.map((x) => (x.job_title || '').trim().toLowerCase()).filter(Boolean)
      const dup = titles.some((t, i) => titles.indexOf(t) !== i)
      setDuplicateError(dup ? 'Duplicate job titles are not allowed' : null)
      return next
    })
  }

  function addJob() {
    // prevent adding if there are duplicates currently
    const titles = jobs.map((x) => (x.job_title || '').trim().toLowerCase()).filter(Boolean)
    const dup = titles.some((t, i) => titles.indexOf(t) !== i)
    if (dup) {
      setDuplicateError('Resolve duplicate job titles before adding another')
      return
    }
    setJobs((p) => [...p, { job_title: '', number_of_workers: 1, job_description: '' }])
  }
  function removeJob(idx: number) { setJobs((p) => p.filter((_, i) => i !== idx)) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    // require all top-level fields
    if (!form.company_name.trim()) { setError('Company name is required'); return }
    if (!form.contact_person.trim()) { setError('Contact person is required'); return }
    if (!form.email.trim()) { setError('Email is required'); return }
    if (!form.phone.trim()) { setError('Phone is required'); return }
    // validate phone
    try {
      const { isValidEthiopianPhone, phoneValidationMessage, normalizeEthiopianPhone } = await import('@/lib/validation')
      if (!isValidEthiopianPhone(form.phone)) {
        const msg = phoneValidationMessage(form.phone)
        setPhoneError(msg)
        setError(msg)
        return
      }
      // normalize before submit
      setForm((f) => ({ ...f, phone: normalizeEthiopianPhone(f.phone) }))
      setPhoneError(null)
    } catch (e) {
      // if validation util fails for some reason, allow but don't normalize
    }
    if (!form.country.trim()) { setError('Country is required'); return }
    if (jobs.length === 0) { setError('Add at least one job'); return }
    if (jobs.some(j => !j.job_title.trim())) { setError('All jobs must have a title'); return }
    if (jobs.some(j => !String(j.number_of_workers))) { setError('Number of workers is required for all jobs'); return }
    if (jobs.some(j => !j.job_description || !String(j.job_description).trim())) { setError('All jobs must have a description'); return }
    if (!licenseFile) { setError('License file is required'); return }
    // check duplicates before submit
    const titles = jobs.map((x) => (x.job_title || '').trim().toLowerCase()).filter(Boolean)
    const dup = titles.some((t, i) => titles.indexOf(t) !== i)
    if (dup) { setError('Duplicate job titles are not allowed'); return }

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('company_name', form.company_name)
      formData.append('contact_person', form.contact_person)
      formData.append('email', form.email)
      formData.append('phone', form.phone)
      formData.append('country', form.country)
      formData.append('jobs', JSON.stringify(jobs))
      if (licenseFile) formData.append('license', licenseFile)

      const res = await fetch(`${API_BASE_URL}/api/employer-requests`, {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        let errMsg = 'Submit failed'
        try {
          const json = await res.json()
          errMsg = json.error || json.message || errMsg
        } catch (err) {
          // ignore json parse errors
        }
        throw new Error(errMsg)
      }
      setSuccess('Request submitted — we will contact you')
      setForm({ company_name: '', contact_person: '', email: '', phone: '', country: '' })
      setJobs([{ job_title: '', number_of_workers: 1, job_description: '' }])
      setLicenseFile(null)
      // Optionally redirect to a thank-you page
    } catch (err: any) {
      setError(err?.message ?? 'Failed')
    } finally { setSubmitting(false) }
  }

  return (
    <main className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <section className="relative overflow-hidden border-b border-border/60 bg-linear-to-br from-primary/10 via-background to-primary/5 px-4 py-12">
        <div className="pointer-events-none absolute -left-20 top-8 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 -top-8 h-56 w-56 rounded-full bg-primary/15 blur-3xl" />
        <div className="relative mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full border border-primary/30 bg-white/70 px-3 py-1 text-xs font-semibold tracking-wide text-primary shadow-sm">
              {t('employerRequest.badge', 'Employer Requests')}
            </span>
            <h1 className="mt-4 text-4xl font-black leading-tight text-foreground">{t('employerRequest.title', 'Foreign Employer Hiring Request')}</h1>
            <p className="mt-4 text-lg text-foreground/70">{t('employerRequest.subtitle', 'Register your company and submit labor requirements. We will review and contact you.')}</p>
          </div>
        </div>
      </section>

      <div className="flex-1 mx-auto w-full max-w-7xl px-4 py-12 md:py-14">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm md:p-8">
              {error && <div className="mb-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-red-700">{error}</div>}
              {success && (
                <div className="mb-6 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3">
                  <p className="font-semibold text-primary">✓ Request submitted</p>
                  <p className="text-sm text-primary/85">We will review your request and contact you shortly.</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-3">
                  <input
                    value={form.company_name}
                    onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                    placeholder="Company name"
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    required
                  />
                  <input
                    value={form.contact_person}
                    onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
                    placeholder="Contact person"
                    required
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="Email"
                      required
                      type="email"
                      className="rounded-lg border border-border bg-background px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                      <input
                        type="text"
                        value={form.phone}
                        onChange={(e) => { setForm({ ...form, phone: e.target.value }); setPhoneError(null) }}
                        placeholder="+2519XXXXXXXX"
                        required
                        className="rounded-lg border border-border bg-background px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      {phoneError && <p className="mt-2 text-sm text-red-600">{phoneError}</p>}
                      {!phoneError && <p className="mt-2 text-sm text-foreground/60">+2519XXXXXXXX</p>}
                  </div>
                  <input
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    placeholder="Country"
                    required
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />

                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">{t('employerRequest.jobRequirements', 'Job Requirements')}</h3>
                  {duplicateError && (
                    <div className="mb-2 rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{duplicateError}</div>
                  )}

                  {jobs.map((j, idx) => (
                    <div key={idx} className="rounded-lg border border-border p-4 bg-background/95 shadow-sm">
                      <div className="flex gap-3 items-start">
                        <input
                          value={j.job_title}
                          onChange={(e) => updateJob(idx, 'job_title', e.target.value)}
                          placeholder={t('employerRequest.form.jobTitlePlaceholder', 'Job title')}
                          required
                          className={`flex-1 rounded-md bg-background px-3 py-2 shadow-sm ${j.job_title && jobs.filter(x => x.job_title.trim().toLowerCase() === j.job_title.trim().toLowerCase()).length > 1
                              ? 'border border-red-400'
                              : 'border border-border'
                            }`}
                        />
                        <input
                          type="number"
                          min={1}
                          value={j.number_of_workers}
                          onChange={(e) => updateJob(idx, 'number_of_workers', Number(e.target.value))}
                          placeholder="#"
                          required
                          className="w-24 rounded-md border border-border bg-background px-3 py-2 text-center shadow-sm"
                        />
                        <button type="button" onClick={() => removeJob(idx)} className="text-sm text-red-600">Remove</button>
                      </div>
                        <textarea
                        value={j.job_description}
                        onChange={(e) => updateJob(idx, 'job_description', e.target.value)}
                        placeholder={t('employerRequest.form.jobDescriptionPlaceholder', 'Description')}
                        required
                        className="mt-3 w-full rounded-md border border-border bg-background px-3 py-2 shadow-sm"
                      />
                    </div>
                  ))}
                  <div>
                    <Button type="button" variant="outline" onClick={addJob}>+ Add Another Job</Button>
                  </div>
                </div>

                <div>
                  <label className="block font-medium">Upload License (pdf/jpg/png)</label>
                  <div className="mt-3">
                    <DocumentUpload documentType="License" autoUpload={false} onUpload={(f) => setLicenseFile(f)} />
                  </div>
                  <p className="mt-2 text-xs text-foreground/60">Accepted formats: PDF, JPG, PNG. Max size: 5MB.</p>
                </div>

                <div>
                  <Button type="submit" className="w-full py-3 bg-primary text-primary-foreground text-lg" disabled={submitting}>{submitting ? t('employerRequest.form.submitting', 'Submitting...') : t('employerRequest.form.submit', 'Submit Request')}</Button>
                </div>

              </form>
            </div>
          </div>
        </div>
      </div>
      {/* WhatsApp floating button */}
      <a
        href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '251900000000'}?text=${encodeURIComponent('Hello I need information')}`}
        target="_blank"
        rel="noreferrer"
        className="fixed right-4 bottom-6 z-50 inline-flex items-center gap-3 rounded-full bg-primary px-4 py-3 text-primary-foreground shadow-lg hover:bg-primary/90"

        aria-label="Chat on WhatsApp"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 12.079a9 9 0 10-2.63 6.18L21 21l-1.73-4.73A8.96 8.96 0 0021 12.079z" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /><path d="M17.5 12.5c-.2.5-1.1 1.4-1.8 1.6-.7.2-1.2.2-1.6-.2-.4-.4-1-1.4-1.3-1.9-.3-.5-.7-.4-1.2-.3-.5.1-1 .4-1.5.4-.5 0-.9-.3-1.4-.9" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        <span className="font-semibold">Chat on WhatsApp</span>
      </a>

      <Footer />
    </main>
  )
}
