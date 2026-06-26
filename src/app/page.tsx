'use client'

import { Suspense } from 'react'
import { AppShell } from '@/components/shell/app-shell'

export default function Home() {
  return (
    <Suspense fallback={null}>
      <AppShell />
    </Suspense>
  )
}
