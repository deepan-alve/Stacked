'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Play, Star, TrendingUp, Calendar, BookOpen, Film, Tv, Gamepad2, Music } from "lucide-react"
import { motion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  })

  // Transform values for different sections
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.8])
  
  const statsOpacity = useTransform(scrollYProgress, [0.1, 0.25, 0.4, 0.55], [0, 1, 1, 0])
  const statsY = useTransform(scrollYProgress, [0.1, 0.25, 0.4, 0.55], [100, 0, 0, -100])
  
  const featuresOpacity = useTransform(scrollYProgress, [0.45, 0.6, 0.75, 0.9], [0, 1, 1, 0])
  const featuresY = useTransform(scrollYProgress, [0.45, 0.6, 0.75, 0.9], [100, 0, 0, -100])
  
  const activityOpacity = useTransform(scrollYProgress, [0.8, 0.95], [0, 1])
  const activityY = useTransform(scrollYProgress, [0.8, 0.95], [100, 0])

  return (
    <div ref={containerRef} className="relative">
      {/* Hero Section - Fixed Position */}
      <motion.div 
        className="fixed inset-0 z-10 flex items-center justify-center bg-gradient-to-br from-background via-background to-card"
        style={{ 
          opacity: heroOpacity,
          scale: heroScale
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 blur-3xl" />
        <div className="relative container mx-auto px-4 text-center space-y-6">
          <motion.h1 
            className="text-5xl md:text-7xl font-bold tracking-tight"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="gradient-text">Stacked</span>
          </motion.h1>
          <motion.p 
            className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Track your media consumption journey. Movies, TV shows, books, anime, games — all in one beautiful place.
          </motion.p>          <motion.div 
            className="flex gap-4 justify-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Button size="lg" className="glow-primary">
              <Play className="mr-2 h-4 w-4" />
              Sign up for free
            </Button>
            <Button variant="outline" size="lg">
              <Calendar className="mr-2 h-4 w-4" />
              View Demo
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Stats Section - Fixed Position */}
      <motion.div 
        className="fixed inset-0 z-20 flex items-center justify-center bg-gradient-to-br from-background via-background to-card"
        style={{ 
          opacity: statsOpacity,
          y: statsY
        }}
      >
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            {[
              { label: "Media Tracked", value: "2,847", icon: Star, color: "text-primary" },
              { label: "This Month", value: "37", icon: TrendingUp, color: "text-accent" },
              { label: "Avg Rating", value: "8.6", icon: Star, color: "text-yellow-500" },
              { label: "Streak", value: "12 days", icon: Calendar, color: "text-green-500" },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="glass-card border-border/50 hover:border-primary/50 transition-all duration-300">
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
              </motion.div>
            ))}
          </div>
          
          <div className="text-center">
            <motion.h2 
              className="text-3xl font-bold mb-4"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              Your Digital Library Stats
            </motion.h2>
            <motion.p 
              className="text-muted-foreground text-lg"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Track your progress and discover insights about your media consumption habits
            </motion.p>
          </div>
        </div>
      </motion.div>

      {/* Features Section - Fixed Position */}
      <motion.div 
        className="fixed inset-0 z-30 flex items-center justify-center bg-gradient-to-br from-background via-background to-card"
        style={{ 
          opacity: featuresOpacity,
          y: featuresY
        }}
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <motion.h2 
              className="text-3xl font-bold mb-4"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              What can you track?
            </motion.h2>
            <motion.p 
              className="text-muted-foreground text-lg"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Organize all your entertainment in one beautiful interface
            </motion.p>
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
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <Card className="glass-card media-card cursor-pointer group">
                  <CardContent className="p-6 text-center">
                    <div className={`w-12 h-12 rounded-full ${type.color} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                      <type.icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold mb-2">{type.name}</h3>
                    <Badge variant="secondary">{type.count} items</Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Activity Section - Fixed Position */}
      <motion.div 
        className="fixed inset-0 z-40 flex items-center justify-center bg-gradient-to-br from-background via-background to-card"
        style={{ 
          opacity: activityOpacity,
          y: activityY
        }}
      >
        <div className="container mx-auto px-4">
          <Card className="glass-card max-w-4xl mx-auto">
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
                      <motion.div 
                        key={index} 
                        className="flex items-center justify-between p-4 rounded-lg bg-card/50 hover:bg-card/80 transition-colors"
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                      >
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
                      </motion.div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Spacer to enable scrolling */}
      <div className="h-[500vh]" />
    </div>
  )
}
