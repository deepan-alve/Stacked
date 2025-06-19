'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useStore } from '@/store/media'
import { searchMovies } from '@/lib/api/tmdb'
import { searchBooks } from '@/lib/api/openlibrary'
import { searchAnime } from '@/lib/api/jikan'
import { searchGames } from '@/lib/api/igdb'
import { 
  Search, 
  Filter, 
  Star, 
  Bookmark,
  X,
  Film,
  Book,
  Tv,
  Gamepad2,
  Music,
  Sparkles,
  ArrowRight,
  History
} from 'lucide-react'

interface SearchResult {
  id: string
  title: string
  type: 'movie' | 'tv' | 'book' | 'anime' | 'game' | 'podcast'
  coverUrl?: string
  description?: string
  rating?: number
  year?: number
  genre?: string[]
  external_id?: string
  external_source?: string
}

interface SearchFilters {
  type: string
  genre: string
  year: string
  rating: string
  status: string
}

const mediaTypes = [
  { value: 'all', label: 'All Media', icon: Search },
  { value: 'movie', label: 'Movies', icon: Film },
  { value: 'tv', label: 'TV Shows', icon: Tv },
  { value: 'book', label: 'Books', icon: Book },
  { value: 'anime', label: 'Anime', icon: Star },
  { value: 'game', label: 'Games', icon: Gamepad2 },
  { value: 'podcast', label: 'Podcasts', icon: Music },
]

export default function GlobalSearchPage() {
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [userResults, setUserResults] = useState<SearchResult[]>([])
  const [filters, setFilters] = useState<SearchFilters>({
    type: 'all',
    genre: 'all',
    year: 'all',
    rating: 'all',
    status: 'all'
  })
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [savedSearches, setSavedSearches] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const { userMedia } = useStore()
  const router = useRouter()

  // Load search history from localStorage
  useEffect(() => {
    const history = localStorage.getItem('search-history')
    const saved = localStorage.getItem('saved-searches')
    if (history) setSearchHistory(JSON.parse(history))
    if (saved) setSavedSearches(JSON.parse(saved))
  }, [])

  // Search user's library
  useEffect(() => {
    if (!query.trim() || !userMedia.length) {
      setUserResults([])
      return
    }

    const results = userMedia
      .filter(item => {
        const title = item.media_item?.title?.toLowerCase() || ''
        const description = item.media_item?.description?.toLowerCase() || ''
        const searchTerm = query.toLowerCase()
        
        const matchesQuery = title.includes(searchTerm) || description.includes(searchTerm)
        const matchesType = filters.type === 'all' || item.media_item?.type === filters.type
        const matchesStatus = filters.status === 'all' || item.status === filters.status
        
        return matchesQuery && matchesType && matchesStatus
      })
      .map(item => ({
        id: item.id,
        title: item.media_item?.title || '',
        type: item.media_item?.type || 'movie',
        coverUrl: item.media_item?.cover_url || item.media_item?.metadata?.cover_url as string,
        description: item.media_item?.description,
        rating: item.rating,
        year: item.media_item?.release_year,
        external_id: item.media_item?.external_id,
        external_source: item.media_item?.external_source,
      })) as SearchResult[]

    setUserResults(results)
  }, [query, userMedia, filters])

  // External API search with debounce
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const results: SearchResult[] = []

        // Search different APIs based on filter
        if (filters.type === 'all' || filters.type === 'movie') {
          const movieResults = await searchMovies(query)
          results.push(...movieResults.slice(0, 5).map(movie => ({
            id: movie.id.toString(),
            title: movie.title,
            type: 'movie' as const,
            coverUrl: movie.poster_path ? `https://image.tmdb.org/t/p/w300${movie.poster_path}` : undefined,
            description: movie.overview,
            year: movie.release_date ? new Date(movie.release_date).getFullYear() : undefined,
            external_id: movie.id.toString(),
            external_source: 'tmdb'
          })))
        }

        if (filters.type === 'all' || filters.type === 'book') {
          const bookResults = await searchBooks(query)
          results.push(...bookResults.slice(0, 5).map(book => ({
            id: book.key,
            title: book.title,
            type: 'book' as const,            coverUrl: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : undefined,
            description: book.subject?.[0],
            year: book.first_publish_year,
            external_id: book.key,
            external_source: 'openlibrary'
          })))
        }        if (filters.type === 'all' || filters.type === 'anime') {
          const animeResults = await searchAnime(query)
          results.push(...animeResults.slice(0, 5).map(anime => ({
            id: anime.mal_id.toString(),
            title: anime.title,
            type: 'anime' as const,
            coverUrl: anime.images?.jpg?.image_url,
            description: anime.synopsis,
            rating: anime.score ?? undefined,
            year: anime.aired?.from ? new Date(anime.aired.from).getFullYear() : undefined,
            external_id: anime.mal_id.toString(),
            external_source: 'jikan'
          })))
        }

        if (filters.type === 'all' || filters.type === 'game') {
          const gameResults = await searchGames(query)
          results.push(...gameResults.slice(0, 5).map(game => ({
            id: game.id.toString(),
            title: game.name,
            type: 'game' as const,
            coverUrl: game.cover?.url ? `https:${game.cover.url.replace('t_thumb', 't_cover_big')}` : undefined,
            description: game.summary,
            rating: game.rating ? Math.round(game.rating / 10) : undefined,
            year: game.first_release_date ? new Date(game.first_release_date * 1000).getFullYear() : undefined,
            external_id: game.id.toString(),
            external_source: 'igdb'
          })))
        }

        setSearchResults(results)
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [query, filters.type])

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery)
    
    // Add to search history
    if (searchQuery.trim() && !searchHistory.includes(searchQuery)) {
      const newHistory = [searchQuery, ...searchHistory.slice(0, 9)]
      setSearchHistory(newHistory)
      localStorage.setItem('search-history', JSON.stringify(newHistory))
    }
  }

  const saveSearch = (searchQuery: string) => {
    if (!savedSearches.includes(searchQuery)) {
      const newSaved = [searchQuery, ...savedSearches]
      setSavedSearches(newSaved)
      localStorage.setItem('saved-searches', JSON.stringify(newSaved))
    }
  }

  const removeSavedSearch = (searchQuery: string) => {
    const newSaved = savedSearches.filter(s => s !== searchQuery)
    setSavedSearches(newSaved)
    localStorage.setItem('saved-searches', JSON.stringify(newSaved))
  }

  const handleResultClick = (result: SearchResult) => {
    setSelectedResult(result)
  }
  const addToLibrary = () => {
    if (selectedResult) {
      router.push(`/add?prefill=${encodeURIComponent(JSON.stringify({
        title: selectedResult.title,
        type: selectedResult.type,
        coverUrl: selectedResult.coverUrl,
        description: selectedResult.description,
        external_id: selectedResult.external_id,
        external_source: selectedResult.external_source,
        year: selectedResult.year
      }))}`)
      setSelectedResult(null)
    }
  }

  const getTypeIcon = (type: string) => {
    const typeData = mediaTypes.find(t => t.value === type)
    return typeData ? typeData.icon : Search
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">
          <span className="gradient-text">Discover</span> & Search
        </h1>
        <p className="text-muted-foreground text-lg">
          Find your next favorite movie, book, game, or show
        </p>
      </div>

      {/* Search Bar */}
      <Card className="glass-card mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4">
            {/* Main Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search for movies, books, games, anime..."
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-12 pr-20 h-12 text-lg"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4" />
                </Button>
                {query && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => saveSearch(query)}
                  >
                    <Bookmark className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="flex flex-wrap gap-2">
                <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Media Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {mediaTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="dropped">Dropped</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Search History & Saved Searches */}
            {!query && (searchHistory.length > 0 || savedSearches.length > 0) && (
              <div className="space-y-4">
                {searchHistory.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <History className="h-4 w-4" />
                      Recent Searches
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {searchHistory.slice(0, 5).map((search, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => setQuery(search)}
                          className="text-xs"
                        >
                          {search}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {savedSearches.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Bookmark className="h-4 w-4" />
                      Saved Searches
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {savedSearches.map((search, index) => (
                        <div key={index} className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setQuery(search)}
                            className="text-xs"
                          >
                            {search}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSavedSearch(search)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {query && (
        <div className="space-y-8">
          {/* User Library Results */}
          {userResults.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                In Your Library ({userResults.length})
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {userResults.map((result) => {
                  const Icon = getTypeIcon(result.type)
                  return (
                    <Card key={result.id} className="glass-card cursor-pointer hover:border-primary/50 transition-colors"
                          onClick={() => handleResultClick(result)}>
                      <CardContent className="p-3">
                        <div className="relative aspect-[2/3] mb-3 rounded overflow-hidden bg-muted">
                          {result.coverUrl && (
                            <Image
                              src={result.coverUrl}
                              alt={result.title}
                              fill
                              className="object-cover"
                            />
                          )}
                          <div className="absolute top-2 left-2">
                            <Badge variant="secondary" className="text-xs">
                              <Icon className="h-3 w-3 mr-1" />
                              {result.type}
                            </Badge>
                          </div>
                          {result.rating && (
                            <div className="absolute bottom-2 right-2 bg-black/70 rounded px-2 py-1">
                              <div className="flex items-center gap-1 text-yellow-400 text-xs">
                                <Star className="h-3 w-3 fill-current" />
                                {result.rating}
                              </div>
                            </div>
                          )}
                        </div>
                        <h3 className="font-medium text-sm line-clamp-2">{result.title}</h3>
                        {result.year && <p className="text-xs text-muted-foreground">{result.year}</p>}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {/* External Search Results */}
          {(searchResults.length > 0 || isSearching) && (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent" />
                Discover New Media
                {isSearching && <span className="text-sm text-muted-foreground">(searching...)</span>}
              </h2>
              
              {isSearching ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {[...Array(10)].map((_, i) => (
                    <Card key={i} className="glass-card">
                      <CardContent className="p-3">
                        <div className="aspect-[2/3] mb-3 rounded bg-muted animate-pulse" />
                        <div className="h-4 bg-muted animate-pulse rounded mb-2" />
                        <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {searchResults.map((result) => {
                    const Icon = getTypeIcon(result.type)
                    return (
                      <Card key={`${result.external_source}-${result.id}`} 
                            className="glass-card cursor-pointer hover:border-accent/50 transition-colors"
                            onClick={() => handleResultClick(result)}>
                        <CardContent className="p-3">
                          <div className="relative aspect-[2/3] mb-3 rounded overflow-hidden bg-muted">
                            {result.coverUrl && (
                              <Image
                                src={result.coverUrl}
                                alt={result.title}
                                fill
                                className="object-cover"
                              />
                            )}
                            <div className="absolute top-2 left-2">
                              <Badge variant="secondary" className="text-xs">
                                <Icon className="h-3 w-3 mr-1" />
                                {result.type}
                              </Badge>
                            </div>
                            {result.rating && (
                              <div className="absolute bottom-2 right-2 bg-black/70 rounded px-2 py-1">
                                <div className="flex items-center gap-1 text-yellow-400 text-xs">
                                  <Star className="h-3 w-3 fill-current" />
                                  {result.rating}
                                </div>
                              </div>
                            )}
                          </div>
                          <h3 className="font-medium text-sm line-clamp-2">{result.title}</h3>
                          {result.year && <p className="text-xs text-muted-foreground">{result.year}</p>}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* No Results */}
          {!isSearching && searchResults.length === 0 && userResults.length === 0 && query && (
            <Card className="glass-card">
              <CardContent className="p-12 text-center">
                <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No results found</h3>
                <p className="text-muted-foreground">
                  Try different keywords or adjust your filters
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Discovery Section - Show when no search query */}
      {!query && (
        <div className="space-y-12">
          {/* Trending Movies */}
          <TrendingSection 
            title="Trending Movies"
            icon={Film}
            type="movie"
            onResultClick={handleResultClick}
          />
          
          {/* Popular Books */}
          <TrendingSection 
            title="Popular Books"
            icon={Book}
            type="book"
            onResultClick={handleResultClick}
          />
          
          {/* Top Anime */}
          <TrendingSection 
            title="Top Anime"
            icon={Star}
            type="anime"
            onResultClick={handleResultClick}
          />
          
          {/* Popular Games */}
          <TrendingSection 
            title="Popular Games"
            icon={Gamepad2}
            type="game"
            onResultClick={handleResultClick}
          />
        </div>
      )}
      
      {/* Result Detail Modal */}
      <Dialog open={!!selectedResult} onOpenChange={() => setSelectedResult(null)}>
        <DialogContent className="max-w-2xl">
          {selectedResult && (
            <div>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {React.createElement(getTypeIcon(selectedResult.type), { className: "h-5 w-5" })}
                  {selectedResult.title}
                </DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <div className="aspect-[2/3] rounded overflow-hidden bg-muted">
                  {selectedResult.coverUrl && (
                    <Image
                      src={selectedResult.coverUrl}
                      alt={selectedResult.title}
                      width={300}
                      height={450}
                      className="object-cover w-full h-full"
                    />
                  )}
                </div>
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <Badge variant="secondary" className="mb-2">
                      {selectedResult.type}
                    </Badge>
                    {selectedResult.year && (
                      <Badge variant="outline" className="mb-2 ml-2">
                        {selectedResult.year}
                      </Badge>
                    )}
                    {selectedResult.rating && (
                      <div className="flex items-center gap-1 mb-2">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{selectedResult.rating}/10</span>
                      </div>
                    )}
                  </div>
                  {selectedResult.description && (
                    <p className="text-muted-foreground text-sm line-clamp-6">
                      {selectedResult.description}
                    </p>
                  )}
                  <div className="flex gap-2 pt-4">
                    <Button onClick={addToLibrary} className="flex-1">
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Add to Library
                    </Button>
                    <Button variant="outline" onClick={() => setSelectedResult(null)}>
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// TrendingSection Component
function TrendingSection({ 
  title, 
  icon: Icon, 
  type, 
  onResultClick 
}: { 
  title: string
  icon: React.ComponentType<{ className?: string }>
  type: string
  onResultClick: (result: SearchResult) => void 
}) {
  const [trendingData, setTrendingData] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTrendingData = async () => {
      setIsLoading(true)
      try {
        let results: SearchResult[] = []
        
        switch (type) {
          case 'movie':
            const { getPopularMovies } = await import('@/lib/api/tmdb')
            const movies = await getPopularMovies()
            results = movies.slice(0, 10).map(movie => ({
              id: movie.id.toString(),
              title: movie.title,
              type: 'movie' as const,
              coverUrl: movie.poster_path ? `https://image.tmdb.org/t/p/w300${movie.poster_path}` : undefined,
              description: movie.overview,
              year: movie.release_date ? new Date(movie.release_date).getFullYear() : undefined,
              rating: Math.round(movie.vote_average),
              external_id: movie.id.toString(),
              external_source: 'tmdb'
            }))
            break
            
          case 'book':
            const { getTrendingBooks } = await import('@/lib/api/openlibrary')
            const books = await getTrendingBooks()
            results = books.slice(0, 10).map(book => ({
              id: book.key,
              title: book.title,
              type: 'book' as const,
              coverUrl: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : undefined,
              description: book.subject?.[0],
              year: book.first_publish_year,
              external_id: book.key,
              external_source: 'openlibrary'
            }))
            break
            
          case 'anime':
            const { getTopAnime } = await import('@/lib/api/jikan')
            const anime = await getTopAnime()
            results = anime.slice(0, 10).map(a => ({
              id: a.mal_id.toString(),
              title: a.title,
              type: 'anime' as const,
              coverUrl: a.images?.jpg?.image_url,
              description: a.synopsis,
              rating: a.score ?? undefined,
              year: a.aired?.from ? new Date(a.aired.from).getFullYear() : undefined,
              external_id: a.mal_id.toString(),
              external_source: 'jikan'
            }))
            break
            
          case 'game':
            const { getPopularGames } = await import('@/lib/api/igdb')
            const games = await getPopularGames()
            results = games.slice(0, 10).map(game => ({
              id: game.id.toString(),
              title: game.name,
              type: 'game' as const,
              coverUrl: game.cover?.url ? `https:${game.cover.url.replace('t_thumb', 't_cover_big')}` : undefined,
              description: game.summary,
              rating: game.rating ? Math.round(game.rating / 10) : undefined,
              year: game.first_release_date ? new Date(game.first_release_date * 1000).getFullYear() : undefined,
              external_id: game.id.toString(),
              external_source: 'igdb'
            }))
            break
        }
        
        setTrendingData(results)
      } catch (error) {
        console.error(`Error fetching trending ${type}:`, error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTrendingData()
  }, [type])

  const getTypeIcon = (itemType: string) => {
    const mediaTypes = [
      { value: 'movie', icon: Film },
      { value: 'tv', icon: Tv },
      { value: 'book', icon: Book },
      { value: 'anime', icon: Star },
      { value: 'game', icon: Gamepad2 },
      { value: 'podcast', icon: Music },
    ]
    const typeData = mediaTypes.find(t => t.value === itemType)
    return typeData ? typeData.icon : Search
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
        <Icon className="h-6 w-6 text-primary" />
        {title}
      </h2>
      
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="glass-card">
              <CardContent className="p-3">
                <div className="aspect-[2/3] mb-3 rounded bg-muted animate-pulse" />
                <div className="h-4 bg-muted animate-pulse rounded mb-2" />
                <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {trendingData.map((result) => {
            const TypeIcon = getTypeIcon(result.type)
            return (
              <Card 
                key={`${result.external_source}-${result.id}`} 
                className="glass-card cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => onResultClick(result)}
              >
                <CardContent className="p-3">
                  <div className="relative aspect-[2/3] mb-3 rounded overflow-hidden bg-muted">
                    {result.coverUrl && (
                      <Image
                        src={result.coverUrl}
                        alt={result.title}
                        fill
                        className="object-cover"
                      />
                    )}
                    <div className="absolute top-2 left-2">
                      <Badge variant="secondary" className="text-xs">
                        <TypeIcon className="h-3 w-3 mr-1" />
                        {result.type}
                      </Badge>
                    </div>
                    {result.rating && (
                      <div className="absolute bottom-2 right-2 bg-black/70 rounded px-2 py-1">
                        <div className="flex items-center gap-1 text-yellow-400 text-xs">
                          <Star className="h-3 w-3 fill-current" />
                          {result.rating}
                        </div>
                      </div>
                    )}
                  </div>
                  <h3 className="font-medium text-sm line-clamp-2">{result.title}</h3>
                  {result.year && <p className="text-xs text-muted-foreground">{result.year}</p>}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
