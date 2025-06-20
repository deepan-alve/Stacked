import React, { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

interface MorphingBlobProps {
  className?: string
  colors?: string[]
  size?: 'small' | 'medium' | 'large'
  speed?: 'slow' | 'normal' | 'fast'
}

export const MorphingBlob: React.FC<MorphingBlobProps> = ({
  className = '',
  colors = ['#00C2FF', '#FF00C7'],
  size = 'medium',
  speed = 'normal'
}) => {
  const sizeMap = {
    small: 200,
    medium: 400,
    large: 600
  }
  
  const speedMap = {
    slow: 12,
    normal: 8,
    fast: 4
  }

  const dimensions = sizeMap[size]
  const duration = speedMap[speed]

  // Multiple blob paths for morphing animation
  const blobPaths = [
    "M60,20 Q80,10 100,30 Q90,50 70,60 Q50,50 40,30 Q50,10 60,20",
    "M50,15 Q85,5 95,35 Q85,55 65,65 Q45,55 35,35 Q45,5 50,15", 
    "M65,25 Q75,15 90,25 Q95,45 75,55 Q55,45 45,25 Q55,15 65,25",
    "M55,10 Q90,15 90,40 Q80,60 60,65 Q40,60 30,40 Q30,15 55,10",
    "M70,20 Q85,25 80,45 Q75,65 55,60 Q35,55 40,35 Q45,15 70,20"
  ]

  return (
    <div className={`absolute pointer-events-none ${className}`}>
      <svg
        width={dimensions}
        height={dimensions}
        viewBox="0 0 100 80"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id={`blobGradient-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors[0]} stopOpacity="0.6" />
            <stop offset="50%" stopColor={colors[1]} stopOpacity="0.4" />
            <stop offset="100%" stopColor={colors[0]} stopOpacity="0.3" />
          </linearGradient>
          <filter id={`blur-${size}`}>
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
          </filter>
        </defs>
        
        <motion.path
          d={blobPaths[0]}
          fill={`url(#blobGradient-${size})`}
          filter={`url(#blur-${size})`}
          animate={{
            d: blobPaths
          }}
          transition={{
            duration: duration,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </svg>
    </div>
  )
}

// Interactive blob that follows mouse
export const InteractiveBlob: React.FC<{ className?: string }> = ({ className = '' }) => {
  const blobRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (blobRef.current) {
        const x = e.clientX
        const y = e.clientY
        
        // Smooth following with delay
        blobRef.current.style.transform = `translate(${x - 100}px, ${y - 100}px)`
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <motion.div
      ref={blobRef}
      className={`fixed pointer-events-none z-10 transition-transform duration-1000 ease-out ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1 }}
    >
      <div className="w-48 h-48 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 blur-xl" />
    </motion.div>
  )
}
