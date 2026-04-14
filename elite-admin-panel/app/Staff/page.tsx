'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { SuperAdmin } from '@/lib/api'

export default function StaffPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', password_confirmation: '', preferred_language: 'en' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setNotice(null)
    if (form.password !== form.password_confirmation) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      await SuperAdmin.createStaff(form)
      setNotice('Staff account created successfully')
      setForm({ name: '', email: '', phone: '', password: '', password_confirmation: '', preferred_language: 'en' })
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create staff')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <section className="relative isolate mb-6 overflow-hidden rounded-3xl border border-border/80 bg-card px-6 py-6 shadow-sm">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-br from-primary/14 via-background to-cyan-200/20" />
          <div className="pointer-events-none absolute -top-16 -left-12 -z-10 h-44 w-44 rounded-full bg-primary/12 blur-3xl" />
          <div className="pointer-events-none absolute right-0 top-3 -z-10 h-44 w-44 rounded-full bg-primary/14 blur-3xl" />

          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-black text-foreground">Staff Management</h1>
              <p className="text-foreground/65">Create and manage staff accounts.</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border/80 bg-card p-6 max-w-2xl shadow-sm">
          <h2 className="text-xl font-semibold text-foreground">Create Staff Account</h2>
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
          {notice && <p className="text-sm text-primary mt-2">{notice}</p>}
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <input required value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} placeholder="Name" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 shadow-sm" />
            <input required type="email" value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} placeholder="Email" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 shadow-sm" />
            <input required value={form.phone} onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))} placeholder="Phone (e.g. 0941291771)" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 shadow-sm" />
            <div className="grid grid-cols-2 gap-3">
              <input required type="password" value={form.password} onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))} placeholder="Password" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 shadow-sm" />
              <input required type="password" value={form.password_confirmation} onChange={(e) => setForm((s) => ({ ...s, password_confirmation: e.target.value }))} placeholder="Confirm password" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 shadow-sm" />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="bg-primary text-primary-foreground rounded-lg" disabled={loading}>{loading ? 'Creating...' : 'Create Staff'}</Button>
              <Link href="/Dashboard"><Button variant="outline" className="rounded-lg">Back to Dashboard</Button></Link>
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}
