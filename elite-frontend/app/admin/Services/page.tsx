'use client'

import React, { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Admin } from '@/lib/api'
import { Button } from '@/components/ui/button'

export default function AdminServicesPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await Admin.services()
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

  async function handleCreate() {
    if (!title) return alert('Enter title')
    try {
      await Admin.createService({ title, description })
      window.location.reload()
    } catch (e: any) {
      alert(e?.message ?? 'Failed')
    }
  }

  return (
    <main className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Manage Services</h1>

        <div className="mb-6 grid md:grid-cols-2 gap-4">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="px-3 py-2 border rounded" />
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" className="px-3 py-2 border rounded" />
        </div>
        <div className="mb-8">
          <Button onClick={handleCreate} className="bg-primary text-primary-foreground">Create Service</Button>
        </div>

        <div>
          {loading && <div>Loading...</div>}
          {error && <div className="text-red-600">{error}</div>}
          {!loading && !error && (
            <div className="space-y-3">
              {items.map((s) => (
                <div key={s.id} className="p-4 border rounded flex justify-between items-center">
                  <div>
                    <div className="font-semibold">{s.title}</div>
                    <div className="text-sm text-foreground/60">{s.description}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={async () => {
                      const newTitle = prompt('Title', s.title)
                      if (!newTitle) return
                      try {
                        await Admin.updateService(s.id, { title: newTitle })
                        window.location.reload()
                      } catch (e) { console.error(e) }
                    }} variant="outline">Edit</Button>
                    <Button onClick={async () => {
                      if (!confirm('Delete?')) return
                      try {
                        await Admin.deleteService(s.id)
                        window.location.reload()
                      } catch (e) { console.error(e) }
                    }} className="bg-red-600 text-white">Delete</Button>
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
