'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { AdminApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { showAlert } from '@/lib/popup'

type AboutSection = {
  id: number
  key: string
  title: unknown
  description: unknown
  content: Record<string, any> | null
  order: number
  is_active: boolean
}

const requiredSectionKeys = [
  'company_background',
  'mission',
  'vision',
  'legal_compliance',
  'recruitment_standards',
  'certifications',
]

function prettyLabel(key: string) {
  return key.replaceAll('_', ' ').replace(/\b\w/g, (m) => m.toUpperCase())
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

type ContentEntry = {
  id: string
  key: string
  value: string
}

function parseContentEntries(contentText: string): ContentEntry[] {
  try {
    const parsed = contentText.trim() ? JSON.parse(contentText) : {}
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return []
    }

    return Object.entries(parsed).map(([key, value], index) => ({
      id: `${key}-${index}`,
      key,
      value: typeof value === 'string' ? value : JSON.stringify(value),
    }))
  } catch {
    return []
  }
}

function parsePrimitiveValue(raw: string): any {
  const value = raw.trim()
  if (value === '') return ''
  if (value === 'true') return true
  if (value === 'false') return false
  if (value === 'null') return null
  if (!Number.isNaN(Number(value)) && /^-?\d+(\.\d+)?$/.test(value)) {
    return Number(value)
  }
  return value
}

export default function AboutAdminPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [sections, setSections] = useState<AboutSection[]>([])

  const sectionsMap = useMemo(() => {
    const map = new Map<string, AboutSection>()
    sections.forEach((s) => map.set(s.key, s))
    return map
  }, [sections])

  async function loadSections() {
    setLoading(true)
    setError('')
    try {
      const res = await AdminApi.aboutPageSections()
      const list = Array.isArray(res) ? res : (res.data ?? [])
      setSections(list)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load about page content')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSections()
  }, [])

  async function saveSection(key: string, payload: {
    title: string | Record<string, string> | null
    description: string | Record<string, string> | null
    content: Record<string, any>
    order: number
    is_active: boolean
  }) {
    setSaving(true)
    setError('')
    setNotice('')
    try {
      await AdminApi.updateAboutPageSection(key, payload)
      setNotice(`${prettyLabel(key)} updated.`)
      await loadSections()
    } catch (e: any) {
      setError(e?.message ?? 'Failed to update section')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-foreground">About Page Content Management</h1>
          <p className="mt-2 text-foreground/70">Manage company background, mission, vision, compliance, standards, and certifications.</p>
        </header>

        {loading && <p className="text-foreground/70">Loading...</p>}
        {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {notice && <p className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">{notice}</p>}

        {!loading && (
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-xl font-semibold text-foreground">Sections</h2>
            <div className="mt-5 grid gap-6 md:grid-cols-2">
              {requiredSectionKeys.map((key) => {
                const item = sectionsMap.get(key)
                const contentText = item?.content ? JSON.stringify(item.content, null, 2) : '{}'

                return (
                  <div key={key} className="rounded-lg border border-border p-4">
                    <h3 className="font-semibold text-foreground">{prettyLabel(key)}</h3>

                    <SectionEditor
                      defaultTitle={item?.title ?? ''}
                      defaultDescription={item?.description ?? ''}
                      defaultContentText={contentText}
                      defaultOrder={item?.order ?? 0}
                      defaultIsActive={item?.is_active ?? true}
                      disabled={saving}
                      onSave={(value) => saveSection(key, value)}
                    />
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}

type SectionEditorProps = {
  defaultTitle: unknown
  defaultDescription: unknown
  defaultContentText: string
  defaultOrder: number
  defaultIsActive: boolean
  disabled: boolean
  onSave: (payload: {
    title: string | Record<string, string> | null
    description: string | Record<string, string> | null
    content: Record<string, any>
    order: number
    is_active: boolean
  }) => Promise<void>
}

function SectionEditor(props: SectionEditorProps) {
  const [titleEn, setTitleEn] = useState('')
  const [titleAm, setTitleAm] = useState('')
  const [titleAr, setTitleAr] = useState('')
  const [titleOr, setTitleOr] = useState('')
  const [descriptionEn, setDescriptionEn] = useState('')
  const [descriptionAm, setDescriptionAm] = useState('')
  const [descriptionAr, setDescriptionAr] = useState('')
  const [descriptionOr, setDescriptionOr] = useState('')
  const [contentEntries, setContentEntries] = useState<ContentEntry[]>(parseContentEntries(props.defaultContentText))
  const [order, setOrder] = useState(props.defaultOrder)
  const [isActive, setIsActive] = useState(props.defaultIsActive)

  useEffect(() => {
    const parsedTitle = parseLocalizedText(props.defaultTitle)
    const parsedDescription = parseLocalizedText(props.defaultDescription)
    setTitleEn(parsedTitle.en)
    setTitleAm(parsedTitle.am)
    setTitleAr(parsedTitle.ar)
    setTitleOr(parsedTitle.or)
    setDescriptionEn(parsedDescription.en)
    setDescriptionAm(parsedDescription.am)
    setDescriptionAr(parsedDescription.ar)
    setDescriptionOr(parsedDescription.or)
    setContentEntries(parseContentEntries(props.defaultContentText))
    setOrder(props.defaultOrder)
    setIsActive(props.defaultIsActive)
  }, [props.defaultTitle, props.defaultDescription, props.defaultContentText, props.defaultOrder, props.defaultIsActive])

  return (
    <div className="mt-3 space-y-3">
      <input
        value={titleEn}
        onChange={(e) => setTitleEn(e.target.value)}
        placeholder="Title (English) *"
        className="w-full rounded-md border border-border bg-background px-3 py-2"
      />
      <div className="grid gap-3 md:grid-cols-3">
        <input
          value={titleAm}
          onChange={(e) => setTitleAm(e.target.value)}
          placeholder="Title (Amharic, optional)"
          className="w-full rounded-md border border-border bg-background px-3 py-2"
        />
        <input
          value={titleAr}
          onChange={(e) => setTitleAr(e.target.value)}
          placeholder="Title (Arabic, optional)"
          className="w-full rounded-md border border-border bg-background px-3 py-2"
        />
        <input
          value={titleOr}
          onChange={(e) => setTitleOr(e.target.value)}
          placeholder="Title (Oromifa, optional)"
          className="w-full rounded-md border border-border bg-background px-3 py-2"
        />
      </div>
      <textarea
        value={descriptionEn}
        onChange={(e) => setDescriptionEn(e.target.value)}
        placeholder="Description (English) *"
        className="w-full rounded-md border border-border bg-background px-3 py-2 min-h-20"
      />
      <div className="grid gap-3 md:grid-cols-3">
        <textarea
          value={descriptionAm}
          onChange={(e) => setDescriptionAm(e.target.value)}
          placeholder="Description (Amharic, optional)"
          className="w-full rounded-md border border-border bg-background px-3 py-2 min-h-20"
        />
        <textarea
          value={descriptionAr}
          onChange={(e) => setDescriptionAr(e.target.value)}
          placeholder="Description (Arabic, optional)"
          className="w-full rounded-md border border-border bg-background px-3 py-2 min-h-20"
        />
        <textarea
          value={descriptionOr}
          onChange={(e) => setDescriptionOr(e.target.value)}
          placeholder="Description (Oromifa, optional)"
          className="w-full rounded-md border border-border bg-background px-3 py-2 min-h-20"
        />
      </div>
      <div className="rounded-lg border border-border bg-background p-3">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Section Content Fields</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => setContentEntries((prev) => [...prev, { id: `new-${Date.now()}`, key: '', value: '' }])}
          >
            Add Field
          </Button>
        </div>
        <div className="space-y-2">
          {contentEntries.map((entry) => (
            <div key={entry.id} className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
              <input
                value={entry.key}
                onChange={(e) => setContentEntries((prev) => prev.map((item) => item.id === entry.id ? { ...item, key: e.target.value } : item))}
                placeholder="Field key"
                className="w-full rounded-md border border-border bg-card px-3 py-2"
              />
              <input
                value={entry.value}
                onChange={(e) => setContentEntries((prev) => prev.map((item) => item.id === entry.id ? { ...item, value: e.target.value } : item))}
                placeholder="Value"
                className="w-full rounded-md border border-border bg-card px-3 py-2"
              />
              <Button
                type="button"
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50"
                onClick={() => setContentEntries((prev) => prev.filter((item) => item.id !== entry.id))}
              >
                Remove
              </Button>
            </div>
          ))}
          {contentEntries.length === 0 && (
            <p className="text-sm text-foreground/60">No custom fields yet. Click Add Field.</p>
          )}
        </div>
      </div>
      <input
        value={order}
        onChange={(e) => setOrder(Number(e.target.value || 0))}
        type="number"
        placeholder="Order"
        className="w-full rounded-md border border-border bg-background px-3 py-2"
      />
      <label className="inline-flex items-center gap-2 text-sm text-foreground/80">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        Active
      </label>
      <div>
        <Button
          disabled={props.disabled}
          onClick={async () => {
            const localizedTitle = buildLocalizedText({ en: titleEn, am: titleAm, ar: titleAr, or: titleOr }, true)
            if (!localizedTitle) {
              await showAlert('English title is required', 'Validation')
              return
            }

            const localizedDescription = buildLocalizedText({ en: descriptionEn, am: descriptionAm, ar: descriptionAr, or: descriptionOr }, true)
            if (!localizedDescription) {
              await showAlert('English description is required', 'Validation')
              return
            }

            const parsed: Record<string, any> = {}
            for (const entry of contentEntries) {
              const key = entry.key.trim()
              if (!key) continue
              parsed[key] = parsePrimitiveValue(entry.value)
            }
            await props.onSave({
              title: localizedTitle,
              description: localizedDescription,
              content: parsed,
              order,
              is_active: isActive,
            })
          }}
          className="bg-primary text-primary-foreground"
        >
          Save Section
        </Button>
      </div>
    </div>
  )
}
