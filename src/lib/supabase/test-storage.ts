// Quick test to verify Supabase Storage is working
import { createClient } from '@/lib/supabase/client'

export async function testSupabaseStorage() {
  const supabase = createClient()
  
  try {
    console.log('Testing Supabase Storage connection...')
    
    // Test: Try to access the avatars bucket directly
    const { data: files, error } = await supabase.storage
      .from('avatars')
      .list('', { limit: 1 })
    
    if (error) {
      console.error('Error accessing avatars bucket:', error)
      
      if (error.message.includes('Bucket not found')) {
        return { 
          success: false, 
          error: 'Avatars bucket not found. Please create it using the SQL method in your Supabase Dashboard.'
        }
      }
      
      return { success: false, error: `Storage error: ${error.message}` }
    }
    
    console.log('Avatars bucket is accessible. Current files:', files)
    
    // Test: Try to get a public URL (this should work even for non-existent files)
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl('test/dummy.jpg')
    
    console.log('Public URL generation works:', publicUrl)
    
    return { 
      success: true, 
      message: 'Avatars bucket is working correctly! Upload should work now.',
      fileCount: files?.length || 0,
      testUrl: publicUrl
    }
    
  } catch (error) {
    console.error('Unexpected error:', error)
    return { 
      success: false, 
      error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}
