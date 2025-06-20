import React from 'react'
import { motion } from 'framer-motion'
import { Film, Book, Gamepad2, Tv, Music, Podcast } from 'lucide-react'

interface FloatingMediaCardProps {
  type: 'movie' | 'book' | 'game' | 'tv' | 'music' | 'podcast'
  title: string
  subtitle?: string
  image?: string
  index: number
  onClick?: () => void
}

export const FloatingMediaCard: React.FC<FloatingMediaCardProps> = ({
  type,
  title,
  subtitle,
  index,
  onClick
}) => {
  const iconMap = {
    movie: Film,
    book: Book,
    game: Gamepad2,
    tv: Tv,
    music: Music,
    podcast: Podcast
  }

  const colorMap = {
    movie: '#FF6B6B',
    book: '#4ECDC4',
    game: '#45B7D1',
    tv: '#96CEB4',
    music: '#FFEAA7',
    podcast: '#DDA0DD'
  }

  const Icon = iconMap[type]
  const color = colorMap[type]
  // Orbital animation
  const orbitalAnimation = {
    rotate: 360,
    transition: {
      duration: 20 + index * 5,
      repeat: Infinity,
      ease: 'linear' as const
    }
  }

  // Card hover effects
  const cardHoverAnimation = {
    scale: 1.1,
    rotateY: 15,
    z: 50,
    boxShadow: `0 20px 40px ${color}40`,
    transition: {
      type: 'spring' as const,
      damping: 10,
      stiffness: 200
    }
  }

  // Positioning in orbit
  const radius = 200 + index * 30
  const angle = (index * 120) - 60 // 120 degrees apart
  const x = Math.cos((angle * Math.PI) / 180) * radius
  const y = Math.sin((angle * Math.PI) / 180) * radius

  return (    <motion.div
      className="absolute"
      style={{
        left: '50%',
        top: '50%'
      }}
      animate={orbitalAnimation}
    >
      <motion.div
        className="relative"
        style={{
          transform: `translate(${x}px, ${y}px)`
        }}
        whileHover={cardHoverAnimation}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
      >
        <motion.div
          className="glass-card w-24 h-32 flex flex-col items-center justify-center p-3 cursor-pointer group"
          style={{ borderColor: color }}
          whileHover={{
            background: `linear-gradient(135deg, ${color}20, ${color}10)`
          }}
        >
          {/* Icon */}
          <motion.div
            className="mb-2"
            whileHover={{
              rotate: 10,
              scale: 1.2
            }}
          >
            <Icon 
              size={24} 
              style={{ color }} 
              className="drop-shadow-lg"
            />
          </motion.div>

          {/* Title */}
          <div className="text-center">
            <div 
              className="text-xs font-medium text-white/90 truncate w-full"
              title={title}
            >
              {title}
            </div>
            {subtitle && (
              <div 
                className="text-xs text-white/60 truncate w-full"
                title={subtitle}
              >
                {subtitle}
              </div>
            )}
          </div>

          {/* Glow effect */}
          <motion.div
            className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              background: `radial-gradient(circle at center, ${color}30, transparent 70%)`
            }}
          />
        </motion.div>

        {/* Orbit trail */}
        <motion.div
          className="absolute inset-0 rounded-full border border-white/10"
          style={{
            width: radius * 2,
            height: radius * 2,
            left: -radius + 12,
            top: -radius + 16
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ delay: index * 0.5 }}
        />
      </motion.div>
    </motion.div>
  )
}

// Container for multiple floating cards
export const FloatingMediaPreview: React.FC = () => {
  const mediaItems = [
    { type: 'movie' as const, title: 'Dune', subtitle: '2021' },
    { type: 'book' as const, title: 'Atomic Habits', subtitle: 'James Clear' },
    { type: 'game' as const, title: 'Elden Ring', subtitle: 'FromSoftware' }
  ]

  return (
    <motion.div
      className="relative w-96 h-96 mx-auto"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1, duration: 1 }}
    >
      {mediaItems.map((item, index) => (
        <FloatingMediaCard
          key={index}
          {...item}
          index={index}
          onClick={() => console.log(`Navigate to ${item.type} section`)}
        />
      ))}
      
      {/* Central glow */}
      <motion.div
        className="absolute left-1/2 top-1/2 w-16 h-16 -translate-x-1/2 -translate-y-1/2"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      >
        <div className="w-full h-full rounded-full bg-gradient-to-r from-primary/30 to-accent/30 blur-xl" />
      </motion.div>
    </motion.div>
  )
}
