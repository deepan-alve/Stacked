'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Book } from 'lucide-react'

interface BookAnalyticsProps {
  stats: {
    totalItems: number
    completedItems: number
    inProgressItems: number
    plannedItems: number
    droppedItems: number
    averageRating: number
    totalTimeInvested: number
    thisYearCompleted: number
    thisMonthCompleted: number
    completionRate: number
    favoriteGenres: Array<{ genre: string; count: number }>
    monthlyActivity: Array<{ month: string; count: number }>
    ratingDistribution: Array<{ rating: number; count: number }>
  }
}

export function BookAnalytics({ stats }: BookAnalyticsProps) {
  if (!stats) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Book className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No book analytics available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Book className="h-5 w-5 text-green-500" />
            Books Overview
          </CardTitle>
          <CardDescription>
            Comprehensive statistics for your reading journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-card/30 rounded-lg border">
              <div className="w-12 h-12 rounded-full bg-green-500/20 mx-auto mb-3 flex items-center justify-center">
                <Book className="h-6 w-6 text-green-500" />
              </div>
              <h3 className="font-bold text-lg">{stats.totalItems}</h3>
              <p className="text-sm text-muted-foreground">Total Books</p>
            </div>
            <div className="text-center p-4 bg-card/30 rounded-lg border">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 mx-auto mb-3 flex items-center justify-center">
                <Book className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="font-bold text-lg">{stats.averageRating.toFixed(1)}</h3>
              <p className="text-sm text-muted-foreground">Avg Rating</p>
            </div>
            <div className="text-center p-4 bg-card/30 rounded-lg border">
              <div className="w-12 h-12 rounded-full bg-yellow-500/20 mx-auto mb-3 flex items-center justify-center">
                <Book className="h-6 w-6 text-yellow-500" />
              </div>
              <h3 className="font-bold text-lg">{Math.round(stats.totalTimeInvested)}h</h3>
              <p className="text-sm text-muted-foreground">Reading Time</p>
            </div>
            <div className="text-center p-4 bg-card/30 rounded-lg border">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 mx-auto mb-3 flex items-center justify-center">
                <Book className="h-6 w-6 text-purple-500" />
              </div>
              <h3 className="font-bold text-lg">{stats.completedItems}</h3>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Add more analytics visualizations as needed using stats */}
    </div>
  )
}
