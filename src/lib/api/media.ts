import { createClient } from '@/lib/supabase/client'
import { MediaItem, UserMedia, CreateMediaResponse, UpdateMediaResponse, DeleteMediaResponse } from '@/types/database'

const supabase = createClient()

// Media Items API
export async function getOrCreateMediaItem(
  title: string,
  type: string,
  external_id?: string,
  external_source?: string,
  metadata?: Record<string, unknown>
): Promise<MediaItem | null> {
  try {
    // First try to find existing media item by external ID
    if (external_id && external_source) {
      const { data: existing } = await supabase
        .from('media_items')
        .select('*')
        .eq('external_id', external_id)
        .eq('external_source', external_source)
        .single()

      if (existing) {
        return existing
      }
    }    // If not found, create new media item
    const { data, error } = await supabase
      .from('media_items')
      .insert({
        title,
        type: type as 'movie' | 'tv' | 'book' | 'anime' | 'game' | 'podcast',
        external_id,
        external_source,
        cover_url: metadata?.cover_url as string,
        description: metadata?.description as string,
        release_year: metadata?.release_year as number,
        metadata: metadata || {}
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating media item:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getOrCreateMediaItem:', error)
    return null
  }
}

// User Media API
export async function addUserMedia(
  userId: string,
  mediaData: {
    title: string
    type: string
    rating?: number
    status: string
    review?: string
    notes?: string
    cover_url?: string
    external_id?: string
    external_source?: string
    metadata?: Record<string, unknown>
  }
): Promise<CreateMediaResponse> {
  try {    // First create or get the media item
    const mediaItem = await getOrCreateMediaItem(
      mediaData.title,
      mediaData.type,
      mediaData.external_id,
      mediaData.external_source,
      {
        cover_url: mediaData.cover_url,
        description: mediaData.metadata?.description,
        release_year: mediaData.metadata?.release_year,
        ...mediaData.metadata
      }
    )

    if (!mediaItem) {
      return { success: false, error: 'Failed to create media item' }
    }    // Then create user media entry
    const { data, error } = await supabase
      .from('user_media')
      .insert({
        user_id: userId,
        media_id: mediaItem.id,
        status: mediaData.status as 'completed' | 'in_progress' | 'planned' | 'dropped' | 'on_hold',
        rating: mediaData.rating,
        review: mediaData.review,
        notes: mediaData.notes
      })
      .select(`
        *,
        media_item:media_items(*)
      `)
      .single()

    if (error) {
      console.error('Error adding user media:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error in addUserMedia:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function getUserMedia(userId: string): Promise<UserMedia[]> {
  try {
    const { data, error } = await supabase
      .from('user_media')
      .select(`
        *,
        media_item:media_items(*)
      `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching user media:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getUserMedia:', error)
    return []
  }
}

export async function updateUserMedia(
  userMediaId: string,
  updates: {
    status?: string
    rating?: number
    review?: string
    notes?: string
  }
): Promise<UpdateMediaResponse> {
  try {
    const { data, error } = await supabase
      .from('user_media')
      .update(updates)
      .eq('id', userMediaId)
      .select(`
        *,
        media_item:media_items(*)
      `)
      .single()

    if (error) {
      console.error('Error updating user media:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error in updateUserMedia:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function deleteUserMedia(userMediaId: string): Promise<DeleteMediaResponse> {
  try {
    const { error } = await supabase
      .from('user_media')
      .delete()
      .eq('id', userMediaId)

    if (error) {
      console.error('Error deleting user media:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in deleteUserMedia:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

// Tags API
export async function getOrCreateTag(name: string, color = '#00C2FF') {
  try {
    // First try to find existing tag
    const { data: existing } = await supabase
      .from('tags')
      .select('*')
      .eq('name', name.toLowerCase())
      .single()

    if (existing) {
      return existing
    }

    // Create new tag
    const { data, error } = await supabase
      .from('tags')
      .insert({
        name: name.toLowerCase(),
        color
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating tag:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getOrCreateTag:', error)
    return null
  }
}

export async function addTagToUserMedia(userMediaId: string, tagName: string) {
  try {
    const tag = await getOrCreateTag(tagName)
    if (!tag) return false

    const { error } = await supabase
      .from('user_media_tags')
      .insert({
        user_media_id: userMediaId,
        tag_id: tag.id
      })

    if (error) {
      console.error('Error adding tag to user media:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in addTagToUserMedia:', error)
    return false
  }
}
