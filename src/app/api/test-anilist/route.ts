import { NextResponse } from 'next/server'
import { anilistClient } from '@/lib/api/anilist'

export async function GET() {
  try {
    const authUrl = anilistClient.getAuthUrl()
    
    return NextResponse.json({
      success: true,
      authUrl,
      clientId: process.env.ANILIST_CLIENT_ID,
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/anilist/callback`,
      hasClientSecret: !!process.env.ANILIST_CLIENT_SECRET
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
