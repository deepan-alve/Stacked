'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Star, Clock, Target, TrendingUp } from 'lucide-react'

export function AnimeAnalytics() {
  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-pink-500" />
            Anime Overview
          </CardTitle>
          <CardDescription>
            Comprehensive statistics for your anime watching journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-card/30 rounded-lg border">
              <div className="w-12 h-12 rounded-full bg-pink-500/20 mx-auto mb-3 flex items-center justify-center">
                <Star className="h-6 w-6 text-pink-500" />
              </div>
              <h3 className="font-bold text-lg">0</h3>
              <p className="text-sm text-muted-foreground">Total Anime</p>
            </div>
            
            <div className="text-center p-4 bg-card/30 rounded-lg border">
              <div className="w-12 h-12 rounded-full bg-green-500/20 mx-auto mb-3 flex items-center justify-center">
                <Target className="h-6 w-6 text-green-500" />
              </div>
              <h3 className="font-bold text-lg">0</h3>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
            
            <div className="text-center p-4 bg-card/30 rounded-lg border">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 mx-auto mb-3 flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="font-bold text-lg">0h</h3>
              <p className="text-sm text-muted-foreground">Watch Time</p>
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

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-pink-500" />
              Currently Watching
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Star className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No anime currently being watched</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Top Rated Anime
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Star className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No rated anime yet</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Favorite Genres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Badge variant="outline" className="opacity-50">Action</Badge>
            <Badge variant="outline" className="opacity-50 ml-2">Romance</Badge>
            <Badge variant="outline" className="opacity-50 ml-2">Slice of Life</Badge>
            <Badge variant="outline" className="opacity-50 ml-2">Fantasy</Badge>
            <p className="text-muted-foreground mt-3">Add anime to see your favorite genres</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
