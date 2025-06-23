'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useMediaSearch, SearchResult } from '@/hooks/useMediaSearch'
import { StarRating } from '@/components/StarRating'
import { addUserMedia } from '@/lib/api/media'
import { createClient } from '@/lib/supabase/client'
import { 
  X,
  Search,
  Film,
  Tv,
  Book,
  Gamepad2,
  Star,
  Music,
  Save,
  Loader2,
  Plus,
  Check
} from 'lucide-react'
import { RatingSystem } from '@/components/ui/RatingSystemSelect'
import Image from 'next/image'

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

interface FloatingAddModalProps {
  isOpen: boolean
  onClose: () => void
}

export function FloatingAddModal({ isOpen, onClose }: FloatingAddModalProps) {  const [selectedType, setSelectedType] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null)
  const [manualEntry, setManualEntry] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: '',
    rating: 0,
    progress: '',
    notes: '',
    cover_url: ''
  })
  const { results, isLoading, search, clearResults } = useMediaSearch()

  // Get rating system from settings (localStorage)
  const [ratingSystem, setRatingSystem] = useState<RatingSystem>('10-star')
  useEffect(() => {
    const savedSettings = localStorage.getItem('stacked-settings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        if (parsed.ratingSystem) setRatingSystem(parsed.ratingSystem)
      } catch {}
    }
  }, [])

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedType('')
      setSearchQuery('')
      setSelectedResult(null)
      setManualEntry(false)
      setFormData({
        title: '',
        description: '',
        status: '',
        rating: 0,
        progress: '',
        notes: '',
        cover_url: ''
      })
      setSaveSuccess(false)
      clearResults() // Clear search results when modal closes
    }
  }, [isOpen, clearResults])
  const handleSearch = async (query: string) => {
    if (query.length > 2 && selectedType) {
      await search(query, [selectedType])
    }
  }

  const handleResultSelect = (result: SearchResult) => {
    setSelectedResult(result)
    setFormData({
      title: result.title,
      description: result.description || '',
      status: '',
      rating: 0,
      progress: '',
      notes: '',
      cover_url: result.coverUrl || ''
    })
  }

  const handleManualEntry = () => {
    setManualEntry(true)
    setSelectedResult(null)
    setFormData({
      title: '',      description: '',
      status: '',
      rating: 0,
      progress: '',
      notes: '',
      cover_url: ''
    })
  }
  const handleSave = async () => {
    if (!formData.title || !selectedType || !formData.status) return

    setIsSaving(true)
    try {
      // Get current user
      const supabase = createClient()
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        throw new Error(`Authentication error: ${userError.message}`)
      }
      
      if (!user) {
        throw new Error('User not authenticated')
      }const mediaData = {
        title: formData.title,
        type: selectedType,
        status: formData.status,
        rating: formData.rating || undefined,
        notes: formData.notes || undefined,
        review: formData.notes || undefined, // Some APIs expect 'review' field
        cover_url: formData.cover_url || undefined,
        metadata: {
          description: formData.description || undefined,
          progress: formData.progress ? parseInt(formData.progress) : undefined,        }
      }

      const result = await addUserMedia(user.id, mediaData)

      if (!result.success) {
        throw new Error(result.error || 'Failed to save media')
      }

      setSaveSuccess(true)
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (error) {
      console.error('Error saving media:', error)
      alert(`Error saving media: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSaving(false)
    }
  }

  function renderRatingInput() {
    switch (ratingSystem) {
      case '5-star':
        return (
          <StarRating
            value={formData.rating}
            onChange={(rating: number) => setFormData({ ...formData, rating })}
            size="md"
            max={5}
          />
        )
      case '10-star':
        return (
          <StarRating
            value={formData.rating}
            onChange={(rating: number) => setFormData({ ...formData, rating })}
            size="md"
            max={10}
          />
        )
      case '100-point':
        return (
          <input
            type="number"
            min={0}
            max={100}
            step={1}
            value={formData.rating}
            onChange={e => setFormData({ ...formData, rating: Number(e.target.value) })}
            className="input"
          />
        )
      case 'decimal':
        return (
          <input
            type="number"
            min={0}
            max={10}
            step={0.1}
            value={formData.rating}
            onChange={e => setFormData({ ...formData, rating: Number(e.target.value) })}
            className="input"
          />
        )
      case 'like-dislike':
        return (
          <div className="flex gap-2">
            <Button
              type="button"
              variant={formData.rating === 1 ? 'default' : 'outline'}
              onClick={() => setFormData({ ...formData, rating: 1 })}
            >Like</Button>
            <Button
              type="button"
              variant={formData.rating === -1 ? 'default' : 'outline'}
              onClick={() => setFormData({ ...formData, rating: -1 })}
            >Dislike</Button>
          </div>
        )
      default:
        return null
    }
  }

  if (saveSuccess) {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-card border border-border rounded-lg p-8 max-w-md mx-4 text-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <Check className="h-8 w-8 text-white" />
              </motion.div>
              <h3 className="text-xl font-semibold mb-2">Added Successfully!</h3>
              <p className="text-muted-foreground">
                {formData.title} has been added to your library.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    )
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-card border border-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Plus className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Add New Media</h2>
                  <p className="text-sm text-muted-foreground">Add to your library without leaving this page</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
              {/* Step 1: Select Media Type */}
              {!selectedType && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">What type of media are you adding?</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {mediaTypes.map((type) => (
                      <Button
                        key={type.value}
                        variant="outline"
                        onClick={() => setSelectedType(type.value)}
                        className="h-20 flex flex-col gap-2 hover:bg-primary/10"
                      >
                        <type.icon className="h-6 w-6" />
                        <span>{type.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Search or Manual Entry */}
              {selectedType && !selectedResult && !manualEntry && (
                <div className="space-y-6">                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedType('')
                        clearResults() // Clear search results when going back
                        setSearchQuery('') // Clear search query
                      }}
                    >
                      ← Back
                    </Button>
                    <Badge variant="secondary" className="flex items-center gap-2">
                      {mediaTypes.find(t => t.value === selectedType)?.icon && (
                        <span className="w-4 h-4">
                          {React.createElement(mediaTypes.find(t => t.value === selectedType)!.icon, { className: "w-4 h-4" })}
                        </span>
                      )}
                      {mediaTypes.find(t => t.value === selectedType)?.label}
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="search">Search for {selectedType}</Label>
                      <div className="relative mt-2">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="search"
                          placeholder={`Search for ${selectedType}...`}
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value)
                            handleSearch(e.target.value)
                          }}
                          className="pl-10"
                          autoFocus
                        />
                      </div>
                    </div>

                    {isLoading && (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <span className="ml-2 text-muted-foreground">Searching...</span>
                      </div>
                    )}

                    {results.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Search Results</h4>
                        <div className="grid gap-3 max-h-60 overflow-y-auto">
                          {results.slice(0, 8).map((result, index) => (
                            <div
                              key={index}
                              onClick={() => handleResultSelect(result)}
                              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                            >
                              {result.coverUrl ? (
                                <Image
                                  src={result.coverUrl}
                                  alt={result.title}
                                  width={48}
                                  height={64}
                                  className="w-12 h-16 object-cover rounded"
                                  unoptimized
                                />
                              ) : (
                                <div className="w-12 h-16 bg-muted rounded flex items-center justify-center">
                                  <Film className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{result.title}</p>
                                {result.year && (
                                  <p className="text-sm text-muted-foreground">{result.year}</p>
                                )}
                                {result.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                    {result.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t border-border">
                      <Button
                        variant="outline"
                        onClick={handleManualEntry}
                        className="w-full"
                      >
                        Can&apos;t find what you&apos;re looking for? Add manually
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Fill Details */}
              {(selectedResult || manualEntry) && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedResult(null)
                        setManualEntry(false)
                        clearResults() // Clear search results when going back
                      }}
                    >
                      ← Back
                    </Button>
                    <Badge variant="secondary" className="flex items-center gap-2">
                      {mediaTypes.find(t => t.value === selectedType)?.icon && (
                        <span className="w-4 h-4">
                          {React.createElement(mediaTypes.find(t => t.value === selectedType)!.icon, { className: "w-4 h-4" })}
                        </span>
                      )}
                      {mediaTypes.find(t => t.value === selectedType)?.label}
                    </Badge>
                  </div>

                  {selectedResult && (
                    <div className="flex gap-4 p-4 bg-muted/50 rounded-lg">
                      {selectedResult.coverUrl && (
                        <Image
                          src={selectedResult.coverUrl}
                          alt={selectedResult.title}
                          width={64}
                          height={96}
                          className="w-16 h-24 object-cover rounded"
                          unoptimized
                        />
                      )}
                      <div>
                        <h4 className="font-medium">{selectedResult.title}</h4>
                        {selectedResult.year && (
                          <p className="text-sm text-muted-foreground">{selectedResult.year}</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Enter title"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status">Status *</Label>
                      <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>                    <div className="space-y-2">
                      <Label>Rating</Label>
                      {renderRatingInput()}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="progress">Progress</Label>
                      <Input
                        id="progress"
                        type="number"
                        value={formData.progress}
                        onChange={(e) => setFormData({ ...formData, progress: e.target.value })}
                        placeholder="Episodes, pages, etc."
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Your thoughts, recommendations, etc."
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handleSave}
                      disabled={!formData.title || !formData.status || isSaving}
                      className="flex-1"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
