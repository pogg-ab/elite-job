 'use client'

import React, { useEffect, useState } from 'react'
import { AdminApi } from '@/lib/api'
import { showAlert, showConfirm } from '@/lib/popup'
import { Button } from '@/components/ui/button'

export default function FaqAdminPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newQuestion, setNewQuestion] = useState('')
  const [newAnswer, setNewAnswer] = useState('')

  const load = async () => {
    setError(null)
    try {
      const res = await AdminApi.faqs()
      const list = Array.isArray(res) ? res : (res.data ?? res)
      setItems(list)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <section className="relative isolate mb-6 overflow-hidden rounded-3xl border border-border/80 bg-card px-6 py-6 shadow-sm">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-br from-primary/14 via-background to-cyan-200/20" />
          <div className="pointer-events-none absolute -top-16 -left-12 -z-10 h-44 w-44 rounded-full bg-primary/12 blur-3xl" />
          <div className="pointer-events-none absolute right-0 top-3 -z-10 h-44 w-44 rounded-full bg-primary/14 blur-3xl" />

          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-black text-foreground">FAQs</h1>
              <p className="text-foreground/65">Create and manage frequently asked questions.</p>
            </div>
          </div>
        </section>

        <section className="mb-6 rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
          <h3 className="font-semibold mb-2">Create FAQ / Answer</h3>
          <textarea value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} placeholder="Question" className="w-full mb-2 p-3 rounded-xl border border-border bg-background shadow-sm" />
          <textarea value={newAnswer} onChange={(e) => setNewAnswer(e.target.value)} placeholder="Answer (optional)" className="w-full mb-2 p-3 rounded-xl border border-border bg-background shadow-sm" />
          <div className="flex gap-2">
            <Button onClick={async () => {
              try {
                await AdminApi.createFaq({ question: newQuestion, answer: newAnswer, is_public: !!newAnswer })
                setNewQuestion('')
                setNewAnswer('')
                await load()
              } catch (err) { await showAlert('Failed', 'Error') }
            }} disabled={!newQuestion.trim()}>Create</Button>
            <Button variant="outline" onClick={() => { setNewQuestion(''); setNewAnswer('') }}>Clear</Button>
          </div>
        </section>

        {loading && <div>Loading...</div>}
        {error && <div className="text-red-600">{error}</div>}

        <div className="grid gap-3">
          {items.map((f: any) => (
            <div key={f.id} className="rounded-xl border border-border/80 bg-background/85 p-4 shadow-sm">
              <div className="mb-2 font-semibold text-foreground">{f.question}</div>
              <textarea defaultValue={f.answer ?? ''} onBlur={async (e) => {
                try {
                  await AdminApi.updateFaq(f.id, { question: f.question, answer: (e.target as HTMLTextAreaElement).value, is_public: !!(e.target as HTMLTextAreaElement).value })
                  await load()
                } catch (err) { await showAlert('Update failed', 'Error') }
              }} className="w-full p-3 rounded-xl border border-border bg-background shadow-sm mb-2" />
              <div className="flex gap-2">
                <Button onClick={async () => { if (!await showConfirm('Delete this FAQ?', 'Confirm Delete')) return; await AdminApi.deleteFaq(f.id); await load() }} variant="outline" className="rounded-lg">Delete</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
