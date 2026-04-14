'use client'

import React, { useEffect, useState } from 'react'
import Footer from '@/components/Footer'
import { AdminApi } from '@/lib/api'
import { showAlert, showConfirm } from '@/lib/popup'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const DEFAULT_CATEGORIES = [
  'Domestic workers recruitment',
  'Housekeeping staff',
  'Cooking staff',
  'Home nursing',
  'Drivers',
  'Skilled workers',
]

function mergeCategoryOptions(existing: string[]) {
  const merged = [...DEFAULT_CATEGORIES, ...existing]
  const unique: string[] = []

  for (const item of merged) {
    const value = (item ?? '').trim()
    if (!value) continue
    if (!unique.some((entry) => entry.toLowerCase() === value.toLowerCase())) {
      unique.push(value)
    }
  }

  return unique
}

function linesToArray(value: string): string[] {
  return value
    .split(/\n|,/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

function arrayToLines(value: unknown): string {
  if (!Array.isArray(value)) return ''
  return value.filter((entry): entry is string => typeof entry === 'string').join('\n')
}

function parseLocalizedText(value: unknown): { en: string; am: string; ar: string; or: string } {
  if (typeof value === 'string') {
    return { en: value, am: '', ar: '', or: '' }
  }

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const map = value as Record<string, unknown>
    return {
      en: typeof map.en === 'string' ? map.en : '',
      am: typeof map.am === 'string' ? map.am : '',
      ar: typeof map.ar === 'string' ? map.ar : '',
      or: typeof map.or === 'string' ? map.or : '',
    }
  }

  return { en: '', am: '', ar: '', or: '' }
}

function buildLocalizedText(input: { en: string; am: string; ar: string; or: string }, requireEnglish = false): string | Record<string, string> | null {
  const normalized = {
    en: input.en.trim(),
    am: input.am.trim(),
    ar: input.ar.trim(),
    or: input.or.trim(),
  }

  if (requireEnglish && !normalized.en) {
    return null
  }

  const nonEmpty = Object.entries(normalized).filter(([, value]) => value.length > 0)
  if (nonEmpty.length === 0) {
    return null
  }

  if (nonEmpty.length === 1 && normalized.en) {
    return normalized.en
  }

  return Object.fromEntries(nonEmpty)
}

function getEnglishText(value: unknown): string {
  const parsed = parseLocalizedText(value)
  return parsed.en.trim() || parsed.am.trim() || parsed.ar.trim() || parsed.or.trim()
}

export default function ServicesPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [categoryOptions, setCategoryOptions] = useState<string[]>(DEFAULT_CATEGORIES)
  const [newCategory, setNewCategory] = useState('')
  const [titleAm, setTitleAm] = useState('')
  const [titleAr, setTitleAr] = useState('')
  const [titleOr, setTitleOr] = useState('')
  const [description, setDescription] = useState('')
  const [descriptionAm, setDescriptionAm] = useState('')
  const [descriptionAr, setDescriptionAr] = useState('')
  const [descriptionOr, setDescriptionOr] = useState('')
  const [requirementsText, setRequirementsText] = useState('')
  const [countriesText, setCountriesText] = useState('')
  const [instructionsText, setInstructionsText] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState<any>({
    id: null,
    title: '',
    slug: '',
    description: '',
    title_am: '',
    title_ar: '',
    title_or: '',
    description_am: '',
    description_ar: '',
    description_or: '',
    icon: '',
    order: 0,
    is_active: true,
    requirementsText: '',
    countriesText: '',
    instructionsText: '',
  })
  const [newEditCategory, setNewEditCategory] = useState('')

  async function loadItems() {
    setLoading(true)
    setError(null)
    try {
      const res = await AdminApi.services()
      const list = Array.isArray(res) ? res : (res.data ?? [])
      setItems(list)
      const dynamicCategories = list
        .map((service: any) => getEnglishText(service?.title))
        .filter((value: string) => value.length > 0)
      setCategoryOptions(mergeCategoryOptions(dynamicCategories))
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadItems()
  }, [])

  async function handleCreate() {
    if (!title) {
      await showAlert('Category in English is required', 'Validation')
      return
    }

    const localizedTitle = buildLocalizedText({ en: title, am: titleAm, ar: titleAr, or: titleOr }, true)
    if (!localizedTitle) {
      await showAlert('Category in English is required', 'Validation')
      return
    }

    const localizedDescription = buildLocalizedText({ en: description, am: descriptionAm, ar: descriptionAr, or: descriptionOr }, false)

    try {
      await AdminApi.createService({
        title: localizedTitle,
        description: localizedDescription,
        qualification_requirements: linesToArray(requirementsText),
        target_countries: linesToArray(countriesText),
        application_instructions: linesToArray(instructionsText),
      })
      setTitle('')
      setTitleAm('')
      setTitleAr('')
      setTitleOr('')
      setDescription('')
      setDescriptionAm('')
      setDescriptionAr('')
      setDescriptionOr('')
      setRequirementsText('')
      setCountriesText('')
      setInstructionsText('')
      await loadItems()
    } catch (e: any) {
      await showAlert(e?.message ?? 'Failed', 'Error')
    }
  }

  async function addCreateCategory() {
    const value = newCategory.trim()
    if (!value) {
      await showAlert('Enter category name', 'Validation')
      return
    }

    setCategoryOptions((prev) => mergeCategoryOptions([...prev, value]))
    setTitle(value)
    setNewCategory('')
  }

  function openEditDialog(service: any) {
    const localizedTitle = parseLocalizedText(service.title)
    const localizedDescription = parseLocalizedText(service.description)

    setEditForm({
      id: service.id,
      title: localizedTitle.en,
      title_am: localizedTitle.am,
      title_ar: localizedTitle.ar,
      title_or: localizedTitle.or,
      slug: service.slug ?? '',
      description: localizedDescription.en,
      description_am: localizedDescription.am,
      description_ar: localizedDescription.ar,
      description_or: localizedDescription.or,
      icon: service.icon ?? '',
      order: Number(service.order ?? 0),
      is_active: Boolean(service.is_active ?? true),
      requirementsText: arrayToLines(service.qualification_requirements),
      countriesText: arrayToLines(service.target_countries),
      instructionsText: arrayToLines(service.application_instructions),
    })
    setNewEditCategory('')
    setEditOpen(true)
  }

  async function addEditCategory() {
    const value = newEditCategory.trim()
    if (!value) {
      await showAlert('Enter category name', 'Validation')
      return
    }

    setCategoryOptions((prev) => mergeCategoryOptions([...prev, value]))
    setEditForm((p: any) => ({ ...p, title: value }))
    setNewEditCategory('')
  }

  async function saveEdit() {
    if (!editForm.title?.trim()) {
      await showAlert('Category in English is required', 'Validation')
      return
    }

    const localizedTitle = buildLocalizedText({
      en: editForm.title,
      am: editForm.title_am ?? '',
      ar: editForm.title_ar ?? '',
      or: editForm.title_or ?? '',
    }, true)
    if (!localizedTitle) {
      await showAlert('Category in English is required', 'Validation')
      return
    }

    const localizedDescription = buildLocalizedText({
      en: editForm.description ?? '',
      am: editForm.description_am ?? '',
      ar: editForm.description_ar ?? '',
      or: editForm.description_or ?? '',
    }, false)

    try {
      await AdminApi.updateService(editForm.id, {
        title: localizedTitle,
        slug: editForm.slug || null,
        description: localizedDescription,
        icon: editForm.icon || null,
        order: Number(editForm.order || 0),
        is_active: Boolean(editForm.is_active),
        qualification_requirements: linesToArray(editForm.requirementsText),
        target_countries: linesToArray(editForm.countriesText),
        application_instructions: linesToArray(editForm.instructionsText),
      })
      setEditOpen(false)
      await loadItems()
    } catch (e: any) {
      await showAlert(e?.message ?? 'Failed to update service', 'Error')
    }
  }

  return (
    <main className="min-h-screen flex flex-col bg-background">

      <div className="max-w-6xl mx-auto px-4 py-8">
        <section className="relative isolate mb-6 overflow-hidden rounded-3xl border border-border/80 bg-card px-6 py-6 shadow-sm">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-br from-primary/14 via-background to-cyan-200/20" />
          <div className="pointer-events-none absolute -top-16 -left-12 -z-10 h-44 w-44 rounded-full bg-primary/12 blur-3xl" />
          <div className="pointer-events-none absolute right-0 top-3 -z-10 h-44 w-44 rounded-full bg-primary/14 blur-3xl" />

          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-black text-foreground">Manage Services</h1>
              <p className="text-foreground/65">Create and manage service categories and descriptions.</p>
            </div>
          </div>
        </section>

        <div className="mb-6 grid md:grid-cols-2 gap-4">
          <div className="flex gap-2 md:col-span-2">
            <select
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-xl border border-border bg-background px-3 py-2.5 shadow-sm flex-1"
            >
              <option value="">Select Category</option>
              {categoryOptions.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Add new category"
              className="rounded-xl border border-border bg-background px-3 py-2.5 shadow-sm flex-1"
            />
            <Button type="button" variant="outline" onClick={addCreateCategory}>Add</Button>
          </div>
          <input value={titleAm} onChange={(e) => setTitleAm(e.target.value)} placeholder="Category (Amharic, optional)" className="rounded-xl border border-border bg-background px-3 py-2.5 shadow-sm" />
          <input value={titleAr} onChange={(e) => setTitleAr(e.target.value)} placeholder="Category (Arabic, optional)" className="rounded-xl border border-border bg-background px-3 py-2.5 shadow-sm" />
          <input value={titleOr} onChange={(e) => setTitleOr(e.target.value)} placeholder="Category (Oromifa, optional)" className="rounded-xl border border-border bg-background px-3 py-2.5 shadow-sm" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (English)" className="rounded-xl border border-border bg-background px-3 py-2.5 shadow-sm min-h-24" />
          <textarea value={descriptionAm} onChange={(e) => setDescriptionAm(e.target.value)} placeholder="Description (Amharic, optional)" className="rounded-xl border border-border bg-background px-3 py-2.5 shadow-sm min-h-24" />
          <textarea value={descriptionAr} onChange={(e) => setDescriptionAr(e.target.value)} placeholder="Description (Arabic, optional)" className="rounded-xl border border-border bg-background px-3 py-2.5 shadow-sm min-h-24" />
          <textarea value={descriptionOr} onChange={(e) => setDescriptionOr(e.target.value)} placeholder="Description (Oromifa, optional)" className="rounded-xl border border-border bg-background px-3 py-2.5 shadow-sm min-h-24" />
          <textarea
            value={requirementsText}
            onChange={(e) => setRequirementsText(e.target.value)}
            placeholder="Qualification requirements (one per line)"
            className="rounded-xl border border-border bg-background px-3 py-2.5 shadow-sm min-h-24"
          />
          <textarea
            value={countriesText}
            onChange={(e) => setCountriesText(e.target.value)}
            placeholder="Target countries (one per line)"
            className="rounded-xl border border-border bg-background px-3 py-2.5 shadow-sm min-h-24"
          />
          <textarea
            value={instructionsText}
            onChange={(e) => setInstructionsText(e.target.value)}
            placeholder="Application instructions (one per line)"
            className="rounded-xl border border-border bg-background px-3 py-2.5 shadow-sm min-h-24 md:col-span-2"
          />
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
                <div key={s.id} className="p-4 rounded-xl border border-border/80 bg-background/95 shadow-sm">
                  <div>
                    <div className="font-semibold">Category: {getEnglishText(s.title)}</div>
                    <div className="text-sm text-foreground/60">{getEnglishText(s.description)}</div>
                    <div className="mt-2 text-xs text-foreground/70">
                      Requirements: {Array.isArray(s.qualification_requirements) ? s.qualification_requirements.length : 0} |
                      Countries: {Array.isArray(s.target_countries) ? s.target_countries.length : 0} |
                      Instructions: {Array.isArray(s.application_instructions) ? s.application_instructions.length : 0}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button onClick={() => openEditDialog(s)} variant="outline">Edit</Button>
                    <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-50" onClick={async () => {
                      if (!await showConfirm('Delete this service?', 'Confirm Delete')) return
                      try {
                        await AdminApi.deleteService(s.id)
                        await loadItems()
                      } catch (e) { console.error(e) }
                    }}>Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
            <DialogDescription>Update all service fields, then save changes.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex gap-2 md:col-span-2">
              <select
                value={editForm.title}
                onChange={(e) => setEditForm((p: any) => ({ ...p, title: e.target.value }))}
                className="rounded-xl border border-border bg-background px-3 py-2.5 shadow-sm flex-1"
              >
                <option value="">Select Category</option>
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <input
                value={newEditCategory}
                onChange={(e) => setNewEditCategory(e.target.value)}
                placeholder="Add new category"
                className="rounded-xl border border-border bg-background px-3 py-2.5 shadow-sm flex-1"
              />
              <Button type="button" variant="outline" onClick={addEditCategory}>Add</Button>
            </div>
            <input
              value={editForm.title_am}
              onChange={(e) => setEditForm((p: any) => ({ ...p, title_am: e.target.value }))}
              placeholder="Category (Amharic, optional)"
              className="rounded-xl border border-border bg-background px-3 py-2.5 shadow-sm"
            />
            <input
              value={editForm.title_ar}
              onChange={(e) => setEditForm((p: any) => ({ ...p, title_ar: e.target.value }))}
              placeholder="Category (Arabic, optional)"
              className="rounded-xl border border-border bg-background px-3 py-2.5 shadow-sm"
            />
            <input
              value={editForm.title_or}
              onChange={(e) => setEditForm((p: any) => ({ ...p, title_or: e.target.value }))}
              placeholder="Category (Oromifa, optional)"
              className="rounded-xl border border-border bg-background px-3 py-2.5 shadow-sm"
            />
            <input
              value={editForm.slug}
              onChange={(e) => setEditForm((p: any) => ({ ...p, slug: e.target.value }))}
              placeholder="Slug (optional)"
              className="rounded-xl border border-border bg-background px-3 py-2.5 shadow-sm"
            />
            <input
              value={editForm.icon}
              onChange={(e) => setEditForm((p: any) => ({ ...p, icon: e.target.value }))}
              placeholder="Icon (optional)"
              className="rounded-xl border border-border bg-background px-3 py-2.5 shadow-sm"
            />
            <input
              type="number"
              value={editForm.order}
              onChange={(e) => setEditForm((p: any) => ({ ...p, order: Number(e.target.value || 0) }))}
              placeholder="Order"
              className="rounded-xl border border-border bg-background px-3 py-2.5 shadow-sm"
            />
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm((p: any) => ({ ...p, description: e.target.value }))}
              placeholder="Description (English)"
              className="rounded-xl border border-border bg-background px-3 py-2.5 shadow-sm min-h-20"
            />
            <textarea
              value={editForm.description_am}
              onChange={(e) => setEditForm((p: any) => ({ ...p, description_am: e.target.value }))}
              placeholder="Description (Amharic, optional)"
              className="rounded-xl border border-border bg-background px-3 py-2.5 shadow-sm min-h-20"
            />
            <textarea
              value={editForm.description_ar}
              onChange={(e) => setEditForm((p: any) => ({ ...p, description_ar: e.target.value }))}
              placeholder="Description (Arabic, optional)"
              className="rounded-xl border border-border bg-background px-3 py-2.5 shadow-sm min-h-20"
            />
            <textarea
              value={editForm.description_or}
              onChange={(e) => setEditForm((p: any) => ({ ...p, description_or: e.target.value }))}
              placeholder="Description (Oromifa, optional)"
              className="rounded-xl border border-border bg-background px-3 py-2.5 shadow-sm min-h-20"
            />
            <textarea
              value={editForm.requirementsText}
              onChange={(e) => setEditForm((p: any) => ({ ...p, requirementsText: e.target.value }))}
              placeholder="Qualification requirements (one per line)"
              className="rounded-xl border border-border bg-background px-3 py-2.5 shadow-sm min-h-24"
            />
            <textarea
              value={editForm.countriesText}
              onChange={(e) => setEditForm((p: any) => ({ ...p, countriesText: e.target.value }))}
              placeholder="Target countries (one per line)"
              className="rounded-xl border border-border bg-background px-3 py-2.5 shadow-sm min-h-24"
            />
            <textarea
              value={editForm.instructionsText}
              onChange={(e) => setEditForm((p: any) => ({ ...p, instructionsText: e.target.value }))}
              placeholder="Application instructions (one per line)"
              className="rounded-xl border border-border bg-background px-3 py-2.5 shadow-sm min-h-24 md:col-span-2"
            />
            <label className="inline-flex items-center gap-2 text-sm text-foreground/80 md:col-span-2">
              <input
                type="checkbox"
                checked={Boolean(editForm.is_active)}
                onChange={(e) => setEditForm((p: any) => ({ ...p, is_active: e.target.checked }))}
              />
              Active
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={saveEdit} className="bg-primary text-primary-foreground">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </main>
  )
}
