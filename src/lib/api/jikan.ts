// Jikan API service for anime
import { MediaLog } from '@/types'

const JIKAN_BASE_URL = 'https://api.jikan.moe/v4'

export interface JikanAnime {
  mal_id: number
  title: string
  title_english?: string
  synopsis?: string
  images: {
    jpg: {
      image_url: string
      small_image_url: string
      large_image_url: string
    }
  }
  aired: {
    from: string | null
    to: string | null
  }
  score: number | null
  scored_by?: number
  rank?: number
  popularity?: number
  status: string
  rating?: string
  genres: Array<{
    mal_id: number
    type: string
    name: string
    url: string
  }>
  type: string
  episodes?: number
}

export interface JikanSearchResponse {
  data: JikanAnime[]
  pagination: {
    last_visible_page: number
    has_next_page: boolean
    current_page: number
    items: {
      count: number
      total: number
      per_page: number
    }
  }
}

export class JikanService {
  private static async fetchJikan<T>(endpoint: string): Promise<T> {
    const url = `${JIKAN_BASE_URL}${endpoint}`
    
    try {
      // Add delay to respect rate limits (3 requests per second)
      await new Promise(resolve => setTimeout(resolve, 350))
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Jikan API error: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Jikan API error:', error)
      throw error
    }
  }

  // Search anime
  static async searchAnime(query: string, page: number = 1): Promise<JikanSearchResponse> {
    const endpoint = `/anime?q=${encodeURIComponent(query)}&page=${page}`
    return this.fetchJikan<JikanSearchResponse>(endpoint)
  }

  // Get top anime
  static async getTopAnime(page: number = 1): Promise<JikanSearchResponse> {
    const endpoint = `/top/anime?page=${page}`
    return this.fetchJikan<JikanSearchResponse>(endpoint)
  }

  // Get anime by season
  static async getSeasonalAnime(year: number, season: 'winter' | 'spring' | 'summer' | 'fall', page: number = 1): Promise<JikanSearchResponse> {
    const endpoint = `/seasons/${year}/${season}?page=${page}`
    return this.fetchJikan<JikanSearchResponse>(endpoint)
  }

  // Get anime details
  static async getAnimeDetails(animeId: number): Promise<{ data: JikanAnime }> {
    const endpoint = `/anime/${animeId}`
    return this.fetchJikan<{ data: JikanAnime }>(endpoint)
  }

  // Convert Jikan anime to our MediaLog format
  static convertAnimeToMediaLog(anime: JikanAnime): Partial<MediaLog> {
    return {
      title: anime.title_english || anime.title,
      media_type: 'anime',
      external_id: anime.mal_id.toString(),
      cover_url: anime.images.jpg.large_image_url,
      notes: anime.synopsis || '',
      rating: anime.score ? Math.round(anime.score) : undefined,
      tags: anime.genres.map(genre => genre.name.toLowerCase()),
    }
  }

  // Get anime by genre
  static async getAnimeByGenre(genreId: number, page: number = 1): Promise<JikanSearchResponse> {
    const endpoint = `/anime?genres=${genreId}&page=${page}`
    return this.fetchJikan<JikanSearchResponse>(endpoint)
  }

  // Get current season anime
  static async getCurrentSeasonAnime(page: number = 1): Promise<JikanSearchResponse> {
    const endpoint = `/seasons/now?page=${page}`
    return this.fetchJikan<JikanSearchResponse>(endpoint)
  }
}

// Export convenience functions
export async function searchAnime(query: string): Promise<JikanAnime[]> {
  const response = await JikanService.searchAnime(query)
  return response.data
}

export async function getTopAnime(): Promise<JikanAnime[]> {
  const response = await JikanService.getTopAnime()
  return response.data
}

export async function getCurrentSeasonAnime(): Promise<JikanAnime[]> {
  const response = await JikanService.getCurrentSeasonAnime()
  return response.data
}
