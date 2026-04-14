'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getAccessToken } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { useTranslation } from 'react-i18next'

interface JobCardProps {
  id: string | number
  title: any
  employer?: string
  location?: string
  country?: string
  salaryRange?: string
  applicationDeadline?: string | null
  skillCategory?: string | null
  type?: 'Full-time' | 'Part-time' | 'Contract' | string
  description?: any
  requiredQualifications?: string[] | null
  posted?: string
  canEdit?: boolean
  onEdit?: () => void
  isPartner?: boolean
}

const JobCard: React.FC<JobCardProps> = ({
  id,
  title,
  employer,
  location,
  country,
  salaryRange,
  applicationDeadline,
  skillCategory,
  type = 'Full-time',
  description,
  requiredQualifications,
  canEdit = false,
  onEdit,
  isPartner = false,
}) => {
  const { t } = useTranslation()
  const displayTitle = (() => {
    if (!title) return ''
    if (typeof title === 'string') return title
    if (typeof title === 'object') return title.en ?? Object.values(title)[0] ?? ''
    return String(title)
  })()

  const displayDescription = (() => {
    if (!description) return ''
    if (typeof description === 'string') return description
    if (typeof description === 'object') return description.en ?? Object.values(description)[0] ?? ''
    return String(description)
  })()

  const reqs = Array.isArray(requiredQualifications) ? requiredQualifications : []
  const displayLocation = [location, country].filter(Boolean)
  const locationText = displayLocation[0] === displayLocation[1]
    ? (displayLocation[0] ?? '')
    : displayLocation.join(', ')
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Full-time':
        return 'bg-primary/10 text-primary dark:bg-primary/25 dark:text-primary-foreground'
      case 'Part-time':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'Contract':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6 hover:shadow-lg hover:border-primary/30 transition-all duration-300 group">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1">
            <Link href={`/Jobs/${id}`}>
              <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition cursor-pointer">
                {displayTitle}
              </h3>
            </Link>
            <p className="text-foreground/60 font-medium">{employer ?? t('jobCard.employerNotSpecified')}</p>
          </div>
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getTypeColor(type)}`}>
            {type}
          </span>
        </div>

        {/* Location & Salary */}
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex items-center gap-1 text-foreground/60">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm">{locationText || t('jobCard.locationNotSpecified')}</span>
          </div>
          {salaryRange && (
            <div className="flex items-center gap-1 text-primary font-semibold">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm">{salaryRange}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {skillCategory && (
            <span className="inline-block bg-secondary/50 text-secondary-foreground text-xs px-2.5 py-1 rounded-full">
              {skillCategory}
            </span>
          )}
          {applicationDeadline && (
            <span className="inline-block bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-full">
              {t('jobCard.applyBy')}: {applicationDeadline}
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-foreground/70 text-sm leading-relaxed mb-4 line-clamp-2">
        {displayDescription}
      </p>

      {/* Requirements */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-foreground/60 mb-2 uppercase tracking-wide">{t('jobCard.requirements')}</p>
        <div className="flex flex-wrap gap-2">
          {reqs.slice(0, 3).map((req, idx) => (
            <span key={idx} className="inline-block bg-secondary/50 text-secondary-foreground text-xs px-2.5 py-1 rounded-full">
              {req}
            </span>
          ))}
          {reqs.length > 3 && (
            <span className="inline-block text-xs text-foreground/60 px-2.5 py-1">
              +{reqs.length - 3} {t('jobCard.more')}
            </span>
          )}
        </div>
      </div>

      {/* Apply / Edit Actions */}
      <div className="flex flex-col gap-3">
        {!isPartner && (
          <ApplyButton id={id} />
        )}

        {canEdit && onEdit && (
          <Button
            className="w-full rounded-lg"
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
          >
            {t('jobCard.edit')}
          </Button>
        )}
      </div>
    </div>
  )
}
export default JobCard

function ApplyButton({ id }: { id: string | number }) {
  const router = useRouter()
  const { t } = useTranslation()

  function handleClick() {
    const token = getAccessToken()
    if (!token) {
      router.push(`/Login?next=/Jobs/${id}`)
      return
    }
    router.push(`/Jobs/${id}`)
  }

  return (
    <button
      onClick={handleClick}
      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold inline-block py-2 px-4 rounded"
    >
      {t('jobCard.viewAndApply')}
    </button>
  )
}

