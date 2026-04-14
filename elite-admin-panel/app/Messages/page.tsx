'use client'

import React, { useEffect, useState } from 'react'
import { AdminApi } from '@/lib/api'
import { showAlert, showConfirm } from '@/lib/popup'
import { Button } from '@/components/ui/button'

export default function MessagesPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<any | null>(null)
  const [replyMessage, setReplyMessage] = useState('')

  const load = async () => {
    setError(null)
    try {
      const res = await AdminApi.contacts()
      // admin endpoints return a paginated object or array
      const list = Array.isArray(res) ? res : (res.data ?? res)
      setItems(list)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const formatDate = (value: string | null | undefined) => {
    if (!value) return ''
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return value
    return d.toLocaleString()
  }

  const unreadCount = items.filter((item) => !item.is_read).length

  const handleDeleteContact = async (id: number | string) => {
    const confirmed = await showConfirm('Delete this message thread? This cannot be undone.', 'Delete Message')
    if (!confirmed) return

    try {
      await AdminApi.deleteContact(id)
      if (selected?.id === id) {
        setSelected(null)
        setReplyMessage('')
      }
      await load()
      await showAlert('Message deleted successfully', 'Success')
    } catch (err) {
      await showAlert('Failed to delete message', 'Error')
    }
  }

  return (
    <main className="min-h-screen flex flex-col bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-10 w-full">
        <section className="mb-6 rounded-2xl border border-border/70 bg-linear-to-r from-primary/10 to-primary/5 p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-black text-foreground">Messages</h1>
              <p className="mt-1 text-sm text-foreground/70">Review conversations and reply to users in one place.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-sm">
              <span className="inline-flex h-2 w-2 rounded-full bg-primary" />
              {unreadCount} unread
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-12">
          <aside className="lg:col-span-4 rounded-2xl border border-border/70 bg-card shadow-sm overflow-hidden">
            <div className="border-b border-border/70 px-4 py-3">
              <h2 className="text-base font-bold text-foreground">Inbox</h2>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-3">
              {loading && <div className="rounded-xl border border-border bg-background p-3 text-sm text-foreground/65">Loading...</div>}
              {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

              {!loading && !error && items.length === 0 && (
                <div className="rounded-xl border border-dashed border-border bg-background p-6 text-center text-sm text-foreground/60">
                  No messages yet.
                </div>
              )}

              {!loading && !error && items.length > 0 && (
                <div className="space-y-2">
                  {items.map((c: any) => {
                    const isActive = selected?.id === c.id
                    return (
                      <button
                        key={c.id}
                        type="button"
                        className={`w-full rounded-xl border p-3 text-left transition ${
                          isActive
                            ? 'border-primary/35 bg-primary/10 shadow-sm'
                            : c.is_read
                              ? 'border-border/70 bg-background hover:border-primary/25'
                              : 'border-primary/30 bg-primary/5 hover:border-primary/40'
                        }`}
                        onClick={async () => {
                          const detail = await AdminApi.getContact(c.id)
                          setSelected(detail)
                          setReplyMessage('')
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-foreground">{c.name}</p>
                            <p className="truncate text-xs text-foreground/60">{c.email}</p>
                            {c.phone && <p className="truncate text-xs text-foreground/50">{c.phone}</p>}
                          </div>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${c.is_read ? 'bg-secondary text-foreground/70' : 'bg-primary text-primary-foreground'}`}>
                            {c.is_read ? 'Read' : 'New'}
                          </span>
                        </div>
                        <p className="mt-2 truncate text-sm text-foreground/80">{c.subject}</p>
                        <p className="mt-1 line-clamp-1 text-xs text-foreground/55">{c.message}</p>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </aside>

          <section className="lg:col-span-8 rounded-2xl border border-border/70 bg-card shadow-sm overflow-hidden">
            {!selected && (
              <div className="flex min-h-105 items-center justify-center p-8">
                <div className="max-w-md text-center">
                  <div className="mx-auto mb-4 h-12 w-12 rounded-2xl bg-primary/10 ring-1 ring-primary/25" />
                  <h3 className="text-xl font-bold text-foreground">No conversation selected</h3>
                  <p className="mt-2 text-sm text-foreground/65">Choose a message from the inbox to view details and send a reply.</p>
                </div>
              </div>
            )}

            {selected && (
              <div className="flex flex-col">
                <header className="border-b border-border/70 bg-background/60 px-5 py-4 md:px-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-bold text-foreground">{selected.name}</h2>
                      <p className="text-sm text-foreground/65">{selected.email}</p>
                      {selected.phone && <p className="text-sm text-foreground/55">{selected.phone}</p>}
                    </div>
                    <div className="text-right text-xs text-foreground/60">
                      <p>{formatDate(selected.created_at)}</p>
                      <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 font-semibold ${selected.is_read ? 'bg-secondary text-foreground/70' : 'bg-primary text-primary-foreground'}`}>
                        {selected.is_read ? 'Read' : 'Unread'}
                      </span>
                      <span className={`mt-1 ml-1 inline-flex rounded-full px-2 py-0.5 font-semibold ${selected.is_resolved ? 'bg-primary/10 text-primary' : 'bg-amber-100 text-amber-700'}`}>
                        {selected.is_resolved ? 'Resolved' : 'Open'}
                      </span>
                    </div>
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-foreground">{selected.subject}</h3>
                  <p className="mt-2 whitespace-pre-wrap text-foreground/75 leading-relaxed">{selected.message}</p>
                </header>

                <div className="px-5 py-4 md:px-6">
                  <h4 className="mb-3 text-sm font-bold uppercase tracking-wide text-foreground/60">Conversation</h4>
                  <div className="space-y-3">
                    {(selected.replies ?? []).length === 0 && (
                      <div className="rounded-xl border border-dashed border-border bg-background p-4 text-sm text-foreground/60">
                        No replies yet.
                      </div>
                    )}

                    {(selected.replies ?? []).map((r: any) => (
                      <div
                        key={r.id}
                        className={`rounded-xl border p-3 ${
                          r.sender === 'admin'
                            ? 'ml-6 border-primary/30 bg-primary/10'
                            : 'mr-6 border-border/70 bg-background'
                        }`}
                      >
                        <div className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
                          {r.sender} - {formatDate(r.created_at)}
                        </div>
                        <div className="mt-1 whitespace-pre-wrap text-sm text-foreground/80">{r.message}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-border/70 bg-background/40 px-5 py-4 md:px-6">
                  <div className="mb-3 flex flex-wrap gap-2">
                    {!selected.is_read && (
                      <Button
                        onClick={async () => {
                          await AdminApi.markContactRead(selected.id)
                          await load()
                          const detail = await AdminApi.getContact(selected.id)
                          setSelected(detail)
                        }}
                        className="bg-primary hover:bg-primary/90"
                      >
                        Mark as Read
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={async () => {
                        await AdminApi.markContactResolved(selected.id, !selected.is_resolved)
                        await load()
                        const detail = await AdminApi.getContact(selected.id)
                        setSelected(detail)
                      }}
                    >
                      {selected.is_resolved ? 'Mark as Open' : 'Mark as Resolved'}
                    </Button>
                    <Button
                      variant="outline"
                      className="border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800"
                      onClick={() => handleDeleteContact(selected.id)}
                    >
                      Delete Thread
                    </Button>
                  </div>

                  <textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Write a thoughtful reply..."
                    className="w-full rounded-xl border border-border/80 bg-card px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
                    rows={4}
                  />

                  <div className="mt-3 flex gap-2">
                    <Button
                      disabled={!replyMessage.trim()}
                      onClick={async () => {
                        try {
                          await AdminApi.replyContact(selected.id, { message: replyMessage })
                          await load()
                          const detail = await AdminApi.getContact(selected.id)
                          setSelected(detail)
                          setReplyMessage('')
                        } catch (err) {
                          await showAlert('Failed to send reply', 'Error')
                        }
                      }}
                    >
                      Send Reply
                    </Button>
                    <Button variant="outline" onClick={() => setReplyMessage('')}>Clear</Button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
