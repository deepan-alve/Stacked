'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useStore } from '@/store/media'
import { useAuth } from '@/components/providers/AuthProvider'
import { useTheme } from '@/components/providers/ThemeProvider'
import { useOnboarding } from '@/components/onboarding/OnboardingTour'
import { uploadAvatarAndUpdateProfile, updateProfile } from '@/lib/supabase/profile-update'
import { debugUserProfile } from '@/lib/supabase/profile-debug'
import { 
  User, 
  Camera, 
  Save, 
  Settings as SettingsIcon,
  Shield,
  Download,
  Moon,
  Sun,
  Monitor,
  Globe,
  Database,
  HelpCircle,
  Trash2,
  RefreshCw
} from 'lucide-react'

interface UserMetadata {
  full_name?: string
  bio?: string
  location?: string
  website?: string
  avatar_url?: string
  is_public?: boolean
}

interface ExtendedUser {
  id: string
  email: string
  created_at?: string
  user_metadata?: UserMetadata
}

interface UserProfile {
  id: string
  email: string
  displayName: string
  bio: string
  location: string
  website: string
  avatarUrl: string
  joinedAt: string
  isPublic: boolean
}

interface AppSettings {
  language: string
  accentColor: string
  notifications: {
    email: boolean
    push: boolean
    marketing: boolean
    recommendations: boolean
  }
  privacy: {
    profilePublic: boolean
    showActivity: boolean
    showStats: boolean
  }
  defaultView: 'grid' | 'list'
  autoSync: boolean
}

const themes = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

const languages = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'ja', label: '日本語' },
]

export default function SettingsPage() {
  const { user } = useAuth()
  const { setUser } = useStore()
  const { theme, setTheme } = useTheme()
  const { resetOnboarding } = useOnboarding()
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'privacy' | 'data'>('profile')
  const [profile, setProfile] = useState<UserProfile>({
    id: user?.id || '',
    email: user?.email || '',
    displayName: user?.profile?.display_name || user?.email?.split('@')[0] || '',
    bio: user?.profile?.bio || '',
    location: (user as ExtendedUser)?.user_metadata?.location || '',
    website: (user as ExtendedUser)?.user_metadata?.website || '',
    avatarUrl: user?.profile?.avatar_url || '',
    joinedAt: (user as ExtendedUser)?.created_at || new Date().toISOString(),
    isPublic: (user as ExtendedUser)?.user_metadata?.is_public ?? true,
  })

  const [settings, setSettings] = useState<AppSettings>({
    language: 'en',
    accentColor: 'blue',
    notifications: {
      email: true,
      push: true,
      marketing: false,
      recommendations: true,
    },
    privacy: {
      profilePublic: true,
      showActivity: true,
      showStats: true,
    },
    defaultView: 'grid',
    autoSync: true,
  })

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('stacked-settings')
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings))
      } catch (error) {
        console.error('Failed to parse saved settings:', error)
      }
    }
  }, [])

  // Save settings to localStorage
  const saveSettings = () => {
    localStorage.setItem('stacked-settings', JSON.stringify(settings))
  }
  const handleSettingsUpdate = () => {
    saveSettings()
    alert('Settings saved successfully!')
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && user) {
      setIsSaving(true)
      try {
        console.log('Starting avatar upload and profile update...')
        
        const result = await uploadAvatarAndUpdateProfile(file, user.id, {
          display_name: profile.displayName,
          bio: profile.bio
        })
        
        if (result.success && result.avatarUrl && result.profile) {
          console.log('Avatar upload and profile update successful, URL:', result.avatarUrl)
          
          // Update local state immediately
          setProfile(prev => ({ ...prev, avatarUrl: result.avatarUrl! }))
          
          // Update the user in the store
          setUser({
            ...user,
            profile: result.profile
          })
          
          alert('✅ Avatar uploaded successfully!')
        } else {
          alert(`❌ Upload failed: ${result.error}`)
        }
      } catch (error) {
        console.error('Avatar upload error:', error)
        alert(`❌ Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      } finally {
        setIsSaving(false)
        // Reset the input
        if (event.target) {
          event.target.value = ''
        }
      }
    }
  }

  const exportData = () => {
    const data = {
      profile,
      settings,
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `stacked-data-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const clearCache = () => {
    localStorage.removeItem('stacked-settings')
    localStorage.removeItem('search-history')
    localStorage.removeItem('saved-searches')
    alert('Cache cleared successfully!')
  }
  const handleProfileSave = async () => {
    if (!user) return
    
    setIsSaving(true)
    try {
      console.log('Saving profile changes...')
      
      const result = await updateProfile(user.id, {
        display_name: profile.displayName,
        bio: profile.bio,
        username: profile.displayName?.toLowerCase().replace(/\s+/g, '_')
      })
      
      if (result.success && result.profile) {
        console.log('Profile saved successfully')
        
        // Update the user in the store
        setUser({
          ...user,
          profile: result.profile
        })
        
        alert('✅ Profile updated successfully!')
      } else {
        alert(`❌ Failed to save profile: ${result.error}`)
      }
    } catch (error) {
      console.error('Profile save error:', error)
      alert(`❌ Failed to save profile: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDebugProfile = async () => {
    if (!user) return
    
    console.log('🔍 Starting profile debug...')
    const result = await debugUserProfile(user.id)
    
    if (result.success) {
      alert('✅ Profile debug completed. Check the browser console for details.')
    } else {
      alert(`❌ Profile debug failed: ${result.error}`)
    }
  }

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'preferences' as const, label: 'Preferences', icon: SettingsIcon },
    { id: 'privacy' as const, label: 'Privacy', icon: Shield },
    { id: 'data' as const, label: 'Data', icon: Database },
  ]

  // Update local profile state when user data changes
  useEffect(() => {
    if (user) {
      setProfile({
        id: user.id,
        email: user.email || '',
        displayName: user.profile?.display_name || user.email?.split('@')[0] || '',
        bio: user.profile?.bio || '',
        location: '', // We can add this to profiles table later if needed
        website: '', // We can add this to profiles table later if needed
        avatarUrl: user.profile?.avatar_url || '',
        joinedAt: user.profile?.created_at || new Date().toISOString(),
        isPublic: true, // We can add this to profiles table later if needed
      })
    }
  }, [user])

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="glass-card max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <SettingsIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Sign in to access settings</h3>
            <p className="text-muted-foreground mb-4">
              You need to be signed in to view and modify your settings.
            </p>
            <Button asChild>
              <a href="/auth/login">Sign In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account, preferences, and privacy settings
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-8 p-1 bg-muted rounded-lg w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === tab.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="grid gap-6 max-w-2xl">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your profile details and avatar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Upload */}
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profile.avatarUrl} alt={profile.displayName} />
                    <AvatarFallback className="text-lg">
                      {profile.displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <label htmlFor="avatar-upload" className="absolute -bottom-2 -right-2 bg-primary rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors">
                    {isSaving ? (
                      <RefreshCw className="h-4 w-4 text-primary-foreground animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4 text-primary-foreground" />
                    )}
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      disabled={isSaving}
                    />
                  </label>
                  {profile.avatarUrl && (
                    <button
                      onClick={() => setProfile(prev => ({ ...prev, avatarUrl: '' }))}
                      className="absolute -top-2 -left-2 bg-destructive rounded-full p-1.5 cursor-pointer hover:bg-destructive/90 transition-colors"
                      title="Remove avatar"
                    >
                      <Trash2 className="h-3 w-3 text-destructive-foreground" />
                    </button>
                  )}
                </div>
                <div>
                  <h3 className="font-medium">Profile Picture</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {isSaving ? 'Uploading...' : 'Click the camera icon to upload a new avatar'}
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Supports PNG, JPEG, GIF, WebP (max 5MB)
                  </p>
                  <Badge variant="secondary" className="mt-2">
                    <Globe className="h-3 w-3 mr-1" />
                    {profile.isPublic ? 'Public Profile' : 'Private Profile'}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Profile Fields */}
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={profile.displayName}
                    onChange={(e) => setProfile(prev => ({ ...prev, displayName: e.target.value }))}
                    placeholder="Your display name"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={profile.email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed here. Contact support if needed.
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={profile.bio}
                    onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell others about yourself..."
                    rows={3}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={profile.location}
                    onChange={(e) => setProfile(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Your location"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={profile.website}
                    onChange={(e) => setProfile(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://your-website.com"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="publicProfile">Public Profile</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow others to see your profile and activity
                    </p>
                  </div>
                  <Switch
                    id="publicProfile"
                    checked={profile.isPublic}
                    onCheckedChange={(checked) => setProfile(prev => ({ ...prev, isPublic: checked }))}
                  />
                </div>
              </div>              <Button onClick={handleProfileSave} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Save Profile
              </Button>
              
              <Button onClick={handleDebugProfile} variant="outline" className="w-full">
                <HelpCircle className="h-4 w-4 mr-2" />
                Debug Profile & Avatar
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div className="grid gap-6 max-w-2xl">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>App Preferences</CardTitle>
              <CardDescription>
                Customize how the app looks and behaves
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Theme Selection */}
              <div className="space-y-3">
                <Label>Theme</Label>
                <div className="grid grid-cols-3 gap-3">
                  {themes.map((themeOption) => (
                    <button
                      key={themeOption.value}
                      onClick={() => setTheme(themeOption.value as 'light' | 'dark' | 'system')}
                      className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${
                        theme === themeOption.value
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:bg-muted'
                      }`}
                    >
                      <themeOption.icon className="h-4 w-4" />
                      {themeOption.label}
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Accent Color */}
              <div className="space-y-3">
                <Label>Accent Color</Label>
                <p className="text-sm text-muted-foreground">
                  Choose your preferred accent color
                </p>
                <div className="grid grid-cols-8 gap-3">
                  {[
                    { name: 'Blue', value: 'blue', color: 'bg-blue-500' },
                    { name: 'Green', value: 'green', color: 'bg-green-500' },
                    { name: 'Purple', value: 'purple', color: 'bg-purple-500' },
                    { name: 'Pink', value: 'pink', color: 'bg-pink-500' },
                    { name: 'Orange', value: 'orange', color: 'bg-orange-500' },
                    { name: 'Red', value: 'red', color: 'bg-red-500' },
                    { name: 'Yellow', value: 'yellow', color: 'bg-yellow-500' },
                    { name: 'Indigo', value: 'indigo', color: 'bg-indigo-500' },
                  ].map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setSettings(prev => ({ ...prev, accentColor: color.value }))}
                      className={`w-10 h-10 rounded-lg ${color.color} border-2 transition-colors ${
                        settings.accentColor === color.value
                          ? 'border-foreground scale-110'
                          : 'border-transparent hover:border-muted-foreground'
                      }`}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              <Separator />

              {/* Language */}
              <div className="space-y-2">
                <Label>Language</Label>
                <Select value={settings.language} onValueChange={(value) => setSettings(prev => ({ ...prev, language: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Default View */}
              <div className="flex items-center justify-between">
                <div>
                  <Label>Default Library View</Label>
                  <p className="text-sm text-muted-foreground">
                    Choose how your library is displayed by default
                  </p>
                </div>
                <Select value={settings.defaultView} onValueChange={(value: 'grid' | 'list') => setSettings(prev => ({ ...prev, defaultView: value }))}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grid">Grid</SelectItem>
                    <SelectItem value="list">List</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Auto Sync */}
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto Sync</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically sync your data across devices
                  </p>
                </div>
                <Switch
                  checked={settings.autoSync}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoSync: checked }))}
                />
              </div>

              <Button onClick={handleSettingsUpdate} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Privacy Tab */}
      {activeTab === 'privacy' && (
        <div className="grid gap-6 max-w-2xl">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Choose what notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive updates via email
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.email}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, email: checked }
                  }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified on your device
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.push}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, push: checked }
                  }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Recommendations</Label>
                  <p className="text-sm text-muted-foreground">
                    Get personalized media recommendations
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.recommendations}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, recommendations: checked }
                  }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Marketing Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive news and feature updates
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.marketing}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, marketing: checked }
                  }))}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>
                Control what information is visible to others
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Activity</Label>
                  <p className="text-sm text-muted-foreground">
                    Let others see what you&apos;re watching/reading
                  </p>
                </div>
                <Switch
                  checked={settings.privacy.showActivity}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    privacy: { ...prev.privacy, showActivity: checked }
                  }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Statistics</Label>
                  <p className="text-sm text-muted-foreground">
                    Display your stats on your public profile
                  </p>
                </div>
                <Switch
                  checked={settings.privacy.showStats}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    privacy: { ...prev.privacy, showStats: checked }
                  }))}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Data Tab */}
      {activeTab === 'data' && (
        <div className="grid gap-6 max-w-2xl">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>
                Export, import, and manage your data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Export Data</h4>
                  <p className="text-sm text-muted-foreground">
                    Download all your data in JSON format
                  </p>
                </div>
                <Button onClick={exportData} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Clear Cache</h4>
                  <p className="text-sm text-muted-foreground">
                    Clear stored settings and search history
                  </p>
                </div>
                <Button onClick={clearCache} variant="outline">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Reset Onboarding</h4>
                  <p className="text-sm text-muted-foreground">
                    Show the welcome tour again
                  </p>
                </div>
                <Button onClick={resetOnboarding} variant="outline">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Reset Tour
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
