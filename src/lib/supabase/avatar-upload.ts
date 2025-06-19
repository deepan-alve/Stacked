// Simplified avatar upload that skips metadata update
import { createClient } from './client'

const supabase = createClient()

export async function uploadAvatarOnly(file: File, userId: string): Promise<{ success: boolean; error?: string; url?: string }> {
  try {
    console.log('Starting avatar upload (no metadata update)...')
    console.log('File details:', { name: file.name, size: file.size, type: file.type })

    // Simple validation
    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'Please select an image file' }
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      return { success: false, error: 'File size must be less than 5MB' }
    }

    const fileExt = file.name.split('.').pop() || 'jpg'
    const fileName = `${userId}/avatar.${fileExt}`
    
    console.log('Uploading to path:', fileName)

    // Upload to storage
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      })

    if (error) {
      console.error('Storage upload error:', error)
      return { 
        success: false, 
        error: `Upload failed: ${error.message}`
      }
    }

    console.log('Upload successful:', data)

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(data.path)

    console.log('Public URL:', publicUrl)

    return { 
      success: true, 
      url: publicUrl 
    }

  } catch (error) {
    console.error('Unexpected error in avatar upload:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}
