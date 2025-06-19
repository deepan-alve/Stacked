import { createClient } from './client'

const supabase = createClient()

// Upload avatar to Supabase Storage
export async function uploadAvatar(file: File, userId: string): Promise<string | null> {
  try {
    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please use PNG, JPEG, JPG, GIF, or WebP.')
    }

    // Validate file size (5MB max)
    if (file.size > 5242880) {
      throw new Error('File too large. Please use a file smaller than 5MB.')
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/avatar.${fileExt}`
    
    // Upload file to storage
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true // Replace existing file
      })

    if (error) {
      console.error('Upload error:', error)
      // Return a more specific error message
      if (error.message.includes('Bucket not found')) {
        throw new Error('Storage bucket not configured. Please create the "avatars" bucket in your Supabase Dashboard first.')
      }
      throw new Error(error.message)
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(data.path)

    return publicUrl
  } catch (error) {
    console.error('Error uploading avatar:', error)
    throw error
  }
}

// Delete avatar from Supabase Storage
export async function deleteAvatar(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from('avatars')
      .remove([`${userId}/avatar.jpg`, `${userId}/avatar.png`, `${userId}/avatar.jpeg`])

    return !error
  } catch (error) {
    console.error('Error deleting avatar:', error)
    return false
  }
}

// Update user profile metadata with timeout
export async function updateUserProfile(updates: {
  full_name?: string
  bio?: string
  location?: string
  website?: string
  avatar_url?: string
  is_public?: boolean
}): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('Updating user profile with data:', updates)
    
    // Set a timeout for the operation
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      controller.abort()
      console.error('Profile update timed out after 8 seconds')
    }, 8000)
    
    try {
      const { error } = await supabase.auth.updateUser({
        data: updates
      })
      
      clearTimeout(timeoutId)

      if (error) {
        console.error('Supabase auth update error:', error)
        return { success: false, error: error.message }
      }

      console.log('Profile update successful')
      return { success: true }
    } catch (updateError) {
      clearTimeout(timeoutId)
      if (controller.signal.aborted) {
        return { success: false, error: 'Profile update timed out. Please try again.' }
      }
      throw updateError
    }
  } catch (error) {
    console.error('Unexpected error in profile update:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}

// Get user profile data
export async function getUserProfile() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return { data: null, error: error?.message || 'User not found' }
    }

    return { data: user, error: null }
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}
