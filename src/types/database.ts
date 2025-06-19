// Core Media Types
export type MediaType = 'movie' | 'tv' | 'book' | 'anime' | 'game' | 'podcast'
export type MediaStatus = 'completed' | 'in_progress' | 'planned' | 'dropped' | 'on_hold'

// Database Types
export interface Profile {
  id: string
  username?: string
  display_name?: string
  avatar_url?: string
  bio?: string
  created_at: string
  updated_at: string
}

export interface MediaItem {
  id: string
  title: string
  subtitle?: string
  type: MediaType
  description?: string
  cover_url?: string
  release_year?: number
  external_id?: string
  external_source?: string
  metadata?: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface UserMedia {
  id: string
  user_id: string
  media_id: string
  status: MediaStatus
  rating?: number // 0-5 with 0.5 increments
  review?: string
  notes?: string
  started_at?: string
  completed_at?: string
  created_at: string
  updated_at: string
  
  // Relations
  media_item?: MediaItem
  tags?: Tag[]
}

export interface Collection {
  id: string
  user_id: string
  name: string
  description?: string
  is_public: boolean
  cover_url?: string
  created_at: string
  updated_at: string
  
  // Relations
  items?: CollectionItem[]
  item_count?: number
}

export interface CollectionItem {
  id: string
  collection_id: string
  media_id: string
  added_at: string
  
  // Relations
  media_item?: MediaItem
}

export interface Tag {
  id: string
  name: string
  color: string
  created_at: string
}

export interface UserMediaTag {
  id: string
  user_media_id: string
  tag_id: string
  
  // Relations
  tag?: Tag
}

// Form Types
export interface AddMediaForm {
  title: string
  type: MediaType
  rating: number
  status: MediaStatus
  review: string
  notes: string
  coverUrl: string
  tags: string[]
}

// API Response Types
export interface CreateMediaResponse {
  success: boolean
  data?: UserMedia
  error?: string
}

export interface UpdateMediaResponse {
  success: boolean
  data?: UserMedia
  error?: string
}

export interface DeleteMediaResponse {
  success: boolean
  error?: string
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

// External API Response Types
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

export interface OpenLibraryBook {
  key: string
  title: string
  author_name?: string[]
  first_publish_year?: number
  cover_i?: number
  isbn?: string[]
}

export interface IGDBGame {
  id: number
  name: string
  summary?: string
  cover?: {
    id: number
    url: string
  }
  first_release_date?: number
  rating?: number
  genres?: Array<{ name: string }>
}

// Auth Types
export interface AuthUser {
  id: string
  email?: string
  profile?: Profile
}

// Store Types
export interface MediaStore {
  // User state
  user: AuthUser | null
  setUser: (user: AuthUser | null) => void
  
  // Media state
  userMedia: UserMedia[]
  setUserMedia: (media: UserMedia[]) => void
  addUserMedia: (media: UserMedia) => void
  updateUserMedia: (id: string, updates: Partial<UserMedia>) => void
  removeUserMedia: (id: string) => void
  
  // Collections state
  collections: Collection[]
  setCollections: (collections: Collection[]) => void
  addCollection: (collection: Collection) => void
  updateCollection: (id: string, updates: Partial<Collection>) => void
  removeCollection: (id: string) => void
  
  // UI state
  searchQuery: string
  setSearchQuery: (query: string) => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

// Database helper types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>
      }
      media_items: {
        Row: MediaItem
        Insert: Omit<MediaItem, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<MediaItem, 'id' | 'created_at' | 'updated_at'>>
      }
      user_media: {
        Row: UserMedia
        Insert: Omit<UserMedia, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<UserMedia, 'id' | 'created_at' | 'updated_at'>>
      }
      collections: {
        Row: Collection
        Insert: Omit<Collection, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Collection, 'id' | 'created_at' | 'updated_at'>>
      }
      collection_items: {
        Row: CollectionItem
        Insert: Omit<CollectionItem, 'id'>
        Update: Partial<Omit<CollectionItem, 'id'>>
      }
      tags: {
        Row: Tag
        Insert: Omit<Tag, 'id' | 'created_at'>
        Update: Partial<Omit<Tag, 'id' | 'created_at'>>
      }
      user_media_tags: {
        Row: UserMediaTag
        Insert: Omit<UserMediaTag, 'id'>
        Update: Partial<Omit<UserMediaTag, 'id'>>
      }
    }
  }
}
