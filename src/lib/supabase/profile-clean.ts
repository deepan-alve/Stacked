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

// Update user profile metadata
export async function updateUserProfile(updates: {
  full_name?: string
  bio?: string
  location?: string
  website?: string
  avatar_url?: string
  is_public?: boolean
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.updateUser({
      data: updates
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
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
