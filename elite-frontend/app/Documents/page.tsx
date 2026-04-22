 'use client'

import React, { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Profile, downloadFile, Documents, getAccessToken } from '@/lib/api'
import DocumentUpload from '@/components/DocumentUpload'
import { toast } from '@/hooks/use-toast'
import { useTranslation } from 'react-i18next'

const DocumentsPage: React.FC = () => {
  const { t } = useTranslation()
  const [docs, setDocs] = useState<any[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [docType, setDocType] = useState('Passport Copy')
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        const token = getAccessToken()
        if (!token) {
          if (mounted) setError(t('documentsPage.loginRequired'))
          return
        }

        const profile = await Profile.get()
        const list = Array.isArray(profile.documents) ? profile.documents : (profile.documents?.data ?? [])
        if (mounted) setDocs(list)
      } catch (err: any) {
        if (mounted) setError(err?.message ?? t('documentsPage.loadError'))
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => { mounted = false }
  }, [t])

  const handleDownload = async (id: number) => {
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
      toast({ title: 'Download failed', description: err?.message ?? t('documentsPage.downloadFailed'), variant: 'destructive' })
    }
  }

  return (
    <main className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto w-full px-4 py-12">
        <h1 className="text-3xl font-bold text-foreground mb-4">{t('documentsPage.title')}</h1>
        {loading && <p>{t('documentsPage.loading')}</p>}
        {error && <p className="text-red-600">{error}</p>}

        <div className="space-y-6">
          <div className="bg-card border border-border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-2">{t('documentsPage.uploadTitle')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <label className="flex flex-col">
                <span className="text-sm mb-1">{t('documentsPage.documentType')}</span>
                <select value={docType} onChange={(e) => setDocType(e.target.value)} className="px-3 py-2 border rounded">
                  <option value="Passport Copy">Passport Copy</option>
                  <option value="Certificates">Certificates</option>
                  <option value="Training Documents">Training Documents</option>
                  <option value="Profile Photo">Profile Photo</option>
                </select>
              </label>
              <label className="flex flex-col md:col-span-2">
                <span className="text-sm mb-1">{t('documentsPage.file')}</span>
                <div>
                  <DocumentUpload documentType={docType} onUpload={async () => {
                    // reload documents after upload
                    try {
                      const profile = await Profile.get()
                      const list = Array.isArray(profile.documents) ? profile.documents : (profile.documents?.data ?? [])
                      setDocs(list)
                      setDocType('Passport Copy')
                    } catch (err: any) {
                      setError(err?.message ?? t('documentsPage.uploadFailed'))
                    }
                  }} />
                </div>
              </label>
            </div>
            <div>
              {/* Upload handled by DocumentUpload above */}
              {error && <p className="text-red-600 mt-2">{error}</p>}
            </div>
          </div>

          <div className="space-y-3">
            {docs.map((d: any) => (
              <div key={d.id} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{d.document_type ?? d.name}</p>
                  <p className="text-xs text-foreground/60">{t('documentsPage.status')}: {d.status}</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleDownload(d.id)} className="text-sm">{t('documentsPage.download')}</Button>
                </div>
              </div>
            ))}
            {docs.length === 0 && !loading && <p className="text-foreground/60">{t('documentsPage.noDocs')}</p>}
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}

export default DocumentsPage
