'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/client'
import { anilistClient } from '@/lib/api/anilist'
import { useAuth } from '@/components/providers/AuthProvider'
import { Loader2, ExternalLink, Crown, Zap, TrendingUp, Users } from 'lucide-react'

interface Profile {
  id: string
  anilist_user_id?: number
  anilist_username?: string
  anilist_avatar_url?: string
  anilist_connected_at?: string
  power_user_features_enabled?: boolean
}

export function AniListConnection() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return
      
      try {
        const supabase = createClient()
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (error) {
          console.error('Error loading profile:', error)
        } else {
          setProfile(data)
        }
      } catch (error) {
        console.error('Error loading profile:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [user])

  const loadProfile = async () => {
    if (!user) return
    
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (error) {
        console.error('Error loading profile:', error)
      } else {
        setProfile(data)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  const connectAniList = async () => {
    setConnecting(true)
    try {
      const authUrl = anilistClient.getAuthUrl()
      window.location.href = authUrl
    } catch (error) {
      console.error('Error connecting to AniList:', error)
      setConnecting(false)
    }
  }

  const disconnectAniList = async () => {
    if (!user) return
    
    setDisconnecting(true)
    try {
      const supabase = createClient()
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          anilist_user_id: null,
          anilist_username: null,
          anilist_avatar_url: null,
          anilist_access_token: null,
          anilist_connected_at: null,
          power_user_features_enabled: false
        })
        .eq('id', user.id)
      
      if (updateError) {
        console.error('Error updating profile:', updateError)
        return
      }
      
      // Clear cached data
      const { error: cacheError } = await supabase
        .from('anilist_cache')
        .delete()
        .eq('user_id', user.id)
      
      if (cacheError) {
        console.error('Error clearing cache:', cacheError)
      }
      
      await loadProfile()
    } catch (error) {
      console.error('Error disconnecting AniList:', error)
    } finally {
      setDisconnecting(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  const isConnected = !!profile?.anilist_user_id
  const isPowerUser = profile?.power_user_features_enabled

  return (
    <div className="space-y-6">
      {/* Main Connection Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <ExternalLink className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  AniList Integration
                  {isPowerUser && (
                    <Badge variant="secondary" className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30">
                      <Crown className="h-3 w-3 mr-1" />
                      Power User
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {isConnected 
                    ? "Connected to AniList for enhanced features"
                    : "Connect your AniList account to unlock power user features"
                  }
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isConnected ? (
            <div className="space-y-4">
              {/* Connected User Info */}
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">                <Avatar className="h-10 w-10">
                  {profile?.anilist_avatar_url && (
                    <Image 
                      src={profile.anilist_avatar_url} 
                      alt={profile.anilist_username || 'User'} 
                      width={40}
                      height={40}
                      className="h-full w-full object-cover rounded-full"
                    />
                  )}
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{profile?.anilist_username}</p>
                  <p className="text-sm text-muted-foreground">
                    Connected {profile?.anilist_connected_at && new Date(profile.anilist_connected_at).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Connected
                </Badge>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={disconnectAniList}
                  disabled={disconnecting}
                  className="flex-1"
                >
                  {disconnecting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Disconnecting...
                    </>
                  ) : (
                    'Disconnect'
                  )}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.open(`https://anilist.co/user/${profile?.anilist_username}`, '_blank')}
                  className="flex-1"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Profile
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Button 
                onClick={connectAniList} 
                disabled={connecting}
                className="w-full"
              >
                {connecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting to AniList...
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Connect AniList Account
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Power User Features Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-purple-500" />
            Power User Features
          </CardTitle>
          <CardDescription>
            {isConnected 
              ? "You have access to all advanced features!" 
              : "Unlock advanced analytics and features by connecting your AniList account"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-3">
              <div className={`flex items-center gap-3 p-3 rounded-lg border ${isConnected ? 'bg-green-50/50 border-green-200' : 'bg-muted/50'}`}>
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${isConnected ? 'bg-green-100' : 'bg-muted'}`}>
                  <TrendingUp className={`h-4 w-4 ${isConnected ? 'text-green-600' : 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Advanced Analytics</p>
                  <p className="text-sm text-muted-foreground">
                    Detailed viewing patterns, genre preferences, and trends
                  </p>
                </div>
                <Badge variant={isConnected ? "default" : "secondary"}>
                  {isConnected ? "Enabled" : "Locked"}
                </Badge>
              </div>

              <div className={`flex items-center gap-3 p-3 rounded-lg border ${isConnected ? 'bg-green-50/50 border-green-200' : 'bg-muted/50'}`}>
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${isConnected ? 'bg-green-100' : 'bg-muted'}`}>
                  <Zap className={`h-4 w-4 ${isConnected ? 'text-green-600' : 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Smart Recommendations</p>
                  <p className="text-sm text-muted-foreground">
                    AI-powered suggestions based on your AniList history
                  </p>
                </div>
                <Badge variant={isConnected ? "default" : "secondary"}>
                  {isConnected ? "Enabled" : "Locked"}
                </Badge>
              </div>

              <div className={`flex items-center gap-3 p-3 rounded-lg border ${isConnected ? 'bg-green-50/50 border-green-200' : 'bg-muted/50'}`}>
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${isConnected ? 'bg-green-100' : 'bg-muted'}`}>
                  <Users className={`h-4 w-4 ${isConnected ? 'text-green-600' : 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Social Features</p>
                  <p className="text-sm text-muted-foreground">
                    Compare with friends and join community challenges
                  </p>
                </div>
                <Badge variant={isConnected ? "default" : "secondary"}>
                  {isConnected ? "Enabled" : "Locked"}
                </Badge>
              </div>
            </div>

            {!isConnected && (
              <>
                <Separator />
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-3">
                    Connect your AniList account to unlock all features above
                  </p>
                  <Button onClick={connectAniList} disabled={connecting}>
                    <Crown className="h-4 w-4 mr-2" />
                    Become a Power User
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
