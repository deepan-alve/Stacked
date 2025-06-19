'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useStore } from '@/store/media'
import { getCurrentUser, onAuthStateChange } from '@/lib/api/auth'
import { getUserMedia } from '@/lib/api/media'
import { AuthUser } from '@/types/database'

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)
  const { user, setUser, setUserMedia } = useStore()

  // Fix hydration mismatch by ensuring client-side only
  useEffect(() => {
    setIsClient(true)
  }, [])
  useEffect(() => {
    if (!isClient) return

    // Get initial user
    getCurrentUser().then((user) => {
      setUser(user)
      if (user) {
        // Load user's media when component mounts
        getUserMedia(user.id).then(userMedia => {
          setUserMedia(userMedia)
        }).catch(error => {
          console.error('Error loading user media:', error)
        })
      }
      setIsLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = onAuthStateChange(async (user) => {
      setUser(user)
      
      if (user) {
        // Load user's media when they sign in
        try {
          const userMedia = await getUserMedia(user.id)
          setUserMedia(userMedia)
        } catch (error) {
          console.error('Error loading user media:', error)
        }
      } else {
        // Clear user media when they sign out
        setUserMedia([])
      }
      
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [isClient, setUser, setUserMedia])

  // Don't render anything on the server to prevent hydration mismatch
  if (!isClient) {
    return (
      <AuthContext.Provider value={{ user: null, isLoading: true }}>
        {children}
      </AuthContext.Provider>
    )
  }

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}
