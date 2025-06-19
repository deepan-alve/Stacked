export type MediaType = 'movie' | 'tv' | 'book' | 'anime' | 'game' | 'podcast'

export type MediaStatus = 'completed' | 'in_progress' | 'planned' | 'dropped' | 'on_hold'

export interface Profile {
  id: string
  email: string
  name?: string
  avatar_url?: string
  bio?: string
  created_at: string
}

export interface MediaLog {
  id: string
  user_id: string
  title: string
  media_type: MediaType
  external_id?: string
  cover_url?: string
  notes?: string
  rating?: number
  status: MediaStatus
  date_logged: string
  tags: string[]
  mood?: string
  quote?: string
  is_private: boolean
  created_at: string
  updated_at: string
}

export interface Collection {
  id: string
  user_id: string
  name: string
  description?: string
  emoji: string
  is_private: boolean
  created_at: string
}

export interface CollectionItem {
  id: string
  collection_id: string
  media_log_id: string
  added_at: string
  media_log?: MediaLog
}

// External API types
export interface TMDBMovie {
  id: number
  title: string
  overview: string
  poster_path?: string
  backdrop_path?: string
  release_date: string
  vote_average: number
  genre_ids: number[]
}

export interface TMDBTVShow {
  id: number
  name: string
  overview: string
  poster_path?: string
  backdrop_path?: string
  first_air_date: string
  vote_average: number
  genre_ids: number[]
}

export interface JikanAnime {
  mal_id: number
  title: string
  synopsis: string
  images: {
    jpg: {
      image_url: string
      large_image_url: string
    }
  }
  aired: {
    from: string
  }
  score: number
  genres: Array<{ name: string }>
}

// Search & External API Types
export interface SearchResult {
  id: string
  title: string
  subtitle?: string
  type: MediaType
  description?: string
  coverUrl?: string
  year?: number
  rating?: number
  external_id?: string
  external_source?: string
}

export interface UseMediaSearchResult {
  results: SearchResult[]
  isLoading: boolean
  error: string | null
  search: (query: string, types: MediaType[]) => Promise<void>
}
