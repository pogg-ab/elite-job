'use client'

import React, { useEffect, useState } from 'react'
import Footer from '@/components/Footer'
import { AdminApi, API_BASE_URL } from '@/lib/api'
import { showAlert, showConfirm, showPrompt } from '@/lib/popup'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function PoliciesPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [policyForm, setPolicyForm] = useState({ title: '', type: 'terms', content: '', file: null as File | null })

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await AdminApi.policies()
        const list = Array.isArray(res) ? res : (res.data ?? [])
        if (mounted) setItems(list)
      } catch (e: any) {
        if (mounted) setError(e?.message ?? 'Failed to load')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  return (
    <main className="min-h-screen flex flex-col bg-background">

      <div className="max-w-6xl mx-auto px-4 py-8">
        <section className="relative isolate mb-6 overflow-hidden rounded-3xl border border-border/80 bg-card px-6 py-6 shadow-sm">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-br from-primary/14 via-background to-cyan-200/20" />
          <div className="pointer-events-none absolute -top-16 -left-12 -z-10 h-44 w-44 rounded-full bg-primary/12 blur-3xl" />
          <div className="pointer-events-none absolute right-0 top-3 -z-10 h-44 w-44 rounded-full bg-primary/14 blur-3xl" />

          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-black text-foreground">Manage Policies</h1>
              <p className="text-foreground/65">Create and manage site policies and documents.</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border/80 bg-card p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-3">Create Policy (Quick)</h2>
          <form onSubmit={async (e) => {
            e.preventDefault()
            try {
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
              window.location.reload()
            } catch (err) {
              console.error(err)
              await showAlert('Failed to create policy', 'Error')
            }
          }} className="space-y-3">
            <input required value={policyForm.title} onChange={(e) => setPolicyForm((s) => ({ ...s, title: e.target.value }))} placeholder="Policy title" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 shadow-sm" />
            <select value={policyForm.type} onChange={(e) => setPolicyForm((s) => ({ ...s, type: e.target.value }))} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 shadow-sm">
              <option value="terms">Terms of Service</option>
              <option value="privacy">Privacy Policy</option>
            </select>
            <textarea value={policyForm.content} onChange={(e) => setPolicyForm((s) => ({ ...s, content: e.target.value }))} placeholder="Optional: short summary (will be ignored if PDF uploaded)" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 shadow-sm h-28" />
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Upload PDF (optional)</label>
              <input type="file" accept="application/pdf" onChange={(e) => setPolicyForm((s) => ({ ...s, file: e.target.files && e.target.files[0] ? e.target.files[0] : null }))} className="w-full" />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="bg-primary text-primary-foreground">Create Policy</Button>
              <Link href="/Policies"><Button variant="outline">Refresh</Button></Link>
            </div>
          </form>
        </section>

        <div>
          {loading && <div>Loading...</div>}
          {error && <div className="text-red-600">{error}</div>}
          {!loading && !error && (
            <div className="grid gap-3">
              {items.map((p) => (
                <div key={p.id} className="p-4 rounded-xl border border-border/80 bg-background/95 flex justify-between items-start shadow-sm">
                  <div className="flex-1">
                    <div className="font-semibold">{p.title} <span className="text-sm text-foreground/60">({p.type})</span></div>
                    <div className="text-sm text-foreground/60 mt-2">{p.content ? p.content.slice(0, 200) : ''}</div>
                    {p.file_path && (
                      <div className="mt-2">
                        <a href={`${API_BASE_URL}/api/policies/${p.id}/download`} target="_blank" rel="noreferrer" className="text-primary underline">Download PDF</a>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button onClick={async () => {
                      const newTitle = await showPrompt('Enter a new title', p.title, 'Edit Policy', 'Title')
                      if (!newTitle) return
                      try {
                        await AdminApi.updatePolicy(p.id, { title: newTitle })
                        window.location.reload()
                      } catch (e) { console.error(e) }
                    }} variant="outline">Edit</Button>
                    <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-50" onClick={async () => {
                      if (!await showConfirm('Delete this policy?', 'Confirm Delete')) return
                      try {
                        await AdminApi.deletePolicy(p.id)
                        window.location.reload()
                      } catch (e) { console.error(e) }
                    }}>Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  )
}
