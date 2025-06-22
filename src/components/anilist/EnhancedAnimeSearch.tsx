'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { anilistClient } from '@/lib/api/anilist'
import { useAuth } from '@/components/providers/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import { Search, ExternalLink, Plus, Crown, Star, Calendar } from 'lucide-react'
import Image from 'next/image'

interface AniListAnimeResult {
  id: number
  title: {
    romaji: string
    english?: string
    native: string
  }
  coverImage: {
    large: string
    medium: string
  }
  episodes?: number
  genres: string[]
  averageScore?: number
  season?: string
  seasonYear?: number
  format: string
  status: string
}

interface SearchResult {
  source: 'anilist' | 'local'
  data: AniListAnimeResult
  isInLibrary?: boolean
}

export function EnhancedAnimeSearch() {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isPowerUser, setIsPowerUser] = useState(false)
  const [userLibrary, setUserLibrary] = useState<Set<number>>(new Set())
  useEffect(() => {
    if (user) {
      checkPowerUserStatus()
      loadUserLibrary()
    }
  }, [user, checkPowerUserStatus, loadUserLibrary])
  const checkPowerUserStatus = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('profiles')
        .select('power_user_features_enabled')
        .eq('id', user?.id)
        .single()
      
      setIsPowerUser(data?.power_user_features_enabled || false)
    } catch (error) {
      console.error('Error checking power user status:', error)
    }
  }, [user?.id])
  const loadUserLibrary = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('user_media')
        .select('media_items(anilist_id)')
        .eq('user_id', user?.id)
        .not('media_items.anilist_id', 'is', null)

      const anilistIds = new Set(
        data?.map((item: { media_items?: { anilist_id?: number } }) => item.media_items?.anilist_id)
          .filter((id): id is number => id !== undefined) || []
      )
      setUserLibrary(anilistIds)
    } catch (error) {
      console.error('Error loading user library:', error)
    }
  }, [user?.id])

  const searchAnime = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      // Search AniList
      const response = await anilistClient.searchAnime(query, 1, 20)
      const results: SearchResult[] = response.data.Page.media.map(anime => ({
        source: 'anilist',
        data: anime,
        isInLibrary: userLibrary.has(anime.id)
      }))

      setSearchResults(results)
    } catch (error) {
      console.error('Error searching anime:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const addToLibrary = async (anime: AniListAnimeResult) => {
    try {
      const supabase = createClient()
      
      // First, upsert the anime item
      const { data: animeItem, error: animeError } = await supabase
        .from('media_items')
        .upsert({
          anilist_id: anime.id,
          title: anime.title.romaji || anime.title.english,
          title_romaji: anime.title.romaji,
          title_english: anime.title.english,
          title_native: anime.title.native,
          type: 'anime',
          cover_url: anime.coverImage.large || anime.coverImage.medium,
          episodes: anime.episodes,
          genres: anime.genres || [],
          average_score: anime.averageScore,
          season: anime.season,
          season_year: anime.seasonYear,
          format: anime.format,
          anime_status: anime.status,
          external_id: anime.id.toString(),
          external_source: 'anilist'
        }, { 
          onConflict: 'anilist_id',
          ignoreDuplicates: false 
        })
        .select()
        .single()

      if (animeError) {
        console.error('Error adding anime item:', animeError)
        return
      }

      // Then, add to user's library
      const { error: userMediaError } = await supabase
        .from('user_media')
        .insert({
          user_id: user?.id,
          media_id: animeItem.id,
          status: 'planned',
          external_id: anime.id.toString(),
          external_source: 'anilist'
        })

      if (userMediaError) {
        console.error('Error adding to library:', userMediaError)
        return
      }

      // Update local state
      setUserLibrary(prev => new Set([...prev, anime.id]))

    } catch (error) {
      console.error('Error adding anime to library:', error)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    searchAnime(searchQuery)
  }

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Anime Search</h2>
          <p className="text-muted-foreground">
            {isPowerUser 
              ? "Enhanced search powered by AniList" 
              : "Search and discover anime"
            }
          </p>
        </div>
        {isPowerUser && (
          <Badge variant="secondary" className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30">
            <Crown className="h-3 w-3 mr-1" />
            Power User
          </Badge>
        )}
      </div>

      {/* Search Form */}
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for anime..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={isSearching}>
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Search Results</h3>
          <div className="grid gap-4">
            {searchResults.map((result) => (
              <Card key={result.data.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex gap-4 p-4">
                    {/* Cover Image */}
                    <div className="relative w-16 h-24 flex-shrink-0">
                      <Image
                        src={result.data.coverImage.medium}
                        alt={result.data.title.romaji || result.data.title.english || 'Anime cover'}
                        fill
                        className="object-cover rounded"
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold truncate">
                            {result.data.title.english || result.data.title.romaji}
                          </h4>
                          {result.data.title.english && result.data.title.romaji !== result.data.title.english && (
                            <p className="text-sm text-muted-foreground truncate">
                              {result.data.title.romaji}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            {result.data.episodes && (
                              <span>{result.data.episodes} episodes</span>
                            )}
                            {result.data.averageScore && (
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span>{result.data.averageScore}%</span>
                              </div>
                            )}
                            {result.data.seasonYear && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{result.data.season} {result.data.seasonYear}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-1 mt-2">
                            {result.data.genres.slice(0, 3).map((genre) => (
                              <Badge key={genre} variant="outline" className="text-xs">
                                {genre}
                              </Badge>
                            ))}
                            {result.data.genres.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{result.data.genres.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          {result.isInLibrary ? (
                            <Badge variant="default">In Library</Badge>
                          ) : (
                            <Button 
                              size="sm" 
                              onClick={() => addToLibrary(result.data)}
                              disabled={!user}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add
                            </Button>
                          )}
                          <Button size="sm" variant="outline" asChild>
                            <a 
                              href={`https://anilist.co/anime/${result.data.id}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {searchQuery && !isSearching && searchResults.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No results found</h3>
            <p className="text-muted-foreground">
              Try searching with different keywords or check your spelling.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
