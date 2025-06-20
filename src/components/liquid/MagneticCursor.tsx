import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

interface MagneticCursorProps {
  children: React.ReactNode
  className?: string
}

export const MagneticCursor: React.FC<MagneticCursorProps> = ({ children, className = '' }) => {
  const ref = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect()
      const x = e.clientX - rect.left - rect.width / 2
      const y = e.clientY - rect.top - rect.height / 2
      
      // Magnetic effect - elements attract cursor within radius
      const distance = Math.sqrt(x * x + y * y)
      const maxDistance = 100 // Magnetic field radius
      
      if (distance < maxDistance) {
        const force = 1 - distance / maxDistance
        const magneticX = x * force * 0.2
        const magneticY = y * force * 0.2
        
        element.style.transform = `translate(${magneticX}px, ${magneticY}px)`
        setIsHovered(true)
      } else {
        element.style.transform = 'translate(0px, 0px)'
        setIsHovered(false)
      }
    }

    const handleMouseLeave = () => {
      element.style.transform = 'translate(0px, 0px)'
      setIsHovered(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    element.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      element.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  return (
    <motion.div
      ref={ref}
      className={`transition-transform duration-300 ease-out ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      animate={{
        boxShadow: isHovered 
          ? '0 20px 40px rgba(0, 194, 255, 0.3)' 
          : '0 10px 20px rgba(0, 0, 0, 0.1)'
      }}
    >
      {children}
    </motion.div>
  )
}

// Custom cursor component
export const CustomCursor: React.FC = () => {
  const cursorRef = useRef<HTMLDivElement>(null)
  const [cursorVariant, setCursorVariant] = useState('default')

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = e.clientX + 'px'
        cursorRef.current.style.top = e.clientY + 'px'
      }
    }

    const handleMouseEnter = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'BUTTON' || target.tagName === 'A') {
        setCursorVariant('button')
      } else if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        setCursorVariant('text')
      }
    }

    const handleMouseLeave = () => {
      setCursorVariant('default')
    }

    document.addEventListener('mousemove', moveCursor)
    document.addEventListener('mouseenter', handleMouseEnter, true)
    document.addEventListener('mouseleave', handleMouseLeave, true)

    return () => {
      document.removeEventListener('mousemove', moveCursor)
      document.removeEventListener('mouseenter', handleMouseEnter, true)
      document.removeEventListener('mouseleave', handleMouseLeave, true)
    }
  }, [])

  const cursorVariants = {
    default: {
      width: 12,
      height: 12,
      backgroundColor: 'rgba(0, 194, 255, 0.8)',
      border: 'none'
    },
    button: {
      width: 40,
      height: 40,
      backgroundColor: 'rgba(255, 0, 199, 0.2)',
      border: '2px solid rgba(255, 0, 199, 0.8)'
    },
    text: {
      width: 2,
      height: 20,
      backgroundColor: 'rgba(0, 194, 255, 1)',
      border: 'none'
    }
  }

  return (
    <motion.div
      ref={cursorRef}
      className="fixed pointer-events-none z-50 rounded-full mix-blend-difference"
      variants={cursorVariants}
      animate={cursorVariant}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      style={{ transform: 'translate(-50%, -50%)' }}
    />
  )
}
