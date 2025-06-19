// TMDB API service for movies and TV shows
import { MediaLog } from '@/types'

const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY

export interface TMDBMovie {
  id: number
  title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  vote_average: number
  genre_ids: number[]
  popularity: number
}

export interface TMDBTVShow {
  id: number
  name: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  first_air_date: string
  vote_average: number
  genre_ids: number[]
  popularity: number
}

export interface TMDBSearchResponse<T> {
  page: number
  results: T[]
  total_pages: number
  total_results: number
}

export class TMDBService {
  private static async fetchTMDB<T>(endpoint: string): Promise<T> {
    const url = `${TMDB_BASE_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${TMDB_API_KEY}`
    
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`TMDB API error: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('TMDB API error:', error)
      throw error
    }
  }

  // Search movies
  static async searchMovies(query: string, page: number = 1): Promise<TMDBSearchResponse<TMDBMovie>> {
    const endpoint = `/search/movie?query=${encodeURIComponent(query)}&page=${page}`
    return this.fetchTMDB<TMDBSearchResponse<TMDBMovie>>(endpoint)
  }

  // Search TV shows
  static async searchTV(query: string, page: number = 1): Promise<TMDBSearchResponse<TMDBTVShow>> {
    const endpoint = `/search/tv?query=${encodeURIComponent(query)}&page=${page}`
    return this.fetchTMDB<TMDBSearchResponse<TMDBTVShow>>(endpoint)
  }

  // Get popular movies
  static async getPopularMovies(page: number = 1): Promise<TMDBSearchResponse<TMDBMovie>> {
    const endpoint = `/movie/popular?page=${page}`
    return this.fetchTMDB<TMDBSearchResponse<TMDBMovie>>(endpoint)
  }

  // Get popular TV shows
  static async getPopularTV(page: number = 1): Promise<TMDBSearchResponse<TMDBTVShow>> {
    const endpoint = `/tv/popular?page=${page}`
    return this.fetchTMDB<TMDBSearchResponse<TMDBTVShow>>(endpoint)
  }

  // Get movie details
  static async getMovieDetails(movieId: number): Promise<TMDBMovie & { genres: Array<{id: number, name: string}> }> {
    const endpoint = `/movie/${movieId}`
    return this.fetchTMDB<TMDBMovie & { genres: Array<{id: number, name: string}> }>(endpoint)
  }

  // Get TV show details
  static async getTVDetails(tvId: number): Promise<TMDBTVShow & { genres: Array<{id: number, name: string}> }> {
    const endpoint = `/tv/${tvId}`
    return this.fetchTMDB<TMDBTVShow & { genres: Array<{id: number, name: string}> }>(endpoint)
  }

  // Helper to get full image URL
  static getImageURL(path: string | null, size: 'w200' | 'w300' | 'w500' | 'original' = 'w300'): string | null {
    if (!path) return null
    return `https://image.tmdb.org/t/p/${size}${path}`
  }
  // Convert TMDB movie to our MediaLog format
  static convertMovieToMediaLog(movie: TMDBMovie): Partial<MediaLog> {
    return {
      title: movie.title,
      media_type: 'movie',
      external_id: movie.id.toString(),
      cover_url: this.getImageURL(movie.poster_path) || undefined,
      notes: movie.overview,
      rating: Math.round(movie.vote_average), // Convert 10-point to our scale
      tags: [], // Will be populated from genres in detail call
    }
  }

  // Convert TMDB TV show to our MediaLog format
  static convertTVToMediaLog(tv: TMDBTVShow): Partial<MediaLog> {
    return {
      title: tv.name,
      media_type: 'tv',
      external_id: tv.id.toString(),
      cover_url: this.getImageURL(tv.poster_path) || undefined,
      notes: tv.overview,
      rating: Math.round(tv.vote_average),
      tags: [],
    }
  }
}

// Export convenience functions
export async function searchMovies(query: string): Promise<TMDBMovie[]> {
  const response = await TMDBService.searchMovies(query)
  return response.results
}

export async function searchTV(query: string): Promise<TMDBTVShow[]> {
  const response = await TMDBService.searchTV(query)
  return response.results
}

export async function getPopularMovies(): Promise<TMDBMovie[]> {
  const response = await TMDBService.getPopularMovies()
  return response.results
}

export async function getPopularTV(): Promise<TMDBTVShow[]> {
  const response = await TMDBService.getPopularTV()
  return response.results
}
