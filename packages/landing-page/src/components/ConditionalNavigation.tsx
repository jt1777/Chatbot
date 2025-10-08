'use client'

import { usePathname } from 'next/navigation'
import MainNavigation from './MainNavigation'

export default function ConditionalNavigation() {
  const pathname = usePathname()
  
  // Don't show main navigation on admin pages
  if (pathname.startsWith('/admin')) {
    return null
  }
  
  return <MainNavigation />
}
