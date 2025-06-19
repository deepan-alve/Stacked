import { createClient } from '@/lib/supabase/client'
import { AuthUser } from '@/types/database'
import { ensureProfileExists } from '@/lib/supabase/profile-debug'

const supabase = createClient()

export async function signUp(email: string, password: string, displayName?: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
          username: displayName?.toLowerCase().replace(/\s+/g, '_'),
        },
      },
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error in signUp:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error in signIn:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in signOut:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return null

    // Ensure profile exists (create if missing)
    const profileResult = await ensureProfileExists(user.id, user.email)
    
    if (!profileResult.success) {
      console.error('Failed to ensure profile exists:', profileResult.error)
      // Still return user with undefined profile rather than null
      return {
        id: user.id,
        email: user.email,
        profile: undefined
      }
    }

    return {
      id: user.id,
      email: user.email,
      profile: profileResult.profile
    }
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

export async function updateProfile(userId: string, updates: {
  username?: string
  display_name?: string
  bio?: string
  avatar_url?: string
}) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error updating profile:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

// Listen to auth state changes
export function onAuthStateChange(callback: (user: AuthUser | null) => void) {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      const user = await getCurrentUser()
      callback(user)
    } else {
      callback(null)
    }
  })
}
