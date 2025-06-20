import React from 'react'
import { motion } from 'framer-motion'

interface LiquidTextProps {
  children: React.ReactNode
  className?: string
  delay?: number
  stagger?: number
}

export const LiquidText: React.FC<LiquidTextProps> = ({ 
  children, 
  className = '', 
  delay = 0,
  stagger = 0.1 
}) => {
  const text = children?.toString() || ''
  const letters = text.split('')

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delay: delay,
        staggerChildren: stagger
      }
    }
  }
  const child = {
    hidden: {
      opacity: 0,
      y: 50,
      filter: 'blur(10px)',
      scale: 0.8
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      scale: 1,
      transition: {
        type: 'spring' as const,
        damping: 12,
        stiffness: 200
      }
    }
  }

  return (
    <motion.div
      className={`overflow-hidden ${className}`}
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {letters.map((letter, index) => (
        <motion.span
          key={index}
          className="inline-block"
          variants={child}
          whileHover={{
            scale: 1.1,
            color: '#FF00C7',
            textShadow: '0 0 20px rgba(255, 0, 199, 0.5)',
            transition: { duration: 0.2 }
          }}
        >
          {letter === ' ' ? '\u00A0' : letter}
        </motion.span>
      ))}
    </motion.div>
  )
}

// Morphing text effect
export const MorphingText: React.FC<{
  words: string[]
  className?: string
  interval?: number
}> = ({ words, className = '', interval = 3000 }) => {
  const [currentIndex, setCurrentIndex] = React.useState(0)

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % words.length)
    }, interval)

    return () => clearInterval(timer)
  }, [words.length, interval])

  return (
    <motion.div className={`relative ${className}`}>
      {words.map((word, index) => (
        <motion.span
          key={word}
          className="absolute inset-0"
          initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
          animate={{
            opacity: index === currentIndex ? 1 : 0,
            y: index === currentIndex ? 0 : -20,
            filter: index === currentIndex ? 'blur(0px)' : 'blur(10px)'
          }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          {word}
        </motion.span>
      ))}
    </motion.div>
  )
}

// Liquid underline effect
export const LiquidUnderline: React.FC<{
  children: React.ReactNode
  className?: string
}> = ({ children, className = '' }) => {
  return (
    <motion.div
      className={`relative inline-block ${className}`}
      whileHover="hover"
      initial="rest"
    >
      {children}
      <motion.div
        className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-primary to-accent"
        variants={{
          rest: { width: 0, opacity: 0 },
          hover: { 
            width: '100%', 
            opacity: 1,
            transition: { duration: 0.3, ease: 'easeOut' }
          }
        }}
      />
    </motion.div>
  )
}
