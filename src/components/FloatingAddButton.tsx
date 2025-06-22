'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/components/providers/AuthProvider'
import { useMediaSearch, SearchResult } from '@/hooks/useMediaSearch'
import { 
  Plus,
  X,
  Search,
  Film,
  Tv,
  Book,
  Gamepad2,
  Star,
  Music,
  Loader2,
  Zap
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const mediaTypes = [
  { value: 'movie', label: 'Movie', icon: Film, color: 'bg-red-500' },
  { value: 'tv', label: 'TV Show', icon: Tv, color: 'bg-blue-500' },
  { value: 'anime', label: 'Anime', icon: Star, color: 'bg-purple-500' },
  { value: 'book', label: 'Book', icon: Book, color: 'bg-green-500' },
  { value: 'game', label: 'Game', icon: Gamepad2, color: 'bg-orange-500' },
  { value: 'podcast', label: 'Podcast', icon: Music, color: 'bg-pink-500' },
]

export function FloatingAddButton() {
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [quickSearch, setQuickSearch] = useState('')
  const [selectedType, setSelectedType] = useState<string>('')
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  
  const { results, isLoading, search } = useMediaSearch()

  // Hide on auth pages and add page
  const shouldHide = pathname?.startsWith('/auth') || pathname === '/add'
  
  if (!user || shouldHide) return null

  const handleQuickSearch = async (query: string) => {
    if (query.length > 2 && selectedType) {
      await search(query, [selectedType])
    }
  }

  const handleResultClick = (result: SearchResult) => {
    const params = new URLSearchParams({
      type: selectedType,
      title: result.title,
      ...(result.coverUrl && { cover_url: result.coverUrl }),
      ...(result.description && { description: result.description }),
      ...(result.year && { year: result.year.toString() }),
    })
    
    router.push(`/add?${params.toString()}`)
    setIsOpen(false)
    setShowQuickAdd(false)
    setQuickSearch('')
  }

  const openFullAddPage = () => {
    router.push('/add')
    setIsOpen(false)
  }

  const selectMediaType = (type: string) => {
    setSelectedType(type)
    setShowQuickAdd(true)
  }

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => {
              setIsOpen(false)
              setShowQuickAdd(false)
              setQuickSearch('')
            }}
          />
        )}
      </AnimatePresence>

      {/* Quick Add Modal */}
      <AnimatePresence>
        {isOpen && showQuickAdd && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md mx-4"
          >
            <Card className="glass-card border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    Quick Add {mediaTypes.find(t => t.value === selectedType)?.label}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowQuickAdd(false)
                      setQuickSearch('')
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription>
                  Search and add {selectedType} quickly
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={`Search for ${selectedType}...`}
                    value={quickSearch}
                    onChange={(e) => {
                      setQuickSearch(e.target.value)
                      handleQuickSearch(e.target.value)
                    }}
                    className="pl-10"
                    autoFocus
                  />
                </div>

                {isLoading && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                )}                {results.length > 0 && (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {results.slice(0, 5).map((result: SearchResult, index: number) => (
                      <div
                        key={index}
                        onClick={() => handleResultClick(result)}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                      >
                        {result.coverUrl ? (
                          <Image
                            src={result.coverUrl}
                            alt={result.title}
                            width={40}
                            height={56}
                            className="w-10 h-14 object-cover rounded"
                          />
                        ) : (
                          <div className="w-10 h-14 bg-muted rounded flex items-center justify-center">
                            <Film className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{result.title}</p>
                          {result.year && (
                            <p className="text-sm text-muted-foreground">{result.year}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Button 
                  onClick={openFullAddPage}
                  variant="outline" 
                  className="w-full"
                >
                  Open Full Add Page
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Media Type Selection */}
      <AnimatePresence>
        {isOpen && !showQuickAdd && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-24 right-6 z-50"
          >
            <div className="flex flex-col gap-2">
              {mediaTypes.map((type, index) => (
                <motion.div
                  key={type.value}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ 
                    opacity: 1, 
                    x: 0,
                    transition: { delay: index * 0.1 }
                  }}
                  exit={{ 
                    opacity: 0, 
                    x: 50,
                    transition: { delay: (mediaTypes.length - index) * 0.05 }
                  }}
                >
                  <Button
                    onClick={() => selectMediaType(type.value)}
                    className={`${type.color} hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl`}
                    size="lg"
                  >
                    <type.icon className="h-5 w-5 mr-2" />
                    {type.label}
                  </Button>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ 
                  opacity: 1, 
                  x: 0,
                  transition: { delay: mediaTypes.length * 0.1 }
                }}
                exit={{ opacity: 0, x: 50 }}
              >
                <Button
                  onClick={openFullAddPage}
                  variant="outline"
                  size="lg"
                  className="bg-background/90 backdrop-blur-sm border-primary/20 hover:bg-primary/10"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Full Add Page
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          size="lg"
          className={`
            rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-300
            ${isOpen 
              ? 'bg-red-500 hover:bg-red-600 rotate-45' 
              : 'bg-primary hover:bg-primary/90 glow-primary'
            }
          `}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </motion.div>
    </>
  )
}
