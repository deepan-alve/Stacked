import { create } from 'zustand'
import { MediaLog, MediaType, MediaStatus, Profile } from '@/types'
import { User } from '@supabase/supabase-js'

interface MediaStore {
  mediaLogs: MediaLog[]
  selectedMediaType: MediaType | 'all'
  selectedStatus: MediaStatus | 'all'
  searchQuery: string
  isLoading: boolean
  
  // Actions
  setMediaLogs: (logs: MediaLog[]) => void
  addMediaLog: (log: MediaLog) => void
  updateMediaLog: (id: string, updates: Partial<MediaLog>) => void
  deleteMediaLog: (id: string) => void
  setSelectedMediaType: (type: MediaType | 'all') => void
  setSelectedStatus: (status: MediaStatus | 'all') => void
  setSearchQuery: (query: string) => void
  setIsLoading: (loading: boolean) => void
  
  // Computed
  filteredMediaLogs: () => MediaLog[]
}

export const useMediaStore = create<MediaStore>((set, get) => ({
  mediaLogs: [],
  selectedMediaType: 'all',
  selectedStatus: 'all',
  searchQuery: '',
  isLoading: false,
  
  setMediaLogs: (logs) => set({ mediaLogs: logs }),
  
  addMediaLog: (log) => set((state) => ({ 
    mediaLogs: [log, ...state.mediaLogs] 
  })),
  
  updateMediaLog: (id, updates) => set((state) => ({
    mediaLogs: state.mediaLogs.map(log => 
      log.id === id ? { ...log, ...updates } : log
    )
  })),
  
  deleteMediaLog: (id) => set((state) => ({
    mediaLogs: state.mediaLogs.filter(log => log.id !== id)
  })),
  
  setSelectedMediaType: (type) => set({ selectedMediaType: type }),
  setSelectedStatus: (status) => set({ selectedStatus: status }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  
  filteredMediaLogs: () => {
    const { mediaLogs, selectedMediaType, selectedStatus, searchQuery } = get()
    
    return mediaLogs.filter((log) => {
      const matchesType = selectedMediaType === 'all' || log.media_type === selectedMediaType
      const matchesStatus = selectedStatus === 'all' || log.status === selectedStatus
      const matchesSearch = searchQuery === '' || 
        log.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      
      return matchesType && matchesStatus && matchesSearch
    })
  }
}))

// Auth store
interface AuthStore {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  
  setUser: (user: User | null) => void
  setProfile: (profile: Profile | null) => void
  setIsLoading: (loading: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  profile: null,
  isLoading: true,
  
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  logout: () => set({ user: null, profile: null })
}))
