'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { AdminApi } from '@/lib/api'
import { showAlert, showConfirm } from '@/lib/popup'

type UserItem = {
  id: number
  name: string
  email: string
  phone?: string | null
  role: string
  account_status: string
  preferred_language?: string | null
}

export default function UsersPage() {
  const [items, setItems] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [roleFilter, setRoleFilter] = useState('all')
  const [editing, setEditing] = useState<UserItem | null>(null)
  const [saving, setSaving] = useState(false)

  const roleBadge = (role: string) => {
    const value = (role || '').toLowerCase()
    if (value === 'superadmin') return 'bg-violet-100 text-violet-700 border-violet-200'
    if (value === 'staff') return 'bg-blue-100 text-blue-700 border-blue-200'
    if (value === 'partner') return 'bg-cyan-100 text-cyan-700 border-cyan-200'
    return 'bg-primary/10 text-primary border-primary/30'
  }

  const statusBadge = (status: string) => {
    const value = (status || '').toLowerCase()
    if (value === 'active') return 'bg-primary/10 text-primary border-primary/30'
    if (value === 'pending_approval') return 'bg-amber-100 text-amber-700 border-amber-200'
    return 'bg-rose-100 text-rose-700 border-rose-200'
  }

  const seekerCount = items.filter((u) => u.role === 'seeker').length
  const activeCount = items.filter((u) => u.account_status === 'active').length
  const pendingCount = items.filter((u) => u.account_status === 'pending_approval').length

  const load = async (role = roleFilter) => {
    setError(null)
    setLoading(true)
    try {
      const pathRole = role === 'all' ? '' : `?role=${encodeURIComponent(role)}`
      const res = await AdminApi.users(pathRole)
      const list = Array.isArray(res) ? res : (res.data ?? [])
      setItems(list)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load('all')
  }, [])

  const onApproveCandidate = async (id: number) => {
    try {
      await AdminApi.approveCandidate(id)
      await showAlert('Candidate approved', 'Success')
      await load()
    } catch (e: any) {
      await showAlert(e?.message ?? 'Failed to approve candidate', 'Error')
    }
  }

  const onDeleteUser = async (id: number) => {
    const confirmed = await showConfirm('Delete this user account?', 'Delete User')
    if (!confirmed) return

    try {
      await AdminApi.deleteUser(id)
      await showAlert('User deleted', 'Success')
      await load()
    } catch (e: any) {
      await showAlert(e?.message ?? 'Failed to delete user', 'Error')
    }
  }

  const saveEdit = async () => {
    if (!editing) return
    setSaving(true)
    try {
      await AdminApi.updateUser(editing.id, {
        name: editing.name,
        email: editing.email,
        phone: editing.phone,
        account_status: editing.account_status,
        preferred_language: editing.preferred_language,
      })
      setEditing(null)
      await showAlert('User updated successfully', 'Success')
      await load()
    } catch (e: any) {
      await showAlert(e?.message ?? 'Failed to update user', 'Error')
    } finally {
      setSaving(false)
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
              <h1 className="text-3xl font-black text-foreground">User Management</h1>
              <p className="text-foreground/65">View, edit, approve, and delete user accounts.</p>
            </div>

            <select
              value={roleFilter}
              onChange={async (e) => {
                const next = e.target.value
                setRoleFilter(next)
                await load(next)
              }}
              className="rounded-xl border border-border bg-card px-3 py-2 text-sm shadow-sm"
            >
              <option value="all">All roles</option>
              <option value="seeker">Seeker</option>
              <option value="partner">Partner</option>
              <option value="staff">Staff</option>
              <option value="superadmin">Superadmin</option>
            </select>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-border/80 bg-background/85 p-3 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-foreground/60">Total users</p>
              <p className="mt-1 text-2xl font-black text-foreground">{items.length}</p>
            </div>
            <div className="rounded-xl border border-border/80 bg-background/85 p-3 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-foreground/60">Seekers</p>
              <p className="mt-1 text-2xl font-black text-foreground">{seekerCount}</p>
            </div>
            <div className="rounded-xl border border-border/80 bg-background/85 p-3 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-foreground/60">Active</p>
              <p className="mt-1 text-2xl font-black text-primary">{activeCount}</p>
            </div>
            <div className="rounded-xl border border-border/80 bg-background/85 p-3 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-foreground/60">Pending</p>
              <p className="mt-1 text-2xl font-black text-amber-700">{pendingCount}</p>
            </div>
          </div>
        </section>

        {loading && <p className="text-foreground/70">Loading...</p>}
        {error && <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        {!loading && !error && (
          <div className="overflow-x-auto rounded-2xl border border-border/80 bg-card/95 shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="border-b border-border bg-background/70">
                <tr>
                  <th className="px-4 py-3 text-left font-bold text-foreground/75">Name</th>
                  <th className="px-4 py-3 text-left font-bold text-foreground/75">Email</th>
                  <th className="px-4 py-3 text-left font-bold text-foreground/75">Phone</th>
                  <th className="px-4 py-3 text-left font-bold text-foreground/75">Role</th>
                  <th className="px-4 py-3 text-left font-bold text-foreground/75">Status</th>
                  <th className="px-4 py-3 text-left font-bold text-foreground/75">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((u) => (
                  <tr key={u.id} className="border-b border-border/60 transition hover:bg-primary/5">
                    <td className="px-4 py-3 font-semibold text-foreground">{u.name}</td>
                    <td className="px-4 py-3 text-foreground/80">{u.email}</td>
                    <td className="px-4 py-3 text-foreground/80">{u.phone ?? 'N/A'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${roleBadge(u.role)}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusBadge(u.account_status)}`}>
                        {u.account_status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" className="rounded-lg" onClick={() => setEditing(u)}>Edit</Button>
                        {u.role === 'seeker' && u.account_status !== 'active' && (
                          <Button onClick={() => onApproveCandidate(u.id)} className="rounded-lg bg-primary text-primary-foreground">Approve</Button>
                        )}
                        <Button variant="outline" className="rounded-lg border-red-300 text-red-700 hover:bg-red-50" onClick={() => onDeleteUser(u.id)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-12 text-center text-foreground/60">No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {editing && (
          <section className="mt-6 rounded-2xl border border-border/80 bg-card/95 p-5 shadow-sm">
            <h2 className="mb-1 text-xl font-bold text-foreground">Edit User</h2>
            <p className="mb-4 text-sm text-foreground/60">Update basic user details and account status.</p>
            <div className="grid gap-3 md:grid-cols-2">
              <input className="rounded-xl border border-border bg-background px-3 py-2.5 shadow-sm" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Name" />
              <input className="rounded-xl border border-border bg-background px-3 py-2.5 shadow-sm" value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} placeholder="Email" />
              <input className="rounded-xl border border-border bg-background px-3 py-2.5 shadow-sm" value={editing.phone ?? ''} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} placeholder="Phone" />
              <select className="rounded-xl border border-border bg-background px-3 py-2.5 shadow-sm" value={editing.account_status} onChange={(e) => setEditing({ ...editing, account_status: e.target.value })}>
                <option value="active">active</option>
                <option value="pending_approval">pending_approval</option>
                <option value="inactive">inactive</option>
              </select>
            </div>
            <div className="mt-4 flex gap-2">
              <Button className="rounded-lg bg-primary text-primary-foreground" onClick={saveEdit} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
              <Button className="rounded-lg" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
