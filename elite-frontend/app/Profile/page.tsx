'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Profile as ProfileApi, Documents, downloadFile, Auth } from '@/lib/api'
import DocumentUpload from '@/components/DocumentUpload'
import { calculateProfileCompletion } from '@/lib/profileCompletion'
import { useTranslation } from 'react-i18next'

const inputClass = 'w-full rounded-xl border border-border/70 bg-background/80 px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/20'
const labelClass = 'text-xs font-semibold uppercase tracking-wide text-foreground/60 mb-1.5'
const DOCUMENT_TYPES = ['Passport Copy', 'Certificates', 'Training Documents', 'Profile Photo']
const COUNTRY_OPTIONS = ['United Arab Emirates', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Oman', 'Bahrain', 'Jordan', 'Lebanon', 'Malaysia']

const ProfilePage: React.FC = () => {
  const { t } = useTranslation()
  const [profile, setProfile] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [phoneError, setPhoneError] = useState<string | null>(null)

  const [uploadFiles, setUploadFiles] = useState<Record<string, File | null>>(() => ({
    'Passport Copy': null,
    Certificates: null,
    'Training Documents': null,
    'Profile Photo': null,
  }))
  const [uploadingType, setUploadingType] = useState<string | null>(null)
  const role = profile?.role ?? profile?.profile?.role ?? null
  const isPartner = role === 'partner' || role === 'agency' || profile?.is_partner || profile?.profile?.is_partner
  const agency = profile?.foreign_agency ?? profile?.foreignAgency ?? null

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        const p: any = await ProfileApi.get()
        let normalizedAgency = p?.foreign_agency ?? p?.foreignAgency ?? null

        const role = p?.role ?? p?.profile?.role ?? null
        const isPartner = role === 'partner' || role === 'agency' || p?.is_partner || p?.profile?.is_partner
        if (isPartner && !normalizedAgency) {
          try {
            const me: any = await Auth.me()
            normalizedAgency = me?.foreign_agency ?? me?.foreignAgency ?? null
          } catch {
            // Keep profile payload as-is if /me fallback fails.
          }
        }

        if (mounted) {
          setProfile({ ...p, foreign_agency: normalizedAgency })
        }
      } catch (err: any) {
        if (mounted) setError(err?.message ?? t('profilePage.loadError'))
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [t])

  const handleSave = async () => {
    if (!profile) return

    setSaving(true)
    setError(null)
    try {
      // validate phone fields
      try {
        const { isValidEthiopianPhone, phoneValidationMessage, normalizeEthiopianPhone } = await import('@/lib/validation')
        if (profile.phone && !isValidEthiopianPhone(profile.phone)) {
          const msg = phoneValidationMessage(profile.phone)
          setPhoneError(msg)
          setError(msg)
          setSaving(false)
          return
        }
        if (agency?.company_phone && !isValidEthiopianPhone(agency.company_phone)) {
          const msg = phoneValidationMessage(agency.company_phone)
          setError(msg)
          setSaving(false)
          return
        }
      } catch (err) {
        // ignore validation utility errors
      }
      const payload: any = {
        name: profile.name,
        phone: profile.phone,
        preferred_language: profile.preferred_language,
      }

      if (isPartner) {
        payload.foreign_agency = {
          company_name: agency?.company_name,
          company_email: agency?.company_email,
          company_phone: agency?.company_phone,
          country: agency?.country,
        }
      } else {
        payload.profile = {
          full_name: profile.profile?.full_name,
          gender: profile.profile?.gender,
          age: profile.profile?.age ? Number(profile.profile?.age) : null,
          passport_status: profile.profile?.passport_status,
          date_of_birth: profile.profile?.date_of_birth,
          nationality: profile.profile?.nationality,
          address: profile.profile?.address,
          education_level: profile.profile?.education_level,
          experience_summary: profile.profile?.experience_summary,
          preferred_country: profile.profile?.preferred_country,
          skills: profile.profile?.skills ?? [],
        }
      }

      // normalize phone values if possible
      try {
        const { normalizeEthiopianPhone } = await import('@/lib/validation')
        if (payload.phone) payload.phone = normalizeEthiopianPhone(payload.phone)
        if (payload.foreign_agency?.company_phone) payload.foreign_agency.company_phone = normalizeEthiopianPhone(payload.foreign_agency.company_phone)
      } catch {}

      const saveResult: any = await ProfileApi.update(payload)
      const refreshed: any = saveResult?.user ?? (await ProfileApi.get())
      const normalizedAgency = refreshed?.foreign_agency ?? refreshed?.foreignAgency ?? null
      setProfile({ ...refreshed, foreign_agency: normalizedAgency })
    } catch (err: any) {
      setError(err?.message ?? t('profilePage.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const handleUploadByType = async (type: string) => {
    const file = uploadFiles[type]
    if (!file) {
      setError(t('profilePage.pleaseChooseFile'))
      return
    }

    const allowed = ['application/pdf', 'image/jpeg', 'image/png']
    if (!allowed.includes(file.type)) {
      setError(t('profilePage.allowedFormats'))
      return
    }

    setUploadingType(type)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('document_type', type)
      await Documents.upload(fd)

      const refreshed = await ProfileApi.get()
      setProfile(refreshed)
      setUploadFiles((prev) => ({ ...prev, [type]: null }))
    } catch (err: any) {
      setError(err?.message ?? t('profilePage.uploadFailed'))
    } finally {
      setUploadingType(null)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm(t('profilePage.deleteConfirm'))) return

    setError(null)
    try {
      await Documents.destroy(id)
      const refreshed = await ProfileApi.get()
      setProfile(refreshed)
    } catch (err: any) {
      setError(err?.message ?? t('profilePage.deleteFailed'))
    }
  }

  const handleUpdateType = async (id: number, type: string) => {
    setError(null)
    try {
      await Documents.update(id, { document_type: type })
      const refreshed = await ProfileApi.get()
      setProfile(refreshed)
    } catch (err: any) {
      setError(err?.message ?? t('profilePage.updateFailed'))
    }
  }

  const handleDownload = async (id: number) => {
    setError(null)
    try {
      const { blob, disposition } = await downloadFile(`/api/documents/${id}/download`, true)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = disposition.split('filename=')[1]?.replace(/\"|\'/g, '') ?? `document-${id}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      setError(err?.message ?? t('profilePage.downloadFailed'))
    }
  }

  const documents = Array.isArray(profile?.documents)
    ? profile.documents
    : (Array.isArray(profile?.documents?.data) ? profile.documents.data : [])

  const completion = useMemo(() => calculateProfileCompletion(profile), [profile])
  const companyStatusRaw = String(agency?.status ?? '').trim().toLowerCase()
  const companyStatusLabel = companyStatusRaw
    ? companyStatusRaw.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase())
    : t('profilePage.notAvailable', { defaultValue: 'N/A' })
  const companyStatusClass = companyStatusRaw === 'approved'
    ? 'border-primary/30 bg-primary/10 text-primary'
    : companyStatusRaw === 'pending_approval'
      ? 'border-amber-200 bg-amber-50 text-amber-700'
      : companyStatusRaw === 'rejected'
        ? 'border-red-200 bg-red-50 text-red-700'
        : 'border-border bg-background text-foreground/80'
  const displayName = profile?.profile?.full_name || profile?.name || 'Profile'
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word: string) => word[0]?.toUpperCase())
    .join('') || 'P'

  return (
    <main className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <div className="relative isolate overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-28 -left-24 h-64 w-64 rounded-full bg-primary/12 blur-3xl" />
          <div className="absolute top-40 -right-16 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" />
          <div className="absolute inset-0 bg-linear-to-b from-transparent via-background/30 to-background" />
        </div>

        <div className="max-w-5xl mx-auto w-full px-4 py-10 md:py-14">
          {loading && <p className="text-foreground/70">{t('profilePage.loading')}</p>}
          {error && <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</p>}

          {profile && (
            <div className="space-y-6">
              <section className="rounded-3xl border border-border/70 bg-card/80 backdrop-blur p-6 md:p-8 shadow-sm">
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-linear-to-br from-primary to-primary/70 text-primary-foreground grid place-items-center font-bold text-xl shadow-lg">
                      {initials}
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-foreground/60">{t('profilePage.profileCenter')}</p>
                      <h1 className="text-3xl md:text-4xl font-black leading-tight text-foreground">{displayName}</h1>
                      <p className="text-sm text-foreground/65 mt-1">
                        {isPartner
                          ? t('profilePage.partnerProfileSubtext', { defaultValue: 'Manage your partner account and company details.' })
                          : t('profilePage.profileSubtext')}
                      </p>
                    </div>
                  </div>

                  <div className="min-w-52 rounded-2xl border border-border bg-background/70 px-4 py-3">
                    {isPartner ? (
                      <div className="space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
                          {t('profilePage.companyStatus', { defaultValue: 'Company status' })}
                        </p>
                        <span className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${companyStatusClass}`}>
                          {companyStatusLabel}
                        </span>
                        <div className="rounded-xl border border-border/70 bg-card/70 px-3 py-2.5">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground/55">{t('profilePage.reviewNotes', { defaultValue: 'Review notes' })}</p>
                          <p className="mt-1 text-sm text-foreground/75">{agency?.review_notes ?? t('profilePage.notAvailable', { defaultValue: 'N/A' })}</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-foreground/60">{t('profilePage.completion')}</p>
                          <p className="text-2xl font-black text-primary">{completion.percent}%</p>
                        </div>
                        <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
                          <div className="h-full rounded-full bg-linear-to-r from-primary to-primary/70 transition-all duration-300" style={{ width: `${completion.percent}%` }} />
                        </div>
                        <p className="mt-2 text-xs text-foreground/60">{completion.completed} / {completion.total} {t('profilePage.itemsCompleted')}</p>
                      </>
                    )}
                  </div>
                </div>

                {!isPartner && (completion.missingFields.length > 0 || completion.missingDocuments.length > 0) && (
                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-900">
                    <span className="font-semibold">{t('profilePage.missing')}:</span>{' '}
                    {[...completion.missingFields, ...completion.missingDocuments].join(', ')}
                  </div>
                )}
              </section>

              <section className="rounded-3xl border border-border/70 bg-card/80 backdrop-blur p-6 md:p-8 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl md:text-2xl font-bold text-foreground">
                    {isPartner
                      ? t('profilePage.partnerInformation', { defaultValue: 'Partner Information' })
                      : t('profilePage.personalInformation')}
                  </h2>
                  <span className="text-xs rounded-full border border-border px-3 py-1 text-foreground/70">{t('profilePage.mainProfile')}</span>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-foreground/60 mb-3">{t('profilePage.account')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="flex flex-col">
                        <span className={labelClass}>{t('profilePage.name')}</span>
                        <input value={profile.name ?? ''} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className={inputClass} />
                      </label>

                      <label className="flex flex-col">
                        <span className={labelClass}>{t('profilePage.phone')}</span>
                          <input placeholder="+2519XXXXXXXX" value={profile.phone ?? ''} onChange={(e) => { setProfile({ ...profile, phone: e.target.value }); setPhoneError(null) }} className={inputClass} />
                          {phoneError && <p className="mt-2 text-sm text-red-600">{phoneError}</p>}
                          {!phoneError && <p className="mt-2 text-sm text-foreground/60">+2519XXXXXXXX</p>}
                      </label>

                      <label className="flex flex-col">
                        <span className={labelClass}>{t('profilePage.email', { defaultValue: 'Email' })}</span>
                        <input value={profile.email ?? ''} className={inputClass} readOnly />
                      </label>

                      <label className="flex flex-col md:col-span-2">
                        <span className={labelClass}>{t('profilePage.preferredLanguage')}</span>
                        <select value={profile.preferred_language ?? 'en'} onChange={(e) => setProfile({ ...profile, preferred_language: e.target.value })} className={inputClass}>
                          <option value="en">EN</option>
                          <option value="am">AM</option>
                          <option value="ar">AR</option>
                          <option value="or">OR</option>
                        </select>
                      </label>
                    </div>
                  </div>

                  {!isPartner && (
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-foreground/60 mb-3">{t('profilePage.personalDetails')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="flex flex-col md:col-span-2">
                        <span className={labelClass}>{t('profilePage.fullName')}</span>
                        <input value={profile.profile?.full_name ?? ''} onChange={(e) => setProfile({ ...profile, profile: { ...profile.profile, full_name: e.target.value } })} className={inputClass} />
                      </label>

                      <label className="flex flex-col">
                        <span className={labelClass}>{t('profilePage.gender')}</span>
                        <input value={profile.profile?.gender ?? ''} onChange={(e) => setProfile({ ...profile, profile: { ...profile.profile, gender: e.target.value } })} className={inputClass} />
                      </label>

                      <label className="flex flex-col">
                        <span className={labelClass}>{t('profilePage.dateOfBirth')}</span>
                        <input type="date" value={profile.profile?.date_of_birth ?? ''} onChange={(e) => setProfile({ ...profile, profile: { ...profile.profile, date_of_birth: e.target.value } })} className={inputClass} />
                      </label>

                      <label className="flex flex-col">
                        <span className={labelClass}>{t('profilePage.nationality')}</span>
                        <input value={profile.profile?.nationality ?? ''} onChange={(e) => setProfile({ ...profile, profile: { ...profile.profile, nationality: e.target.value } })} className={inputClass} />
                      </label>

                      <label className="flex flex-col md:col-span-2">
                        <span className={labelClass}>{t('profilePage.address')}</span>
                        <textarea value={profile.profile?.address ?? ''} onChange={(e) => setProfile({ ...profile, profile: { ...profile.profile, address: e.target.value } })} className={inputClass} rows={2} />
                      </label>

                      <label className="flex flex-col">
                        <span className={labelClass}>{t('profilePage.passportStatus')}</span>
                        <select value={profile.profile?.passport_status ?? ''} onChange={(e) => setProfile({ ...profile, profile: { ...profile.profile, passport_status: e.target.value } })} className={inputClass}>
                          <option value="">{t('profilePage.selectStatus')}</option>
                          <option value="valid">{t('profilePage.validPassport')}</option>
                          <option value="expired">{t('profilePage.expiredPassport')}</option>
                          <option value="applied">{t('profilePage.appliedPassport')}</option>
                          <option value="none">{t('profilePage.noPassport')}</option>
                        </select>
                      </label>

                      <label className="flex flex-col">
                        <span className={labelClass}>{t('profilePage.age')}</span>
                        <input type="number" min={18} max={65} value={profile.profile?.age ?? ''} onChange={(e) => setProfile({ ...profile, profile: { ...profile.profile, age: e.target.value } })} className={inputClass} />
                      </label>
                    </div>
                  </div>
                  )}

                  {!isPartner && (
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-foreground/60 mb-3">{t('profilePage.professionalDetails')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="flex flex-col">
                        <span className={labelClass}>{t('profilePage.education')}</span>
                        <input value={profile.profile?.education_level ?? ''} onChange={(e) => setProfile({ ...profile, profile: { ...profile.profile, education_level: e.target.value } })} className={inputClass} />
                      </label>

                      <label className="flex flex-col">
                        <span className={labelClass}>{t('profilePage.preferredCountry')}</span>
                        <select value={profile.profile?.preferred_country ?? ''} onChange={(e) => setProfile({ ...profile, profile: { ...profile.profile, preferred_country: e.target.value } })} className={inputClass}>
                          <option value="">Select country</option>
                          {COUNTRY_OPTIONS.map((country) => (
                            <option key={country} value={country}>{country}</option>
                          ))}
                        </select>
                      </label>

                      <label className="flex flex-col md:col-span-2">
                        <span className={labelClass}>{t('profilePage.workExperience')}</span>
                        <textarea value={profile.profile?.experience_summary ?? ''} onChange={(e) => setProfile({ ...profile, profile: { ...profile.profile, experience_summary: e.target.value } })} className={inputClass} rows={3} />
                      </label>

                      <label className="flex flex-col md:col-span-2">
                        <span className={labelClass}>{t('profilePage.skills')}</span>
                        <input
                          value={Array.isArray(profile.profile?.skills) ? profile.profile.skills.join(', ') : ''}
                          onChange={(e) => setProfile({
                            ...profile,
                            profile: {
                              ...profile.profile,
                              skills: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean),
                            },
                          })}
                          className={inputClass}
                        />
                      </label>
                    </div>
                  </div>
                  )}

                  {isPartner && (
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-foreground/60 mb-3">{t('profilePage.companyDetails', { defaultValue: 'Company Details' })}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="flex flex-col md:col-span-2">
                          <span className={labelClass}>{t('profilePage.companyName', { defaultValue: 'Company Name' })}</span>
                          <input
                            value={agency?.company_name ?? ''}
                            onChange={(e) => setProfile({ ...profile, foreign_agency: { ...(agency ?? {}), company_name: e.target.value } })}
                            className={inputClass}
                          />
                        </label>

                        <label className="flex flex-col">
                          <span className={labelClass}>{t('profilePage.companyEmail', { defaultValue: 'Company Email' })}</span>
                          <input
                            type="email"
                            value={agency?.company_email ?? ''}
                            onChange={(e) => setProfile({ ...profile, foreign_agency: { ...(agency ?? {}), company_email: e.target.value } })}
                            className={inputClass}
                          />
                        </label>

                        <label className="flex flex-col">
                          <span className={labelClass}>{t('profilePage.companyPhone', { defaultValue: 'Company Phone' })}</span>
                            <input
                              placeholder="+2519XXXXXXXX"
                              value={agency?.company_phone ?? ''}
                              onChange={(e) => setProfile({ ...profile, foreign_agency: { ...(agency ?? {}), company_phone: e.target.value } })}
                              className={inputClass}
                            />
                            <p className="mt-2 text-sm text-foreground/60">+2519XXXXXXXX</p>
                        </label>

                        <label className="flex flex-col">
                          <span className={labelClass}>{t('profilePage.companyCountry', { defaultValue: 'Company Country' })}</span>
                          <input
                            value={agency?.country ?? ''}
                            onChange={(e) => setProfile({ ...profile, foreign_agency: { ...(agency ?? {}), country: e.target.value } })}
                            className={inputClass}
                          />
                        </label>

                        <label className="flex flex-col">
                          <span className={labelClass}>{t('profilePage.companyApproval', { defaultValue: 'Approval Status' })}</span>
                          <input
                            value={agency?.status ?? t('profilePage.notAvailable', { defaultValue: 'N/A' })}
                            className={inputClass}
                            readOnly
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <Button onClick={handleSave} className="min-w-40 bg-primary hover:bg-primary/90 text-primary-foreground" disabled={saving}>
                    {saving ? t('profilePage.saving') : t('profilePage.saveProfile')}
                  </Button>
                </div>
              </section>

              {!isPartner && (
              <section className="rounded-3xl border border-border/70 bg-card/80 backdrop-blur p-6 md:p-8 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-foreground">{t('profilePage.documents')}</h2>
                    <p className="text-sm text-foreground/65 mt-1">{t('profilePage.requiredDocs')}</p>
                  </div>
                  <span className="rounded-full border border-border px-3 py-1 text-xs text-foreground/60">{t('profilePage.allowed')}</span>
                </div>

                <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {DOCUMENT_TYPES.map((type) => {
                    const isUploading = uploadingType === type
                    const existing = documents.find((d: any) => d.document_type === type)

                    return (
                      <div key={type} className="rounded-2xl border border-border/70 bg-background/70 p-4">
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-foreground">{type}</p>
                          {existing && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">Uploaded</span>}
                        </div>
                        <div className="mt-2">
                          <DocumentUpload documentType={type} onUpload={async () => {
                            setUploadingType(type)
                            setError(null)
                            try {
                              const refreshed = await ProfileApi.get()
                              setProfile(refreshed)
                              setUploadFiles((prev) => ({ ...prev, [type]: null }))
                            } catch (err: any) {
                              setError(err?.message ?? t('profilePage.uploadFailed'))
                            } finally {
                              setUploadingType(null)
                            }
                          }} />
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="space-y-3">
                  {documents.length === 0 && (
                    <div className="rounded-xl border border-dashed border-border px-4 py-5 text-sm text-foreground/60 text-center">
                      {t('profilePage.noDocsUploaded')}
                    </div>
                  )}

                  {documents.map((d: any) => (
                    <div key={d.id} className="rounded-2xl border border-border bg-background/80 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground">{d.document_type}</p>
                        <p className="text-xs text-foreground/60">{t('profilePage.uploadedReady')}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <select value={d.document_type} onChange={(e) => handleUpdateType(d.id, e.target.value)} className="rounded-lg border border-border/70 bg-background px-2.5 py-2 text-sm">
                          <option value="Passport Copy">Passport Copy</option>
                          <option value="Certificates">Certificates</option>
                          <option value="Training Documents">Training Documents</option>
                          <option value="Profile Photo">Profile Photo</option>
                        </select>
                        <Button onClick={() => handleDownload(d.id)} className="bg-primary hover:bg-primary/90">{t('profilePage.view')}</Button>
                        <Button onClick={() => handleDelete(d.id)} variant="outline">{t('profilePage.delete')}</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
              )}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  )
}

export default ProfilePage
