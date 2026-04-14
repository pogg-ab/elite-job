 'use client'

import React from 'react'

type Props = {
  open: boolean
  title?: string
  children?: React.ReactNode
  onClose: () => void
}

const SimpleModal: React.FC<Props> = ({ open, title, children, onClose }) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-lg w-full p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-foreground/60 hover:text-foreground">✕</button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  )
}

export default SimpleModal
