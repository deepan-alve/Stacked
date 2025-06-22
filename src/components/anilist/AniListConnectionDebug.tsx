'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/AuthProvider'
import { Loader2, AlertCircle } from 'lucide-react'

export function AniListConnectionDebug() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<Record<string, unknown> | null>(null)
  useEffect(() => {
    const debugLoad = async () => {
      if (!user) {
        setError('No user found')
        setLoading(false)
        return
      }

      try {
        console.log('Debug: User from AuthProvider:', user)
        
        const supabase = createClient()
        console.log('Debug: Supabase client created')
        
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth call timeout')), 5000)
        )
        
        const authPromise = supabase.auth.getUser()
          console.log('Debug: About to call auth.getUser()')
        const result = await Promise.race([
          authPromise,
          timeoutPromise
        ])
        
        const { data: authUser, error: authError } = result as { data: any; error: any }
        
        console.log('Debug: Auth user:', authUser, 'Error:', authError)
        
        if (authError) {
          setError(`Auth error: ${authError.message}`)
          return
        }

        // Since we already have user from AuthProvider, let's try to query profiles directly
        console.log('Debug: About to query profiles table')
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id) // Use user.id from AuthProvider instead
          .single()
        
        console.log('Debug: Profile query result:', { profile, profileError })
        
        if (profileError) {
          if (profileError.code === 'PGRST116') {
            setError('No profile found - this might be a new user')
          } else {
            setError(`Profile error: ${profileError.message} (Code: ${profileError.code})`)
          }
        }
        
        setDebugInfo({
          userIdFromAuth: user.id,
          userEmailFromAuth: user.email,
          profile,
          profileError: profileError?.message,
          profileErrorCode: profileError?.code
        })
        
      } catch (err: any) {
        console.error('Debug: Catch error:', err)
        setError(`Unexpected error: ${err.message || err}`)
      } finally {
        setLoading(false)
      }
    }

    debugLoad()
  }, [user])

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading debug info...
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          AniList Debug Info
        </CardTitle>
        <CardDescription>
          Debug information for AniList connection issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium">Error:</p>
            <p className="text-red-600">{error}</p>
          </div>
        )}
        
        <div className="space-y-2">
          <h4 className="font-medium">Debug Information:</h4>
          <pre className="text-xs bg-muted p-3 rounded overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
        
        <div className="space-y-2">
          <h4 className="font-medium">User from Auth Provider:</h4>
          <pre className="text-xs bg-muted p-3 rounded overflow-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
      </CardContent>
    </Card>
  )
}
