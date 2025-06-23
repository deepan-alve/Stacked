'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

// Import the existing landing page content from page.tsx
// We'll need to move all the components and logic here

export function LandingPage() {
  // All the existing landing page logic will go here
  // For now, let's create a simple placeholder
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-20">
        <div className="text-center">
          <h1 className="text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            Stacked
          </h1>
          <p className="text-xl text-white/80 mb-8">
            The ultimate media tracking experience
          </p>
          <div className="space-x-4">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-gradient-to-r from-primary to-accent">
                Get Started Free
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="border-white/20 text-white">
                Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
