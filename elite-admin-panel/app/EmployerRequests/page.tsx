"use client"

import React, { useEffect, useState } from 'react'
import { AdminApi, API_BASE_URL } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

export default function EmployerRequestsAdmin() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [page, setPage] = useState<number>(1)
  const [pagination, setPagination] = useState<any>(null)
  const [selected, setSelected] = useState<any | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function load(opts: { status?: string, page?: number } = {}) {
    setLoading(true)
    try {
      const qsParts: string[] = []
      const s = opts.status ?? statusFilter
      const p = opts.page ?? page
      if (s) qsParts.push(`?status=${encodeURIComponent(s)}`)
      if (p && p > 1) {
        qsParts.push(`${s ? '&' : '?'}page=${p}`)
      }
      const query = qsParts.length ? qsParts.join('') : ''
      const res = await AdminApi.employerRequests(query)
      // Laravel paginator returns { data: [...], current_page, last_page, ... }
      const list = Array.isArray(res.data) ? res.data : (res.data ?? [])
      setItems(list)
      setPagination(res)
    } catch (e) {
      console.error(e)
    } finally { setLoading(false) }
  }

  useEffect(() => { load({ status: statusFilter, page }) }, [statusFilter, page])

  async function openDetail(id: string) {
    try {
      const res = await AdminApi.getEmployerRequest(id)
      setSelected(res.data ?? res)
    } catch (e) { console.error(e) }
  }

  async function updateStatus(id: string, status: string) {
    try {
      const res = await AdminApi.updateEmployerRequestStatus(id, { status })
      // refresh list and update modal with returned data
      await load()
      setSelected(res.data ?? res)
    } catch (e) { console.error(e) }
  }

  function deleteRequest(id: string) {
    setPendingDeleteId(id)
    setShowDeleteConfirm(true)
  }

  async function confirmDelete() {
    if (!pendingDeleteId) return
    setDeleting(true)
    try {
      await AdminApi.deleteEmployerRequest(pendingDeleteId)
      await load()
      setSelected(null)
    } catch (e) { console.error(e) }
    finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
      setPendingDeleteId(null)
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-bold mb-4">Employer Requests</h1>
        <div className="flex items-center gap-4 mb-4">
          <label className="text-sm">Filter by status:</label>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="border rounded px-2 py-1">
            <option value="">All</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="In Progress">In Progress</option>
          </select>
          {loading && <div className="text-sm text-muted-foreground">Loading...</div>}
        </div>
        <div className="grid gap-3">
          {items.map((it: any) => (
            <div key={it.id} className="rounded-xl border border-border bg-card p-4 flex justify-between items-start">
              <div>
                <div className="font-semibold">{it.company_name} <span className="text-sm text-foreground/60">{it.country}</span></div>
                <div className="text-sm text-foreground/70">Jobs: {it.job_requirements_count ?? it.jobRequirements?.length ?? 0} • Workers: {/* not computed here */}</div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => openDetail(it.id)}>View</Button>
              </div>
            </div>
          ))}
        </div>
        {/* Pagination */}
        {pagination && (pagination.last_page > 1) && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button className="px-3 py-1 border rounded" onClick={() => setPage(Math.max(1, (pagination.current_page || 1) - 1))} disabled={(pagination.current_page || 1) <= 1}>Prev</button>
            {Array.from({ length: pagination.last_page }).map((_, idx) => {
              const p = idx + 1
              return (
                <button key={p} className={`px-3 py-1 border rounded ${p === (pagination.current_page || 1) ? 'bg-primary text-primary-foreground' : ''}`} onClick={() => setPage(p)}>{p}</button>

              )
            })}
            <button className="px-3 py-1 border rounded" onClick={() => setPage(Math.min(pagination.last_page, (pagination.current_page || 1) + 1))} disabled={(pagination.current_page || 1) >= pagination.last_page}>Next</button>
          </div>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null) }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              <div><strong>Company:</strong> {selected.company_name}</div>
              <div><strong>Contact:</strong> {selected.contact_person} • {selected.email} • {selected.phone}</div>
              <div><strong>Country:</strong> {selected.country}</div>
              <div><strong>Status:</strong> {selected.status}</div>
              {selected.license_path && (
                <div>
                  <strong>License:</strong>{' '}
                  <a className="text-primary underline" href={`${API_BASE_URL}/storage/${selected.license_path}`} target="_blank" rel="noopener noreferrer">View / Download</a>

                </div>
              )}
              <div>
                <strong>Jobs:</strong>
                <ul className="list-disc ml-6">
                  {(selected.job_requirements ?? selected.jobRequirements ?? []).map((j: any) => (
                    <li key={j.id}>{j.job_title} ({j.number_of_workers})</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
            {selected && (
              <Button className="bg-red-600 text-white" onClick={() => deleteRequest(selected.id)}>Delete</Button>
            )}
            {selected && (
              <div className="flex gap-2">
                <Button
                  onClick={() => updateStatus(selected.id, 'Approved')}
                  className="bg-primary text-primary-foreground"

                  disabled={selected.status === 'Approved'}
                >
                  Approve
                </Button>
                <Button
                  onClick={() => updateStatus(selected.id, 'Rejected')}
                  className="bg-red-600 text-white"
                  disabled={selected.status === 'Rejected'}
                >
                  Reject
                </Button>
                <Button
                  onClick={() => updateStatus(selected.id, 'In Progress')}
                  disabled={selected.status === 'In Progress'}
                >
                  Mark In Progress
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteConfirm} onOpenChange={(open) => { if (!open) { setShowDeleteConfirm(false); setPendingDeleteId(null) } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Confirm delete</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Are you sure you want to delete this employer request? This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDeleteConfirm(false); setPendingDeleteId(null) }} disabled={deleting}>Cancel</Button>
            <Button className="bg-red-600 text-white" onClick={confirmDelete} disabled={deleting}>{deleting ? 'Deleting...' : 'Delete'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
