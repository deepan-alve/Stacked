'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { usePathname } from 'next/navigation'
import { LandingNavigation } from './LandingNavigation'
import { AppTopNavigation } from './AppTopNavigation'
import { FloatingBottomNav } from './FloatingBottomNav'
import { NavigationContext } from '@/hooks/useNavigation'

export function NavigationWrapper() {
  const { user } = useAuth()
  const pathname = usePathname()
  const [isNavVisible, setIsNavVisible] = useState(true)

  // Show landing navigation only for non-authenticated users on the landing page
  const showLandingNav = !user && pathname === '/'
  
  // Show app top navigation for authenticated users (excluding auth pages)
  const showAppNav = user && !pathname.startsWith('/auth')

  // Listen for scroll events to track navigation visibility
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      if (currentScrollY < 100) {
        setIsNavVisible(true)
      } else {
        // This will be managed by individual nav components
        // but we can sync the state here if needed
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navigationContextValue = {
    isNavVisible,
    navHeight: 64
  }

  if (showLandingNav) {
    return (
      <NavigationContext.Provider value={navigationContextValue}>
        <LandingNavigation />
      </NavigationContext.Provider>
    )
  }
  
  if (showAppNav) {
    return (
      <NavigationContext.Provider value={navigationContextValue}>
        <AppTopNavigation />
        <FloatingBottomNav />
      </NavigationContext.Provider>
    )
  }

  // No navigation on auth pages for non-authenticated users
  return (
    <NavigationContext.Provider value={navigationContextValue}>
      {null}
    </NavigationContext.Provider>
  )
}
