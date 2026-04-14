'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { AdminApi, Auth, SuperAdmin, clearAdminAuth } from '@/lib/api'

type Stats = {
  total_users: number
  total_seekers: number
  total_partners: number
  pending_partner_approvals: number
  total_jobs: number
  pending_jobs: number
  published_jobs: number
  closed_jobs: number
  pending_applications: number
  shortlisted_applications: number
  hired_applications: number
  placed_applications: number
}

type Agency = {
  id: number
  company_name: string
  country: string | null
  status: string
  owner: {
    id: number
    name: string
    email: string
    phone: string
  }
}

type Me = {
  id: number
  name: string
  email: string
  role: string
  admin_type: 'super_admin' | 'staff' | 'partner' | null
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [me, setMe] = useState<Me | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [pendingAgencies, setPendingAgencies] = useState<Agency[]>([])
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
    preferred_language: 'en',
  })
  const [serviceForm, setServiceForm] = useState({
    title: '',
    description: '',
  })
  const [policyForm, setPolicyForm] = useState({
    title: '',
    type: 'terms',
    content: '',
    file: null as File | null,
  })

  const isSuperAdmin = useMemo(() => me?.admin_type === 'super_admin' || me?.role === 'superadmin', [me])

  const loadDashboard = async () => {
    setError('')
      try {
      const profile = await Auth.me()
      const isAllowedByAdminType = profile.admin_type === 'super_admin' || profile.admin_type === 'staff'
      const isAllowedByRole = profile.role === 'superadmin' || profile.role === 'staff'
      if (!isAllowedByAdminType && !isAllowedByRole) {
        throw new Error('Only superadmin or staff accounts can access this panel.')
      }

      setMe(profile)

      const adminStats = await AdminApi.stats()
      setStats(adminStats)

      if (profile.admin_type === 'super_admin' || profile.role === 'superadmin') {
        const pending = await SuperAdmin.pendingAgencies()
        setPendingAgencies(pending.data ?? [])
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const handleLogout = async () => {
    try {
      await Auth.logout()
    } catch {
      // ignore logout failures and clear local auth regardless
    }

    clearAdminAuth()
    window.location.href = '/Login'
  }

  const handleCreateStaff = async (event: React.FormEvent) => {
    event.preventDefault()
    setNotice('')
    setError('')

    try {
      await SuperAdmin.createStaff(staffForm)

      setNotice('Staff account created successfully.')
      setStaffForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
        preferred_language: 'en',
      })
      await loadDashboard()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to create staff')
    }
  }

  const handleCreateService = async (event: React.FormEvent) => {
    event.preventDefault()
    setNotice('')
    setError('')

    try {
      await AdminApi.createService(serviceForm)
      setNotice('Service created successfully.')
      setServiceForm({ title: '', description: '' })
    } catch (e: any) {
      setError(e?.message ?? 'Failed to create service')
    }
  }

  const handleCreatePolicy = async (event: React.FormEvent) => {
    event.preventDefault()
    setNotice('')
    setError('')

    try {
      // if a file is present, submit as FormData
      if (policyForm.file) {
        const fd = new FormData()
        fd.append('title', policyForm.title)
        fd.append('type', policyForm.type)
        fd.append('content', policyForm.content)
        fd.append('file', policyForm.file)
        await AdminApi.createPolicyForm(fd)
      } else {
        await AdminApi.createPolicy({ title: policyForm.title, type: policyForm.type, content: policyForm.content })
      }
      setNotice('Policy created successfully.')
      setPolicyForm({ title: '', type: 'terms', content: '', file: null })
    } catch (e: any) {
      setError(e?.message ?? 'Failed to create policy')
    }
  }

  const handleAgencyReview = async (agencyId: number, action: 'approve' | 'reject') => {
    setNotice('')
    setError('')

    try {
      await SuperAdmin.reviewAgency(agencyId, { action })
      setNotice(`Agency ${action}d successfully.`)
      await loadDashboard()
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : 'Failed to review agency')
    }
  }

  const handleViewAgencyLicense = async (agencyId: number) => {
    setError('')
    try {
      const { blob } = await SuperAdmin.downloadAgencyLicense(agencyId)
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
      setTimeout(() => URL.revokeObjectURL(url), 10000)
    } catch (viewError) {
      setError(viewError instanceof Error ? viewError.message : 'Failed to open license document')
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="relative isolate overflow-hidden mb-8 rounded-3xl border border-border/80 px-6 py-8 shadow-sm">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-br from-primary/14 via-background to-primary/20" />
          <div className="pointer-events-none absolute -top-20 -left-12 -z-10 h-52 w-52 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute right-0 top-4 -z-10 h-52 w-52 rounded-full bg-amber-300/16 blur-3xl" />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Elite Admin Dashboard</h1>
              <p className="text-foreground/70">Phase 1 onboarding and security control center</p>
            </div>
          </div>
        </div>

        {loading && <p className="text-foreground/70">Loading dashboard...</p>}
        {error && <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {notice && <p className="mb-4 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">{notice}</p>}

        {!loading && me && (
          <div className="space-y-8">
            <section className="grid gap-4 md:grid-cols-4">
              {[
                ['Total Users', stats?.total_users ?? 0],
                ['Pending Partner Approvals', stats?.pending_partner_approvals ?? 0],
                ['Pending Jobs', stats?.pending_jobs ?? 0],
                ['Pending Applications', stats?.pending_applications ?? 0],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-border/80 bg-card/90 p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
                  <p className="text-sm text-foreground/70">{label}</p>
                  <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
                </div>
              ))}
            </section>

            {isSuperAdmin && (
              <section className="grid gap-8 lg:grid-cols-2">
                <div className="rounded-3xl border border-border/80 bg-card/90 p-6 shadow-sm">
                  <h2 className="text-xl font-semibold text-foreground">Pending Foreign Agencies</h2>
                  <div className="mt-4 space-y-3">
                    {pendingAgencies.length === 0 && (
                      <p className="text-sm text-foreground/60">No pending agencies.</p>
                    )}
                    {pendingAgencies.map((agency) => (
                      <div key={agency.id} className="rounded-2xl border border-border bg-background/80 p-4 transition hover:border-primary/25">
                        <p className="font-semibold text-foreground">{agency.company_name}</p>
                        <p className="text-sm text-foreground/60">{agency.owner.email} • {agency.country ?? 'N/A'}</p>
                        <div className="mt-3 flex gap-2">
                          <Button variant="outline" onClick={() => handleViewAgencyLicense(agency.id)}>View Document</Button>
                          <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => handleAgencyReview(agency.id, 'approve')}>Approve</Button>
                          <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50" onClick={() => handleAgencyReview(agency.id, 'reject')}>Reject</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  )
}

