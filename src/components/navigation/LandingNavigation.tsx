'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'

export function LandingNavigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [isHovering, setIsHovering] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Update scrolled state for background effect
      setScrolled(currentScrollY > 50)
      
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

  const handleNavigation = (href: string) => {
    if (isOpen) {
      setIsOpen(false)
      // Small delay to allow menu animation to complete
      setTimeout(() => {
        router.push(href)
      }, 150)
    } else {
      router.push(href)
    }
  }

  const navItems = [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'About', href: '#about' },
    { label: 'Contact', href: '#contact' },
  ]
  return (
    <>
      {/* Hover trigger zone - invisible area at top of screen */}
      <div 
        className="fixed top-0 left-0 right-0 h-16 z-40 pointer-events-none"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        style={{ pointerEvents: isVisible ? 'none' : 'auto' }}
      />
      
      {/* Desktop Navigation */}      <motion.nav 
        className={`fixed left-0 right-0 z-50 transition-all duration-300 ${
          scrolled 
            ? 'bg-black/80 backdrop-blur-xl border-b border-white/10' 
            : 'bg-transparent'
        }`}
        initial={{ y: -100 }}
        animate={{ 
          y: isVisible || isHovering ? 0 : -100,
          top: 0
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", damping: 15 }}
            >
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <span className="text-sm font-bold text-white">S</span>
                </div>                <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-primary to-accent">
                  Stacked
                </span>
              </Link>
            </motion.div>

            {/* Desktop Navigation Items */}
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item, index) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >                  <Link
                    href={item.href}
                    className="text-white/80 hover:text-white transition-colors relative group"
                  >
                    {item.label}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-accent transition-all duration-300 group-hover:w-full"></span>
                  </Link>
                </motion.div>
              ))}
            </div>            {/* Desktop Action Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >                <Button 
                  variant="ghost" 
                  className="text-white/80 hover:text-white hover:bg-white/10"
                  onClick={() => handleNavigation('/auth/login')}
                >
                  Login
                </Button>
              </motion.div>                <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  className="bg-gradient-to-r from-primary to-accent hover:from-accent hover:to-primary transition-all duration-300 shadow-lg hover:shadow-primary/25"
                  onClick={() => handleNavigation('/auth/signup')}
                >
                  Sign Up Free
                </Button>
              </motion.div>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(!isOpen)}
                className="text-white hover:bg-white/10"
              >
                {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden mt-4 pb-4 border-t border-white/10"
            >
              <div className="space-y-4 pt-4">
                {navItems.map((item, index) => (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >                    <Link
                      href={item.href}
                      className="block text-white/80 hover:text-white transition-colors py-2"
                      onClick={() => setIsOpen(false)}
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                ))}                  {/* Mobile Action Buttons */}                <div className="space-y-3 pt-4 border-t border-white/10">
                  <Button 
                    variant="outline" 
                    className="w-full border-white/20 text-white hover:bg-white/10"
                    onClick={() => handleNavigation('/auth/login')}
                  >
                    Login
                  </Button>
                  <Button 
                    className="w-full bg-gradient-to-r from-primary to-accent"
                    onClick={() => handleNavigation('/auth/signup')}
                  >
                    Sign Up Free
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.nav>
    </>
  )
}
