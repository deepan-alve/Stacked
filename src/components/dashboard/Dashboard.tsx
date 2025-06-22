'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Film, Tv, BookOpen, Gamepad2, Star, TrendingUp, Plus, Calendar } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useNavigation } from '@/hooks/useNavigation'
import { useStore } from '@/store/media'
import { useMemo } from 'react'

export function Dashboard() {
  const { user } = useAuth()
  const { navHeight, isNavVisible } = useNavigation()
  const { userMedia } = useStore()
  // Calculate real stats from user data
  const quickStats = useMemo(() => {
    const movieCount = userMedia.filter(media => media.media_item?.type === 'movie').length
    const tvCount = userMedia.filter(media => media.media_item?.type === 'tv').length
    const bookCount = userMedia.filter(media => media.media_item?.type === 'book').length
    const gameCount = userMedia.filter(media => media.media_item?.type === 'game').length

    return [
      { icon: Film, label: 'Movies', count: movieCount, color: 'text-blue-500' },
      { icon: Tv, label: 'TV Shows', count: tvCount, color: 'text-purple-500' },
      { icon: BookOpen, label: 'Books', count: bookCount, color: 'text-green-500' },
      { icon: Gamepad2, label: 'Games', count: gameCount, color: 'text-red-500' },
    ]  }, [userMedia])

  // Helper function to format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInHours / 24)

    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours} hours ago`
    if (diffInDays === 1) return '1 day ago'
    return `${diffInDays} days ago`
  }

  // Get recent activity from user data
  const recentActivity = useMemo(() => {
    // Sort by creation date and take the 5 most recent
    const sortedMedia = [...userMedia]
      .filter(media => media.media_item) // Only include items with media_item data
      .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
      .slice(0, 5)

    return sortedMedia.map(media => ({
      title: media.media_item?.title || 'Unknown Title',
      type: media.media_item?.type ? 
        media.media_item.type.charAt(0).toUpperCase() + media.media_item.type.slice(1) : 
        'Media',
      action: media.status === 'completed' ? 'Completed' : 'Added to library',
      time: formatTimeAgo(media.created_at || new Date().toISOString())
    }))
  }, [userMedia])
  return (
    <div 
      className="min-h-screen bg-background pb-24 transition-all duration-300" 
      style={{ 
        paddingTop: isNavVisible ? `${navHeight + 16}px` : '16px' 
      }}
    >
      <div className="container mx-auto px-4 py-8">
        
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">
            Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}! 👋
          </h1>          <p className="text-muted-foreground">
            Here&apos;s what&apos;s happening with your media library today.
          </p>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >          {quickStats.map((stat) => (
            <motion.div
              key={stat.label}
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", damping: 15 }}
            >
              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                      <stat.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stat.count}</p>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Your latest media interactions
                </CardDescription>
              </CardHeader>              <CardContent>
                <div className="space-y-4">
                  {recentActivity.length > 0 ? (
                    recentActivity.map((activity, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div>
                          <p className="font-medium">{activity.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {activity.action} • {activity.type}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {activity.time}
                        </span>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-2">📚</div>
                      <p className="text-muted-foreground mb-4">No media in your library yet</p>
                      <Button size="sm" asChild>
                        <a href="/add">Add Your First Media</a>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  Quick Actions
                </CardTitle>
                <CardDescription>
                  Jump back into your media journey
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Media
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Calendar className="mr-2 h-4 w-4" />
                    Continue Watching
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Discover Trending
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <BookOpen className="mr-2 h-4 w-4" />
                    View Library
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Coming Soon Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8"
        >
          <Card className="text-center">
            <CardContent className="p-8">
              <div className="text-6xl mb-4">🚀</div>
              <h3 className="text-xl font-semibold mb-2">More Features Coming Soon</h3>              <p className="text-muted-foreground">
                We&apos;re working on personalized recommendations, social features, and detailed analytics.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
