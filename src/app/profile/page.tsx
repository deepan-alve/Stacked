'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useStore } from '@/store/media'
import { useAuth } from '@/components/providers/AuthProvider'
import { ProfileEmptyState } from '@/components/empty-states/EmptyState'
import Link from 'next/link'
import { 
  Calendar,
  Star,
  TrendingUp,
  Settings,
  Share,
  Download,
  Film,
  Book,
  Gamepad2,
  Tv,
  LogIn
} from 'lucide-react'

import React from 'react'

interface MediaTypeBreakdown {
  type: string
  count: number
  icon: React.ComponentType<{ className?: string }>
  color: string
}

export default function ProfilePage() {
  const { user } = useAuth()
  const { userMedia } = useStore()
  const [stats, setStats] = useState({
    totalMedia: 0,
    thisMonth: 0,
    avgRating: 0,
    favoriteGenres: [] as string[],
    mediaBreakdown: [] as MediaTypeBreakdown[]
  })

  useEffect(() => {
    if (userMedia.length > 0) {
      // Calculate total media
      const totalMedia = userMedia.length

      // Calculate this month's additions
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      const thisMonth = userMedia.filter(item => {
        const itemDate = new Date(item.created_at)
        return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear
      }).length

      // Calculate average rating
      const ratingsArray = userMedia.filter(item => item.rating).map(item => item.rating!)
      const avgRating = ratingsArray.length > 0 
        ? ratingsArray.reduce((sum, rating) => sum + rating, 0) / ratingsArray.length 
        : 0

      // Calculate media breakdown by type
      const typeCount: Record<string, number> = {}
      userMedia.forEach(item => {
        if (item.media_item?.type) {
          typeCount[item.media_item.type] = (typeCount[item.media_item.type] || 0) + 1
        }
      })

      const mediaBreakdown = [
        { type: 'Movies', count: typeCount.movie || 0, icon: Film, color: 'text-blue-400' },
        { type: 'TV Shows', count: typeCount.tv || 0, icon: Tv, color: 'text-purple-400' },
        { type: 'Books', count: typeCount.book || 0, icon: Book, color: 'text-green-400' },
        { type: 'Games', count: typeCount.game || 0, icon: Gamepad2, color: 'text-red-400' },
        { type: 'Anime', count: typeCount.anime || 0, icon: Star, color: 'text-yellow-400' },
      ].filter(item => item.count > 0)

      setStats({
        totalMedia,
        thisMonth,
        avgRating: Math.round(avgRating * 10) / 10,
        favoriteGenres: [],
        mediaBreakdown
      })
    }
  }, [userMedia])

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="glass-card">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-4">
              <LogIn className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">Sign in to view your profile</h3>
            <p className="text-muted-foreground mb-4">
              Please sign in to access your profile and statistics.
            </p>
            <Link href="/auth/login">
              <Button>
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getInitials = (email: string, displayName?: string) => {
    if (displayName) {
      return displayName.split(' ').map(n => n[0]).join('').toUpperCase()
    }
    return email.substring(0, 2).toUpperCase()
  }

  const displayName = user.profile?.display_name || user.profile?.username || user.email?.split('@')[0]
  const joinDate = user.profile?.created_at || new Date().toISOString()

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">
          Your <span className="gradient-text">Profile</span>
        </h1>
        <p className="text-muted-foreground text-lg">
          Track your progress and manage your account
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Info */}
        <div className="lg:col-span-1">
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="text-center">
                <Avatar className="w-24 h-24 mx-auto mb-4">
                  <AvatarImage src={user.profile?.avatar_url} />
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-accent text-white">
                    {getInitials(user.email || '', displayName)}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-2xl font-bold mb-2">{displayName}</h2>
                <p className="text-muted-foreground mb-4">
                  {user.profile?.bio || 'Media enthusiast'}
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6">
                  <Calendar className="h-4 w-4" />
                  Joined {new Date(joinDate).toLocaleDateString('en-US', { 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                  <Button variant="outline" size="sm">
                    <Share className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="glass-card mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Share className="h-4 w-4 mr-2" />
                Share Profile
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
                Account Settings
              </Button>
            </CardContent>
          </Card>
        </div>        {/* Stats and Activity */}
        <div className="lg:col-span-2 space-y-6">
          {userMedia.length > 0 ? (
            <>
              {/* Overview Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="glass-card">
              <CardContent className="p-4 text-center">                <div className="text-2xl font-bold text-primary mb-1">
                  {stats.totalMedia.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Total Media</div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-4 text-center">                <div className="text-2xl font-bold text-accent mb-1">
                  {stats.thisMonth}
                </div>
                <div className="text-sm text-muted-foreground">This Month</div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-4 text-center">                <div className="text-2xl font-bold text-yellow-500 mb-1">
                  {stats.avgRating || 'N/A'}
                </div>
                <div className="text-sm text-muted-foreground">Avg Rating</div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-4 text-center">                <div className="text-2xl font-bold text-green-500 mb-1">
                  {userMedia.filter(item => item.status === 'completed').length}
                </div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </CardContent>
            </Card>
          </div>

          {/* Media Breakdown */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Media Breakdown
              </CardTitle>
              <CardDescription>
                Your consumption by media type
              </CardDescription>
            </CardHeader>            <CardContent>
              {stats.mediaBreakdown.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {stats.mediaBreakdown.map((item) => {
                    const Icon = item.icon
                    return (
                      <div key={item.type} className="flex items-center gap-3 p-3 rounded-lg bg-card/50">
                        <div className={`w-10 h-10 rounded-full bg-current/10 flex items-center justify-center ${item.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-medium">{item.count}</div>
                          <div className="text-sm text-muted-foreground">{item.type}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No media added yet. Start building your collection!
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Your latest media interactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userMedia.length > 0 ? (
                <div className="space-y-4">
                  {userMedia.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-card/50">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <div className="flex-1">
                        <div className="text-sm">
                          <span className="font-medium">
                            {item.status === 'completed' ? 'Completed' : 
                             item.status === 'in_progress' ? 'Currently watching/reading' :
                             item.status === 'planned' ? 'Added to watchlist' :
                             'Updated'}
                          </span> {item.media_item?.title}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(item.updated_at).toLocaleDateString()}
                        </div>
                      </div>
                      {item.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm">{item.rating}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No activity yet. Add some media to get started!
                </p>
              )}
            </CardContent>
          </Card>
            </>
          ) : (
            <ProfileEmptyState />
          )}
        </div>
      </div>
    </div>
  )
}
