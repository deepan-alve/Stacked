import { createClient } from './client'

const supabase = createClient()

export async function debugUserProfile(userId: string) {
  try {
    console.log('🔍 Debugging user profile for ID:', userId)
    
    // Check if profile exists in database
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('❌ Error fetching profile:', profileError)
      return { success: false, error: profileError.message }
    }

    if (!profile) {
      console.log('⚠️ Profile not found in database')
      return { success: false, error: 'Profile not found' }
    }

    console.log('✅ Profile found:', profile)

    // Check if avatar file exists in storage
    if (profile.avatar_url) {
      console.log('🖼️ Avatar URL found:', profile.avatar_url)
      
      // Try to fetch the avatar to see if it's accessible
      try {
        const response = await fetch(profile.avatar_url)
        if (response.ok) {
          console.log('✅ Avatar file is accessible')
        } else {
          console.log('❌ Avatar file is not accessible:', response.status)
        }
      } catch (fetchError) {
        console.log('❌ Error fetching avatar:', fetchError)
      }
    } else {
      console.log('⚠️ No avatar URL set in profile')
    }

    return { success: true, profile }
  } catch (error) {
    console.error('❌ Unexpected error in debugUserProfile:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

export async function ensureProfileExists(userId: string, userEmail?: string) {
  try {
    console.log('🔧 Ensuring profile exists for user:', userId)
    
    // Check if profile exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ Error checking profile:', fetchError)
      return { success: false, error: fetchError.message }
    }

    if (existingProfile) {
      console.log('✅ Profile already exists:', existingProfile)
      return { success: true, profile: existingProfile }
    }

    // Create profile if it doesn't exist
    console.log('🆕 Creating new profile...')
    const displayName = userEmail ? userEmail.split('@')[0] : 'User'
    
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        display_name: displayName,
        username: displayName.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (createError) {
      console.error('❌ Error creating profile:', createError)
      return { success: false, error: createError.message }
    }

    console.log('✅ Profile created successfully:', newProfile)
    return { success: true, profile: newProfile }
  } catch (error) {
    console.error('❌ Unexpected error in ensureProfileExists:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}
