'use client'

import { createContext, useContext } from 'react'

interface NavigationContextType {
  navHeight: number
  isNavVisible: boolean
}

export const NavigationContext = createContext<NavigationContextType>({
  navHeight: 64, // Default height
  isNavVisible: true
})

export const useNavigation = () => {
  const context = useContext(NavigationContext)
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider')
  }
  return context
}
