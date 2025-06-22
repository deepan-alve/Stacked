'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/AuthProvider'
import { Loader2, AlertCircle } from 'lucide-react'

export function AniListConnectionSimple() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    const simpleLoad = async () => {
      if (!user) {
        setError('No user found')
        setLoading(false)
        return
      }

      try {
        console.log('Simple Debug: User ID:', user.id)
        
        const supabase = createClient()
        
        // Skip auth.getUser() and query profiles directly
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        console.log('Simple Debug: Profile result:', { profile, profileError })
        
        if (profileError) {
          if (profileError.code === 'PGRST116') {
            setError('No profile found - user profile needs to be created')
          } else {
            setError(`Profile error: ${profileError.message}`)
          }
        } else {
          setError('Profile found successfully!')
        }
        
        setDebugInfo({
          userId: user.id,
          email: user.email,
          profileExists: !!profile,
          profileData: profile,
          errorCode: profileError?.code
        })
        
      } catch (err) {
        console.error('Simple Debug error:', err)
        setError(`Error: ${err}`)
      } finally {
        setLoading(false)
      }
    }

    simpleLoad()
  }, [user])

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading simple debug...
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Simple AniList Debug
        </CardTitle>
        <CardDescription>
          Simple debug for profile loading
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium">Status:</p>
            <p className="text-red-600">{error}</p>
          </div>
        )}
        
        <div className="space-y-2">
          <h4 className="font-medium">Debug Information:</h4>
          <pre className="text-xs bg-muted p-3 rounded overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      </CardContent>
    </Card>
  )
}
