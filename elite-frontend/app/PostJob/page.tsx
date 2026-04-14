"use client"

import React, { useState } from "react"
import { Jobs } from "../../lib/api"
import { useRouter } from "next/navigation"
import { useTranslation } from 'react-i18next'

export default function PostJobPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [jobType, setJobType] = useState("Full-time")
  const [skillCategory, setSkillCategory] = useState("")
  const [employerName, setEmployerName] = useState("")
  const [country, setCountry] = useState("")
  const [vacancies, setVacancies] = useState(1)
  const [salaryRange, setSalaryRange] = useState("")
  const [applicationDeadline, setApplicationDeadline] = useState("")
  const [requiredQualifications, setRequiredQualifications] = useState("")
  const [isHighLevel, setIsHighLevel] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!Number.isFinite(vacancies) || Number(vacancies) < 1) {
      setError(t('postJobPage.vacanciesRequired'))
      return
    }

    setLoading(true)
    try {
      const payload = {
        title: { en: title },
        description: { en: description },
        category,
        job_type: jobType,
        skill_category: skillCategory || category,
        employer_name: employerName || undefined,
        country,
        vacancies_total: Number(vacancies),
        salary_range: salaryRange || undefined,
        application_deadline: applicationDeadline || undefined,
        required_qualifications: requiredQualifications
          .split(/\n|,/)
          .map((line) => line.trim())
          .filter((line) => line.length > 0),
        is_high_level: isHighLevel || undefined,
      }

      await Jobs.partnerCreate(payload)
      router.push("/Dashboard")
    } catch (err: any) {
      setError(err?.message || t('postJobPage.loadError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col bg-background px-4 py-12">
      <div className="max-w-3xl w-full mx-auto">
        <h1 className="text-2xl font-bold mb-4">{t('postJobPage.title')}</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">{t('postJobPage.jobTitle')}</label>
            <input required value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 block w-full rounded-md border px-3 py-2" />
          </div>

          <div>
            <label className="block text-sm font-medium">{t('postJobPage.description')}</label>
            <textarea required value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 block w-full rounded-md border px-3 py-2" rows={6} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">{t('postJobPage.category')}</label>
              <input required value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 block w-full rounded-md border px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">{t('postJobPage.jobType')}</label>
              <select value={jobType} onChange={(e) => setJobType(e.target.value)} className="mt-1 block w-full rounded-md border px-3 py-2">
                <option value="Full-time">{t('postJobPage.jobTypes.fullTime')}</option>
                <option value="Part-time">{t('postJobPage.jobTypes.partTime')}</option>
                <option value="Contract">{t('postJobPage.jobTypes.contract')}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">{t('postJobPage.skillCategory')}</label>
              <input value={skillCategory} onChange={(e) => setSkillCategory(e.target.value)} className="mt-1 block w-full rounded-md border px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">{t('postJobPage.employer')}</label>
              <input value={employerName} onChange={(e) => setEmployerName(e.target.value)} className="mt-1 block w-full rounded-md border px-3 py-2" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">{t('postJobPage.country')}</label>
              <input required value={country} onChange={(e) => setCountry(e.target.value)} className="mt-1 block w-full rounded-md border px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">{t('postJobPage.deadline')}</label>
              <input type="date" value={applicationDeadline} onChange={(e) => setApplicationDeadline(e.target.value)} className="mt-1 block w-full rounded-md border px-3 py-2" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium">{t('postJobPage.vacancies')}</label>
              <input required type="number" min={1} value={vacancies} onChange={(e) => setVacancies(Number(e.target.value))} className="mt-1 block w-full rounded-md border px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">{t('postJobPage.salaryRange')}</label>
              <input value={salaryRange} onChange={(e) => setSalaryRange(e.target.value)} className="mt-1 block w-full rounded-md border px-3 py-2" />
            </div>
            <div className="flex items-end">
              <label className="inline-flex items-center">
                <input type="checkbox" checked={isHighLevel} onChange={(e) => setIsHighLevel(e.target.checked)} className="mr-2" />
                {t('postJobPage.highLevel')}
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">{t('postJobPage.qualifications')}</label>
            <textarea
              value={requiredQualifications}
              onChange={(e) => setRequiredQualifications(e.target.value)}
              className="mt-1 block w-full rounded-md border px-3 py-2"
              rows={4}
            />
          </div>

          {error && <div className="text-destructive">{error}</div>}

          <div>
            <button type="submit" disabled={loading} className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md">
              {loading ? t('postJobPage.submitting') : t('postJobPage.submitJob')}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
