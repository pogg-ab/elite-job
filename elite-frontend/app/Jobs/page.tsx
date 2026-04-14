import React, { Suspense } from 'react'
import ClientJobs from './ClientJobs'

export default function Page() {
  return (
    <Suspense fallback={<div />}>
      <ClientJobs />
    </Suspense>
  )
}
