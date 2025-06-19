'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from '@/components/providers/AuthProvider'
import { useStore } from '@/store/media'
import { useOnboarding } from '@/components/onboarding/OnboardingTour'
import { 
  Play, 
  Star, 
  TrendingUp, 
  Calendar, 
  BookOpen, 
  Film, 
  Tv, 
  Gamepad2, 
  Music,
  ArrowRight,
  Check,
  Zap,
  Shield,
  Users,
  Plus
} from "lucide-react"

// Interface for media type breakdown
interface MediaTypeBreakdown {
  type: string
  count: number
  icon: React.ComponentType<{ className?: string }>
  color: string
}

// Landing Page Component (for non-authenticated users)
function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 blur-3xl" />
        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
                <span className="gradient-text">Stacked</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
                Track your media consumption journey. Movies, TV shows, books, anime, games, and podcasts — all in one beautiful place.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="lg" className="glow-primary">
                  <Play className="mr-2 h-4 w-4" />
                  Get Started Free
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button variant="outline" size="lg">
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything you need to track your media
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Powerful features designed to make organizing your entertainment effortless and enjoyable
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {[
            {
              icon: Star,
              title: "Rate & Review",
              description: "Give ratings and write reviews for everything you consume",
              color: "text-yellow-500"
            },
            {
              icon: TrendingUp,
              title: "Track Progress",
              description: "Monitor your reading, watching, and gaming habits over time",
              color: "text-primary"
            },
            {
              icon: Users,
              title: "Share Collections",
              description: "Create and share curated collections with friends",
              color: "text-accent"
            },
            {
              icon: Zap,
              title: "Smart Search",
              description: "Find any movie, book, game, or show with our powerful search",
              color: "text-blue-500"
            },
            {
              icon: Shield,
              title: "Private & Secure",
              description: "Your data is encrypted and private. Own your media history.",
              color: "text-green-500"
            },
            {
              icon: Calendar,
              title: "Track Everything",
              description: "Movies, TV, books, anime, games, podcasts - all in one place",
              color: "text-purple-500"
            }
          ].map((feature, index) => (
            <Card key={index} className="glass-card border-border/50 hover:border-primary/50 transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className={`w-12 h-12 rounded-full bg-current/10 flex items-center justify-center mx-auto mb-4 ${feature.color}`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold mb-2 text-lg">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Media Types Preview */}
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Track Any Type of Media</h2>
            <p className="text-muted-foreground text-lg">
              From blockbuster movies to indie games, organize everything you love
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {[
              { name: "Movies", icon: Film, color: "bg-blue-500/20 text-blue-400", description: "Track films and documentaries" },
              { name: "TV Shows", icon: Tv, color: "bg-purple-500/20 text-purple-400", description: "Follow series and episodes" },
              { name: "Books", icon: BookOpen, color: "bg-green-500/20 text-green-400", description: "Novels, non-fiction, comics" },
              { name: "Games", icon: Gamepad2, color: "bg-red-500/20 text-red-400", description: "Video games across all platforms" },
              { name: "Anime", icon: Star, color: "bg-pink-500/20 text-pink-400", description: "Japanese animation series" },
              { name: "Podcasts", icon: Music, color: "bg-orange-500/20 text-orange-400", description: "Episodes and series" },
            ].map((type, index) => (
              <Card key={index} className="glass-card media-card cursor-pointer group hover:border-primary/50 transition-all">
                <CardContent className="p-6 text-center">
                  <div className={`w-12 h-12 rounded-full ${type.color} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                    <type.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold mb-2">{type.name}</h3>
                  <p className="text-sm text-muted-foreground">{type.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <Card className="glass-card border-primary/20">
            <CardContent className="p-12">
              <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
                Join thousands of users who are already tracking their media consumption with Stacked
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/signup">
                  <Button size="lg" className="glow-primary">
                    Create Your Account
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button variant="outline" size="lg">
                    Already have an account?
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Dashboard Component (for authenticated users)
function Dashboard() {
  const { userMedia } = useStore()
  const { resetOnboarding } = useOnboarding()
  const [stats, setStats] = useState({
    totalMedia: 0,
    thisMonth: 0,
    avgRating: 0,
    streak: 0,
    mediaBreakdown: [] as MediaTypeBreakdown[]
  })

  useEffect(() => {
    if (userMedia.length > 0) {
      // Calculate stats from real user data
      const totalMedia = userMedia.length
      
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      const thisMonth = userMedia.filter(item => {
        const itemDate = new Date(item.created_at)
        return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear
      }).length

      const ratingsArray = userMedia.filter(item => item.rating).map(item => item.rating!)
      const avgRating = ratingsArray.length > 0 
        ? ratingsArray.reduce((sum, rating) => sum + rating, 0) / ratingsArray.length 
        : 0

      // Calculate media breakdown
      const typeCount: Record<string, number> = {}
      userMedia.forEach(item => {
        if (item.media_item?.type) {
          typeCount[item.media_item.type] = (typeCount[item.media_item.type] || 0) + 1
        }
      })

      const mediaBreakdown = [
        { type: "Movies", count: typeCount.movie || 0, icon: Film, color: "text-blue-400" },
        { type: "TV Shows", count: typeCount.tv || 0, icon: Tv, color: "text-purple-400" },
        { type: "Books", count: typeCount.book || 0, icon: BookOpen, color: "text-green-400" },
        { type: "Games", count: typeCount.game || 0, icon: Gamepad2, color: "text-red-400" },
        { type: "Anime", count: typeCount.anime || 0, icon: Star, color: "text-pink-400" },
        { type: "Podcasts", count: typeCount.podcast || 0, icon: Music, color: "text-orange-400" },
      ]

      setStats({
        totalMedia,
        thisMonth,
        avgRating: Math.round(avgRating * 10) / 10,
        streak: 0, // TODO: Calculate actual streak
        mediaBreakdown
      })
    }
  }, [userMedia])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card">
      {/* Welcome Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 blur-3xl" />
        <div className="relative container mx-auto px-4 py-16">
          <div className="text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Welcome back to <span className="gradient-text">Stacked</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Continue your media journey and discover what&apos;s next
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/add">
                <Button size="lg" className="glow-primary">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Media
                </Button>
              </Link>
              <Link href="/library">
                <Button variant="outline" size="lg">
                  <BookOpen className="mr-2 h-4 w-4" />
                  View Library
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={resetOnboarding}
                className="text-muted-foreground hover:text-foreground"
              >
                <Play className="mr-2 h-3 w-3" />
                Take Tour
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {[
            { label: "Total Media", value: stats.totalMedia.toLocaleString(), icon: Star, color: "text-primary" },
            { label: "This Month", value: stats.thisMonth.toString(), icon: TrendingUp, color: "text-accent" },
            { label: "Avg Rating", value: stats.avgRating > 0 ? stats.avgRating.toString() : "N/A", icon: Star, color: "text-yellow-500" },
            { label: "Completed", value: userMedia.filter(item => item.status === 'completed').length.toString(), icon: Check, color: "text-green-500" },
          ].map((stat, index) => (
            <Card key={index} className="glass-card border-border/50 hover:border-primary/50 transition-all duration-300">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  {stat.label}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Media Types Overview */}
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Your Collection</h2>
            <p className="text-muted-foreground text-lg">
              Overview of your media library by type
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {stats.mediaBreakdown.filter(type => type.count > 0).map((type, index) => (
              <Card key={index} className="glass-card media-card cursor-pointer group">
                <CardContent className="p-6 text-center">
                  <div className={`w-12 h-12 rounded-full bg-current/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform ${type.color}`}>
                    <type.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold mb-2">{type.type}</h3>
                  <Badge variant="secondary">{type.count} items</Badge>
                </CardContent>
              </Card>
            ))}
            {stats.mediaBreakdown.every(type => type.count === 0) && (
              <div className="col-span-full text-center py-12">
                <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No media added yet</h3>
                <p className="text-muted-foreground mb-4">Start building your collection</p>
                <Link href="/add">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Media
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        {userMedia.length > 0 && (
          <div className="mt-16">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Your latest media additions and updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userMedia.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 rounded-lg bg-card/50 hover:bg-card/80 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="relative w-12 h-16 rounded overflow-hidden bg-muted">
                          <Image
                            src={item.media_item?.cover_url || item.media_item?.metadata?.cover_url as string || '/placeholder-cover.svg'}
                            alt={item.media_item?.title || 'Media cover'}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <h4 className="font-medium">{item.media_item?.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {item.media_item?.type} • {new Date(item.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {item.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                          <span className="font-medium">{item.rating}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-6 text-center">
                  <Link href="/library">
                    <Button variant="outline">
                      View Full Library
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Home() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return user ? <Dashboard /> : <LandingPage />
}
