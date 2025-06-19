'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { CollectionsEmptyState, FilteredResultsEmptyState } from '@/components/empty-states/EmptyState'
import { useAuth } from '@/components/providers/AuthProvider'
import { useStore } from '@/store/media'
import { 
  Plus,
  FolderOpen,
  Lock,
  Calendar,
  MoreVertical,
  LogIn,
  Search,
  Star
} from 'lucide-react'

// For now using local state - in a real app this would be in Supabase
interface Collection {
  id: string
  name: string
  description: string
  emoji: string
  itemCount: number
  isPrivate: boolean
  createdAt: string
  coverImages: string[]
}

export default function CollectionsPage() {
  const { user } = useAuth()
  const { userMedia } = useStore()
  const [collections, setCollections] = useState<Collection[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [newCollection, setNewCollection] = useState({
    name: '',
    description: '',
    emoji: '📁',
    isPrivate: false
  })

  // Sample collections for demonstration - in real app these would come from Supabase
  useEffect(() => {
    if (user && userMedia.length > 0) {
      // Create sample collections based on user's media
      const movieItems = userMedia.filter(item => item.media_item?.type === 'movie')
      const bookItems = userMedia.filter(item => item.media_item?.type === 'book')
      const completedItems = userMedia.filter(item => item.status === 'completed')
      
      const sampleCollections: Collection[] = []
      
      if (movieItems.length > 0) {
        sampleCollections.push({
          id: '1',
          name: 'My Movies',
          description: 'All my tracked movies',
          emoji: '🎬',
          itemCount: movieItems.length,
          isPrivate: false,
          createdAt: new Date().toISOString(),
          coverImages: movieItems.slice(0, 3).map(item => 
            item.media_item?.cover_url || item.media_item?.metadata?.cover_url as string || '/placeholder-cover.svg'
          ).filter(Boolean)
        })
      }
      
      if (bookItems.length > 0) {
        sampleCollections.push({
          id: '2',
          name: 'My Books',
          description: 'All my tracked books',
          emoji: '📚',
          itemCount: bookItems.length,
          isPrivate: false,
          createdAt: new Date().toISOString(),
          coverImages: bookItems.slice(0, 3).map(item => 
            item.media_item?.cover_url || item.media_item?.metadata?.cover_url as string || '/placeholder-cover.svg'
          ).filter(Boolean)
        })
      }
      
      if (completedItems.length > 0) {
        sampleCollections.push({
          id: '3',
          name: 'Completed',
          description: 'Media I have completed',
          emoji: '✅',
          itemCount: completedItems.length,
          isPrivate: false,
          createdAt: new Date().toISOString(),
          coverImages: completedItems.slice(0, 3).map(item => 
            item.media_item?.cover_url || item.media_item?.metadata?.cover_url as string || '/placeholder-cover.svg'
          ).filter(Boolean)
        })
      }
      
      setCollections(sampleCollections)
    }
  }, [user, userMedia])

  const handleCreateCollection = () => {
    if (!newCollection.name.trim()) return
    
    const collection: Collection = {
      id: Date.now().toString(),
      name: newCollection.name,
      description: newCollection.description,
      emoji: newCollection.emoji,
      itemCount: 0,
      isPrivate: newCollection.isPrivate,
      createdAt: new Date().toISOString(),
      coverImages: []
    }
    
    setCollections(prev => [collection, ...prev])
    setNewCollection({ name: '', description: '', emoji: '📁', isPrivate: false })
    setShowCreateForm(false)
  }

  const filteredCollections = collections.filter(collection =>
    collection.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    collection.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="glass-card">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">Sign in to view your collections</h3>
            <p className="text-muted-foreground mb-4">
              Please sign in to create and manage your media collections.
            </p>
            <Link href="/auth/login">
              <Button>
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">
            Your <span className="gradient-text">Collections</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Organize your media into custom collections
          </p>
        </div>
        <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
          <DialogTrigger asChild>
            <Button className="glow-primary">
              <Plus className="h-4 w-4 mr-2" />
              New Collection
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Collection</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Collection Name</label>
                <Input
                  placeholder="Enter collection name..."
                  value={newCollection.name}
                  onChange={(e) => setNewCollection(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <Textarea
                  placeholder="Describe your collection..."
                  value={newCollection.description}
                  onChange={(e) => setNewCollection(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Emoji</label>
                <Input
                  placeholder="📁"
                  value={newCollection.emoji}
                  onChange={(e) => setNewCollection(prev => ({ ...prev, emoji: e.target.value }))}
                  maxLength={2}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="private"
                  checked={newCollection.isPrivate}
                  onChange={(e) => setNewCollection(prev => ({ ...prev, isPrivate: e.target.checked }))}
                />
                <label htmlFor="private" className="text-sm">Make this collection private</label>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleCreateCollection} className="flex-1">
                  Create Collection
                </Button>
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      {collections.length > 0 && (
        <Card className="glass-card mb-8">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search collections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Collections Grid */}
      {filteredCollections.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCollections.map((collection) => (
            <Card key={collection.id} className="glass-card media-card cursor-pointer group hover:border-primary/50 transition-colors">
              <CardContent className="p-0">
                {/* Cover Images */}
                <div className="relative h-32 bg-gradient-to-br from-primary/20 to-accent/20 rounded-t-lg overflow-hidden">
                  {collection.coverImages.length > 0 ? (
                    <div className="grid grid-cols-3 h-full">
                      {collection.coverImages.slice(0, 3).map((image, index) => (
                        <div key={index} className="relative overflow-hidden">
                          <Image
                            src={image}
                            alt=""
                            fill
                            className="object-cover"
                          />
                        </div>
                      ))}
                      {collection.coverImages.length < 3 && 
                        Array.from({ length: 3 - collection.coverImages.length }).map((_, index) => (
                          <div key={`empty-${index}`} className="bg-card/20 flex items-center justify-center">
                            <FolderOpen className="h-6 w-6 text-muted-foreground/50" />
                          </div>
                        ))
                      }
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-4xl">{collection.emoji}</div>
                    </div>
                  )}
                  
                  {/* Privacy indicator */}
                  {collection.isPrivate && (
                    <div className="absolute top-2 right-2">
                      <div className="bg-black/50 rounded-full p-1">
                        <Lock className="h-3 w-3 text-white" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <span>{collection.emoji}</span>
                      {collection.name}
                    </h3>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                    {collection.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      {collection.itemCount} items
                    </Badge>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(collection.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>      ) : collections.length === 0 ? (
        /* Empty State - No Collections */
        <CollectionsEmptyState />
      ) : (
        /* No Search Results */
        <FilteredResultsEmptyState 
          onClearFilters={() => setSearchQuery('')}
        />
      )}</div>
  )
}
