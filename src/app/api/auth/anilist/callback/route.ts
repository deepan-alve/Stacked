import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anilistClient } from '@/lib/api/anilist'

// Types for AniList data structures
interface AniListMediaEntry {
  id: number
  status: string
  score?: number
  progress?: number
  startedAt?: {
    year?: number
    month?: number
    day?: number
  }
  completedAt?: {
    year?: number
    month?: number
    day?: number
  }
  media: {
    id: number
    title: {
      romaji?: string
      english?: string
      native?: string
    }
    description?: string
    coverImage?: {
      large?: string
      medium?: string
    }
    bannerImage?: string
    episodes?: number
    duration?: number
    genres?: string[]
    studios?: {
      nodes?: Array<{ name: string }>
    }
    averageScore?: number
    popularity?: number
    trending?: number
    season?: string
    seasonYear?: number
    format?: string
    status?: string
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    
    if (error) {
      console.error('AniList OAuth error:', error)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=anilist_auth_failed`)
    }

    if (!code) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=no_code`)
    }    // Exchange code for access token
    const { access_token, user } = await anilistClient.exchangeCodeForToken(code)
    const anilistUser = user as { id: number; name: string; avatar?: { medium: string } }

    // Get Supabase client and current user
    const supabase = await createClient()
    const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()

    if (userError || !currentUser) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth/login?error=not_authenticated`)
    }

    // Update user profile with AniList connection
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        anilist_user_id: anilistUser.id,
        anilist_username: anilistUser.name,
        anilist_avatar_url: anilistUser.avatar?.medium,
        anilist_access_token: access_token,
        anilist_connected_at: new Date().toISOString(),
        power_user_features_enabled: true
      })
      .eq('id', currentUser.id)

    if (updateError) {
      console.error('Error updating profile:', updateError)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=profile_update_failed`)
    }

    // Fetch and cache user's anime list
    try {
      const animeList = await anilistClient.getUserAnimeList(anilistUser.id, access_token)
      
      // Cache the anime list data
      await supabase
        .from('anilist_cache')
        .upsert({
          user_id: currentUser.id,
          data_type: 'anime_list',
          data: animeList.data,
          last_synced: new Date().toISOString()
        })

      // Import anime to our database (async process)
      // This could be moved to a background job for large lists
      await importAniListData(currentUser.id, animeList.data, supabase)

    } catch (syncError) {
      console.error('Error syncing AniList data:', syncError)
      // Don't fail the connection, just log the error
    }

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?success=anilist_connected`)

  } catch (error) {
    console.error('AniList callback error:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=connection_failed`)
  }
}

// Helper function to import AniList data to our database
async function importAniListData(userId: string, anilistData: unknown, supabase: Awaited<ReturnType<typeof createClient>>) {
  try {
    const data = anilistData as { MediaListCollection?: { lists?: unknown[] } }
    const lists = data.MediaListCollection?.lists || []    
    for (const listItem of lists) {
      const list = listItem as { entries?: unknown[] }
      for (const entryItem of list.entries || []) {
        const entry = entryItem as AniListMediaEntry
        const media = entry.media
        
        // First, upsert the anime item
        const { data: animeItem, error: animeError } = await supabase
          .from('media_items')
          .upsert({
            anilist_id: media.id,
            title: media.title.romaji || media.title.english,
            title_romaji: media.title.romaji,
            title_english: media.title.english,
            title_native: media.title.native,
            type: 'anime',
            description: media.description,
            cover_url: media.coverImage?.large || media.coverImage?.medium,
            banner_image_url: media.bannerImage,
            episodes: media.episodes,
            duration: media.duration,
            genres: media.genres || [],
            studios: media.studios?.nodes?.map((s: { name: string }) => s.name) || [],
            average_score: media.averageScore,
            popularity: media.popularity,
            trending: media.trending,
            season: media.season,
            season_year: media.seasonYear,
            format: media.format,
            anime_status: media.status,
            release_year: media.seasonYear,
            external_id: media.id.toString(),
            external_source: 'anilist'
          }, { 
            onConflict: 'anilist_id',
            ignoreDuplicates: false 
          })
          .select()
          .single()

        if (animeError) {
          console.error('Error upserting anime item:', animeError)
          continue
        }

        // Then, create/update the user's media entry
        const startDate = entry.startedAt?.year ? 
          `${entry.startedAt.year}-${(entry.startedAt.month || 1).toString().padStart(2, '0')}-${(entry.startedAt.day || 1).toString().padStart(2, '0')}` : 
          null

        const completeDate = entry.completedAt?.year ? 
          `${entry.completedAt.year}-${(entry.completedAt.month || 1).toString().padStart(2, '0')}-${(entry.completedAt.day || 1).toString().padStart(2, '0')}` : 
          null

        await supabase
          .from('user_media')
          .upsert({
            user_id: userId,
            media_id: animeItem.id,
            status: mapAniListStatusToOurs(entry.status),
            rating: entry.score ? entry.score / 2 : null, // Convert 1-10 to 1-5
            progress: entry.progress || 0,
            started_at: startDate,
            completed_at: completeDate,
            external_id: entry.id.toString(),
            external_source: 'anilist'
          }, { 
            onConflict: 'user_id,media_id',
            ignoreDuplicates: false 
          })
      }
    }

    // Track import event
    await supabase
      .from('analytics_events')
      .insert({
        user_id: userId,
        event_type: 'anilist_import_completed',
        event_data: {
          imported_count: lists.reduce((total: number, listItem: unknown) => {
            const list = listItem as { entries?: unknown[] }
            return total + (list.entries?.length || 0)
          }, 0),
          import_timestamp: new Date().toISOString()
        }
      })

  } catch (error) {
    console.error('Error importing AniList data:', error)
    throw error
  }
}

function mapAniListStatusToOurs(status: string): string {
  const statusMap: Record<string, string> = {
    'CURRENT': 'in_progress',
    'COMPLETED': 'completed',
    'PAUSED': 'on_hold',
    'DROPPED': 'dropped',
    'PLANNING': 'planned',
    'REPEATING': 'in_progress'
  }
  return statusMap[status] || 'planned'
}
