import { NextResponse } from 'next/server'

export async function GET() {
  const clientId = process.env.ANILIST_CLIENT_ID
  const clientSecret = process.env.ANILIST_CLIENT_SECRET
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  
  // Test if we can make a simple request to AniList
  try {
    const testResponse = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: `query { Media(id: 1) { id title { romaji } } }`
      }),
    })
    
    const testData = await testResponse.json()
    
    return NextResponse.json({
      status: 'debug',
      clientId: clientId ? `${clientId.substring(0, 5)}...` : 'NOT_SET',
      clientSecret: clientSecret ? `${clientSecret.substring(0, 10)}...` : 'NOT_SET',
      appUrl,
      redirectUri: `${appUrl}/api/auth/anilist/callback`,
      authUrl: `https://anilist.co/api/v2/oauth/authorize?client_id=${clientId}&redirect_uri=${appUrl}/api/auth/anilist/callback&response_type=code`,
      anilistApiTest: testResponse.ok ? 'SUCCESS' : 'FAILED',
      testData: testData
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      clientId: clientId ? `${clientId.substring(0, 5)}...` : 'NOT_SET',
      clientSecret: clientSecret ? `${clientSecret.substring(0, 10)}...` : 'NOT_SET',
      appUrl,
      redirectUri: `${appUrl}/api/auth/anilist/callback`,
    })
  }
}
