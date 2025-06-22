/**
 * AniList GraphQL API Client
 * Handles both anonymous queries and authenticated requests
 */

const ANILIST_GRAPHQL_URL = 'https://graphql.anilist.co'

// Types for AniList API responses
export interface AniListAnime {
  id: number
  title: {
    romaji: string
    english?: string
    native: string
  }
  description?: string
  coverImage: {
    large: string
    medium: string
  }
  bannerImage?: string
  episodes?: number
  duration?: number
  genres: string[]
  averageScore?: number
  meanScore?: number
  popularity: number
  trending: number
  season?: string
  seasonYear?: number
  format: string
  status: string
  studios: {
    nodes: Array<{
      name: string
      isAnimationStudio: boolean
    }>
  }
  staff?: {
    nodes: Array<{
      name: {
        first: string
        last: string
      }
      primaryOccupations: string[]
    }>
  }
}

export interface AniListSearchResponse {
  data: {
    Page: {
      media: AniListAnime[]
      pageInfo: {
        total: number
        currentPage: number
        lastPage: number
        hasNextPage: boolean
      }
    }
  }
}

export interface AniListUserAnime {
  id: number
  media: AniListAnime
  status: 'CURRENT' | 'COMPLETED' | 'PAUSED' | 'DROPPED' | 'PLANNING' | 'REPEATING'
  score: number
  progress: number
  startedAt: {
    year?: number
    month?: number
    day?: number
  }
  completedAt: {
    year?: number
    month?: number
    day?: number
  }
  updatedAt: number
}

// GraphQL Queries
const SEARCH_ANIME_QUERY = `
  query SearchAnime($search: String, $page: Int, $perPage: Int, $sort: [MediaSort]) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        total
        currentPage
        lastPage
        hasNextPage
      }
      media(search: $search, type: ANIME, sort: $sort) {
        id
        title {
          romaji
          english
          native
        }
        description
        coverImage {
          large
          medium
        }
        bannerImage
        episodes
        duration
        genres
        averageScore
        meanScore
        popularity
        trending
        season
        seasonYear
        format
        status
        studios {
          nodes {
            name
            isAnimationStudio
          }
        }
      }
    }
  }
`

const GET_ANIME_DETAILS_QUERY = `
  query GetAnimeDetails($id: Int) {
    Media(id: $id, type: ANIME) {
      id
      title {
        romaji
        english
        native
      }
      description
      coverImage {
        large
        medium
      }
      bannerImage
      episodes
      duration
      genres
      averageScore
      meanScore
      popularity
      trending
      season
      seasonYear
      format
      status
      studios {
        nodes {
          name
          isAnimationStudio
        }
      }
      staff {
        nodes {
          name {
            first
            last
          }
          primaryOccupations
        }
      }
      relations {
        nodes {
          id
          title {
            romaji
            english
          }
          coverImage {
            medium
          }
          format
        }
      }
    }
  }
`

const GET_TRENDING_ANIME_QUERY = `
  query GetTrendingAnime($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      media(type: ANIME, sort: TRENDING_DESC) {
        id
        title {
          romaji
          english
        }
        coverImage {
          large
          medium
        }
        episodes
        genres
        averageScore
        season
        seasonYear
        format
        status
      }
    }
  }
`

const GET_SEASONAL_ANIME_QUERY = `
  query GetSeasonalAnime($season: MediaSeason, $year: Int, $page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      media(type: ANIME, season: $season, seasonYear: $year, sort: POPULARITY_DESC) {
        id
        title {
          romaji
          english
        }
        coverImage {
          large
          medium
        }
        episodes
        genres
        averageScore
        format
        status
      }
    }
  }
`

const GET_USER_ANIME_LIST_QUERY = `
  query GetUserAnimeList($userId: Int, $type: MediaType) {
    MediaListCollection(userId: $userId, type: $type) {
      lists {
        name
        status
        entries {
          id
          status
          score
          progress
          startedAt {
            year
            month
            day
          }
          completedAt {
            year
            month
            day
          }
          updatedAt
          media {
            id
            title {
              romaji
              english
              native
            }
            coverImage {
              large
              medium
            }
            episodes
            duration
            genres
            averageScore
            season
            seasonYear
            format
            status
            studios {
              nodes {
                name
                isAnimationStudio
              }
            }
          }
        }
      }
    }
  }
`

// API Client Class
class AniListClient {
  private async makeRequest(query: string, variables: Record<string, unknown> = {}, accessToken?: string) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`
    }

    const response = await fetch(ANILIST_GRAPHQL_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query,
        variables,
      }),
    })

    if (!response.ok) {
      throw new Error(`AniList API error: ${response.status}`)
    }

    const data = await response.json()

    if (data.errors) {
      throw new Error(`AniList GraphQL error: ${data.errors[0].message}`)
    }

    return data
  }

  // Anonymous API calls (no auth required)
  async searchAnime(query: string, page: number = 1, perPage: number = 20): Promise<AniListSearchResponse> {
    return this.makeRequest(SEARCH_ANIME_QUERY, {
      search: query,
      page,
      perPage,
      sort: ['POPULARITY_DESC']
    })
  }

  async getAnimeDetails(id: number): Promise<{ data: { Media: AniListAnime } }> {
    return this.makeRequest(GET_ANIME_DETAILS_QUERY, { id })
  }

  async getTrendingAnime(page: number = 1, perPage: number = 20): Promise<AniListSearchResponse> {
    return this.makeRequest(GET_TRENDING_ANIME_QUERY, { page, perPage })
  }

  async getSeasonalAnime(season: string, year: number, page: number = 1, perPage: number = 20): Promise<AniListSearchResponse> {
    return this.makeRequest(GET_SEASONAL_ANIME_QUERY, { season, year, page, perPage })
  }

  // Authenticated API calls (requires user's access token)
  async getUserAnimeList(userId: number, accessToken: string): Promise<{ data: { MediaListCollection: unknown } }> {
    return this.makeRequest(GET_USER_ANIME_LIST_QUERY, { userId, type: 'ANIME' }, accessToken)
  }

  // OAuth helpers
  getAuthUrl(): string {
    const clientId = process.env.ANILIST_CLIENT_ID
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/anilist/callback`
    
    return `https://anilist.co/api/v2/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code`
  }

  async exchangeCodeForToken(code: string): Promise<{ access_token: string; user: unknown }> {
    const response = await fetch('https://anilist.co/api/v2/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: process.env.ANILIST_CLIENT_ID,
        client_secret: process.env.ANILIST_CLIENT_SECRET,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/anilist/callback`,
        code,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to exchange code for token')
    }

    const tokenData = await response.json()

    // Get user info
    const userResponse = await this.makeRequest(
      `query { Viewer { id name avatar { medium } } }`,
      {},
      tokenData.access_token
    )

    return {
      access_token: tokenData.access_token,
      user: userResponse.data.Viewer
    }
  }
}

// Export singleton instance
export const anilistClient = new AniListClient()

// Helper functions
export const mapAniListStatusToOurs = (status: string): string => {
  const statusMap: Record<string, string> = {
    'CURRENT': 'in_progress',
    'COMPLETED': 'completed',
    'PAUSED': 'on_hold',
    'DROPPED': 'dropped',
    'PLANNING': 'planned',
    'REPEATING': 'in_progress'
  }
  return statusMap[status] || 'planned'
}

export const mapOurStatusToAniList = (status: string): string => {
  const statusMap: Record<string, string> = {
    'in_progress': 'CURRENT',
    'completed': 'COMPLETED',
    'on_hold': 'PAUSED',
    'dropped': 'DROPPED',
    'planned': 'PLANNING'
  }
  return statusMap[status] || 'PLANNING'
}

export const getCurrentSeason = (): { season: string; year: number } => {
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  let season: string
  if (month >= 12 || month <= 2) season = 'WINTER'
  else if (month >= 3 && month <= 5) season = 'SPRING'
  else if (month >= 6 && month <= 8) season = 'SUMMER'
  else season = 'FALL'

  return { season, year: month === 12 ? year + 1 : year }
}
