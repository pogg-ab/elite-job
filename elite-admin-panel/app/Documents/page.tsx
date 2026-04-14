 'use client'

import React, { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { AdminApi } from '@/lib/api'
import { showAlert } from '@/lib/popup'

const AdminDocumentsPage: React.FC = () => {
  const [docs, setDocs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        const res = await AdminApi.documents()
        const list = Array.isArray(res) ? res : (res.data ?? [])
        if (mounted) setDocs(list)
      } catch (err: any) {
        if (mounted) setError(err?.message ?? 'Failed to load documents')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => { mounted = false }
  }, [])

  const updateStatus = async (id: number, status: string) => {
    try {
      await AdminApi.updateDocumentStatus(id, { status })
      setDocs((s) => s.map(d => d.id === id ? { ...d, status } : d))
    } catch (err: any) {
      await showAlert(err?.message ?? 'Failed to update status', 'Error')
    }
  }

  const download = async (id: number) => {
    try {
      const { blob, disposition } = await AdminApi.downloadDocument(id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = disposition.split('filename=')[1]?.replace(/\"|\'/g, '') ?? `document-${id}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      await showAlert(err?.message ?? 'Download failed', 'Error')
    }
  }

  return (
    <main className="min-h-screen flex flex-col bg-background">
      <div className="max-w-7xl mx-auto w-full px-4 py-12">
        <h1 className="text-3xl font-bold text-foreground mb-4">Admin — Documents</h1>
        {loading && <p>Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}

        <div className="space-y-3">
          {docs.map((d: any) => (
            <div key={d.id} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold">{d.document_type ?? d.name}</p>
                <p className="text-xs text-foreground/60">Owner: {d.user?.name ?? d.user?.email}</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => download(d.id)}>Download</Button>
                <Button variant="outline" onClick={() => updateStatus(d.id, d.status === 'verified' ? 'pending' : 'verified')}>{d.status === 'verified' ? 'Mark Pending' : 'Verify'}</Button>
              </div>
            </div>
          ))}
          {docs.length === 0 && !loading && <p className="text-foreground/60">No documents found.</p>}
        </div>
      </div>
      <Footer />
    </main>
  )
}

export default AdminDocumentsPage
