import { NextRequest, NextResponse } from 'next/server'

const IGDB_BASE_URL = 'https://api.igdb.com/v4'
const IGDB_CLIENT_ID = process.env.NEXT_PUBLIC_IGDB_CLIENT_ID
const IGDB_CLIENT_SECRET = process.env.IGDB_CLIENT_SECRET

interface IGDBGame {
  id: number
  name: string
  summary?: string
  rating?: number
  rating_count?: number
  first_release_date?: number
  genres?: Array<{ id: number; name: string }>
  platforms?: Array<{ id: number; name: string }>
  cover?: {
    id: number
    url: string
    image_id: string
  }
}

// Cache for access token
let accessToken: string | null = null
let tokenExpiry: number = 0

async function getAccessToken(): Promise<string> {
  // Check if we have a valid token
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken
  }

  // Get new token
  try {
    const response = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: IGDB_CLIENT_ID!,
        client_secret: IGDB_CLIENT_SECRET!,
        grant_type: 'client_credentials',
      }),
    })

    if (!response.ok) {
      throw new Error(`OAuth error: ${response.status}`)
    }    const data = await response.json()
    accessToken = data.access_token
    tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000 // Subtract 1 minute for safety

    return accessToken!
  } catch (error) {
    console.error('Error getting IGDB access token:', error)
    throw error
  }
}

async function searchIGDBGames(query: string, limit: number = 10): Promise<IGDBGame[]> {
  const token = await getAccessToken()
  
  const body = `
    fields name, summary, rating, rating_count, first_release_date, 
           genres.name, platforms.name, cover.url, cover.image_id;
    search "${query}";
    limit ${limit};
    where version_parent = null & category = 0;
  `.trim()

  try {
    const response = await fetch(`${IGDB_BASE_URL}/games`, {
      method: 'POST',
      headers: {
        'Client-ID': IGDB_CLIENT_ID!,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'text/plain',
      },
      body: body
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`IGDB API error: ${response.status} - ${errorText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('IGDB search error:', error)
    throw error
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
    }

    if (!IGDB_CLIENT_ID || !IGDB_CLIENT_SECRET) {
      return NextResponse.json({ error: 'IGDB API credentials not configured' }, { status: 500 })
    }

    const games = await searchIGDBGames(query, limit)
    return NextResponse.json(games)
  } catch (error) {
    console.error('IGDB API route error:', error)
    return NextResponse.json(
      { error: 'Failed to search games' },
      { status: 500 }
    )
  }
}
