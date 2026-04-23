"use client"

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { API_BASE_URL } from '@/lib/api'

interface FooterProps {
  hideSeekerSection?: boolean
}

const Footer: React.FC<FooterProps> = ({ hideSeekerSection = false }) => {
  const { t } = useTranslation()
  const currentYear = new Date().getFullYear()
  const [termsPolicy, setTermsPolicy] = useState<any | null>(null)
  const [privacyPolicy, setPrivacyPolicy] = useState<any | null>(null)

  useEffect(() => {
    let mounted = true
      ; (async () => {
        try {
          const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? API_BASE_URL ?? 'http://127.0.0.1:8000'
          const t = await fetch(`${base}/api/policies/terms`).then(r => r.json()).catch(() => null)
          const p = await fetch(`${base}/api/policies/privacy`).then(r => r.json()).catch(() => null)
          if (!mounted) return
          setTermsPolicy(t?.data ?? null)
          setPrivacyPolicy(p?.data ?? null)
        } catch {
          // ignore
        }
      })()
    return () => { mounted = false }
  }, [])

  return (
    <footer className="bg-primary text-white border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src="/logo.jpeg" alt="Elite" className="w-8 h-8 object-contain rounded-lg border border-white/20" />
              <span className="font-bold text-lg text-white">Elite</span>
            </div>

            <p className="text-white/80 text-sm leading-relaxed">{t('footer.company_para')}</p>
          </div>

          {/* Quick Links */}
          {!hideSeekerSection && (
            <div>
              <h4 className="font-semibold text-[#C5A06A] mb-4">{t('footer.for_job_seekers')}</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/Jobs" className="text-white/70 hover:text-[#C5A06A] transition">{t('footer.browse_jobs')}</Link></li>
                <li><Link href="/RegisterMultiStep" className="text-white/70 hover:text-[#C5A06A] transition">{t('footer.create_profile')}</Link></li>
                <li><Link href="/HowItWorks" className="text-white/70 hover:text-[#C5A06A] transition">{t('footer.how_it_works')}</Link></li>
              </ul>
            </div>
          )}

          {/* For Employers */}
          <div>
            <h4 className="font-semibold text-[#C5A06A] mb-4">{t('footer.for_employers')}</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-white/70 hover:text-[#C5A06A] transition">{t('footer.post_jobs')}</a></li>
              <li><a href="#" className="text-white/70 hover:text-[#C5A06A] transition">{t('footer.features')}</a></li>
            </ul>
          </div>

          {/* Legal & Support */}
          <div>
            <h4 className="font-semibold text-[#C5A06A] mb-4">{t('footer.support')}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/Contact" className="text-white/70 hover:text-[#C5A06A] transition">{t('footer.contact_us')}</Link></li>
              <li><a href="#" className="text-white/70 hover:text-[#C5A06A] transition">{t('footer.faqs')}</a></li>
              <li>
                {privacyPolicy && privacyPolicy.file_path ? (
                  <a href={`${API_BASE_URL}/api/policies/${privacyPolicy.id}/download`} target="_blank" rel="noreferrer" className="text-white/70 hover:text-[#C5A06A] transition">{t('footer.privacy_policy')} (PDF)</a>
                ) : (
                  <Link href="/RegisterMultiStep" className="text-white/70 hover:text-[#C5A06A] transition">{t('footer.privacy_policy')}</Link>
                )}
              </li>
              <li>
                {termsPolicy && termsPolicy.file_path ? (
                  <a href={`${API_BASE_URL}/api/policies/${termsPolicy.id}/download`} target="_blank" rel="noreferrer" className="text-white/70 hover:text-[#C5A06A] transition">{t('footer.terms_of_service')} (PDF)</a>
                ) : (
                  <Link href="/RegisterMultiStep" className="text-white/70 hover:text-[#C5A06A] transition">{t('footer.terms_of_service')}</Link>
                )}
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-white/60">
            <p>&copy; {currentYear} {t('footer.rights_reserved')}</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-[#C5A06A] transition">{t('footer.linkedin')}</a>
              <a href="#" className="hover:text-[#C5A06A] transition">{t('footer.twitter')}</a>
              <a href="#" className="hover:text-[#C5A06A] transition">{t('footer.facebook')}</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
