'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { motion } from 'framer-motion'
import { Search, Settings, User, LogOut, BarChart3 } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { signOut } from '@/lib/api/auth'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar } from '@/components/ui/avatar'

export function AppTopNavigation() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [isHovering, setIsHovering] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Auto-hide/show logic
      if (currentScrollY < 100) {
        // Always show at top of page
        setIsVisible(true)
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down - hide nav
        setIsVisible(false)
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up - show nav
        setIsVisible(true)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  const handleSignOut = async () => {
    await signOut()
  }
  return (
    <>
      {/* Hover trigger zone */}
      <div 
        className="fixed top-0 left-0 right-0 h-16 z-40 pointer-events-none"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        style={{ pointerEvents: isVisible ? 'none' : 'auto' }}
      />
      
      <motion.nav 
        className="fixed left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50"
        initial={{ y: -100 }}
        animate={{ 
          y: isVisible || isHovering ? 0 : -100,
          top: 0
        }}        transition={{ duration: 0.3, ease: "easeInOut" }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", damping: 15 }}
            className="flex-shrink-0"
          >
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-sm font-bold text-white">S</span>
              </div>
              <span className="text-xl font-bold gradient-text hidden sm:inline">
                Stacked
              </span>
            </Link>
          </motion.div>

          {/* Global Search Bar */}
          <motion.div 
            className="flex-1 max-w-2xl mx-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search movies, TV shows, books, games..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 h-10 bg-card/50 border-border/50 focus:border-primary/50 focus:bg-card transition-all duration-200"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
                >
                  ×
                </Button>
              )}
            </div>
          </motion.div>          {/* Right Actions */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            
            {/* Settings Button */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Link href="/settings">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="w-9 h-9 p-0 hover:bg-card"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
            </motion.div>            {/* User Avatar & Dropdown */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="w-9 h-9 p-0 rounded-full hover:bg-card"
                  >
                    <Avatar className="w-8 h-8">
                      <div className="w-full h-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">
                      {user?.email || 'User'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user?.email || 'user@example.com'}
                    </p>
                  </div>
                  <DropdownMenuSeparator />                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="w-full">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/analytics" className="w-full">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Analytics
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="w-full">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleSignOut}
                    className="text-red-600 focus:text-red-600 cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>              </DropdownMenu>
            </motion.div>
          </div>
        </div>
        </div>
      </motion.nav>
    </>
  )
}
