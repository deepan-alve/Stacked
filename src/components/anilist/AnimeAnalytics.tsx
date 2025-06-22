'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/AuthProvider'
import { 
  Clock, 
  Star, 
  BarChart3, 
  Trophy,
  Crown,
  Activity
} from 'lucide-react'

interface AnimeStats {
  totalWatched: number
  totalEpisodes: number
  watchTimeHours: number
  averageScore: number
  completedThisYear: number
  favoriteGenres: Array<{ genre: string; count: number }>
  monthlyActivity: Array<{ month: string; count: number }>
  statusDistribution: Record<string, number>
  topRatedAnime: Array<{ title: string; score: number; cover_url?: string }>
}

interface MediaItem {
  id: string
  status: string
  rating?: number
  progress?: number
  completed_at?: string
  media_items?: {
    title: string
    episodes?: number
    duration?: number
    genres?: string[]
    cover_url?: string
    type: string
  }
}

interface Profile {
  power_user_features_enabled?: boolean
  anilist_username?: string
}

export function AnimeAnalytics() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<AnimeStats | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const loadProfileAndData = async () => {
      if (!user) return
      
      try {
        const supabase = createClient()
        
        // Load profile to check power user status
        const { data: profileData } = await supabase
          .from('profiles')
          .select('power_user_features_enabled, anilist_username')
          .eq('id', user.id)
          .single()
        
        setProfile(profileData)

        // Load user's anime data
        const { data: userMedia } = await supabase
          .from('user_media')
          .select(`
            *,
            media_items (
              title,
              episodes,
              duration,
              genres,
              cover_url,
              type
            )
          `)
          .eq('user_id', user.id)
          .eq('media_items.type', 'anime')

        if (userMedia) {
          const calculatedStats = calculateStats(userMedia as MediaItem[])
          setStats(calculatedStats)
        }
      } catch (error) {
        console.error('Error loading analytics data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProfileAndData()
  }, [user])
  const calculateStats = (userMedia: MediaItem[]): AnimeStats => {
    const animeList = userMedia.filter(item => item.media_items?.type === 'anime')
    
    // Basic stats
    const totalWatched = animeList.filter(item => item.status === 'completed').length
    const totalEpisodes = animeList.reduce((sum, item) => {
      if (item.status === 'completed') {
        return sum + (item.media_items?.episodes || 0)
      } else {
        return sum + (item.progress || 0)
      }
    }, 0)
    
    const watchTimeHours = animeList.reduce((sum, item) => {
      const episodeCount = item.status === 'completed' 
        ? (item.media_items?.episodes || 0)
        : (item.progress || 0)
      const duration = item.media_items?.duration || 24 // Default 24 minutes
      return sum + (episodeCount * duration / 60)
    }, 0)

    const ratedAnime = animeList.filter(item => item.rating)
    const averageScore = ratedAnime.length > 0 
      ? ratedAnime.reduce((sum, item) => sum + (item.rating || 0), 0) / ratedAnime.length
      : 0

    const currentYear = new Date().getFullYear()
    const completedThisYear = animeList.filter(item => 
      item.status === 'completed' && 
      item.completed_at && 
      new Date(item.completed_at).getFullYear() === currentYear
    ).length

    // Genre analysis
    const genreCount: Record<string, number> = {}
    animeList.forEach(item => {
      const genres = item.media_items?.genres || []
      genres.forEach((genre: string) => {
        genreCount[genre] = (genreCount[genre] || 0) + 1
      })
    })
    
    const favoriteGenres = Object.entries(genreCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([genre, count]) => ({ genre, count }))

    // Status distribution
    const statusDistribution: Record<string, number> = {}
    animeList.forEach(item => {
      const status = item.status || 'planned'
      statusDistribution[status] = (statusDistribution[status] || 0) + 1
    })    // Top rated anime
    const topRatedAnime = animeList
      .filter(item => item.rating && item.rating >= 4)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 5)
      .map(item => ({
        title: item.media_items?.title || 'Unknown',
        score: item.rating || 0,
        cover_url: item.media_items?.cover_url
      }))

    // Monthly activity (simplified - last 6 months)
    const monthlyActivity = Array.from({ length: 6 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthStr = date.toLocaleString('default', { month: 'short' })
      
      const count = animeList.filter(item => {
        if (!item.completed_at) return false
        const completedDate = new Date(item.completed_at)
        return completedDate.getMonth() === date.getMonth() && 
               completedDate.getFullYear() === date.getFullYear()
      }).length
      
      return { month: monthStr, count }
    }).reverse()

    return {
      totalWatched,
      totalEpisodes,
      watchTimeHours: Math.round(watchTimeHours),
      averageScore: Math.round(averageScore * 10) / 10,
      completedThisYear,
      favoriteGenres,
      monthlyActivity,
      statusDistribution,
      topRatedAnime
    }
  }

  if (loading) {
    return (
      <div className="grid gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="h-32 bg-muted/50 rounded-lg m-6" />
          </Card>
        ))}
      </div>
    )
  }

  const isPowerUser = profile?.power_user_features_enabled

  if (!isPowerUser) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <Crown className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Power User Feature</h3>
          <p className="text-muted-foreground mb-4 max-w-md">
            Connect your AniList account to unlock advanced analytics and gain deeper insights into your anime watching habits.
          </p>
          <Badge variant="secondary" className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30">
            <Crown className="h-3 w-3 mr-1" />
            Premium Feature
          </Badge>
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <Activity className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Data Yet</h3>
          <p className="text-muted-foreground">
            Start tracking anime to see your analytics here.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Anime Analytics</h2>
          <p className="text-muted-foreground">
            Advanced insights into your anime watching habits
          </p>
        </div>
        <Badge variant="secondary" className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30">
          <Crown className="h-3 w-3 mr-1" />
          Power User
        </Badge>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{stats.totalWatched}</p>
              </div>
              <Trophy className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Episodes</p>
                <p className="text-2xl font-bold">{stats.totalEpisodes}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Watch Time</p>
                <p className="text-2xl font-bold">{stats.watchTimeHours}h</p>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Score</p>
                <p className="text-2xl font-bold">{stats.averageScore}/5</p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="genres" className="space-y-4">
        <TabsList>
          <TabsTrigger value="genres">Genres</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="top-rated">Top Rated</TabsTrigger>
        </TabsList>

        <TabsContent value="genres" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Favorite Genres</CardTitle>
              <CardDescription>
                Your most watched anime genres
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats.favoriteGenres.map((genre, index) => (
                <div key={genre.genre} className="flex items-center gap-4">
                  <div className="w-16 text-sm font-medium">#{index + 1}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{genre.genre}</span>
                      <span className="text-sm text-muted-foreground">{genre.count}</span>
                    </div>
                    <Progress value={(genre.count / stats.totalWatched) * 100} className="h-2" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Activity</CardTitle>
              <CardDescription>
                Anime completed per month
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats.monthlyActivity.map((month) => (
                <div key={month.month} className="flex items-center gap-4">
                  <div className="w-12 text-sm font-medium">{month.month}</div>
                  <div className="flex-1">
                    <Progress value={(month.count / Math.max(...stats.monthlyActivity.map(m => m.count))) * 100} className="h-2" />
                  </div>
                  <div className="w-8 text-sm text-muted-foreground">{month.count}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status Distribution</CardTitle>
              <CardDescription>
                How your anime list is distributed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(stats.statusDistribution).map(([status, count]) => (
                <div key={status} className="flex items-center gap-4">
                  <div className="w-20 text-sm font-medium capitalize">{status.replace('_', ' ')}</div>
                  <div className="flex-1">
                    <Progress value={(count / stats.totalWatched) * 100} className="h-2" />
                  </div>
                  <div className="w-8 text-sm text-muted-foreground">{count}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="top-rated" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Rated Anime</CardTitle>
              <CardDescription>
                Your highest rated anime (4+ stars)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats.topRatedAnime.length > 0 ? (
                stats.topRatedAnime.map((anime, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 rounded-lg border">
                    <div className="w-8 text-sm font-medium">#{index + 1}</div>
                    <div className="flex-1">
                      <p className="font-medium">{anime.title}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{anime.score}/5</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No highly rated anime yet. Start rating your watched anime!
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
