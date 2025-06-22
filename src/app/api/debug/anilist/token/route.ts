import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()
    
    if (!code) {
      return NextResponse.json({ error: 'No code provided' }, { status: 400 })
    }
    
    const clientId = process.env.ANILIST_CLIENT_ID
    const clientSecret = process.env.ANILIST_CLIENT_SECRET
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/anilist/callback`
    
    console.log('Token exchange request:', {
      clientId: clientId ? `${clientId.substring(0, 5)}...` : 'NOT_SET',
      clientSecret: clientSecret ? `${clientSecret.substring(0, 10)}...` : 'NOT_SET',
      redirectUri,
      code: `${code.substring(0, 10)}...`
    })
    
    const response = await fetch('https://anilist.co/api/v2/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code,
      }),
    })

    const responseText = await response.text()
    console.log('AniList response status:', response.status)
    console.log('AniList response:', responseText)

    if (!response.ok) {
      return NextResponse.json({
        error: 'Token exchange failed',
        status: response.status,
        response: responseText,
        requestData: {
          grant_type: 'authorization_code',
          client_id: clientId,
          redirect_uri: redirectUri,
          code: `${code.substring(0, 10)}...`
        }
      }, { status: 400 })
    }

    const tokenData = JSON.parse(responseText)
    
    return NextResponse.json({
      success: true,
      access_token: tokenData.access_token ? `${tokenData.access_token.substring(0, 10)}...` : 'NOT_SET',
      token_type: tokenData.token_type,
      expires_in: tokenData.expires_in
    })
    
  } catch (error) {
    console.error('Token exchange error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
