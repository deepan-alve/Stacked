'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Music, Star, Clock, Target, TrendingUp } from 'lucide-react'

export function PodcastAnalytics() {
  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5 text-orange-500" />
            Podcast Overview
          </CardTitle>
          <CardDescription>
            Comprehensive statistics for your podcast listening habits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-card/30 rounded-lg border">
              <div className="w-12 h-12 rounded-full bg-orange-500/20 mx-auto mb-3 flex items-center justify-center">
                <Music className="h-6 w-6 text-orange-500" />
              </div>
              <h3 className="font-bold text-lg">0</h3>
              <p className="text-sm text-muted-foreground">Total Podcasts</p>
            </div>
            
            <div className="text-center p-4 bg-card/30 rounded-lg border">
              <div className="w-12 h-12 rounded-full bg-green-500/20 mx-auto mb-3 flex items-center justify-center">
                <Target className="h-6 w-6 text-green-500" />
              </div>
              <h3 className="font-bold text-lg">0</h3>
              <p className="text-sm text-muted-foreground">Episodes Completed</p>
            </div>
            
            <div className="text-center p-4 bg-card/30 rounded-lg border">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 mx-auto mb-3 flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="font-bold text-lg">0h</h3>
              <p className="text-sm text-muted-foreground">Listen Time</p>
            </div>
            
            <div className="text-center p-4 bg-card/30 rounded-lg border">
              <div className="w-12 h-12 rounded-full bg-yellow-500/20 mx-auto mb-3 flex items-center justify-center">
                <Star className="h-6 w-6 text-yellow-500" />
              </div>
              <h3 className="font-bold text-lg">0.0</h3>
              <p className="text-sm text-muted-foreground">Avg Rating</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">Listening Habits</CardTitle>
            <CardDescription>Your podcast consumption patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Daily Average</span>
                <Badge variant="secondary">0h 0m</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Longest Session</span>
                <Badge variant="secondary">0h 0m</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Favorite Day</span>
                <Badge variant="secondary">Not Available</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">Top Categories</CardTitle>
            <CardDescription>Your most listened podcast genres</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-center py-8 text-muted-foreground">
                <Music className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No podcast data available yet</p>
                <p className="text-sm">Start adding podcasts to see analytics</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>Your latest podcast interactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Music className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No recent podcast activity</p>
            <p className="text-sm">Your podcast listening history will appear here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
