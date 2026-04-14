 'use client'

import React, { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Applications } from '@/lib/api'
import { useTranslation } from 'react-i18next'

const MyApplicationsPage: React.FC = () => {
  const { t } = useTranslation()
  const [apps, setApps] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        const res = await Applications.myApplications()
        const list = Array.isArray(res) ? res : (res.data ?? [])
        if (mounted) setApps(list)
      } catch (err: any) {
        if (mounted) setError(err?.message ?? t('myApplicationsPage.loadError'))
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => { mounted = false }
  }, [t])

  return (
    <main className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto w-full px-4 py-12">
        <h1 className="text-3xl font-bold text-foreground mb-4">{t('myApplicationsPage.title')}</h1>
        {loading && <p>{t('myApplicationsPage.loading')}</p>}
        {error && <p className="text-red-600">{error}</p>}

        <div className="space-y-4">
          {apps.map((a: any) => (
            <div key={a.id} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{a.job?.title ?? t('myApplicationsPage.job')}</h3>
                  <p className="text-sm text-foreground/60">{a.job?.company_name ?? ''}</p>
                </div>
                <div className="text-sm font-semibold">{a.workflow_status ?? a.status}</div>
              </div>
              <p className="text-xs text-foreground/60 mt-2">{t('myApplicationsPage.applied')}: {a.created_at ? new Date(a.created_at).toLocaleDateString() : ''}</p>
            </div>
          ))}
          {apps.length === 0 && !loading && <p className="text-foreground/60">{t('myApplicationsPage.noApplications')}</p>}
        </div>
      </div>
      <Footer />
    </main>
  )
}

export default MyApplicationsPage
