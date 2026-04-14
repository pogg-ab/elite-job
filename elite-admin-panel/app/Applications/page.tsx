 'use client'

import React, { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { AdminApi } from '@/lib/api'
import { showAlert } from '@/lib/popup'

const AdminApplicationsPage: React.FC = () => {
  const [apps, setApps] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        const res = await AdminApi.applications()
        const list = Array.isArray(res) ? res : (res.data ?? [])
        if (mounted) setApps(list)
      } catch (err: any) {
        if (mounted) setError(err?.message ?? 'Failed to load applications')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => { mounted = false }
  }, [])

  const updateStatus = async (id: number, status: string) => {
    try {
      await AdminApi.updateApplicationStatus(id, { status })
      setApps((s) => s.map(a => a.id === id ? { ...a, status } : a))
    } catch (err: any) {
      await showAlert(err?.message ?? 'Failed to update status', 'Error')
    }
  }

  return (
    <main className="min-h-screen flex flex-col bg-background">
      <div className="max-w-7xl mx-auto w-full px-4 py-12">
        <h1 className="text-3xl font-bold text-foreground mb-4">Admin — Applications</h1>
        {loading && <p>Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}

        <div className="space-y-4">
          {apps.map((a: any) => (
            <div key={a.id} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{a.job?.title ?? 'Job'}</h3>
                  <p className="text-sm text-foreground/60">Applicant: {a.user?.name ?? a.user?.email}</p>
                </div>
                <div className="text-sm font-semibold">{a.status ?? a.workflow_status}</div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button onClick={() => updateStatus(a.id, 'shortlisted')}>Shortlist</Button>
                <Button variant="outline" onClick={() => updateStatus(a.id, 'rejected')}>Reject</Button>
              </div>
            </div>
          ))}
          {apps.length === 0 && !loading && <p className="text-foreground/60">No applications found.</p>}
        </div>
      </div>
      <Footer />
    </main>
  )
}

export default AdminApplicationsPage
