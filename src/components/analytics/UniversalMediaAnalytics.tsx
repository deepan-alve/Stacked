'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/AuthProvider'
import { MovieAnalytics } from './MovieAnalytics'
import { BookAnalytics } from './BookAnalytics'
import { TVAnalytics } from './TVAnalytics'
import { AnimeAnalytics } from './AnimeAnalytics'
import { FloatingComingSoonCard } from '@/components/ui/FloatingComingSoonCard'
import {
  Clock,
  Star,
  BarChart3,
  Trophy,
  Crown,
  Activity,
  Film,
  Tv,
  Book,
  Gamepad2,
  Target,
  TrendingUp,
  Medal,
  Sparkles,
  Music // Import Music only for use in config
} from 'lucide-react'
import Image from 'next/image'

// Types
import { LucideIcon } from 'lucide-react'

interface MediaStats {
  totalItems: number
  completedItems: number
  inProgressItems: number
  plannedItems: number
  droppedItems: number
  averageRating: number
  totalTimeInvested: number // hours
  thisYearCompleted: number
  thisMonthCompleted: number
  completionRate: number
  favoriteGenres: Array<{ genre: string; count: number }>
  monthlyActivity: Array<{ month: string; count: number }>
  ratingDistribution: Array<{ rating: number; count: number }>
}

interface UniversalStats {
  overall: MediaStats
  byType: Record<string, MediaStats>
  achievements: Array<{
    title: string
    description: string
    icon: LucideIcon
    earned: boolean
    rarity: 'common' | 'rare' | 'legendary'
    progress?: number
  }>
  insights: Array<{
    title: string
    description: string
    type: string
    icon: LucideIcon
  }>
  recentActivity: Array<{
    title: string
    description: string
    type: string
    icon: LucideIcon
  }>
}

interface MediaItem {
  id: string
  status: string
  rating?: number
  progress?: number
  completed_at?: string
  created_at?: string
  updated_at?: string
  review?: string
  notes?: string
  media_items?: {
    title: string
    type: string
    episodes?: number
    duration?: number
    pages?: number
    genres?: string[]
    cover_url?: string
    release_year?: number
    metadata?: Record<string, unknown>
  }
}

const mediaTypeConfig = {
  movie: { icon: Film, label: 'Movies', color: 'text-blue-500', timeUnit: 'hours', avgTime: 2 },
  tv: { icon: Tv, label: 'TV Shows', color: 'text-purple-500', timeUnit: 'hours', avgTime: 1 },
  book: { icon: Book, label: 'Books', color: 'text-green-500', timeUnit: 'hours', avgTime: 8 },
  anime: { icon: Star, label: 'Anime', color: 'text-pink-500', timeUnit: 'hours', avgTime: 0.4 },
  game: { icon: Gamepad2, label: 'Games', color: 'text-red-500', timeUnit: 'hours', avgTime: 30 },
  podcast: { icon: Music, label: 'Podcasts', color: 'text-orange-500', timeUnit: 'hours', avgTime: 1 }
}

export function UniversalMediaAnalytics() {
  const { user } = useAuth()
  const [stats, setStats] = useState<UniversalStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTimeframe, setSelectedTimeframe] = useState<'month' | 'year' | 'all'>('year')
  const [comingSoonOpen, setComingSoonOpen] = useState<string | undefined>(undefined)

  useEffect(() => {
    const loadAnalyticsData = async () => {
      if (!user) return
      
      try {
        const supabase = createClient()
        
        // Load all user media with media items
        const { data: userMedia, error } = await supabase
          .from('user_media')
          .select(`
            *,
            media_items!media_id(
              title,
              type,
              episodes,
              duration,
              pages,
              genres,
              cover_url,
              release_year,
              metadata
            )
          `)
          .eq('user_id', user.id)

        console.log('Supabase query result:', { userMedia, error })

        if (error) {
          console.error('Supabase error:', error)
          return
        }

        if (userMedia && userMedia.length > 0) {
          console.log('User media found:', userMedia.length, 'items')
          console.log('Loaded user media:', userMedia)
          const calculatedStats = calculateUniversalStats(userMedia as MediaItem[], selectedTimeframe)
          setStats(calculatedStats)
        } else {
          console.log('No user media found')
        }
      } catch (error) {
        console.error('Error loading analytics data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadAnalyticsData()
  }, [user, selectedTimeframe])

  const calculateUniversalStats = (userMedia: MediaItem[], timeframe: 'month' | 'year' | 'all'): UniversalStats => {
    console.log('calculateUniversalStats called with:', userMedia.length, 'items, timeframe:', timeframe)
    
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()

    // Filter media based on timeframe
    const filteredMedia = userMedia.filter(item => {
      if (timeframe === 'all') return true
      
      const completedDate = item.completed_at ? new Date(item.completed_at) : null
      if (!completedDate) return false
      
      if (timeframe === 'year') {
        return completedDate.getFullYear() === currentYear
      } else if (timeframe === 'month') {
        return completedDate.getFullYear() === currentYear && completedDate.getMonth() === currentMonth
      }
      
      return true
    })

    console.log('Filtered media for', timeframe, ':', filteredMedia.length, 'items')

    // Calculate stats by media type
    const mediaTypes = ['movie', 'tv', 'book', 'anime', 'game', 'podcast']
    const byType: Record<string, MediaStats> = {}

    for (const type of mediaTypes) {
      const typeMedia = filteredMedia.filter(item => item.media_items?.type === type)
      
      // Collect all genres for this type
      const allGenres = new Set<string>()
      typeMedia.forEach(item => {
        item.media_items?.genres?.forEach((genre: string) => allGenres.add(genre))
      })

      const completedItems = typeMedia.filter(item => item.status === 'completed').length
      const inProgressItems = typeMedia.filter(item => item.status === 'in_progress').length
      const plannedItems = typeMedia.filter(item => item.status === 'planned').length
      const droppedItems = typeMedia.filter(item => item.status === 'dropped').length

      const ratedItems = typeMedia.filter(item => item.rating)
      const averageRating = ratedItems.length > 0 
        ? ratedItems.reduce((sum, item) => sum + (item.rating || 0), 0) / ratedItems.length
        : 0

      // Calculate time invested
      const config = mediaTypeConfig[type as keyof typeof mediaTypeConfig]
      const totalTimeInvested = typeMedia.reduce((sum, item) => {
        if (type === 'movie') {
          const movieDuration = item.media_items?.duration || config.avgTime * 60 // minutes
          return sum + (movieDuration / 60) // convert to hours
        } else if (type === 'tv' || type === 'anime') {
          const episodes = item.status === 'completed' 
            ? (item.media_items?.episodes || 1)
            : (item.progress || 0)
          const episodeDuration = item.media_items?.duration || config.avgTime * 60 // minutes per episode
          return sum + (episodes * episodeDuration / 60) // convert to hours
        } else if (type === 'book') {
          const pages = item.media_items?.pages || 300
          const readingSpeed = 250 // words per minute
          const wordsPerPage = 250
          const minutes = (pages * wordsPerPage) / readingSpeed
          return sum + (minutes / 60) // convert to hours
        } else if (type === 'game') {
          // Use metadata or default time
          const playTime = (item.media_items?.metadata?.playtime as number) || config.avgTime
          return sum + playTime
        } else if (type === 'podcast') {
          const episodes = item.progress || 1
          const podcastDuration = item.media_items?.duration || config.avgTime * 60 // minutes per episode
          return sum + (episodes * podcastDuration / 60) // convert to hours
        }
        return sum
      }, 0)

      const thisYearCompleted = typeMedia.filter(item => 
        item.status === 'completed' && 
        item.completed_at && 
        new Date(item.completed_at).getFullYear() === currentYear
      ).length

      const thisMonthCompleted = typeMedia.filter(item => 
        item.status === 'completed' && 
        item.completed_at && 
        new Date(item.completed_at).getFullYear() === currentYear &&
        new Date(item.completed_at).getMonth() === currentMonth
      ).length

      byType[type] = {
        totalItems: typeMedia.length,
        completedItems,
        inProgressItems,
        plannedItems,
        droppedItems,
        averageRating,
        totalTimeInvested,
        thisYearCompleted,
        thisMonthCompleted,
        completionRate: typeMedia.length > 0 ? (completedItems / typeMedia.length) * 100 : 0,
        favoriteGenres: Array.from(allGenres).map(genre => ({
          genre,
          count: typeMedia.filter(item => item.media_items?.genres?.includes(genre)).length
        })).sort((a, b) => b.count - a.count).slice(0, 5),
        monthlyActivity: [], // Could be calculated if needed
        ratingDistribution: [] // Could be calculated if needed
      }
    }

    // Calculate overall stats
    const overall = Object.values(byType).reduce((acc, typeStats) => ({
      totalItems: acc.totalItems + typeStats.totalItems,
      completedItems: acc.completedItems + typeStats.completedItems,
      inProgressItems: acc.inProgressItems + typeStats.inProgressItems,
      plannedItems: acc.plannedItems + typeStats.plannedItems,
      droppedItems: acc.droppedItems + typeStats.droppedItems,
      averageRating: 0, // Will calculate separately
      totalTimeInvested: acc.totalTimeInvested + typeStats.totalTimeInvested,
      thisYearCompleted: acc.thisYearCompleted + typeStats.thisYearCompleted,
      thisMonthCompleted: acc.thisMonthCompleted + typeStats.thisMonthCompleted,
      completionRate: 0, // Will calculate separately
      favoriteGenres: [], // Will merge separately
      monthlyActivity: [],
      ratingDistribution: []
    }), {
      totalItems: 0,
      completedItems: 0,
      inProgressItems: 0,
      plannedItems: 0,
      droppedItems: 0,
      averageRating: 0,
      totalTimeInvested: 0,
      thisYearCompleted: 0,
      thisMonthCompleted: 0,
      completionRate: 0,
      favoriteGenres: [],
      monthlyActivity: [],
      ratingDistribution: []
    })

    // Calculate overall averages
    const allRatedItems = filteredMedia.filter(item => item.rating)
    overall.averageRating = allRatedItems.length > 0 
      ? allRatedItems.reduce((sum, item) => sum + (item.rating || 0), 0) / allRatedItems.length
      : 0
    overall.completionRate = overall.totalItems > 0 ? (overall.completedItems / overall.totalItems) * 100 : 0

    // Merge genres across all types
    const genreCounts: Record<string, number> = {}
    Object.values(byType).forEach(typeStats => {
      typeStats.favoriteGenres.forEach(({ genre, count }) => {
        genreCounts[genre] = (genreCounts[genre] || 0) + count
      })
    })
    overall.favoriteGenres = Object.entries(genreCounts)
      .map(([genre, count]) => ({ genre, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Generate achievements
    const achievements = [
      {
        title: 'First Steps',
        description: 'Added your first media item',
        icon: Target,
        earned: overall.totalItems >= 1,
        rarity: 'common' as const,
        progress: Math.min(100, (overall.totalItems / 1) * 100)
      },
      {
        title: 'Getting Started',
        description: 'Completed 10 media items',
        icon: Medal,
        earned: overall.completedItems >= 10,
        rarity: 'common' as const,
        progress: Math.min(100, (overall.completedItems / 10) * 100)
      },
      {
        title: 'Media Enthusiast',
        description: 'Completed 50 media items',
        icon: Crown,
        earned: overall.completedItems >= 50,
        rarity: 'rare' as const,
        progress: Math.min(100, (overall.completedItems / 50) * 100)
      }
    ]

    // Generate insights
    const insights = [
      {
        title: 'Most Active Type',
        description: `You're most active with ${Object.entries(byType).sort((a, b) => b[1].totalItems - a[1].totalItems)[0]?.[0] || 'unknown'}`,
        type: 'trend',
        icon: TrendingUp
      }
    ]

    // Generate recent activity
    const recentActivity = [
      {
        title: 'Recent Completion',
        description: `You've completed ${overall.thisMonthCompleted} items this month`,
        type: 'achievement',
        icon: Target
      }
    ]

    const result = {
      overall,
      byType,
      achievements,
      insights,
      recentActivity
    }

    console.log('Calculated stats:', result)
    return result
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
        <Card className="glass-card border-dashed border-2 border-muted-foreground/20 bg-card/30 backdrop-blur-xl">
          <CardContent className="p-16 text-center">
            <div className="space-y-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto animate-pulse">
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Loading Analytics
                </h3>
                <p className="text-muted-foreground">Calculating insights and trends...</p>
                <div className="flex justify-center space-x-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
        <Card className="glass-card border-dashed border-2 border-muted-foreground/20 bg-card/30 backdrop-blur-xl shadow-2xl">
          <CardContent className="p-16 text-center">
            <div className="space-y-8">
              <div className="relative flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto shadow-lg animate-pulse overflow-hidden">
                  <Image src="/globe.svg" alt="World Building" width={72} height={72} className="object-contain" priority />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-md">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  &quot;Still Building...&quot;
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto text-lg">
                  <span className="block mb-2">This dashboard is still in production, like a movie waiting for its big premiere.</span>
                  <span className="block italic text-accent-foreground/80">&quot;Frankly, my dear, we’re not done yet.&quot;</span>
                  <span className="block mt-2 text-sm text-muted-foreground">(Coming soon: analytics worthy of an Oscar!)</span>
                </p>
                <div className="flex justify-center gap-2 mt-4">
                  <Badge variant="outline" className="bg-primary/5 border-primary/20">
                    <Film className="h-3 w-3 mr-1" />
                    Movies
                  </Badge>
                  <Badge variant="outline" className="bg-green-500/5 border-green-500/20">
                    <Book className="h-3 w-3 mr-1" />
                    Books
                  </Badge>
                  <Badge variant="outline" className="bg-purple-500/5 border-purple-500/20">
                    <Tv className="h-3 w-3 mr-1" />
                    TV Shows
                  </Badge>
                </div>
              </div>
              <div className="mt-6 flex flex-col items-center">
                <div className="glass-card p-4 rounded-xl border border-accent/30 bg-gradient-to-br from-background/60 to-accent/10 shadow-xl max-w-xs">
                  <span className="block text-lg font-semibold text-accent-foreground mb-1">🎬 &quot;May the stats be with you.&quot;</span>
                  <span className="block text-sm text-muted-foreground">Check back soon for your personalized analytics adventure.</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <FloatingComingSoonCard
        open={!!comingSoonOpen}
        onClose={() => setComingSoonOpen(undefined)}
        featureName={comingSoonOpen}
      />
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-6 border-b border-border/50">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
              Analytics Dashboard
            </h1>
            <p className="text-muted-foreground text-lg">
              Insights into your media consumption habits
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-card/50 backdrop-blur border rounded-lg p-2">
              {(['month', 'year', 'all'] as const).map((timeframe) => (
                <Button
                  key={timeframe}
                  variant={selectedTimeframe === timeframe ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedTimeframe(timeframe)}
                  className="text-xs font-medium"
                >
                  {timeframe === 'month' ? 'This Month' : 
                   timeframe === 'year' ? 'This Year' : 'All Time'}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="grid grid-cols-4 lg:grid-cols-8 bg-card/50 backdrop-blur border">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="movies">Movies</TabsTrigger>
            <TabsTrigger value="tv">TV Shows</TabsTrigger>
            <TabsTrigger value="anime">Anime</TabsTrigger>
            <TabsTrigger value="books">Books</TabsTrigger>
            <TabsTrigger value="games"
              onClick={e => {
                e.preventDefault();
                setComingSoonOpen('Games')
              }}
            >Games</TabsTrigger>
            <TabsTrigger value="podcasts"
              onClick={e => {
                e.preventDefault();
                setComingSoonOpen('Podcasts')
              }}
            >Podcasts</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <BarChart3 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                      <p className="text-2xl font-bold">{stats.overall.totalItems}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <Target className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Completed</p>
                      <p className="text-2xl font-bold">{stats.overall.completedItems}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Star className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Avg Rating</p>
                      <p className="text-2xl font-bold">{stats.overall.averageRating.toFixed(1)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <Clock className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Time Invested</p>
                      <p className="text-2xl font-bold">{Math.round(stats.overall.totalTimeInvested)}h</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-500/10">
                      <TrendingUp className="h-5 w-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">This Year</p>
                      <p className="text-2xl font-bold">{stats.overall.thisYearCompleted}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-yellow-500/10">
                      <Activity className="h-5 w-5 text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                      <p className="text-2xl font-bold">{stats.overall.inProgressItems}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Media Type Breakdown */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Media Type Breakdown
                </CardTitle>
                <CardDescription>
                  Distribution of your media library across different types
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(stats.byType).filter(([, typeStats]) => typeStats.totalItems > 0).map(([type, typeStats]) => {
                    const config = mediaTypeConfig[type as keyof typeof mediaTypeConfig]
                    const Icon = config?.icon || BarChart3
                    return (
                      <div key={type} className="flex items-center justify-between p-4 bg-card/50 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg bg-gradient-to-br ${
                            type === 'movie' ? 'from-blue-500/20 to-blue-600/20' :
                            type === 'book' ? 'from-green-500/20 to-green-600/20' :
                            type === 'tv' ? 'from-purple-500/20 to-purple-600/20' :
                            'from-primary/20 to-accent/20'
                          }`}>
                            <Icon className={`h-4 w-4 ${config?.color || 'text-primary'}`} />
                          </div>
                          <div>
                            <p className="font-medium">{config?.label || type}</p>
                            <p className="text-sm text-muted-foreground">
                              {typeStats.completedItems} completed
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">{typeStats.totalItems}</p>
                          <Progress 
                            value={typeStats.completionRate} 
                            className="w-16 h-2 mt-1"
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>          <TabsContent value="movies" className="space-y-6">
            <MovieAnalytics />
          </TabsContent>
            <TabsContent value="tv" className="space-y-6">
            <TVAnalytics />
          </TabsContent>          <TabsContent value="anime" className="space-y-6">
            <AnimeAnalytics />
          </TabsContent>
          
          <TabsContent value="books" className="space-y-6">
            <BookAnalytics stats={stats.byType.book} />
          </TabsContent>          <TabsContent value="games" className="space-y-6">
            {/* Instead of <GameAnalytics />, show nothing, as the floating card will appear */}
          </TabsContent>
          <TabsContent value="podcasts" className="space-y-6">
            {/* Instead of <PodcastAnalytics />, show nothing, as the floating card will appear */}
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Achievements
                </CardTitle>
                <CardDescription>
                  Milestones and badges you&apos;ve earned
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stats.achievements.map((achievement, index) => (
                    <div key={index} className="flex items-center gap-3 p-4 bg-gradient-to-r from-card/50 to-card/30 rounded-lg border border-border/50">
                      <div className={`p-3 rounded-lg bg-gradient-to-br ${
                        achievement.rarity === 'legendary' ? 'from-yellow-500/20 to-orange-500/20' :
                        achievement.rarity === 'rare' ? 'from-purple-500/20 to-pink-500/20' :
                        'from-blue-500/20 to-cyan-500/20'
                      } ${achievement.earned ? '' : 'grayscale opacity-50'}`}>
                        <achievement.icon className={`h-5 w-5 ${
                          achievement.rarity === 'legendary' ? 'text-yellow-500' :
                          achievement.rarity === 'rare' ? 'text-purple-500' :
                          'text-blue-500'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{achievement.title}</p>
                        <p className="text-sm text-muted-foreground">{achievement.description}</p>
                        {achievement.progress !== undefined && (
                          <Progress value={achievement.progress} className="mt-2 h-2" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
