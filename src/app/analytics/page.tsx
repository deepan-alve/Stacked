'use client'

import { AnimeAnalytics } from '@/components/anilist/AnimeAnalytics'
import { useNavigation } from '@/hooks/useNavigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart3, LogIn } from 'lucide-react'

export default function AnalyticsPage() {
  const { isNavVisible, navHeight } = useNavigation()
  const { user } = useAuth()

  if (!user) {
    return (
      <div 
        className="container mx-auto px-4 py-8 transition-all duration-300" 
        style={{ 
          paddingTop: isNavVisible ? `${navHeight + 32}px` : '32px' 
        }}
      >
        <Card className="glass-card max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Sign in to view analytics</h3>
            <p className="text-muted-foreground mb-4">
              You need to be signed in to access your personalized analytics and insights.
            </p>
            <Button asChild>
              <a href="/auth/login">
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div 
      className="container mx-auto px-4 py-8 transition-all duration-300" 
      style={{ 
        paddingTop: isNavVisible ? `${navHeight + 32}px` : '32px' 
      }}
    >
      <AnimeAnalytics />
    </div>
  )
}
