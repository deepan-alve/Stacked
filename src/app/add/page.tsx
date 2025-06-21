'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useMediaSearch, SearchResult } from '@/hooks/useMediaSearch'
import { SearchResults } from '@/components/SearchResults'
import { StarRating } from '@/components/StarRating'
import { useStore } from '@/store/media'
import { useNavigation } from '@/hooks/useNavigation'
import { addUserMedia } from '@/lib/api/media'
import { 
  Plus,
  Star,
  Search,
  Film,
  Tv,
  Book,
  Gamepad2,
  Music,
  Save,
  X,
  Loader2,
  MessageSquare
} from 'lucide-react'

const mediaTypes = [
  { value: 'movie', label: 'Movie', icon: Film },
  { value: 'tv', label: 'TV Show', icon: Tv },
  { value: 'book', label: 'Book', icon: Book },
  { value: 'game', label: 'Game', icon: Gamepad2 },
  { value: 'anime', label: 'Anime', icon: Star },
  { value: 'podcast', label: 'Podcast', icon: Music },
]

const statusOptions = [
  { value: 'completed', label: 'Completed' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'planned', label: 'Planned' },
  { value: 'dropped', label: 'Dropped' },
]

export default function AddMediaPage() {
  const searchParams = useSearchParams()
  const { navHeight, isNavVisible } = useNavigation()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<'movie' | 'tv' | 'book' | 'anime' | 'game'>('movie')
  const [showResults, setShowResults] = useState(false)
  const { results, isLoading, error, search } = useMediaSearch()
  const { user, addUserMedia: addToStore } = useStore()
    const [formData, setFormData] = useState({
    title: '',
    type: '',
    rating: 0, // Changed to number for star rating (0-5)
    status: 'completed',
    notes: '',
    review: '', // Added dedicated review field
    coverUrl: '',
    tags: [] as string[],
    external_id: '',
    external_source: '',
  })
  const [newTag, setNewTag] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Handle prefill from search
  useEffect(() => {
    const prefillData = searchParams.get('prefill')
    if (prefillData) {
      try {
        const data = JSON.parse(decodeURIComponent(prefillData))
        setFormData(prev => ({
          ...prev,
          title: data.title || '',
          type: data.type || '',
          coverUrl: data.coverUrl || '',
          notes: data.description || '',
          external_id: data.external_id,
          external_source: data.external_source,
        }))
        if (data.type) {
          setSelectedType(data.type)
        }
      } catch (err) {
        console.error('Failed to parse prefill data:', err)
      }
    }
  }, [searchParams])
  
  const handleSearch = async () => {
    if (searchQuery.trim()) {
      try {
        await search(searchQuery, [selectedType])
        setShowResults(true)
      } catch (err) {
        console.error('Search failed:', err)
      }
    }
  }
  const handleSelectFromSearch = (item: SearchResult) => {
    setFormData(prev => ({
      ...prev,
      title: item.title,
      type: item.type,
      coverUrl: item.coverUrl || '',
      notes: item.description || ''
    }))
    setShowResults(false)
    setSearchQuery('')
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    if (!user) {
      console.error('User not authenticated')
      alert('Please log in to add media')
      setIsSubmitting(false)
      return
    }
    
    try {
      const result = await addUserMedia(user.id, {
        title: formData.title,
        type: formData.type,
        rating: formData.rating,
        status: formData.status,
        review: formData.review,
        notes: formData.notes,
        cover_url: formData.coverUrl,
        metadata: {
          tags: formData.tags
        }
      })
      
      if (result.success && result.data) {
        // Add to local store
        addToStore(result.data)
        
        console.log('Media added successfully:', result.data)
          // Reset form
        setFormData({
          title: '',
          type: '',
          rating: 0,
          status: 'completed',
          notes: '',
          review: '',
          coverUrl: '',
          tags: [],
          external_id: '',
          external_source: '',
        })
        
        // Show success message
        alert('Media added successfully!')
      } else {
        console.error('Failed to add media:', result.error)
        alert(`Failed to add media: ${result.error}`)
      }
    } catch (err) {
      console.error('Error adding media:', err)
      alert('An unexpected error occurred')
    }
    
    setIsSubmitting(false)
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {      e.preventDefault()
      addTag()
    }
  }
  
  return (
    <div 
      className="container mx-auto px-4 py-8 max-w-2xl pb-32 md:pb-8 transition-all duration-300" 
      style={{ 
        paddingTop: isNavVisible ? `${navHeight + 32}px` : '32px' 
      }}
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">
          Add <span className="gradient-text">Media</span>
        </h1>
        <p className="text-muted-foreground text-lg">
          Log a new piece of media to your collection
        </p>
      </div>{/* Quick Search Section */}
      <Card className="glass-card mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Search External Databases
          </CardTitle>
          <CardDescription>
            Search for movies, TV shows, books, anime, and games from external APIs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Select value={selectedType} onValueChange={(value: 'movie' | 'tv' | 'book' | 'anime' | 'game') => setSelectedType(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="movie">
                  <div className="flex items-center gap-2">
                    <Film className="h-4 w-4" />
                    Movies
                  </div>
                </SelectItem>
                <SelectItem value="tv">
                  <div className="flex items-center gap-2">
                    <Tv className="h-4 w-4" />
                    TV Shows
                  </div>
                </SelectItem>
                <SelectItem value="book">
                  <div className="flex items-center gap-2">
                    <Book className="h-4 w-4" />
                    Books
                  </div>
                </SelectItem>
                <SelectItem value="anime">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Anime
                  </div>
                </SelectItem>
                <SelectItem value="game">
                  <div className="flex items-center gap-2">
                    <Gamepad2 className="h-4 w-4" />
                    Games
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <Input 
              placeholder={`Search for ${selectedType}s...`} 
              className="flex-1"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={isLoading || !searchQuery.trim()}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>          {/* Search Results */}
          {showResults && (
            <SearchResults
              results={results}
              isLoading={isLoading}
              error={error}
              onSelect={handleSelectFromSearch}
            />
          )}
          
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              Error: {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Entry Form */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Manual Entry
          </CardTitle>
          <CardDescription>
            Add media details manually
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title and Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({...prev, title: e.target.value}))}
                  placeholder="Enter title..."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Media Type *</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => setFormData(prev => ({...prev, type: value}))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select media type" />
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
              </div>
            </div>            {/* Rating and Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rating">Rating</Label>
                <div className="pt-2">
                  <StarRating
                    value={formData.rating}
                    onChange={(rating) => setFormData(prev => ({...prev, rating}))}
                    size="md"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData(prev => ({...prev, status: value}))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Cover URL */}
            <div className="space-y-2">
              <Label htmlFor="coverUrl">Cover Image URL (optional)</Label>
              <Input
                id="coverUrl"
                value={formData.coverUrl}
                onChange={(e) => setFormData(prev => ({...prev, coverUrl: e.target.value}))}
                placeholder="https://example.com/cover.jpg"
              />
            </div>            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add a tag..."
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Review */}
            <div className="space-y-2">
              <Label htmlFor="review" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Your Review
              </Label>
              <Textarea
                id="review"
                value={formData.review}
                onChange={(e) => setFormData(prev => ({...prev, review: e.target.value}))}
                placeholder="Share your thoughts about this media. What did you like or dislike? Would you recommend it?"
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({...prev, notes: e.target.value}))}
                placeholder="Your thoughts, quotes, or any other notes..."
                rows={4}
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">            <Button 
              type="submit" 
              className="flex-1 glow-primary" 
              disabled={isSubmitting || !formData.title || !formData.type}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Add to Library
                </>
              )}
            </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
