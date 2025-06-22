'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/AuthProvider'
import { 
  Film, 
  Clock, 
  Star, 
  Calendar,
  TrendingUp,
  Award,
  Eye,
  Trophy
} from 'lucide-react'

interface MovieStats {
  totalMovies: number
  watchedHours: number
  averageRating: number
  favoriteGenres: Array<{ genre: string; count: number }>
  favoriteDirectors: Array<{ director: string; count: number }>
  yearlyDistribution: Array<{ year: number; count: number }>
  ratingDistribution: Array<{ rating: number; count: number }>
  topRatedMovies: Array<{ title: string; rating: number; year: number }>
  recentActivity: Array<{ title: string; completedAt: string; rating?: number }>
}

interface MovieItem {
  id: string
  status: string
  rating?: number
  completed_at?: string
  media_items?: {
    title: string
    type: string
    duration?: number
    genres?: string[]
    cover_url?: string
    release_year?: number
    metadata?: {
      director?: string
      runtime?: number
      [key: string]: unknown
    }
  }
}

export function MovieAnalytics() {
  const { user } = useAuth()
  const [stats, setStats] = useState<MovieStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadMovieData = async () => {
      if (!user) return
      
      try {
        const supabase = createClient()
        
        const { data: movieData } = await supabase
          .from('user_media')
          .select(`
            *,
            media_items (
              title,
              type,
              duration,
              genres,
              cover_url,
              release_year,
              metadata
            )
          `)
          .eq('user_id', user.id)
          .eq('media_items.type', 'movie')

        if (movieData) {
          const calculatedStats = calculateMovieStats(movieData as MovieItem[])
          setStats(calculatedStats)
        }
      } catch (error) {
        console.error('Error loading movie data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadMovieData()
  }, [user])

  const calculateMovieStats = (movieData: MovieItem[]): MovieStats => {
    const totalMovies = movieData.length
    const completedMovies = movieData.filter(item => item.status === 'completed')
    
    // Calculate total watch time
    const watchedHours = completedMovies.reduce((total, movie) => {
      const duration = movie.media_items?.duration || movie.media_items?.metadata?.runtime || 120 // default 2 hours
      return total + (duration / 60) // convert minutes to hours
    }, 0)

    // Average rating
    const ratedMovies = movieData.filter(item => item.rating)
    const averageRating = ratedMovies.length > 0 
      ? ratedMovies.reduce((sum, item) => sum + (item.rating || 0), 0) / ratedMovies.length
      : 0

    // Genre analysis
    const genreCount: Record<string, number> = {}
    movieData.forEach(item => {
      const genres = item.media_items?.genres || []
      genres.forEach((genre: string) => {
        genreCount[genre] = (genreCount[genre] || 0) + 1
      })
    })
    
    const favoriteGenres = Object.entries(genreCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([genre, count]) => ({ genre, count }))

    // Director analysis
    const directorCount: Record<string, number> = {}
    movieData.forEach(item => {
      const director = item.media_items?.metadata?.director as string
      if (director) {
        directorCount[director] = (directorCount[director] || 0) + 1
      }
    })
    
    const favoriteDirectors = Object.entries(directorCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([director, count]) => ({ director, count }))

    // Yearly distribution
    const yearCount: Record<number, number> = {}
    movieData.forEach(item => {
      const year = item.media_items?.release_year
      if (year) {
        yearCount[year] = (yearCount[year] || 0) + 1
      }
    })
    
    const yearlyDistribution = Object.entries(yearCount)
      .map(([year, count]) => ({ year: parseInt(year), count }))
      .sort((a, b) => b.year - a.year)
      .slice(0, 10)

    // Rating distribution
    const ratingCount: Record<number, number> = {}
    ratedMovies.forEach(item => {
      const rating = Math.floor(item.rating || 0)
      ratingCount[rating] = (ratingCount[rating] || 0) + 1
    })
    
    const ratingDistribution = Array.from({ length: 5 }, (_, i) => ({
      rating: i + 1,
      count: ratingCount[i + 1] || 0
    }))

    // Top rated movies
    const topRatedMovies = movieData
      .filter(item => item.rating && item.rating >= 4)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 10)
      .map(item => ({
        title: item.media_items?.title || 'Unknown',
        rating: item.rating || 0,
        year: item.media_items?.release_year || 0
      }))

    // Recent activity
    const recentActivity = completedMovies
      .filter(item => item.completed_at)
      .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())
      .slice(0, 10)
      .map(item => ({
        title: item.media_items?.title || 'Unknown',
        completedAt: item.completed_at!,
        rating: item.rating
      }))

    return {
      totalMovies,
      watchedHours: Math.round(watchedHours),
      averageRating: Math.round(averageRating * 10) / 10,
      favoriteGenres,
      favoriteDirectors,
      yearlyDistribution,
      ratingDistribution,
      topRatedMovies,
      recentActivity
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

  if (!stats || stats.totalMovies === 0) {
    return (
      <Card className="glass-card">
        <CardContent className="p-12 text-center">
          <Film className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No movie data</h3>
          <p className="text-muted-foreground">
            Start tracking movies to see detailed analytics.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-lg bg-blue-500/10">
          <Film className="h-8 w-8 text-blue-500" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Movie Analytics</h2>
          <p className="text-muted-foreground">Deep dive into your movie watching habits</p>
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Film className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalMovies}</p>
                <p className="text-xs text-muted-foreground">Total Movies</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Clock className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.watchedHours}h</p>
                <p className="text-xs text-muted-foreground">Watch Time</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Star className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.averageRating}</p>
                <p className="text-xs text-muted-foreground">Avg Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Trophy className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.topRatedMovies.length}</p>
                <p className="text-xs text-muted-foreground">Top Rated</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Favorite Genres */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Favorite Genres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.favoriteGenres.map((genre, index) => (
                <div key={genre.genre} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </div>
                    <span className="font-medium capitalize">{genre.genre}</span>
                  </div>
                  <Badge variant="secondary">{genre.count} movies</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Rated Movies */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              Top Rated Movies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topRatedMovies.slice(0, 6).map((movie, index) => (
                <div key={`${movie.title}-${movie.year}`} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{movie.title}</p>
                      <p className="text-xs text-muted-foreground">{movie.year}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-500" />
                    <span className="text-sm font-medium">{movie.rating}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Favorite Directors */}
        {stats.favoriteDirectors.length > 0 && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Favorite Directors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.favoriteDirectors.map((director, index) => (
                  <div key={director.director} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </div>
                      <span className="font-medium">{director.director}</span>
                    </div>
                    <Badge variant="secondary">{director.count} movies</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentActivity.slice(0, 6).map((activity) => (
                <div key={`${activity.title}-${activity.completedAt}`} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.completedAt).toLocaleDateString()}
                    </p>
                  </div>
                  {activity.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500" />
                      <span className="text-sm">{activity.rating}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rating Distribution */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Rating Distribution
          </CardTitle>
          <CardDescription>
            How you rate your movies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.ratingDistribution.map((rating) => (
              <div key={rating.rating} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span>{rating.rating} Star{rating.rating !== 1 ? 's' : ''}</span>
                  </div>
                  <span>{rating.count} movies</span>
                </div>
                <Progress 
                  value={stats.totalMovies > 0 ? (rating.count / stats.totalMovies) * 100 : 0} 
                  className="h-2" 
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
