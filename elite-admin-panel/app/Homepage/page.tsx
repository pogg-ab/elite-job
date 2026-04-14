'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { AdminApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { showAlert, showConfirm, showPrompt } from '@/lib/popup'

type SectionItem = {
  id: number
  key: string
  title: unknown
  subtitle: unknown
  description: unknown
  content: Record<string, any> | null
  is_active: boolean
}

type CountryItem = {
  id: number
  country_name: string
  country_code: string | null
  flag_image: string | null
  order: number
  is_active: boolean
}

type TestimonialItem = {
  id: number
  author_name: string
  author_role: string | null
  quote: string
  author_image: string | null
  rating: number | null
  order: number
  is_active: boolean
}

type ServiceItem = {
  id: number
  title: string
  slug: string | null
  description: string | null
  qualification_requirements: string[] | null
  target_countries: string[] | null
  application_instructions: string[] | null
  icon: string | null
  order: number
  is_active: boolean
}

const requiredSectionKeys = [
  'company_introduction',
  'quick_job_search',
  'latest_job_listings',
  'contact_section',
]

function prettyLabel(key: string) {
  return key.replaceAll('_', ' ').replace(/\b\w/g, (m) => m.toUpperCase())
}

function linesToArray(value: string): string[] {
  return value
    .split(/\n|,/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

function arrayToLines(value: string[] | null | undefined): string {
  if (!Array.isArray(value)) return ''
  return value.join(', ')
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

export default function HomepageAdminPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>('')
  const [notice, setNotice] = useState<string>('')

  const [sections, setSections] = useState<SectionItem[]>([])
  const [services, setServices] = useState<ServiceItem[]>([])
  const [countries, setCountries] = useState<CountryItem[]>([])
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([])

  const [newService, setNewService] = useState({
    title: '',
    description: '',
    qualification_requirements_text: '',
    target_countries_text: '',
    application_instructions_text: '',
    icon: '',
    order: 0,
    is_active: true,
  })

  const [newCountry, setNewCountry] = useState({
    country_name: '',
    country_code: '',
    order: 0,
    is_active: true,
  })

  const [newTestimonial, setNewTestimonial] = useState({
    author_name: '',
    author_role: '',
    quote: '',
    rating: 5,
    order: 0,
    is_active: true,
  })

  const sectionsMap = useMemo(() => {
    const map = new Map<string, SectionItem>()
    sections.forEach((s) => map.set(s.key, s))
    return map
  }, [sections])

  async function loadAll() {
    setLoading(true)
    setError('')

    try {
      const [sectionsRes, servicesRes, countriesRes, testimonialsRes] = await Promise.all([
        AdminApi.homepageSections(),
        AdminApi.services(),
        AdminApi.homepageCountries(),
        AdminApi.homepageTestimonials(),
      ])

      const sec = Array.isArray(sectionsRes) ? sectionsRes : (sectionsRes.data ?? [])
      const srv = Array.isArray(servicesRes) ? servicesRes : (servicesRes.data ?? [])
      const cty = Array.isArray(countriesRes) ? countriesRes : (countriesRes.data ?? [])
      const tst = Array.isArray(testimonialsRes) ? testimonialsRes : (testimonialsRes.data ?? [])

      setSections(sec)
      setServices(srv)
      setCountries(cty)
      setTestimonials(tst)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load homepage content')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  async function saveSection(key: string, payload: Partial<SectionItem>) {
    setSaving(true)
    setError('')
    setNotice('')

    try {
      await AdminApi.updateHomepageSection(key, payload)
      setNotice(`${prettyLabel(key)} updated.`)
      await loadAll()
    } catch (e: any) {
      setError(e?.message ?? 'Failed to update section')
    } finally {
      setSaving(false)
    }
  }

  async function handleCreateCountry() {
    if (!newCountry.country_name) {
      await showAlert('Country name is required', 'Validation')
      return
    }

    setSaving(true)
    setError('')
    setNotice('')

    try {
      await AdminApi.createHomepageCountry(newCountry)
      setNotice('Country created.')
      setNewCountry({ country_name: '', country_code: '', order: 0, is_active: true })
      await loadAll()
    } catch (e: any) {
      setError(e?.message ?? 'Failed to create country')
    } finally {
      setSaving(false)
    }
  }

  async function handleCreateService() {
    if (!newService.title) {
      await showAlert('Service title is required', 'Validation')
      return
    }

    setSaving(true)
    setError('')
    setNotice('')

    try {
      await AdminApi.createService({
        title: newService.title,
        description: newService.description,
        qualification_requirements: linesToArray(newService.qualification_requirements_text),
        target_countries: linesToArray(newService.target_countries_text),
        application_instructions: linesToArray(newService.application_instructions_text),
        icon: newService.icon,
        order: newService.order,
        is_active: newService.is_active,
      })
      setNotice('Service created.')
      setNewService({
        title: '',
        description: '',
        qualification_requirements_text: '',
        target_countries_text: '',
        application_instructions_text: '',
        icon: '',
        order: 0,
        is_active: true,
      })
      await loadAll()
    } catch (e: any) {
      setError(e?.message ?? 'Failed to create service')
    } finally {
      setSaving(false)
    }
  }

  async function handleCreateTestimonial() {
    if (!newTestimonial.author_name || !newTestimonial.quote) {
      await showAlert('Author name and quote are required', 'Validation')
      return
    }

    setSaving(true)
    setError('')
    setNotice('')

    try {
      await AdminApi.createHomepageTestimonial(newTestimonial)
      setNotice('Testimonial created.')
      setNewTestimonial({ author_name: '', author_role: '', quote: '', rating: 5, order: 0, is_active: true })
      await loadAll()
    } catch (e: any) {
      setError(e?.message ?? 'Failed to create testimonial')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-foreground">Homepage Content Management</h1>
          <p className="mt-2 text-foreground/70">Manage all dynamic home page content in one place.</p>
        </header>

        {loading && <p className="text-foreground/70">Loading...</p>}
        {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {notice && <p className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">{notice}</p>}

        {!loading && (
          <>
            <section className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-xl font-semibold text-foreground">Sections</h2>
              <p className="mt-2 text-sm text-foreground/70">Note: Mission & Vision is now managed on the About page. Edit it via the <a href="/About" className="text-primary font-semibold">About</a> editor.</p>
              <div className="mt-5 grid gap-6 md:grid-cols-2">
                {requiredSectionKeys.map((key) => {
                  const item = sectionsMap.get(key)
                  const contentText = item?.content ? JSON.stringify(item.content, null, 2) : '{}'

                  return (
                    <div key={key} className="rounded-lg border border-border p-4">
                      <h3 className="font-semibold text-foreground">{prettyLabel(key)}</h3>

                      <SectionEditor
                        defaultTitle={item?.title ?? ''}
                        defaultSubtitle={item?.subtitle ?? ''}
                        defaultDescription={item?.description ?? ''}
                        defaultContentText={contentText}
                        defaultIsActive={item?.is_active ?? true}
                        disabled={saving}
                        onSave={(value) => saveSection(key, value)}
                      />
                    </div>
                  )
                })}
              </div>
            </section>

            <section className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-xl font-semibold text-foreground">Partner Countries</h2>

              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <input
                  value={newCountry.country_name}
                  onChange={(e) => setNewCountry((p) => ({ ...p, country_name: e.target.value }))}
                  placeholder="Country name"
                  className="rounded-md border border-border bg-background px-3 py-2"
                />
                <input
                  value={newCountry.country_code}
                  onChange={(e) => setNewCountry((p) => ({ ...p, country_code: e.target.value }))}
                  placeholder="Country code (optional)"
                  className="rounded-md border border-border bg-background px-3 py-2"
                />
                <input
                  value={newCountry.order}
                  onChange={(e) => setNewCountry((p) => ({ ...p, order: Number(e.target.value || 0) }))}
                  type="number"
                  placeholder="Order"
                  className="rounded-md border border-border bg-background px-3 py-2"
                />
                <Button disabled={saving} onClick={handleCreateCountry} className="bg-primary text-primary-foreground">Add Country</Button>
              </div>

              <div className="mt-6 space-y-3">
                {countries.map((item) => (
                  <div key={item.id} className="rounded-lg border border-border p-4 flex flex-wrap items-center gap-2 justify-between">
                    <p className="font-medium text-foreground">
                      {item.country_name} {item.country_code ? `(${item.country_code})` : ''}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        disabled={saving}
                        onClick={async () => {
                          const name = await showPrompt('Country name', item.country_name, 'Edit Country', 'Country name')
                          if (!name) return
                          const orderRaw = await showPrompt('Order', String(item.order), 'Edit Country', 'Order')
                          const order = Number(orderRaw ?? item.order)
                          try {
                            setSaving(true)
                            await AdminApi.updateHomepageCountry(item.id, { country_name: name, order })
                            await loadAll()
                          } finally {
                            setSaving(false)
                          }
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        disabled={saving}
                        className="bg-red-600 text-white hover:bg-red-700"
                        onClick={async () => {
                          if (!await showConfirm('Delete this country?', 'Confirm Delete')) return
                          try {
                            setSaving(true)
                            await AdminApi.deleteHomepageCountry(item.id)
                            await loadAll()
                          } finally {
                            setSaving(false)
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
                {countries.length === 0 && <p className="text-foreground/70">No countries yet.</p>}
              </div>
            </section>

            <section className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-xl font-semibold text-foreground">Featured Services</h2>

              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <input
                  value={newService.title}
                  onChange={(e) => setNewService((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Service title"
                  className="rounded-md border border-border bg-background px-3 py-2"
                />
                <input
                  value={newService.description}
                  onChange={(e) => setNewService((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Description"
                  className="rounded-md border border-border bg-background px-3 py-2"
                />
                <input
                  value={newService.icon}
                  onChange={(e) => setNewService((p) => ({ ...p, icon: e.target.value }))}
                  placeholder="Icon (optional)"
                  className="rounded-md border border-border bg-background px-3 py-2"
                />
                <input
                  value={newService.order}
                  onChange={(e) => setNewService((p) => ({ ...p, order: Number(e.target.value || 0) }))}
                  type="number"
                  placeholder="Order"
                  className="rounded-md border border-border bg-background px-3 py-2"
                />
                <textarea
                  value={newService.qualification_requirements_text}
                  onChange={(e) => setNewService((p) => ({ ...p, qualification_requirements_text: e.target.value }))}
                  placeholder="Qualification requirements (one per line)"
                  className="rounded-md border border-border bg-background px-3 py-2 min-h-24 md:col-span-2"
                />
                <textarea
                  value={newService.target_countries_text}
                  onChange={(e) => setNewService((p) => ({ ...p, target_countries_text: e.target.value }))}
                  placeholder="Target countries (one per line)"
                  className="rounded-md border border-border bg-background px-3 py-2 min-h-24"
                />
                <textarea
                  value={newService.application_instructions_text}
                  onChange={(e) => setNewService((p) => ({ ...p, application_instructions_text: e.target.value }))}
                  placeholder="Application instructions (one per line)"
                  className="rounded-md border border-border bg-background px-3 py-2 min-h-24"
                />
                <label className="inline-flex items-center gap-2 text-sm text-foreground/80">
                  <input
                    type="checkbox"
                    checked={newService.is_active}
                    onChange={(e) => setNewService((p) => ({ ...p, is_active: e.target.checked }))}
                  />
                  Active
                </label>
                <Button disabled={saving} onClick={handleCreateService} className="bg-primary text-primary-foreground">Add Service</Button>
              </div>

              <div className="mt-6 space-y-3">
                {services.map((item) => (
                  <div key={item.id} className="rounded-lg border border-border p-4 space-y-3">
                    <div>
                      <p className="font-medium text-foreground">{item.title}</p>
                      <p className="text-sm text-foreground/70">{item.description || '-'}</p>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Qualification Requirements</p>
                        {item.qualification_requirements && item.qualification_requirements.length > 0 ? (
                          <ul className="mt-1 text-sm text-foreground/70 space-y-1">
                            {item.qualification_requirements.map((entry, idx) => <li key={idx}>{entry}</li>)}
                          </ul>
                        ) : <p className="mt-1 text-sm text-foreground/60">No entries</p>}
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Target Countries</p>
                        {item.target_countries && item.target_countries.length > 0 ? (
                          <ul className="mt-1 text-sm text-foreground/70 space-y-1">
                            {item.target_countries.map((entry, idx) => <li key={idx}>{entry}</li>)}
                          </ul>
                        ) : <p className="mt-1 text-sm text-foreground/60">No entries</p>}
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Application Instructions</p>
                        {item.application_instructions && item.application_instructions.length > 0 ? (
                          <ul className="mt-1 text-sm text-foreground/70 space-y-1">
                            {item.application_instructions.map((entry, idx) => <li key={idx}>{entry}</li>)}
                          </ul>
                        ) : <p className="mt-1 text-sm text-foreground/60">No entries</p>}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        disabled={saving}
                        onClick={async () => {
                          const title = await showPrompt('Service title', item.title, 'Edit Service', 'Title')
                          if (!title) return
                          const slug = await showPrompt('Slug (optional)', item.slug ?? '', 'Edit Service', 'Slug')
                          if (slug === null) return
                          const description = await showPrompt('Description', item.description ?? '', 'Edit Service', 'Description')
                          if (description === null) return
                          const icon = await showPrompt('Icon (optional)', item.icon ?? '', 'Edit Service', 'Icon')
                          if (icon === null) return
                          const orderRaw = await showPrompt('Order', String(item.order ?? 0), 'Edit Service', 'Order')
                          if (orderRaw === null) return
                          const activeRaw = await showPrompt('Active? (yes/no)', item.is_active ? 'yes' : 'no', 'Edit Service', 'yes or no')
                          if (activeRaw === null) return
                          const qualificationRequirementsText = await showPrompt(
                            'Qualification requirements (comma separated)',
                            arrayToLines(item.qualification_requirements),
                            'Edit Service',
                            'Qualification requirements'
                          )
                          if (qualificationRequirementsText === null) return
                          const targetCountriesText = await showPrompt(
                            'Target countries (comma separated)',
                            arrayToLines(item.target_countries),
                            'Edit Service',
                            'Target countries'
                          )
                          if (targetCountriesText === null) return
                          const applicationInstructionsText = await showPrompt(
                            'Application instructions (comma separated)',
                            arrayToLines(item.application_instructions),
                            'Edit Service',
                            'Application instructions'
                          )
                          if (applicationInstructionsText === null) return
                          try {
                            setSaving(true)
                            await AdminApi.updateService(item.id, {
                              title,
                              slug: slug || null,
                              description,
                              icon: icon || null,
                              order: Number(orderRaw || 0),
                              is_active: String(activeRaw).toLowerCase() === 'yes',
                              qualification_requirements: linesToArray(qualificationRequirementsText),
                              target_countries: linesToArray(targetCountriesText),
                              application_instructions: linesToArray(applicationInstructionsText),
                            })
                            await loadAll()
                          } finally {
                            setSaving(false)
                          }
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        disabled={saving}
                        className="bg-red-600 text-white hover:bg-red-700"
                        onClick={async () => {
                          if (!await showConfirm('Delete this service?', 'Confirm Delete')) return
                          try {
                            setSaving(true)
                            await AdminApi.deleteService(item.id)
                            await loadAll()
                          } finally {
                            setSaving(false)
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
                {services.length === 0 && <p className="text-foreground/70">No services yet.</p>}
              </div>
            </section>

            <section className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-xl font-semibold text-foreground">Testimonials</h2>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <input
                  value={newTestimonial.author_name}
                  onChange={(e) => setNewTestimonial((p) => ({ ...p, author_name: e.target.value }))}
                  placeholder="Author name"
                  className="rounded-md border border-border bg-background px-3 py-2"
                />
                <input
                  value={newTestimonial.author_role}
                  onChange={(e) => setNewTestimonial((p) => ({ ...p, author_role: e.target.value }))}
                  placeholder="Author role"
                  className="rounded-md border border-border bg-background px-3 py-2"
                />
                <textarea
                  value={newTestimonial.quote}
                  onChange={(e) => setNewTestimonial((p) => ({ ...p, quote: e.target.value }))}
                  placeholder="Quote"
                  className="md:col-span-2 rounded-md border border-border bg-background px-3 py-2 min-h-24"
                />
                <input
                  value={newTestimonial.rating}
                  onChange={(e) => setNewTestimonial((p) => ({ ...p, rating: Number(e.target.value || 5) }))}
                  type="number"
                  min={1}
                  max={5}
                  placeholder="Rating"
                  className="rounded-md border border-border bg-background px-3 py-2"
                />
                <input
                  value={newTestimonial.order}
                  onChange={(e) => setNewTestimonial((p) => ({ ...p, order: Number(e.target.value || 0) }))}
                  type="number"
                  placeholder="Order"
                  className="rounded-md border border-border bg-background px-3 py-2"
                />
                <Button disabled={saving} onClick={handleCreateTestimonial} className="md:col-span-2 bg-primary text-primary-foreground">Add Testimonial</Button>
              </div>

              <div className="mt-6 space-y-3">
                {testimonials.map((item) => (
                  <div key={item.id} className="rounded-lg border border-border p-4">
                    <p className="font-semibold text-foreground">{item.author_name}</p>
                    {item.author_role && <p className="text-sm text-foreground/70">{item.author_role}</p>}
                    <p className="mt-2 text-foreground/80">{item.quote}</p>
                    <div className="mt-3 flex gap-2">
                      <Button
                        variant="outline"
                        disabled={saving}
                        onClick={async () => {
                          const quote = await showPrompt('Quote', item.quote, 'Edit Testimonial', 'Quote')
                          if (!quote) return
                          try {
                            setSaving(true)
                            await AdminApi.updateHomepageTestimonial(item.id, { quote })
                            await loadAll()
                          } finally {
                            setSaving(false)
                          }
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        disabled={saving}
                        className="bg-red-600 text-white hover:bg-red-700"
                        onClick={async () => {
                          if (!await showConfirm('Delete this testimonial?', 'Confirm Delete')) return
                          try {
                            setSaving(true)
                            await AdminApi.deleteHomepageTestimonial(item.id)
                            await loadAll()
                          } finally {
                            setSaving(false)
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
                {testimonials.length === 0 && <p className="text-foreground/70">No testimonials yet.</p>}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  )
}

type SectionEditorProps = {
  defaultTitle: unknown
  defaultSubtitle: unknown
  defaultDescription: unknown
  defaultContentText: string
  defaultIsActive: boolean
  disabled: boolean
  onSave: (payload: {
    title: string | Record<string, string> | null
    subtitle: string | Record<string, string> | null
    description: string | Record<string, string> | null
    content: Record<string, any>
    is_active: boolean
  }) => Promise<void>
}

function SectionEditor(props: SectionEditorProps) {
  const [titleEn, setTitleEn] = useState('')
  const [titleAm, setTitleAm] = useState('')
  const [titleAr, setTitleAr] = useState('')
  const [titleOr, setTitleOr] = useState('')
  const [subtitleEn, setSubtitleEn] = useState('')
  const [subtitleAm, setSubtitleAm] = useState('')
  const [subtitleAr, setSubtitleAr] = useState('')
  const [subtitleOr, setSubtitleOr] = useState('')
  const [descriptionEn, setDescriptionEn] = useState('')
  const [descriptionAm, setDescriptionAm] = useState('')
  const [descriptionAr, setDescriptionAr] = useState('')
  const [descriptionOr, setDescriptionOr] = useState('')
  const [contentEntries, setContentEntries] = useState<ContentEntry[]>(parseContentEntries(props.defaultContentText))
  const [isActive, setIsActive] = useState(props.defaultIsActive)

  useEffect(() => {
    const parsedTitle = parseLocalizedText(props.defaultTitle)
    const parsedSubtitle = parseLocalizedText(props.defaultSubtitle)
    const parsedDescription = parseLocalizedText(props.defaultDescription)

    setTitleEn(parsedTitle.en)
    setTitleAm(parsedTitle.am)
    setTitleAr(parsedTitle.ar)
    setTitleOr(parsedTitle.or)

    setSubtitleEn(parsedSubtitle.en)
    setSubtitleAm(parsedSubtitle.am)
    setSubtitleAr(parsedSubtitle.ar)
    setSubtitleOr(parsedSubtitle.or)

    setDescriptionEn(parsedDescription.en)
    setDescriptionAm(parsedDescription.am)
    setDescriptionAr(parsedDescription.ar)
    setDescriptionOr(parsedDescription.or)

    setContentEntries(parseContentEntries(props.defaultContentText))
    setIsActive(props.defaultIsActive)
  }, [props.defaultTitle, props.defaultSubtitle, props.defaultDescription, props.defaultContentText, props.defaultIsActive])

  return (
    <div className="mt-3 space-y-3">
      <input
        value={titleEn}
        onChange={(e) => setTitleEn(e.target.value)}
        placeholder="Title (English) *"
        className="w-full rounded-md border border-border bg-background px-3 py-2"
      />
      <div className="grid gap-3 md:grid-cols-3">
        <input value={titleAm} onChange={(e) => setTitleAm(e.target.value)} placeholder="Title (Amharic, optional)" className="w-full rounded-md border border-border bg-background px-3 py-2" />
        <input value={titleAr} onChange={(e) => setTitleAr(e.target.value)} placeholder="Title (Arabic, optional)" className="w-full rounded-md border border-border bg-background px-3 py-2" />
        <input value={titleOr} onChange={(e) => setTitleOr(e.target.value)} placeholder="Title (Oromifa, optional)" className="w-full rounded-md border border-border bg-background px-3 py-2" />
      </div>
      <input
        value={subtitleEn}
        onChange={(e) => setSubtitleEn(e.target.value)}
        placeholder="Subtitle (English)"
        className="w-full rounded-md border border-border bg-background px-3 py-2"
      />
      <div className="grid gap-3 md:grid-cols-3">
        <input value={subtitleAm} onChange={(e) => setSubtitleAm(e.target.value)} placeholder="Subtitle (Amharic, optional)" className="w-full rounded-md border border-border bg-background px-3 py-2" />
        <input value={subtitleAr} onChange={(e) => setSubtitleAr(e.target.value)} placeholder="Subtitle (Arabic, optional)" className="w-full rounded-md border border-border bg-background px-3 py-2" />
        <input value={subtitleOr} onChange={(e) => setSubtitleOr(e.target.value)} placeholder="Subtitle (Oromifa, optional)" className="w-full rounded-md border border-border bg-background px-3 py-2" />
      </div>
      <textarea
        value={descriptionEn}
        onChange={(e) => setDescriptionEn(e.target.value)}
        placeholder="Description (English) *"
        className="w-full rounded-md border border-border bg-background px-3 py-2 min-h-20"
      />
      <div className="grid gap-3 md:grid-cols-3">
        <textarea value={descriptionAm} onChange={(e) => setDescriptionAm(e.target.value)} placeholder="Description (Amharic, optional)" className="w-full rounded-md border border-border bg-background px-3 py-2 min-h-20" />
        <textarea value={descriptionAr} onChange={(e) => setDescriptionAr(e.target.value)} placeholder="Description (Arabic, optional)" className="w-full rounded-md border border-border bg-background px-3 py-2 min-h-20" />
        <textarea value={descriptionOr} onChange={(e) => setDescriptionOr(e.target.value)} placeholder="Description (Oromifa, optional)" className="w-full rounded-md border border-border bg-background px-3 py-2 min-h-20" />
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
                placeholder="Field key (example: placeholder_keyword)"
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
              subtitle: buildLocalizedText({ en: subtitleEn, am: subtitleAm, ar: subtitleAr, or: subtitleOr }, false),
              description: localizedDescription,
              content: parsed,
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
