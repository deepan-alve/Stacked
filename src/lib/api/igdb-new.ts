// IGDB API service for games
import { MediaLog } from '@/types'

export interface IGDBGame {
  id: number
  name: string
  summary?: string
  storyline?: string
  rating?: number
  rating_count?: number
  first_release_date?: number
  genres?: Array<{
    id: number
    name: string
  }>
  platforms?: Array<{
    id: number
    name: string
  }>
  cover?: {
    id: number
    url: string
    image_id: string
  }
  screenshots?: Array<{
    id: number
    url: string
    image_id: string
  }>
  involved_companies?: Array<{
    company: {
      name: string
    }
    developer: boolean
    publisher: boolean
  }>
  release_dates?: Array<{
    date: number
    platform: {
      name: string
    }
  }>
}

export class IGDBService {
  // Search games using Next.js API route
  static async searchGames(query: string, limit: number = 20): Promise<IGDBGame[]> {
    try {
      const response = await fetch(`/api/igdb/search?q=${encodeURIComponent(query)}&limit=${limit}`)
      
      if (!response.ok) {
        throw new Error(`IGDB API error: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('IGDB search error:', error)
      // Return empty array instead of throwing to prevent breaking the search
      return []
    }
  }

  // For now, return mock data for popular games until we implement more API routes
  static async getPopularGames(): Promise<IGDBGame[]> {
    // This could be implemented as another API route in the future
    return []
  }

  // Helper to get full image URL
  static getImageURL(imageId: string | undefined, size: 'cover_small' | 'cover_big' | 'screenshot_med' | 'screenshot_big' = 'cover_big'): string | undefined {
    if (!imageId) return undefined
    return `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.jpg`
  }

  // Convert IGDB game to our MediaLog format
  static convertGameToMediaLog(game: IGDBGame): Partial<MediaLog> {
    const coverUrl = game.cover?.image_id ? this.getImageURL(game.cover.image_id, 'cover_big') : undefined
    
    return {
      title: game.name,
      media_type: 'game',
      external_id: game.id.toString(),
      cover_url: coverUrl,
      notes: game.summary || '',
      rating: game.rating ? Math.round(game.rating / 10) : undefined, // Convert from 100-point to 10-point scale
      tags: game.genres?.map(genre => genre.name.toLowerCase()) || [],
    }
  }
}

// Export convenience functions
export async function searchGames(query: string): Promise<IGDBGame[]> {
  return await IGDBService.searchGames(query)
}

export async function getPopularGames(): Promise<IGDBGame[]> {
  return await IGDBService.getPopularGames()
}

export async function getRecentGames(): Promise<IGDBGame[]> {
  return await IGDBService.getPopularGames() // For now, use same as popular
}
