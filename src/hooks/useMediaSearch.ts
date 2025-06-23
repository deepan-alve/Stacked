import { useState, useCallback, useRef } from 'react'
import { TMDBService, TMDBMovie, TMDBTVShow } from '@/lib/api/tmdb'
import { anilistClient, AniListAnime } from '@/lib/api/anilist'
import { OpenLibraryService, OpenLibraryBook } from '@/lib/api/openlibrary'
import { IGDBService, IGDBGame } from '@/lib/api/igdb'

export type SearchResult = {
  id: string
  title: string
  subtitle?: string
  coverUrl?: string
  description?: string
  year?: string
  rating?: number
  type: 'movie' | 'tv' | 'anime' | 'book' | 'game'
  originalData: TMDBMovie | TMDBTVShow | AniListAnime | OpenLibraryBook | IGDBGame
}

export interface UseMediaSearchResult {
  results: SearchResult[]
  isLoading: boolean
  error: string | null
  search: (query: string, types?: string[]) => Promise<void>
  clearResults: () => void
}

export function useMediaSearch(): UseMediaSearchResult {
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const search = useCallback(async (query: string, types: string[] = ['movie', 'tv', 'anime', 'book', 'game']) => {
    if (!query.trim()) {
      setResults([])
      return
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()
    setIsLoading(true)
    setError(null)

    try {
      const searchPromises: Promise<SearchResult[]>[] = []

      // TMDB searches (movies and TV)
      if (types.includes('movie')) {
        searchPromises.push(
          TMDBService.searchMovies(query, 1).then(response =>
            response.results.slice(0, 5).map((movie): SearchResult => ({
              id: `tmdb-movie-${movie.id}`,
              title: movie.title,
              subtitle: movie.release_date ? new Date(movie.release_date).getFullYear().toString() : undefined,
              coverUrl: TMDBService.getImageURL(movie.poster_path, 'w300') || undefined,
              description: movie.overview,
              year: movie.release_date ? new Date(movie.release_date).getFullYear().toString() : undefined,
              rating: movie.vote_average ? Math.round(movie.vote_average) : undefined,
              type: 'movie',
              originalData: movie
            }))
          ).catch(() => [])
        )
      }

      if (types.includes('tv')) {
        searchPromises.push(
          TMDBService.searchTV(query, 1).then(response =>
            response.results.slice(0, 5).map((tv): SearchResult => ({
              id: `tmdb-tv-${tv.id}`,
              title: tv.name,
              subtitle: tv.first_air_date ? new Date(tv.first_air_date).getFullYear().toString() : undefined,
              coverUrl: TMDBService.getImageURL(tv.poster_path, 'w300') || undefined,
              description: tv.overview,
              year: tv.first_air_date ? new Date(tv.first_air_date).getFullYear().toString() : undefined,
              rating: tv.vote_average ? Math.round(tv.vote_average) : undefined,
              type: 'tv',
              originalData: tv
            }))
          ).catch(() => [])
        )
      }      // AniList search (anime)
      if (types.includes('anime')) {
        searchPromises.push(
          anilistClient.searchAnime(query, 1, 5).then((response) =>
            response.data.Page.media.map((anime: AniListAnime): SearchResult => ({
              id: `anilist-anime-${anime.id}`,
              title: anime.title.english || anime.title.romaji || anime.title.native,
              subtitle: anime.seasonYear ? anime.seasonYear.toString() : undefined,
              coverUrl: anime.coverImage?.large || anime.coverImage?.medium,
              description: anime.description,
              year: anime.seasonYear ? anime.seasonYear.toString() : undefined,
              rating: anime.averageScore ? Math.round(anime.averageScore / 10) : undefined,
              type: 'anime',
              originalData: anime
            }))
          ).catch(() => [])
        )
      }      // Open Library search (books)
      if (types.includes('book')) {
        searchPromises.push(
          OpenLibraryService.searchBooks(query, 1).then(response =>
            response.docs.slice(0, 5).map((book): SearchResult => ({
              id: `openlibrary-book-${book.key}`,
              title: book.title,
              subtitle: book.author_name?.[0],
              coverUrl: book.cover_i ? OpenLibraryService.getCoverURL(book.cover_i, 'M') : undefined,
              description: undefined, // Open Library search doesn't include description
              year: book.first_publish_year?.toString(),
              type: 'book',
              originalData: book
            }))
          ).catch(() => [])
        )
      }

      // IGDB search (games)
      if (types.includes('game')) {
        searchPromises.push(
          IGDBService.searchGames(query, 1).then(response =>
            response.slice(0, 5).map((game): SearchResult => ({
              id: `igdb-game-${game.id}`,
              title: game.name,
              subtitle: game.release_dates?.[0] ? new Date(game.release_dates[0].date * 1000).getFullYear().toString() : undefined,
              coverUrl: game.cover?.image_id ? IGDBService.getImageURL(game.cover.image_id, 'cover_big') : undefined,
              description: game.summary,
              year: game.release_dates?.[0] ? new Date(game.release_dates[0].date * 1000).getFullYear().toString() : undefined,
              rating: game.rating ? Math.round(game.rating / 10) : undefined,
              type: 'game',
              originalData: game
            }))
          ).catch(() => [])
        )
      }

      const allResults = await Promise.all(searchPromises)
      const flatResults = allResults.flat()
      
      // Sort by relevance (you could implement more sophisticated scoring)
      const sortedResults = flatResults.sort((a, b) => {
        // Prioritize exact title matches
        const aExact = a.title.toLowerCase() === query.toLowerCase()
        const bExact = b.title.toLowerCase() === query.toLowerCase()
        if (aExact && !bExact) return -1
        if (bExact && !aExact) return 1
        
        // Then by rating
        const aRating = a.rating || 0
        const bRating = b.rating || 0
        return bRating - aRating
      })

      setResults(sortedResults)
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError('Failed to search media. Please try again.')
        console.error('Search error:', err)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clearResults = useCallback(() => {
    setResults([])
    setError(null)
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }, [])

  return {
    results,
    isLoading,
    error,
    search,
    clearResults
  }
}
