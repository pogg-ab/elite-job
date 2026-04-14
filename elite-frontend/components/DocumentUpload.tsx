'use client'

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Documents } from '@/lib/api'

interface DocumentUploadProps {
  onUpload?: (file: File) => void
  documentType?: string
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  onUpload,
  documentType = 'Document'
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png']
  const maxSize = 5 * 1024 * 1024 // 5MB

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (file: File) => {
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Please upload PDF, JPG, or PNG.')
      return
    }

    if (file.size > maxSize) {
      alert('File size exceeds 5MB limit.')
      return
    }

    setUploadedFile(file)
    setIsUploading(false)
  }

  const handleConfirmUpload = async () => {
    if (!uploadedFile) return
    setIsUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', uploadedFile)
      fd.append('document_type', documentType)
      await Documents.upload(fd)
      if (onUpload) onUpload(uploadedFile)
      setUploadedFile(null)
      alert('Document uploaded successfully')
    } catch (err: any) {
      alert(err?.message ?? 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="w-full">
      {!uploadedFile ? (
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition cursor-pointer ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50 bg-background'
          }`}
        >
          <div className="text-4xl mb-4">📄</div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {documentType} Upload
          </h3>
          <p className="text-foreground/60 text-sm mb-4">
            Drag and drop your file here or click to select
          </p>
          <p className="text-xs text-foreground/50 mb-4">
            Accepted formats: PDF, JPG, PNG (Max 5MB)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            aria-label="Upload file"
          />
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            Select File
          </Button>
        </div>
      ) : (
        <div className="bg-primary/10 dark:bg-primary/20 border border-primary/25 dark:border-primary/35 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="text-3xl">✓</div>
              <div>
                <p className="font-semibold text-primary dark:text-primary-foreground">
                  {uploadedFile.name}
                </p>
                <p className="text-xs text-primary/80 dark:text-primary-foreground/80">
                  {isUploading ? 'Uploading...' : 'Upload complete'}
                </p>
              </div>
            </div>
          </div>

          {isUploading && (
            <div className="w-full bg-gray-200 rounded-full h-1 dark:bg-gray-700">
              <div
                className="bg-primary h-1 rounded-full animate-pulse"
                style={{ width: '75%' }}
              ></div>
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <Button
              type="button"
              variant="outline"
              className="text-primary border-primary/30 hover:bg-primary/10"
              onClick={() => setUploadedFile(null)}
              disabled={isUploading}
            >
              Replace
            </Button>
            <Button
              type="button"
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={isUploading}
              onClick={handleConfirmUpload}
            >
              {isUploading ? 'Uploading...' : 'Confirm Upload'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DocumentUpload
