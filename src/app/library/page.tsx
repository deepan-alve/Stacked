'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import EditMediaDialog from '@/components/EditMediaDialog'
import { LibraryEmptyState, FilteredResultsEmptyState } from '@/components/empty-states/EmptyState'
import { 
  Search, 
  Star, 
  Calendar, 
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Book,
  Film,
  Tv,
  Gamepad2,
  Music,
  Grid3X3,
  List,
  Edit3,
  ArrowUpDown
} from 'lucide-react'
import { useStore } from '@/store/media'
import { useNavigation } from '@/hooks/useNavigation'
import { getUserMedia } from '@/lib/api/media'
import { MediaType, MediaStatus } from '@/types/database'

const mediaTypes = [
  { value: 'all', label: 'All Media', icon: Grid3X3 },
  { value: 'movie', label: 'Movies', icon: Film },
  { value: 'tv', label: 'TV Shows', icon: Tv },
  { value: 'book', label: 'Books', icon: Book },
  { value: 'game', label: 'Games', icon: Gamepad2 },
  { value: 'anime', label: 'Anime', icon: Star },
  { value: 'podcast', label: 'Podcasts', icon: Music },
]

const statusTypes = [
  { value: 'all', label: 'All Status', icon: Grid3X3 },
  { value: 'completed', label: 'Completed', icon: CheckCircle },
  { value: 'in_progress', label: 'In Progress', icon: Clock },
  { value: 'planned', label: 'Planned', icon: Eye },
  { value: 'dropped', label: 'Dropped', icon: XCircle },
  { value: 'on_hold', label: 'On Hold', icon: Clock },
]

const sortOptions = [
  { value: 'recent', label: 'Recently Added' },
  { value: 'title', label: 'Title (A-Z)' },
  { value: 'rating', label: 'Rating (High to Low)' },
  { value: 'type', label: 'Media Type' },
]

export default function LibraryPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [sortBy, setSortBy] = useState('recent')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isLoading, setIsLoading] = useState(true)

  const { user, userMedia, setUserMedia } = useStore()
  const { navHeight, isNavVisible } = useNavigation()

  // Load user media on component mount
  useEffect(() => {
    async function loadUserMedia() {
      if (!user?.id) {
        setIsLoading(false)
        return
      }

      try {
        const media = await getUserMedia(user.id)
        setUserMedia(media)
      } catch (error) {
        console.error('Error loading user media:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUserMedia()
  }, [user?.id, setUserMedia])

  // Filter and sort media
  const filteredAndSortedMedia = userMedia
    .filter(item => {
      const matchesSearch = item.media_item?.title?.toLowerCase().includes(searchQuery.toLowerCase()) || false
      const matchesType = selectedType === 'all' || item.media_item?.type === selectedType
      const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus
      return matchesSearch && matchesType && matchesStatus
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return (a.media_item?.title || '').localeCompare(b.media_item?.title || '')
        case 'rating':
          return (b.rating || 0) - (a.rating || 0)
        case 'type':
          return (a.media_item?.type || '').localeCompare(b.media_item?.type || '')
        case 'recent':
        default:
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      }
    })

  const getStatusIcon = (status: MediaStatus) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'in_progress': return <Clock className="h-4 w-4 text-yellow-500" />
      case 'planned': return <Eye className="h-4 w-4 text-blue-500" />
      case 'dropped': return <XCircle className="h-4 w-4 text-red-500" />
      case 'on_hold': return <Clock className="h-4 w-4 text-orange-500" />
      default: return null
    }
  }

  const getTypeIcon = (type: MediaType) => {
    switch (type) {
      case 'movie': return <Film className="h-4 w-4" />
      case 'tv': return <Tv className="h-4 w-4" />
      case 'book': return <Book className="h-4 w-4" />
      case 'game': return <Gamepad2 className="h-4 w-4" />
      case 'anime': return <Star className="h-4 w-4" />
      case 'podcast': return <Music className="h-4 w-4" />
      default: return <Grid3X3 className="h-4 w-4" />
    }
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="glass-card">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-4">
              <Book className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">Sign in to view your library</h3>
            <p className="text-muted-foreground mb-4">
              Please sign in to access your personal media library.
            </p>
            <Button>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    )  }

  return (
    <div 
      className="container mx-auto px-4 py-8 transition-all duration-300" 
      style={{ 
        paddingTop: isNavVisible ? `${navHeight + 32}px` : '32px' 
      }}
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">
          Your <span className="gradient-text">Library</span>
        </h1>
        <p className="text-muted-foreground text-lg">
          {isLoading ? 'Loading your media...' : `${filteredAndSortedMedia.length} items in your collection`}
        </p>
      </div>

      {/* Filters and Search */}
      <Card className="glass-card mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search your library..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Media Type" />
                </SelectTrigger>
                <SelectContent>
                  {mediaTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {statusTypes.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      <div className="flex items-center gap-2">
                        <status.icon className="h-4 w-4" />
                        {status.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <ArrowUpDown className="h-4 w-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              >
                {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Media Grid */}
      {!isLoading && viewMode === 'grid' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredAndSortedMedia.map((item) => (
            <EditMediaDialog key={item.id} userMedia={item}>
              <Card className="glass-card media-card group cursor-pointer hover:border-primary/50 transition-colors">
                <CardContent className="p-0">
                  <div className="relative aspect-[2/3] overflow-hidden rounded-t-lg">                    <Image
                      src={item.media_item?.cover_url || item.media_item?.metadata?.cover_url as string || '/placeholder-cover.svg'}
                      alt={item.media_item?.title || 'Media cover'}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2 flex gap-1">
                      {getStatusIcon(item.status)}
                    </div>
                    <div className="absolute top-2 left-2">
                      <Button size="sm" variant="secondary" className="h-6 w-6 p-0">
                        <Edit3 className="h-3 w-3" />
                      </Button>
                    </div>
                    {item.rating && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                        <div className="flex items-center gap-1 text-yellow-400">
                          <Star className="h-3 w-3 fill-current" />
                          <span className="text-sm font-medium">{item.rating}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      {item.media_item?.type && getTypeIcon(item.media_item.type)}
                      <Badge variant="secondary" className="text-xs capitalize">
                        {item.media_item?.type}
                      </Badge>
                    </div>
                    <h3 className="font-medium text-sm line-clamp-2 mb-2">
                      {item.media_item?.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </EditMediaDialog>
          ))}
        </div>
      )}

      {/* List View */}
      {!isLoading && viewMode === 'list' && (
        <div className="space-y-3">
          {filteredAndSortedMedia.map((item) => (
            <Card key={item.id} className="glass-card hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-20 overflow-hidden rounded">                    <Image
                      src={item.media_item?.cover_url || item.media_item?.metadata?.cover_url as string || '/placeholder-cover.svg'}
                      alt={item.media_item?.title || 'Media cover'}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {item.media_item?.type && getTypeIcon(item.media_item.type)}
                      <h3 className="font-medium">{item.media_item?.title}</h3>
                      <Badge variant="secondary" className="capitalize">{item.media_item?.type}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {item.review || item.notes || 'No notes added'}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {item.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span>{item.rating}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        {getStatusIcon(item.status)}
                        <span className="capitalize">{item.status.replace('_', ' ')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(item.updated_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <EditMediaDialog userMedia={item}>
                    <Button variant="outline" size="sm">
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  </EditMediaDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}      {/* Empty State */}
      {!isLoading && filteredAndSortedMedia.length === 0 && userMedia.length === 0 && (
        <LibraryEmptyState />
      )}

      {/* No Results State */}
      {!isLoading && filteredAndSortedMedia.length === 0 && userMedia.length > 0 && (
        <FilteredResultsEmptyState 
          onClearFilters={() => {
            setSearchQuery('')
            setSelectedType('all')
            setSelectedStatus('all')
          }}
        />
      )}
    </div>
  )
}
