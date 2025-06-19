'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { 
  Library, 
  Plus, 
  Search, 
  FolderOpen, 
  Film, 
  Book, 
  Gamepad2, 
  Tv, 
  Star,
  Music,
  Sparkles,
  TrendingUp
} from 'lucide-react'

interface EmptyStateProps {
  type: 'library' | 'collections' | 'search' | 'profile' | 'filtered-results'
  mediaType?: 'movie' | 'book' | 'game' | 'tv' | 'anime' | 'podcast'
  title?: string
  description?: string
  actionText?: string
  actionHref?: string
  onAction?: () => void
  showSecondaryAction?: boolean
}

const mediaTypeConfig = {
  movie: {
    icon: Film,
    name: 'movies',
    examples: ['Inception', 'The Dark Knight', 'Interstellar']
  },
  book: {
    icon: Book,
    name: 'books',
    examples: ['Harry Potter', 'The Hobbit', 'Dune']
  },
  game: {
    icon: Gamepad2,
    name: 'games',
    examples: ['Cyberpunk 2077', 'The Witcher 3', 'Elden Ring']
  },
  tv: {
    icon: Tv,
    name: 'TV shows',
    examples: ['Breaking Bad', 'Game of Thrones', 'Stranger Things']
  },
  anime: {
    icon: Star,
    name: 'anime',
    examples: ['Attack on Titan', 'Death Note', 'Your Name']
  },
  podcast: {
    icon: Music,
    name: 'podcasts',
    examples: ['Joe Rogan Experience', 'Serial', 'This American Life']
  }
}

const emptyStateConfig = {
  library: {
    title: 'Your library is waiting to be filled! 📚',
    description: 'Start building your personal media collection by adding your first movie, book, or show.',
    icon: Library,
    actionText: 'Add Your First Media',
    actionHref: '/add',
    suggestions: [
      'Search for your favorite movie',
      'Add a book you\'re currently reading',
      'Track a game you\'re playing'
    ]
  },
  collections: {
    title: 'No collections yet—time to get organized! 📂',
    description: 'Create collections to organize your media by themes, genres, or any way you like.',
    icon: FolderOpen,
    actionText: 'Create Your First Collection',
    suggestions: [
      'Create a "Favorites" collection',
      'Make a "To Watch" list',
      'Organize by year or genre'
    ]
  },
  search: {
    title: 'Ready to discover something amazing? 🔍',
    description: 'Search across millions of movies, books, games, anime, and more to find your next favorite.',
    icon: Search,
    actionText: 'Start Searching',
    suggestions: [
      'Try searching for "Studio Ghibli"',
      'Look up your favorite author',
      'Find trending games'
    ]
  },
  profile: {
    title: 'Your journey begins here! 👤',
    description: 'Add some media to your library to see your stats and activity here.',
    icon: Star,
    actionText: 'Build Your Library',
    actionHref: '/add',
    suggestions: [
      'Track what you\'re currently watching',
      'Rate your recent reads',
      'Log your gaming progress'
    ]
  },
  'filtered-results': {
    title: 'No matches found 🔍',
    description: 'Try adjusting your filters or search terms to find what you\'re looking for.',
    icon: Search,
    actionText: 'Clear Filters',
    suggestions: [
      'Remove some filters',
      'Try different keywords',
      'Browse all media instead'
    ]
  }
}

export function EmptyState({ 
  type, 
  mediaType, 
  title, 
  description, 
  actionText, 
  actionHref, 
  onAction,
  showSecondaryAction = true 
}: EmptyStateProps) {
  const config = emptyStateConfig[type]
  const mediaConfig = mediaType ? mediaTypeConfig[mediaType] : null

  // Customize for specific media types
  const getMediaSpecificContent = () => {
    if (!mediaConfig) return config

    return {
      title: `No ${mediaConfig.name} yet—add your first ${mediaConfig.name.slice(0, -1)}! ${getMediaEmoji()}`,
      description: `Start tracking your ${mediaConfig.name}. Discover new favorites and keep track of what you've watched, read, or played.`,
      suggestions: [
        `Search for "${mediaConfig.examples[0]}"`,
        `Add "${mediaConfig.examples[1]}" to your list`,
        `Discover trending ${mediaConfig.name}`
      ]
    }
  }

  const getMediaEmoji = () => {
    switch (mediaType) {
      case 'movie': return '🎬'
      case 'book': return '📖'
      case 'game': return '🎮'
      case 'tv': return '📺'
      case 'anime': return '🌟'
      case 'podcast': return '🎧'
      default: return '📚'
    }
  }
  const content = mediaType ? getMediaSpecificContent() : config
  const finalTitle = title || content.title
  const finalDescription = description || content.description
  const finalActionText = actionText || config.actionText || 'Get Started'
  const finalActionHref = actionHref || ('actionHref' in config ? config.actionHref : undefined)
  const IconComponent = mediaConfig?.icon || config.icon

  return (
    <div className="flex items-center justify-center min-h-[400px] p-8">
      <Card className="glass-card max-w-md w-full">
        <CardContent className="p-8 text-center space-y-6">
          {/* Icon */}
          <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <IconComponent className="h-10 w-10 text-primary" />
          </div>

          {/* Content */}
          <div className="space-y-3">
            <h3 className="text-xl font-semibold">
              {finalTitle}
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              {finalDescription}
            </p>
          </div>

          {/* Suggestions */}
          {content.suggestions && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Ideas to get started:</p>
              <div className="space-y-1">
                {content.suggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Sparkles className="h-3 w-3 text-primary" />
                    {suggestion}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3 pt-2">
            {finalActionHref ? (
              <Link href={finalActionHref} className="block">
                <Button className="w-full glow-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  {finalActionText}
                </Button>
              </Link>
            ) : onAction ? (
              <Button onClick={onAction} className="w-full glow-primary">
                <Plus className="h-4 w-4 mr-2" />
                {finalActionText}
              </Button>
            ) : null}

            {/* Secondary Actions */}
            {showSecondaryAction && (
              <div className="flex gap-2">
                <Link href="/search" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <Search className="h-4 w-4 mr-2" />
                    Discover
                  </Button>
                </Link>
                <Link href="/" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Trending
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Specific empty state components for different pages
export function LibraryEmptyState({ mediaType }: { mediaType?: EmptyStateProps['mediaType'] }) {
  return <EmptyState type="library" mediaType={mediaType} />
}

export function CollectionsEmptyState() {
  return <EmptyState type="collections" />
}

export function SearchEmptyState() {
  return <EmptyState type="search" />
}

export function ProfileEmptyState() {
  return <EmptyState type="profile" />
}

export function FilteredResultsEmptyState({ onClearFilters }: { onClearFilters?: () => void }) {
  return (
    <EmptyState 
      type="filtered-results" 
      onAction={onClearFilters}
      showSecondaryAction={false}
    />
  )
}
