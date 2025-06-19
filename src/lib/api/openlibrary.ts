// Open Library API service for books
import { MediaLog } from '@/types'

const OPENLIBRARY_BASE_URL = 'https://openlibrary.org'

export interface OpenLibraryBook {
  key: string
  title: string
  author_name?: string[]
  first_publish_year?: number
  isbn?: string[]
  cover_i?: number
  edition_count?: number
  publisher?: string[]
  language?: string[]
  subject?: string[]
  ratings_average?: number
  ratings_count?: number
  publish_year?: number[]
}

export interface OpenLibrarySearchResponse {
  numFound: number
  start: number
  numFoundExact: boolean
  docs: OpenLibraryBook[]
}

export interface OpenLibraryWork {
  key: string
  title: string
  authors?: Array<{
    author: {
      key: string
    }
    type: {
      key: string
    }
  }>
  description?: string | { value: string }
  subjects?: string[]
  covers?: number[]
  first_publish_date?: string
}

export class OpenLibraryService {
  private static async fetchOpenLibrary<T>(endpoint: string): Promise<T> {
    const url = `${OPENLIBRARY_BASE_URL}${endpoint}`
    
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Open Library API error: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Open Library API error:', error)
      throw error
    }
  }

  // Search books
  static async searchBooks(query: string, page: number = 1, limit: number = 20): Promise<OpenLibrarySearchResponse> {
    const offset = (page - 1) * limit
    const endpoint = `/search.json?q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`
    return this.fetchOpenLibrary<OpenLibrarySearchResponse>(endpoint)
  }

  // Search by author
  static async searchByAuthor(author: string, page: number = 1, limit: number = 20): Promise<OpenLibrarySearchResponse> {
    const offset = (page - 1) * limit
    const endpoint = `/search.json?author=${encodeURIComponent(author)}&limit=${limit}&offset=${offset}`
    return this.fetchOpenLibrary<OpenLibrarySearchResponse>(endpoint)
  }

  // Search by ISBN
  static async searchByISBN(isbn: string): Promise<OpenLibrarySearchResponse> {
    const endpoint = `/search.json?isbn=${isbn}`
    return this.fetchOpenLibrary<OpenLibrarySearchResponse>(endpoint)
  }

  // Get work details
  static async getWorkDetails(workKey: string): Promise<OpenLibraryWork> {
    const endpoint = `/works/${workKey}.json`
    return this.fetchOpenLibrary<OpenLibraryWork>(endpoint)
  }

  // Get book cover URL
  static getCoverURL(coverId: number | undefined, size: 'S' | 'M' | 'L' = 'M'): string | undefined {
    if (!coverId) return undefined
    return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`
  }

  // Get author details
  static async getAuthorDetails(authorKey: string): Promise<{
    name: string
    bio?: string | { value: string }
    birth_date?: string
    death_date?: string
  }> {
    const endpoint = `/authors/${authorKey}.json`
    return this.fetchOpenLibrary(endpoint)
  }

  // Convert Open Library book to our MediaLog format
  static convertBookToMediaLog(book: OpenLibraryBook): Partial<MediaLog> {
    return {
      title: book.title,
      media_type: 'book',
      external_id: book.key,
      cover_url: this.getCoverURL(book.cover_i, 'L'),
      notes: `By ${book.author_name?.join(', ') || 'Unknown Author'}${book.first_publish_year ? ` (${book.first_publish_year})` : ''}`,
      rating: book.ratings_average ? Math.round(book.ratings_average * 2) : undefined, // Convert to 10-point scale
      tags: book.subject?.slice(0, 5).map(subject => subject.toLowerCase()) || [],
    }
  }

  // Get trending books (using subject search as proxy)
  static async getTrendingBooks(subject: string = 'bestseller', page: number = 1): Promise<OpenLibrarySearchResponse> {
    const offset = (page - 1) * 20
    const endpoint = `/search.json?subject=${encodeURIComponent(subject)}&limit=20&offset=${offset}&sort=rating`
    return this.fetchOpenLibrary<OpenLibrarySearchResponse>(endpoint)
  }

  // Search by subject/genre
  static async searchBySubject(subject: string, page: number = 1): Promise<OpenLibrarySearchResponse> {
    const offset = (page - 1) * 20
    const endpoint = `/search.json?subject=${encodeURIComponent(subject)}&limit=20&offset=${offset}`
    return this.fetchOpenLibrary<OpenLibrarySearchResponse>(endpoint)
  }
}

// Export convenience functions
export async function searchBooks(query: string): Promise<OpenLibraryBook[]> {
  const response = await OpenLibraryService.searchBooks(query)
  return response.docs
}

export async function getTrendingBooks(): Promise<OpenLibraryBook[]> {
  const response = await OpenLibraryService.getTrendingBooks()
  return response.docs
}

export async function searchBooksByAuthor(author: string): Promise<OpenLibraryBook[]> {
  const response = await OpenLibraryService.searchByAuthor(author)
  return response.docs
}
