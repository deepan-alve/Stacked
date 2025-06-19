import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AuthUser, UserMedia, Collection } from '@/types/database'

interface MediaStore {
  // User state
  user: AuthUser | null
  setUser: (user: AuthUser | null) => void
  
  // Media state
  userMedia: UserMedia[]
  setUserMedia: (media: UserMedia[]) => void
  addUserMedia: (media: UserMedia) => void
  updateUserMedia: (id: string, updates: Partial<UserMedia>) => void
  removeUserMedia: (id: string) => void
  
  // Collections state
  collections: Collection[]
  setCollections: (collections: Collection[]) => void
  addCollection: (collection: Collection) => void
  updateCollection: (id: string, updates: Partial<Collection>) => void
  removeCollection: (id: string) => void
  
  // UI state
  searchQuery: string
  setSearchQuery: (query: string) => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

export const useStore = create<MediaStore>()(
  persist(
    (set) => ({
      // User state
      user: null,
      setUser: (user) => set({ user }),

      // Media state
      userMedia: [],
      setUserMedia: (userMedia) => set({ userMedia }),
      addUserMedia: (media) => set((state) => ({
        userMedia: [media, ...state.userMedia]
      })),
      updateUserMedia: (id, updates) => set((state) => ({
        userMedia: state.userMedia.map((media) =>
          media.id === id ? { ...media, ...updates } : media
        )
      })),
      removeUserMedia: (id) => set((state) => ({
        userMedia: state.userMedia.filter((media) => media.id !== id)
      })),

      // Collections state
      collections: [],
      setCollections: (collections) => set({ collections }),
      addCollection: (collection) => set((state) => ({
        collections: [collection, ...state.collections]
      })),
      updateCollection: (id, updates) => set((state) => ({
        collections: state.collections.map((collection) =>
          collection.id === id ? { ...collection, ...updates } : collection
        )
      })),
      removeCollection: (id) => set((state) => ({
        collections: state.collections.filter((collection) => collection.id !== id)
      })),

      // UI state
      searchQuery: '',
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      isLoading: false,
      setIsLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'stacked-store',
      partialize: (state) => ({ 
        user: state.user,
        searchQuery: state.searchQuery 
      }),
    }
  )
)
