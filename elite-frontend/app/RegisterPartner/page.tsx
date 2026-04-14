'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Auth } from '@/lib/api'
import { useTranslation } from 'react-i18next'

export default function RegisterPartnerPage() {
  const { t } = useTranslation()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
    company_name: '',
    company_email: '',
    company_phone: '',
    country: '',
  })
  const [licenseFile, setLicenseFile] = useState<File | null>(null)

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [event.target.name]: event.target.value }))
  }

  const router = useRouter()

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!licenseFile) {
      setError(t('registerPartnerPage.licenseRequired'))
      return
    }

    setIsSubmitting(true)
    try {
      const body = new FormData()
      Object.entries(formData).forEach(([key, value]) => body.append(key, value))
      body.append('license_file', licenseFile)

      await Auth.registerPartner(body)

      setSuccess(t('registerPartnerPage.submitSuccess'))
      // show success then redirect to Login so user can sign in once approved
      setTimeout(() => router.push('/Login'), 1400)
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
        company_name: '',
        company_email: '',
        company_phone: '',
        country: '',
      })
      setLicenseFile(null)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t('registerPartnerPage.submitFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-foreground mb-2">{t('registerPartnerPage.title')}</h1>
          <p className="text-foreground/60">{t('registerPartnerPage.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-8 shadow-sm space-y-5">
          {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          {success && <p className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">{success}</p>}

          <div className="grid md:grid-cols-2 gap-4">
            <input name="name" value={formData.name} onChange={handleChange} placeholder={t('registerPartnerPage.contactName')} required className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground outline-none focus:ring-2 focus:ring-primary" />
            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder={t('registerPartnerPage.contactEmail')} required className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground outline-none focus:ring-2 focus:ring-primary" />
            <input name="phone" value={formData.phone} onChange={handleChange} placeholder={t('registerPartnerPage.phone')} required className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground outline-none focus:ring-2 focus:ring-primary" />
            <input name="country" value={formData.country} onChange={handleChange} placeholder={t('registerPartnerPage.country')} className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground outline-none focus:ring-2 focus:ring-primary" />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <input name="company_name" value={formData.company_name} onChange={handleChange} placeholder={t('registerPartnerPage.companyName')} required className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground outline-none focus:ring-2 focus:ring-primary" />
            <input type="email" name="company_email" value={formData.company_email} onChange={handleChange} placeholder={t('registerPartnerPage.companyEmail')} className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground outline-none focus:ring-2 focus:ring-primary" />
            <input name="company_phone" value={formData.company_phone} onChange={handleChange} placeholder={t('registerPartnerPage.companyPhone')} className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground outline-none focus:ring-2 focus:ring-primary" />
            <label className="block rounded-lg border border-border bg-background px-4 py-3">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-foreground/70">
                {t('registerPartnerPage.uploadLicenseTitle', { defaultValue: 'Upload License Document' })}
              </span>
              <span className="mb-2 block text-xs text-foreground/60">
                {t('registerPartnerPage.uploadLicenseHelp', { defaultValue: 'Attach your company license (PDF, JPG, PNG) for approval review.' })}
              </span>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(event) => setLicenseFile(event.target.files?.[0] ?? null)} required className="w-full text-foreground outline-none" />
            </label>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder={t('registerPartnerPage.password')} required className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground outline-none focus:ring-2 focus:ring-primary" />
            <input type="password" name="password_confirmation" value={formData.password_confirmation} onChange={handleChange} placeholder={t('registerPartnerPage.confirmPassword')} required className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground outline-none focus:ring-2 focus:ring-primary" />
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
            {isSubmitting ? t('registerPartnerPage.submitting') : t('registerPartnerPage.submit')}
          </Button>

          <p className="text-center text-sm text-foreground/60">
            {t('registerPartnerPage.alreadyAccount')} <Link href="/Login" className="text-primary font-semibold">{t('registerPartnerPage.login')}</Link>
          </p>
        </form>
      </div>

      <Footer />
    </main>
  )
}
