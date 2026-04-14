'use client'

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface JobCardProps {
  id: string
  title: string
  company: string
  location: string
  country: string
  salary?: string
  type: 'Full-time' | 'Part-time' | 'Contract'
  description: string
  requirements: string[]
  posted?: string
}

const JobCard: React.FC<JobCardProps> = ({
  id,
  title,
  company,
  location,
  country,
  salary,
  type,
  description,
  requirements,
}) => {
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
                {title}
              </h3>
            </Link>
            <p className="text-foreground/60 font-medium">{company}</p>
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
            <span className="text-sm">{location}, {country}</span>
          </div>
          {salary && (
            <div className="flex items-center gap-1 text-primary font-semibold">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm">{salary}</span>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-foreground/70 text-sm leading-relaxed mb-4 line-clamp-2">
        {description}
      </p>

      {/* Requirements */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-foreground/60 mb-2 uppercase tracking-wide">Requirements</p>
        <div className="flex flex-wrap gap-2">
          {requirements.slice(0, 3).map((req, idx) => (
            <span key={idx} className="inline-block bg-secondary/50 text-secondary-foreground text-xs px-2.5 py-1 rounded-full">
              {req}
            </span>
          ))}
          {requirements.length > 3 && (
            <span className="inline-block text-xs text-foreground/60 px-2.5 py-1">
              +{requirements.length - 3} more
            </span>
          )}
        </div>
      </div>

      {/* Apply Button */}
      <Link href={`/Jobs/${id}`} className="block">
        <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
          View Job & Apply
        </Button>
      </Link>
    </div>
  )
}

export default JobCard
