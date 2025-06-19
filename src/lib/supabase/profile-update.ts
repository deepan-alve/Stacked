import { createClient } from './client'

const supabase = createClient()

export interface ProfileUpdateResult {
  success: boolean
  error?: string
  profile?: {
    id: string
    username?: string
    display_name?: string
    avatar_url?: string
    bio?: string
    created_at: string
    updated_at: string
  }
}

// Update user profile in the profiles table (not auth metadata)
export async function updateProfile(userId: string, updates: {
  display_name?: string
  bio?: string
  avatar_url?: string
  username?: string
}): Promise<ProfileUpdateResult> {
  try {
    console.log('Updating profile table for user:', userId, 'with data:', updates)
    
    // First, check if profile exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error checking existing profile:', fetchError)
      return { success: false, error: fetchError.message }
    }

    let result
    if (existingProfile) {
      // Update existing profile
      result = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()
    } else {
      // Create new profile
      result = await supabase
        .from('profiles')
        .insert({
          id: userId,
          ...updates,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
    }

    if (result.error) {
      console.error('Error updating/creating profile:', result.error)
      return { success: false, error: result.error.message }
    }

    console.log('Profile updated successfully:', result.data)
    return { success: true, profile: result.data }
  } catch (error) {
    console.error('Unexpected error updating profile:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}

// Get user profile from profiles table
export async function getProfile(userId: string): Promise<ProfileUpdateResult> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching profile:', error)
      return { success: false, error: error.message }
    }

    return { success: true, profile: data }
  } catch (error) {
    console.error('Unexpected error fetching profile:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}

// Upload avatar and update profile in one operation
export async function uploadAvatarAndUpdateProfile(
  file: File, 
  userId: string,
  additionalUpdates?: { display_name?: string; bio?: string }
): Promise<ProfileUpdateResult & { avatarUrl?: string }> {
  try {
    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: 'Invalid file type. Please use PNG, JPEG, JPG, GIF, or WebP.' }
    }

    // Validate file size (5MB max)
    if (file.size > 5242880) {
      return { success: false, error: 'File too large. Please use a file smaller than 5MB.' }
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/avatar.${fileExt}`
    
    // Upload file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true // Replace existing file
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      if (uploadError.message.includes('Bucket not found')) {
        return { success: false, error: 'Storage bucket not configured. Please create the "avatars" bucket in your Supabase Dashboard first.' }
      }
      return { success: false, error: uploadError.message }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(uploadData.path)

    // Update profile with new avatar URL
    const profileResult = await updateProfile(userId, {
      avatar_url: publicUrl,
      ...additionalUpdates
    })

    if (!profileResult.success) {
      return profileResult
    }

    return { 
      success: true, 
      profile: profileResult.profile,
      avatarUrl: publicUrl
    }
  } catch (error) {
    console.error('Error uploading avatar and updating profile:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}
