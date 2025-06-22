'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/providers/AuthProvider'
import { signOut } from '@/lib/api/auth'
import { 
  Home, 
  Library, 
  Plus, 
  FolderOpen, 
  User, 
  Search, 
  Menu,
  X,
  LogOut,
  LogIn,
  Settings,
  BarChart3
} from 'lucide-react'

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const { user } = useAuth()

  // Fix hydration mismatch
  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleSignOut = async () => {
    await signOut()
  }
  const navItems = [
    { icon: Home, label: 'Home', href: '/' },
    { icon: Search, label: 'Search', href: '/search' },
    { icon: Library, label: 'Library', href: '/library' },
    { icon: FolderOpen, label: 'Collections', href: '/collections' },
    { icon: BarChart3, label: 'Analytics', href: '/analytics' },
    { icon: User, label: 'Profile', href: '/profile' },
    { icon: Settings, label: 'Settings', href: '/settings' },
  ]

  return (
    <>      {/* Desktop Navigation */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-xl border-b border-white/5">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-sm font-bold text-white">S</span>
              </div>
              <span className="text-xl font-bold gradient-text">Stacked</span>
            </Link>

            {/* Navigation Items */}
            <div className="flex items-center space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>            {/* Actions */}
            <div className="flex items-center space-x-4">
              
              {isClient && user ? (
                <>
                  <Link href="/add">
                    <Button size="sm" className="glow-primary">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Media
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </>
              ) : isClient ? (
                <Link href="/auth/login">
                  <Button size="sm" className="glow-primary">
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </Button>
                </Link>
              ) : (
                <div className="w-20 h-8 bg-muted animate-pulse rounded" />
              )}
            </div>
          </div>
        </div>
      </nav>      {/* Mobile Navigation */}
      <nav className="md:hidden fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-xl border-b border-white/5">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-sm font-bold text-white">S</span>
              </div>
              <span className="text-lg font-bold gradient-text">Stacked</span>
            </Link>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

          {/* Mobile Menu */}
          {isOpen && (
            <div className="mt-4 pb-4 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card/50 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              ))}              <div className="flex space-x-2 px-3 pt-2">
                  {user ? (
                  <>
                    <Link href="/add">
                      <Button size="sm" className="flex-1">
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSignOut}
                      className="flex-1"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </>
                ) : isClient ? (
                  <Link href="/auth/login">
                    <Button size="sm" className="flex-1">
                      <LogIn className="h-4 w-4 mr-2" />
                      Sign In
                    </Button>
                  </Link>
                ) : (
                  <div className="flex-1 h-8 bg-muted animate-pulse rounded" />
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Bottom Navigation (Mobile) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-border/50">
        <div className="grid grid-cols-5 py-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center py-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          ))}          {isClient && user ? (
            <Link href="/add">
              <Button
                size="sm"
                className="mx-2 my-1 h-10 rounded-full bg-gradient-to-r from-primary to-accent"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </Link>
          ) : isClient ? (
            <Link href="/auth/login">
              <Button
                size="sm"
                className="mx-2 my-1 h-10 rounded-full bg-gradient-to-r from-primary to-accent"
              >
                <LogIn className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <div className="mx-2 my-1 h-10 w-10 bg-muted animate-pulse rounded-full" />
          )}
        </div>      </div>
    </>
  )
}
