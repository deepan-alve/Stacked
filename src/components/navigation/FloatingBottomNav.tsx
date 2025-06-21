'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Home, Library, Plus, FolderOpen, User } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function FloatingBottomNav() {
  const pathname = usePathname()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const navItems = [
    { 
      icon: Home, 
      label: 'Home', 
      href: '/',
      isActive: pathname === '/'
    },
    { 
      icon: Library, 
      label: 'Library', 
      href: '/library',
      isActive: pathname === '/library'
    },
    { 
      icon: Plus, 
      label: 'Add', 
      href: '#',
      isAdd: true,
      isActive: false
    },
    { 
      icon: FolderOpen, 
      label: 'Collections', 
      href: '/collections',
      isActive: pathname === '/collections'
    },
    { 
      icon: User, 
      label: 'Profile', 
      href: '/profile',
      isActive: pathname === '/profile'
    },
  ]

  const handleAddClick = () => {
    // TODO: Open floating add modal
    setIsAddModalOpen(true)
    console.log('Add button clicked - will open floating modal')
  }

  return (
    <>
      {/* Floating Bottom Navigation */}
      <motion.div
        className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
      >
        {/* Glassmorphism Container */}
        <div className="relative">
          {/* Background Glow */}
          <div className="absolute -inset-2 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full blur-lg opacity-60"></div>
          
          {/* Main Navigation Container */}
          <div className="relative bg-card/80 backdrop-blur-xl border border-border/50 rounded-full px-2 py-2 shadow-2xl">
            <div className="flex items-center space-x-2">
              {navItems.map((item, index) => {
                if (item.isAdd) {
                  return (
                    <motion.div
                      key="add"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Button
                        onClick={handleAddClick}
                        className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-accent hover:from-accent hover:to-primary shadow-lg hover:shadow-primary/25 transition-all duration-300"
                      >
                        <Plus className="h-5 w-5 text-white" />
                      </Button>
                    </motion.div>
                  )
                }

                return (
                  <motion.div
                    key={item.href}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <Link href={item.href}>
                      <div className={`
                        relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
                        ${item.isActive 
                          ? 'bg-primary/20 text-primary' 
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        }
                      `}>
                        {/* Active indicator */}
                        {item.isActive && (
                          <motion.div
                            className="absolute inset-0 bg-primary/10 rounded-full border-2 border-primary/30"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", damping: 15 }}
                          />
                        )}
                        
                        <item.icon className={`h-5 w-5 relative z-10 ${
                          item.isActive ? 'text-primary' : ''
                        }`} />
                        
                        {/* Tooltip */}
                        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap border border-border/50">
                          {item.label}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* Floating particles effect */}
          {Array.from({ length: 6 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-primary/40 rounded-full"
              style={{
                left: `${20 + i * 15}%`,
                top: `${20 + (i % 3) * 20}%`,
              }}
              animate={{
                y: [-10, -20, -10],
                opacity: [0.4, 0.8, 0.4],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 2 + i * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.3,
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* Temporary Add Modal Placeholder */}
      {isAddModalOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setIsAddModalOpen(false)}
        >
          <motion.div
            className="bg-card border border-border rounded-lg p-6 max-w-md mx-4"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">Add New Media</h3>
            <p className="text-muted-foreground mb-4">
              Floating add modal will be implemented here. This is just a placeholder.
            </p>
            <Button onClick={() => setIsAddModalOpen(false)} className="w-full">
              Close
            </Button>
          </motion.div>
        </motion.div>
      )}
    </>
  )
}
