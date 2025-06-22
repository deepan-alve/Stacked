'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, ExternalLink, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

interface TestResults {
  success: boolean
  authUrl?: string
  clientId?: string
  redirectUri?: string
  hasClientSecret?: boolean
  error?: string
}

export function AniListDebugConnection() {
  const [testing, setTesting] = useState(false)
  const [testResults, setTestResults] = useState<TestResults | null>(null)

  const runTests = async () => {
    setTesting(true)
    try {
      // Test environment variables and auth URL generation
      const response = await fetch('/api/test-anilist')
      const data = await response.json()
      setTestResults(data)
    } catch (error) {
      setTestResults({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setTesting(false)
    }
  }

  const connectToAniList = () => {
    if (testResults?.authUrl) {
      window.location.href = testResults.authUrl
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ExternalLink className="h-5 w-5" />
          AniList Connection Debug
        </CardTitle>
        <CardDescription>
          Debug AniList OAuth configuration and test connection
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={runTests} 
            disabled={testing}
            variant="outline"
          >
            {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Test Configuration
          </Button>
          
          {testResults?.authUrl && (
            <Button 
              onClick={connectToAniList}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Connect to AniList
            </Button>
          )}
        </div>

        {testResults && (
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              {testResults.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span className="font-medium">
                {testResults.success ? 'Configuration Valid' : 'Configuration Error'}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Client ID:</span>
                <Badge variant={testResults.clientId ? "default" : "destructive"}>
                  {testResults.clientId || 'Missing'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Client Secret:</span>
                <Badge variant={testResults.hasClientSecret ? "default" : "destructive"}>
                  {testResults.hasClientSecret ? 'Set' : 'Missing'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Redirect URI:</span>
                <Badge variant={testResults.redirectUri ? "default" : "destructive"}>
                  {testResults.redirectUri || 'Missing'}
                </Badge>
              </div>

              {testResults.authUrl && (
                <div className="mt-3">
                  <span className="font-medium">Generated Auth URL:</span>
                  <div className="mt-1 p-2 bg-background rounded border text-xs break-all">
                    {testResults.authUrl}
                  </div>
                </div>
              )}

              {testResults.error && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">Error:</span>
                  </div>
                  <div className="mt-1 text-red-600 dark:text-red-300 text-sm">
                    {testResults.error}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Requirements:</strong></p>
          <p>• AniList app redirect URI must be: <code>http://localhost:3000/api/auth/anilist/callback</code></p>
          <p>• Client ID and Secret must be set in .env.local</p>
          <p>• Make sure there are no trailing slashes in the redirect URI</p>
        </div>
      </CardContent>
    </Card>
  )
}
