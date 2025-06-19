import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Star, Calendar, Plus } from 'lucide-react'
import { SearchResult } from '@/hooks/useMediaSearch'
import Image from 'next/image'

interface SearchResultsProps {
  results: SearchResult[]
  isLoading: boolean
  error: string | null
  onSelect: (result: SearchResult) => void
}

export function SearchResults({ results, isLoading, error, onSelect }: SearchResultsProps) {
  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <span className="text-muted-foreground">Searching...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="glass-card border-destructive/50">
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            <p className="font-medium">Search failed</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (results.length === 0) {
    return null
  }

  return (
    <Card className="glass-card">
      <CardContent className="p-4">
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground mb-3">
            Search Results ({results.length})
          </h3>
          {results.map((result) => (
            <div
              key={result.id}
              className="flex items-start space-x-3 p-3 rounded-lg border bg-card/50 hover:bg-card/80 transition-colors"
            >
              {/* Cover Image */}
              <div className="flex-shrink-0 w-12 h-16 bg-muted rounded overflow-hidden">
                {result.coverUrl ? (
                  <Image
                    src={result.coverUrl}
                    alt={result.title}
                    width={48}
                    height={64}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-muted-foreground">
                      {result.title.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm line-clamp-1">{result.title}</h4>
                    {result.subtitle && (
                      <p className="text-xs text-muted-foreground mt-0.5">{result.subtitle}</p>
                    )}
                    
                    {/* Metadata */}
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs py-0">
                        {result.type}
                      </Badge>
                      {result.year && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {result.year}
                        </div>
                      )}
                      {result.rating && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Star className="h-3 w-3 fill-current" />
                          {result.rating}/10
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    {result.description && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                        {result.description}
                      </p>
                    )}
                  </div>

                  {/* Add Button */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onSelect(result)}
                    className="flex-shrink-0 h-8 px-2"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
