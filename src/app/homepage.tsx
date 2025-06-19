'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Play, Star, TrendingUp, Calendar, BookOpen, Film, Tv, Gamepad2, Music } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 blur-3xl" />
        <div className="relative container mx-auto px-4 py-16">
          <div className="text-center space-y-6">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              <span className="gradient-text">Stacked</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Track your media consumption journey. Movies, TV shows, books, anime, games — all in one beautiful place.
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" className="glow-primary">
                <Play className="mr-2 h-4 w-4" />
                Get Started
              </Button>
              <Button variant="outline" size="lg">
                <Calendar className="mr-2 h-4 w-4" />
                View Demo
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {[
            { label: "Media Tracked", value: "2,847", icon: Star, color: "text-primary" },
            { label: "This Month", value: "37", icon: TrendingUp, color: "text-accent" },
            { label: "Avg Rating", value: "8.6", icon: Star, color: "text-yellow-500" },
            { label: "Streak", value: "12 days", icon: Calendar, color: "text-green-500" },
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

        {/* Media Types */}
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">What can you track?</h2>
            <p className="text-muted-foreground text-lg">
              Organize all your entertainment in one beautiful interface
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {[
              { name: "Movies", icon: Film, count: "847", color: "bg-blue-500/20 text-blue-400" },
              { name: "TV Shows", icon: Tv, count: "423", color: "bg-purple-500/20 text-purple-400" },
              { name: "Books", icon: BookOpen, count: "156", color: "bg-green-500/20 text-green-400" },
              { name: "Games", icon: Gamepad2, count: "89", color: "bg-red-500/20 text-red-400" },
              { name: "Anime", icon: Star, count: "234", color: "bg-pink-500/20 text-pink-400" },
              { name: "Podcasts", icon: Music, count: "67", color: "bg-orange-500/20 text-orange-400" },
            ].map((type, index) => (
              <Card key={index} className="glass-card media-card cursor-pointer group">
                <CardContent className="p-6 text-center">
                  <div className={`w-12 h-12 rounded-full ${type.color} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                    <type.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold mb-2">{type.name}</h3>
                  <Badge variant="secondary">{type.count} items</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-16">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Your latest media consumption
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="movies">Movies</TabsTrigger>
                  <TabsTrigger value="books">Books</TabsTrigger>
                  <TabsTrigger value="games">Games</TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="mt-6">
                  <div className="space-y-4">
                    {[
                      { title: "The Matrix Resurrections", type: "Movie", rating: 8, time: "2 hours ago" },
                      { title: "Dune: Part Two", type: "Movie", rating: 9, time: "1 day ago" },
                      { title: "The Seven Husbands of Evelyn Hugo", type: "Book", rating: 10, time: "3 days ago" },
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-card/50 hover:bg-card/80 transition-colors">
                        <div>
                          <h4 className="font-medium">{item.title}</h4>
                          <p className="text-sm text-muted-foreground">{item.type} • {item.time}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                            <span className="font-medium">{item.rating}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
