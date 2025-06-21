'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useEffect, useState, useMemo, useRef } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { 
  Play, 
  BookOpen, 
  Film, 
  Tv, 
  Gamepad2,
  Music,
  ArrowRight,
  Zap,
  Users,
  BarChart3,
  Heart,
  Sparkles,
  Star,
  Check,
  X,
  LucideIcon,
  Search,
  TrendingUp,
  Shield
} from 'lucide-react'

// Register GSAP ScrollTrigger plugin
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

// Natural Custom Cursor Component
const CustomCursor = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      setIsHovering(target.tagName === 'BUTTON' || target.closest('button') !== null || target.closest('a') !== null)
    }

    window.addEventListener('mousemove', updateMousePosition)
    window.addEventListener('mouseover', handleMouseOver)

    return () => {
      window.removeEventListener('mousemove', updateMousePosition)
      window.removeEventListener('mouseover', handleMouseOver)
    }
  }, [])

  return (
    <div
      className="fixed top-0 left-0 w-6 h-6 pointer-events-none z-50 mix-blend-difference transition-transform duration-100"
      style={{
        transform: `translate(${mousePosition.x - 12}px, ${mousePosition.y - 12}px) scale(${isHovering ? 1.5 : 1})`
      }}
    >
      <div className={`w-full h-full rounded-full border-2 ${isHovering ? 'border-white bg-white/20' : 'border-white'} backdrop-blur-sm`} />
    </div>
  )
}

// Floating Particles Background
const FloatingParticles = () => {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    size: number;
    duration: number;
    delay: number;
    xMovement: number;
  }>>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Generate particles only on client side to avoid hydration mismatch
    const particleData = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: (i * 7.3) % 100, // Use deterministic values based on index
      y: (i * 11.7) % 100,
      size: (i % 4) + 1,
      duration: 20 + (i % 8) * 2.5,
      delay: (i % 5),
      xMovement: ((i % 11) - 5) * 10
    }))
    setParticles(particleData)
  }, [])

  if (!mounted || particles.length === 0) {
    // Don't render anything during SSR or before mount
    return null
  }

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-gradient-to-r from-primary/30 to-accent/30 blur-sm"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
          }}
          animate={{
            y: [0, -100, 0],
            x: [0, particle.xMovement, 0],
            opacity: [0, 1, 0],
            scale: [0, 1, 0]
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  )
}

// Morphing Blob Component
const MorphingBlob = ({ className, delay = 0 }: { className?: string, delay?: number }) => {
  const [path, setPath] = useState("M60,20 Q80,10 100,30 Q90,50 70,60 Q50,50 40,30 Q50,10 60,20")
  
  const paths = useMemo(() => [
    "M60,20 Q80,10 100,30 Q90,50 70,60 Q50,50 40,30 Q50,10 60,20",
    "M50,15 Q85,5 95,35 Q85,55 65,65 Q45,55 35,35 Q45,5 50,15", 
    "M65,25 Q75,15 90,25 Q95,45 75,55 Q55,45 45,25 Q55,15 65,25",
    "M55,18 Q82,8 98,32 Q88,52 68,62 Q48,52 38,32 Q48,8 55,18"
  ], [])

  useEffect(() => {
    const interval = setInterval(() => {
      setPath(paths[Math.floor(Math.random() * paths.length)])
    }, 3000 + delay * 1000)
    return () => clearInterval(interval)
  }, [delay, paths])

  return (
    <svg className={`absolute ${className}`} viewBox="0 0 140 80" fill="none">
      <motion.path
        d={path}
        fill="url(#blob-gradient)"
        animate={{ d: path }}
        transition={{ 
          duration: 2, 
          ease: "easeInOut",
          repeat: Infinity,
          repeatType: "reverse"
        }}
      />
      <defs>
        <linearGradient id="blob-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(0, 194, 255, 0.3)" />
          <stop offset="100%" stopColor="rgba(255, 0, 199, 0.3)" />
        </linearGradient>
      </defs>
    </svg>
  )
}

// Floating Media Card Component - Fixed positioning around hero
const FloatingMediaCard = ({ 
  icon: Icon, 
  type, 
  position,
  delay 
}: { 
  icon: LucideIcon, 
  type: string, 
  position: { top?: string, bottom?: string, left?: string, right?: string },
  delay: number 
}) => {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <motion.div
      className="absolute hidden lg:block"
      style={position}
      initial={{ opacity: 0, scale: 0.3, rotate: -180 }}
      animate={{ 
        opacity: 1, 
        scale: 1, 
        rotate: 0,
        y: [0, -10, 0]
      }}
      transition={{ 
        duration: 1.5,
        delay: delay,
        ease: [0.23, 1, 0.320, 1],
        y: {
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }
      }}
      whileHover={{ 
        scale: 1.15, 
        rotate: [0, -5, 5, 0],
        y: -15,
        transition: { 
          type: "spring", 
          damping: 10, 
          stiffness: 300,
          rotate: { duration: 0.5 }
        }
      }}
    >
      <div className="group relative">
        <div className="absolute -inset-2 bg-gradient-to-r from-primary/30 to-accent/30 rounded-3xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="relative glass-card p-6 rounded-3xl backdrop-blur-xl border border-white/20 shadow-2xl bg-gradient-to-br from-white/10 to-white/5">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-sm">
              <Icon className="w-8 h-8 text-white" />
            </div>
            <p className="text-sm font-semibold text-white/90 tracking-wide">{type}</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Magnetic Button Component  
const MagneticButton = ({ children, className = "", onClick, ...props }: React.ComponentProps<typeof Button> & { className?: string }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePosition({
      x: e.clientX - rect.left - rect.width / 2,
      y: e.clientY - rect.top - rect.height / 2
    })
  }

  return (
    <motion.div
      className={`relative inline-block`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}      animate={{
        x: isHovering ? mousePosition.x * 0.05 : 0,
        y: isHovering ? mousePosition.y * 0.05 : 0
      }}
      transition={{ type: "spring", damping: 15, stiffness: 150 }}
    >
      <Button 
        {...props}
        onClick={onClick}
        className={`relative overflow-hidden bg-gradient-to-r from-primary to-accent hover:scale-105 transition-transform duration-300 ${className}`}
      >
        {children}
        <motion.div
          className="absolute inset-0 bg-white/20"
          initial={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      </Button>
    </motion.div>
  )
}

// Simple Card Container Component  
const TiltCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
  return (
    <div className={className}>
      {children}
    </div>
  )
}

export default function HomePage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (typeof window === 'undefined') return

    const ctx = gsap.context(() => {
      // Get references to all sections
      const pinWrap = containerRef.current
      const heroSection = heroRef.current
      const featuresSection = featuresRef.current
      const ctaSection = ctaRef.current

      if (!pinWrap || !heroSection || !featuresSection || !ctaSection) return

      // Set initial states
      gsap.set(featuresSection, { opacity: 0, y: 100 })
      gsap.set(ctaSection, { opacity: 0, y: 100 })
      gsap.set(heroSection, { opacity: 1, scale: 1 })

      // Create the main pinning ScrollTrigger
      ScrollTrigger.create({
        trigger: pinWrap,
        start: 'top top',
        end: '+=300%', // 3x viewport height for 3 sections
        pin: true,
        pinSpacing: false,
        anticipatePin: 1,
        onUpdate: (self) => {
          const progress = self.progress
          
          // Hero section (0% to 33%)
          if (progress <= 0.33) {
            const heroProgress = progress / 0.33
            gsap.to(heroSection, {
              opacity: 1 - heroProgress,
              scale: 1 - (heroProgress * 0.2),
              duration: 0.1,
              ease: "none"
            })
            gsap.to(featuresSection, { opacity: 0, duration: 0.1 })
            gsap.to(ctaSection, { opacity: 0, duration: 0.1 })
          }
          
          // Features section (33% to 66%)
          else if (progress <= 0.66) {
            const featuresProgress = (progress - 0.33) / 0.33
            gsap.to(heroSection, { opacity: 0, duration: 0.1 })
            gsap.to(featuresSection, {
              opacity: featuresProgress < 0.5 ? featuresProgress * 2 : 2 - (featuresProgress * 2),
              y: 100 - (featuresProgress * 100),
              duration: 0.1,
              ease: "none"
            })
            gsap.to(ctaSection, { opacity: 0, duration: 0.1 })
          }
          
          // CTA section (66% to 100%)
          else {
            const ctaProgress = (progress - 0.66) / 0.34
            gsap.to(heroSection, { opacity: 0, duration: 0.1 })
            gsap.to(featuresSection, { opacity: 0, duration: 0.1 })
            gsap.to(ctaSection, {
              opacity: ctaProgress,
              y: 100 - (ctaProgress * 100),
              duration: 0.1,
              ease: "none"
            })
          }
        }
      })

    }, containerRef)

    return () => {
      ctx.revert() // Clean up GSAP animations
    }
  }, [])
  // Background parallax with Framer Motion (keeping some effects)
  const { scrollYProgress } = useScroll()
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -100])
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -200])
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -300])
  return (
    <>
      <CustomCursor />
      
      {/* GSAP Pinned Container */}
      <div ref={containerRef} className="relative h-screen overflow-hidden bg-gradient-to-br from-black via-gray-900 to-black">
        
        {/* Background Effects */}
        <FloatingParticles />
        
        {/* Animated Background Blobs */}
        <div className="absolute inset-0 z-0">
          <motion.div style={{ y: y1 }}>
            <MorphingBlob className="top-20 left-10 w-96 h-96 opacity-60" delay={0} />
          </motion.div>
          <motion.div style={{ y: y2 }}>
            <MorphingBlob className="bottom-20 left-1/3 w-80 h-80 opacity-50" delay={2} />
          </motion.div>
          <motion.div style={{ y: y3 }}>
            <MorphingBlob className="bottom-10 right-10 w-48 h-48 opacity-30" delay={3} />
          </motion.div>
        </div>

        {/* Hero Section - Initially visible */}
        <div 
          ref={heroRef}
          className="absolute inset-0 z-30 flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,194,255,0.2),transparent_40%),radial-gradient(circle_at_70%_60%,rgba(255,0,199,0.2),transparent_50%)]"></div>
          
          {/* Animated Concentric Circles */}
          {[800, 600, 400, 200].map((size, index) => (
            <motion.div
              key={size}
              className="absolute top-1/2 left-1/2 rounded-full border border-white/5"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                marginLeft: `-${size/2}px`,
                marginTop: `-${size/2}px`,
              }}
              animate={{
                rotate: 360,
                scale: [1, 1.1, 1],
              }}
              transition={{
                rotate: { duration: 20 + index * 10, repeat: Infinity, ease: "linear" },
                scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
              }}
            />
          ))}
          
          <div className="absolute inset-0 mix-blend-overlay bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(0,0,0,0.4)_100%)]"></div>
          
          <div className="text-center max-w-6xl mx-auto px-4">            {/* Enhanced Floating Media Cards in Fixed Strategic Positions */}
            <FloatingMediaCard 
              icon={Film} 
              type="Movies" 
              position={{ top: "15%", left: "8%" }} 
              delay={0.5} 
            />
            
            <FloatingMediaCard 
              icon={BookOpen} 
              type="Books" 
              position={{ top: "15%", right: "8%" }} 
              delay={1} 
            />
              <FloatingMediaCard 
              icon={Gamepad2} 
              type="Games" 
              position={{ bottom: "25%", left: "12%" }} 
              delay={1.5} 
            />
            
            <FloatingMediaCard 
              icon={Tv} 
              type="TV Shows" 
              position={{ bottom: "25%", right: "12%" }} 
              delay={2} 
            />
              <FloatingMediaCard 
              icon={Music} 
              type="Podcasts" 
              position={{ top: "45%", left: "4%" }} 
              delay={2.5} 
            />
            
            <FloatingMediaCard 
              icon={Star} 
              type="Anime" 
              position={{ top: "45%", right: "4%" }} 
              delay={3} 
            />

            {/* Premium Hero Content with 3D Effects */}
            <TiltCard className="relative mb-16">
              <div className="absolute -inset-10 bg-gradient-conic from-primary via-accent to-primary opacity-30 blur-3xl rounded-full"></div>
              <div className="relative">
                <motion.div 
                  className="mb-4 inline-block"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  <span className="px-4 py-1.5 text-sm font-medium bg-white/10 text-white/90 rounded-full backdrop-blur-sm border border-white/10">
                    Redefining Media Tracking
                  </span>
                </motion.div>
                  <motion.h1 
                  className="text-7xl md:text-9xl font-black mb-8 bg-clip-text text-transparent bg-gradient-to-br from-white via-primary to-accent leading-none tracking-tight"
                  style={{
                    filter: 'drop-shadow(0 0 8px rgba(0, 194, 255, 0.3)) drop-shadow(0 0 16px rgba(255, 0, 199, 0.2))'
                  }}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 0.4 }}
                >
                  Stacked
                </motion.h1><motion.p 
                  className="text-xl md:text-2xl text-white/80 mb-10 max-w-3xl mx-auto leading-relaxed"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 }}                >
                  The ultimate media tracking experience. 
                  <br />
                  <span className="text-primary font-semibold">Track, discover, and obsess</span> over everything you love.
                </motion.p>

                {/* Enhanced CTA Buttons */}
                <motion.div 
                  className="flex flex-col sm:flex-row gap-5 justify-center items-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                >
                  <TiltCard>
                    <a href="/auth/signup" className="group relative inline-flex items-center">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-xl blur opacity-70 group-hover:opacity-100 transition duration-300"></div>
                      <button className="relative flex items-center gap-2 bg-black px-8 py-4 rounded-xl leading-none font-medium text-white hover:scale-105 transition-transform">
                        <Play className="w-5 h-5" />
                        Start Stacking
                        <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                      </button>
                    </a>
                  </TiltCard>
                  
                  <TiltCard>
                    <a href="/library" className="group relative inline-flex items-center">
                      <div className="absolute -inset-px bg-gradient-to-r from-white/20 to-white/20 rounded-xl opacity-70 group-hover:opacity-100 transition duration-300"></div>
                      <button className="relative flex items-center gap-2 bg-black/30 backdrop-blur-xl border border-white/10 px-8 py-4 rounded-xl leading-none font-medium text-white hover:scale-105 transition-transform">
                        <Sparkles className="w-5 h-5" />
                        See Demo
                      </button>
                    </a>
                  </TiltCard>
                </motion.div>
              </div>
            </TiltCard>            {/* Enhanced Stats with Clean Design and Minimal Effects */}            <motion.div 
              className="grid grid-cols-3 gap-8 max-w-4xl mx-auto mt-8"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1 }}
            >
              {[
                { number: "50K+", label: "Active Users", icon: Users, color: "from-blue-500 to-cyan-400" },
                { number: "2.5M+", label: "Items Tracked", icon: BarChart3, color: "from-purple-500 to-pink-400" },
                { number: "99.2%", label: "User Satisfaction", icon: Heart, color: "from-green-500 to-emerald-400" }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  className="relative group cursor-pointer"
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.6, delay: 1.2 + index * 0.15 }}
                  whileHover={{ 
                    scale: 1.05,
                    y: -4,
                    transition: { type: "spring", damping: 15, stiffness: 200 }
                  }}                >
                  {/* Clean minimal hover effect */}
                  <div className="absolute -inset-1 bg-white/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                  {/* Glass card container */}
                  <div className="relative glass-card rounded-2xl p-8 border border-white/20 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl h-full">
                      {/* Main content */}
                    <div className="relative z-10 text-center space-y-4">                      <motion.div 
                        className="text-4xl md:text-5xl font-bold text-white tracking-tight"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 1.4 + index * 0.1 }}
                      >
                        {stat.number}
                      </motion.div>
                      
                      <div className="flex items-center justify-center space-x-2">
                        <stat.icon className="w-4 h-4 text-white/60" />
                        <div className="text-white/80 text-sm font-medium tracking-wide">
                          {stat.label}                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>              ))}
            </motion.div>
            
            {/* Scroll indicator */}
            <motion.div 
              className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: [0, 10, 0] }}
              transition={{ 
                opacity: { delay: 2, duration: 1 },
                y: { delay: 2, duration: 2, repeat: Infinity, repeatType: "loop" }
              }}
            >              <div className="flex flex-col items-center text-white/80">
                <div className="text-sm font-medium mb-2">Discover More</div>
                <div className="w-8 h-12 rounded-full border-2 border-white/40 flex justify-center pt-1">
                  <motion.div 
                    className="w-2 h-2 bg-primary rounded-full"
                    animate={{ y: [0, 18, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatType: "loop" }}
                  />
                </div>              </div>
            </motion.div>
          </div>
        </div>        {/* Features Section - Ultra Modern 3D Design */}
        <div 
          ref={featuresRef}
          className="absolute inset-0 z-20 py-8 px-4 overflow-hidden"
          style={{ opacity: 0 }}
        >
          {/* Dynamic Animated Background */}
          <div className="absolute inset-0">
            {/* Flowing Gradient Mesh */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/30 via-purple-900/20 to-pink-900/30"></div>
            
            {/* Animated Mesh Overlays */}
            <motion.div 
              className="absolute inset-0 opacity-40"
              animate={{
                background: [
                  "radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(168, 85, 247, 0.3) 0%, transparent 50%)",
                  "radial-gradient(circle at 80% 20%, rgba(236, 72, 153, 0.3) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)",
                  "radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.3) 0%, transparent 50%), radial-gradient(circle at 30% 70%, rgba(236, 72, 153, 0.3) 0%, transparent 50%)"
                ]
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
              {/* Floating Orbs */}
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-32 h-32 rounded-full"
                style={{
                  background: `linear-gradient(45deg, ${
                    i % 3 === 0 ? 'rgba(59, 130, 246, 0.1)' : 
                    i % 3 === 1 ? 'rgba(168, 85, 247, 0.1)' : 
                    'rgba(236, 72, 153, 0.1)'
                  }, transparent)`,
                  filter: 'blur(40px)',
                  left: `${(i * 13.7) % 100}%`,
                  top: `${(i * 17.3) % 100}%`,
                }}
                animate={{
                  x: [0, ((i % 7) - 3) * 15, 0],
                  y: [0, ((i % 5) - 2) * 20, 0],
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 0.7, 0.3]
                }}
                transition={{
                  duration: 12 + (i % 3) * 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 1.5
                }}
              />
            ))}
          </div>
          
          <div className="max-w-7xl mx-auto relative z-10 h-full flex flex-col justify-center">            {/* Header Section with Clean White Glow */}
            <motion.div 
              className="text-center mb-12"
              initial={{ opacity: 0, y: -50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              viewport={{ once: true }}
            >
              <motion.div
                className="inline-block relative mb-6"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", damping: 15 }}
              >
                <div className="absolute -inset-2 bg-white/5 rounded-2xl blur-lg opacity-0 hover:opacity-100 transition-all duration-500"></div>
                <div className="relative bg-black/40 backdrop-blur-xl px-8 py-3 rounded-2xl border border-white/10">
                  <span className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 tracking-wider uppercase">
                    Next-Gen Experience
                  </span>
                </div>
              </motion.div>
              
              <h2 className="text-5xl md:text-7xl font-black mb-6 relative">
                <span className="absolute inset-0 text-white/10 blur-sm">
                  Why Choose Stacked?
                </span>
                <span className="relative text-white drop-shadow-lg">
                  Why Choose Stacked?
                </span>
              </h2>
              
              <motion.p 
                className="text-xl text-white/70 max-w-3xl mx-auto"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                viewport={{ once: true }}
              >
                Experience the future of media tracking with revolutionary features that set us apart
              </motion.p>
            </motion.div>{/* Two Column Grid with Balanced Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              
              {/* Left Column - Enhanced Comparison Table */}
              <motion.div
                initial={{ opacity: 0, x: -100, rotateY: -15 }}
                whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
                viewport={{ once: true }}
                className="relative"
                style={{ perspective: "1000px" }}
              >
                <div className="relative group">
                  {/* Minimal Glow Effect */}
                  <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl blur-xl transition-all duration-500 opacity-0 group-hover:opacity-60"></div>
                    {/* Main Container with Balanced Height */}
                  <div className="relative bg-black/30 backdrop-blur-2xl rounded-3xl border border-white/20 p-8 h-[520px] overflow-hidden group-hover:border-white/30 transition-all duration-500">
                    {/* Animated Background Pattern */}
                    <div className="absolute inset-0 opacity-30">
                      <motion.div
                        className="absolute inset-0"
                        animate={{
                          background: [
                            "linear-gradient(45deg, rgba(59, 130, 246, 0.1) 0%, transparent 50%)",
                            "linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, transparent 50%)",
                            "linear-gradient(225deg, rgba(236, 72, 153, 0.1) 0%, transparent 50%)"
                          ]
                        }}
                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                      />
                    </div>

                    <motion.h3 
                      className="text-2xl font-bold text-white mb-8 relative z-10"
                      whileHover={{ scale: 1.05 }}
                    >
                      <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                        Competitive Edge
                      </span>
                    </motion.h3>

                    <div className="space-y-6 relative z-10">
                      {/* Enhanced Header */}
                      <div className="grid grid-cols-5 gap-4 pb-6 border-b border-white/20">
                        <div className="text-white/80 font-semibold">Feature</div>
                        <div className="text-center">
                          <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold px-3 py-1 rounded-full text-sm">
                            Stacked
                          </div>
                        </div>
                        <div className="text-center text-white/60 text-sm font-medium">AniList</div>
                        <div className="text-center text-white/60 text-sm font-medium">Letterboxd</div>
                        <div className="text-center text-white/60 text-sm font-medium">Goodreads</div>
                      </div>

                      {/* Enhanced Rows */}
                      {[
                        { feature: "All Media Types", stacked: true, anilist: false, letterboxd: false, goodreads: false },
                        { feature: "Lightning Performance", stacked: true, anilist: true, letterboxd: false, goodreads: false },
                        { feature: "AI Analytics", stacked: true, anilist: false, letterboxd: false, goodreads: false },
                        { feature: "Privacy First", stacked: true, anilist: false, letterboxd: false, goodreads: false },
                        { feature: "Smart Discovery", stacked: true, anilist: false, letterboxd: true, goodreads: false },
                      ].map((row, index) => (
                        <motion.div
                          key={row.feature}
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1, duration: 0.6 }}
                          viewport={{ once: true }}
                          whileHover={{ scale: 1.02, x: 4 }}
                          className="grid grid-cols-5 gap-4 py-4 rounded-xl hover:bg-white/5 transition-all duration-300 px-2"
                        >
                          <div className="text-white font-medium">{row.feature}</div>
                          <div className="text-center">
                            <motion.div
                              whileHover={{ scale: 1.2, rotate: 360 }}
                              transition={{ duration: 0.3 }}
                            >
                              <Check className="w-6 h-6 text-green-400 mx-auto drop-shadow-lg" />
                            </motion.div>
                          </div>
                          <div className="text-center">
                            <motion.div whileHover={{ scale: 1.2 }}>
                              {row.anilist ? 
                                <Check className="w-5 h-5 text-green-400 mx-auto" /> : 
                                <X className="w-5 h-5 text-red-400 mx-auto" />
                              }
                            </motion.div>
                          </div>
                          <div className="text-center">
                            <motion.div whileHover={{ scale: 1.2 }}>
                              {row.letterboxd ? 
                                <Check className="w-5 h-5 text-green-400 mx-auto" /> : 
                                <X className="w-5 h-5 text-red-400 mx-auto" />
                              }
                            </motion.div>
                          </div>
                          <div className="text-center">
                            <motion.div whileHover={{ scale: 1.2 }}>
                              {row.goodreads ? 
                                <Check className="w-5 h-5 text-green-400 mx-auto" /> : 
                                <X className="w-5 h-5 text-red-400 mx-auto" />
                              }
                            </motion.div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>              {/* Right Column - Larger Feature Cards */}
              <motion.div
                initial={{ opacity: 0, x: 100, rotateY: 15 }}
                whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
                transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                viewport={{ once: true }}
                className="grid grid-cols-2 gap-4"
                style={{ perspective: "1000px" }}
              >
                {[
                  {
                    icon: Users,
                    title: "Track Everything",
                    description: "Movies, TV shows, anime, books, games - unified experience across all media types",
                    gradient: "from-blue-500 via-blue-600 to-cyan-500",
                    glowColor: "rgba(59, 130, 246, 0.3)",
                    particle: "🎬"
                  },
                  {
                    icon: Zap,
                    title: "AI Discovery",
                    description: "Next-gen recommendations that evolve with your taste and understand your preferences",
                    gradient: "from-purple-500 via-purple-600 to-pink-500",
                    glowColor: "rgba(168, 85, 247, 0.3)",
                    particle: "🤖"
                  },
                  {
                    icon: BarChart3,
                    title: "Visual Analytics",
                    description: "Beautiful insights into your entertainment patterns with detailed statistics",
                    gradient: "from-emerald-500 via-green-600 to-teal-500",
                    glowColor: "rgba(16, 185, 129, 0.3)",
                    particle: "📊"
                  },
                  {
                    icon: Heart,
                    title: "Social Connect",
                    description: "Discover through friends and build communities around shared interests",
                    gradient: "from-rose-500 via-pink-600 to-red-500",
                    glowColor: "rgba(236, 72, 153, 0.3)",
                    particle: "❤️"
                  }
                ].map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 50, rotateX: 20 }}
                    whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                    transition={{ 
                      delay: index * 0.15, 
                      duration: 0.8,
                      type: "spring",
                      damping: 12
                    }}
                    viewport={{ once: true }}
                    whileHover={{ 
                      y: -8, 
                      rotateX: -5,
                      scale: 1.02,
                      transition: { type: "spring", damping: 10, stiffness: 200 }
                    }}
                    className="group relative"
                  >
                    {/* Minimal Particle Effect */}
                    <motion.div
                      className="absolute -top-2 -right-2 text-xl opacity-70"
                      animate={{
                        y: [0, -8, 0],
                        rotate: [0, 8, -8, 0],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: index * 0.5
                      }}
                    >
                      {feature.particle}
                    </motion.div>

                    {/* Subtle Glow Effect */}
                    <div 
                      className="absolute -inset-1 rounded-2xl blur-lg opacity-0 group-hover:opacity-60 transition-all duration-500"
                      style={{ boxShadow: `0 0 30px ${feature.glowColor}` }}
                    ></div>

                    {/* Larger Main Card */}
                    <div className="relative bg-black/40 backdrop-blur-2xl rounded-2xl border border-white/20 p-8 h-[250px] overflow-hidden group-hover:border-white/30 transition-all duration-500">
                      {/* Subtle Animated Background */}
                      <motion.div
                        className="absolute inset-0 opacity-10"
                        animate={{
                          background: [
                            `linear-gradient(45deg, ${feature.glowColor} 0%, transparent 70%)`,
                            `linear-gradient(135deg, ${feature.glowColor} 0%, transparent 70%)`,
                            `linear-gradient(225deg, ${feature.glowColor} 0%, transparent 70%)`
                          ]
                        }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      />

                      {/* Icon with Refined Effect */}
                      <motion.div 
                        className="relative mb-6"
                        whileHover={{ 
                          scale: 1.1, 
                          rotate: [0, -5, 5, 0],
                          transition: { duration: 0.5 }
                        }}
                      >
                        <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center relative overflow-hidden shadow-xl`}>
                          <div className="absolute inset-0 bg-white/10 rounded-xl blur-sm"></div>
                          <feature.icon className="w-8 h-8 text-white relative z-10 drop-shadow-lg" />
                          
                          {/* Subtle shine effect */}
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                            animate={{ x: ["-100%", "100%"] }}
                            transition={{ 
                              duration: 2,
                              repeat: Infinity,
                              repeatDelay: 4,
                              ease: "easeInOut"
                            }}
                          />
                        </div>
                      </motion.div>

                      {/* Enhanced Content */}
                      <div className="relative z-10">
                        <h3 className="text-white font-bold text-xl mb-4 group-hover:text-white transition-colors">
                          {feature.title}
                        </h3>
                        <p className="text-white/70 text-sm leading-relaxed group-hover:text-white/90 transition-colors">
                          {feature.description}
                        </p>
                      </div>

                      {/* Subtle Hover Arrow */}
                      <motion.div
                        className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100"
                        initial={{ x: -10 }}
                        whileHover={{ x: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ArrowRight className="w-5 h-5 text-white/60" />
                      </motion.div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>            {/* Bottom Stats Row */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              viewport={{ once: true }}
              className="grid grid-cols-3 gap-8 mt-8 text-center"
            >
              {[
                { number: "50K+", label: "" },
                { number: "1M+", label: "" },
                { number: "99.9%", label: "" }
              ].map((stat, index) => (
                <div key={`features-stat-${index}-${stat.number}`} className="space-y-2">
                  <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                    {stat.number}
                  </div>
                  <div className="text-white/60 text-sm">{stat.label}</div>
                </div>
              ))}
            </motion.div>

            {/* Testimonial */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              viewport={{ once: true }}
              className="text-center mt-6"
            >
              <div className="bg-black/40 backdrop-blur-xl rounded-xl border border-white/10 p-4 max-w-xl mx-auto">
                <p className="text-white/80 italic mb-3 text-sm">
                  &ldquo;Finally, a platform that gets it right. Stacked has completely changed how I track and discover media.&rdquo;
                </p>
                <div className="text-white/60 text-xs">— Sarah K., Beta User</div>
              </div>
            </motion.div>
          </div>
        </div>        {/* CTA Section - Enhanced with Dynamic Effects */}
        <div 
          ref={ctaRef}
          className="absolute inset-0 z-10 py-16 px-4 flex items-center justify-center overflow-hidden"
          style={{ opacity: 0 }}
        >          {/* Ultra Dynamic Background Effects */}
          <div className="absolute inset-0">
            {/* Animated Gradient Mesh */}
            <motion.div 
              className="absolute inset-0"
              animate={{
                background: [
                  "radial-gradient(circle at 20% 30%, rgba(0, 194, 255, 0.2) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(255, 0, 199, 0.2) 0%, transparent 50%), radial-gradient(circle at 50% 20%, rgba(168, 85, 247, 0.15) 0%, transparent 40%)",
                  "radial-gradient(circle at 70% 20%, rgba(255, 0, 199, 0.2) 0%, transparent 50%), radial-gradient(circle at 30% 80%, rgba(0, 194, 255, 0.2) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(34, 197, 94, 0.15) 0%, transparent 40%)",
                  "radial-gradient(circle at 50% 60%, rgba(168, 85, 247, 0.2) 0%, transparent 50%), radial-gradient(circle at 90% 10%, rgba(34, 197, 94, 0.2) 0%, transparent 50%), radial-gradient(circle at 10% 90%, rgba(255, 165, 0, 0.15) 0%, transparent 40%)",
                  "radial-gradient(circle at 40% 10%, rgba(255, 165, 0, 0.2) 0%, transparent 50%), radial-gradient(circle at 60% 90%, rgba(168, 85, 247, 0.2) 0%, transparent 50%), radial-gradient(circle at 20% 60%, rgba(0, 194, 255, 0.15) 0%, transparent 40%)"
                ]
              }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Floating Energy Orbs with More Variety */}
            {Array.from({ length: 18 }).map((_, i) => (
              <motion.div
                key={`cta-orb-${i}`}
                className="absolute rounded-full"
                style={{
                  width: `${15 + (i % 5) * 12}px`,
                  height: `${15 + (i % 5) * 12}px`,
                  background: `linear-gradient(45deg, ${
                    i % 5 === 0 ? 'rgba(0, 194, 255, 0.4)' : 
                    i % 5 === 1 ? 'rgba(255, 0, 199, 0.4)' : 
                    i % 5 === 2 ? 'rgba(168, 85, 247, 0.4)' :
                    i % 5 === 3 ? 'rgba(34, 197, 94, 0.4)' :
                    'rgba(255, 165, 0, 0.4)'
                  }, transparent)`,
                  filter: `blur(${15 + (i % 3) * 10}px)`,
                  left: `${(i * 6.2) % 100}%`,
                  top: `${(i * 9.7) % 100}%`,
                }}
                animate={{
                  x: [0, ((i % 9) - 4) * 40, 0],
                  y: [0, ((i % 7) - 3) * 50, 0],
                  scale: [0.8, 1.8, 0.8],
                  opacity: [0.2, 0.9, 0.2],
                  rotate: [0, ((i % 6) - 3) * 45, 0]
                }}
                transition={{
                  duration: 8 + (i % 6) * 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.6
                }}
              />
            ))}

            {/* Multi-layered Scanning Effects */}
            <motion.div
              className="absolute inset-0"
              animate={{
                background: [
                  "linear-gradient(90deg, transparent 0%, rgba(0, 194, 255, 0.15) 25%, transparent 50%)",
                  "linear-gradient(90deg, transparent 50%, rgba(255, 0, 199, 0.15) 75%, transparent 100%)"
                ]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            
            <motion.div
              className="absolute inset-0"
              animate={{
                background: [
                  "linear-gradient(180deg, transparent 0%, rgba(168, 85, 247, 0.1) 30%, transparent 60%)",
                  "linear-gradient(180deg, transparent 40%, rgba(34, 197, 94, 0.1) 70%, transparent 100%)"
                ]
              }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />

            {/* Rotating Energy Rings */}
            {Array.from({ length: 3 }).map((_, i) => (
              <motion.div
                key={`ring-${i}`}
                className="absolute"
                style={{
                  width: `${200 + i * 100}px`,
                  height: `${200 + i * 100}px`,
                  border: `1px solid rgba(${
                    i === 0 ? '0, 194, 255' : 
                    i === 1 ? '255, 0, 199' : 
                    '168, 85, 247'
                  }, 0.1)`,
                  borderRadius: '50%',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
                animate={{
                  rotate: [0, 360],
                  scale: [1, 1.1, 1],
                  opacity: [0.1, 0.3, 0.1]
                }}
                transition={{
                  duration: 20 + i * 10,
                  repeat: Infinity,
                  ease: "linear",
                  delay: i * 2
                }}
              />
            ))}
          </div>

          <div className="container mx-auto max-w-6xl relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              viewport={{ once: true }}
              className="relative"
            >              {/* Simple static glow */}
              <div 
                className="absolute -inset-4 rounded-3xl opacity-20"
                style={{ 
                  background: 'rgba(0, 194, 255, 0.1)',
                  filter: 'blur(20px)' 
                }}
              />

              {/* Pulsing Ring Effects */}
              {Array.from({ length: 4 }).map((_, i) => (
                <motion.div
                  key={`pulse-ring-${i}`}
                  className="absolute -inset-4 rounded-3xl border opacity-20"
                  style={{
                    borderColor: i % 2 === 0 ? 'rgba(0, 194, 255, 0.4)' : 'rgba(255, 0, 199, 0.4)',
                    borderWidth: '1px'
                  }}
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.2, 0.6, 0.2],
                    rotate: [0, i % 2 === 0 ? 5 : -5, 0]
                  }}
                  transition={{
                    duration: 3 + i * 0.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.3
                  }}
                />
              ))}

              {/* Main CTA Card with Ultra Enhanced Effects */}
              <motion.div 
                className="relative glass-card border-border/50 p-8 md:p-12 overflow-hidden group hover:border-primary/60 transition-all duration-700 bg-black/30 backdrop-blur-3xl"
                whileHover={{ 
                  scale: 1.02,
                  boxShadow: "0 20px 60px rgba(0, 194, 255, 0.2), 0 0 100px rgba(255, 0, 199, 0.1)"
                }}
                transition={{ duration: 0.3 }}
              >                {/* Simple static background */}
                <div
                  className="absolute inset-0 opacity-5"
                  style={{
                    background: "linear-gradient(45deg, rgba(0, 194, 255, 0.1) 0%, transparent 50%)"
                  }}
                />{/* Enhanced Floating Data Particles with More Variety and Effects */}
                {Array.from({ length: 16 }).map((_, i) => (
                  <motion.div
                    key={`data-particle-${i}`}
                    className="absolute rounded-full opacity-40"
                    style={{
                      width: `${2 + (i % 3)}px`,
                      height: `${2 + (i % 3)}px`,
                      background: i % 5 === 0 ? '#00c2ff' : 
                                  i % 5 === 1 ? '#ff00c7' : 
                                  i % 5 === 2 ? '#a855f7' : 
                                  i % 5 === 3 ? '#22c55e' : '#ffa500',
                      left: `${15 + (i * 5) % 70}%`,
                      top: `${15 + (i * 7) % 70}%`,
                      boxShadow: `0 0 10px ${
                        i % 5 === 0 ? '#00c2ff' : 
                        i % 5 === 1 ? '#ff00c7' : 
                        i % 5 === 2 ? '#a855f7' : 
                        i % 5 === 3 ? '#22c55e' : '#ffa500'
                      }`
                    }}
                    animate={{
                      y: [0, -30, 0],
                      x: [0, ((i % 5) - 2) * 15, 0],
                      opacity: [0.2, 0.8, 0.2],
                      scale: [0.5, 2, 0.5],
                      rotate: [0, 360, 0]
                    }}
                    transition={{
                      duration: 3 + (i % 4),
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.3
                    }}
                  />
                ))}

                {/* Floating Action Particles for Extra Visual Interest */}
                {Array.from({ length: 12 }).map((_, i) => (
                  <motion.div
                    key={`action-particle-${i}`}
                    className="absolute rounded-full opacity-30"
                    style={{
                      width: `${3 + (i % 2)}px`,
                      height: `${3 + (i % 2)}px`,
                      background: `linear-gradient(45deg, ${
                        i % 3 === 0 ? 'rgba(0, 194, 255, 0.8)' : 
                        i % 3 === 1 ? 'rgba(255, 0, 199, 0.8)' : 
                        'rgba(168, 85, 247, 0.8)'
                      }, transparent)`,
                      left: `${20 + (i * 7) % 60}%`,
                      top: `${20 + (i * 9) % 60}%`,
                      filter: 'blur(1px)'
                    }}
                    animate={{
                      y: [0, -40, 0],
                      x: [0, ((i % 4) - 2) * 20, 0],
                      opacity: [0.3, 0.9, 0.3],
                      scale: [0.8, 1.8, 0.8],
                      rotate: [0, (i % 2 === 0 ? 180 : -180), 0]
                    }}
                    transition={{
                      duration: 4 + (i % 3),
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.4
                    }}
                  />
                ))}

                {/* Content with Enhanced Animations */}
                <div className="relative z-10 text-center space-y-8">
                  {/* Enhanced Badge with Pulse Effect */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    whileHover={{ scale: 1.05 }}
                  >                    <div 
                      className="inline-flex items-center gap-2 bg-primary/10 backdrop-blur-sm px-4 py-2 rounded-full border border-primary/20 relative overflow-hidden"
                      style={{ boxShadow: "0 0 20px rgba(0, 194, 255, 0.2)" }}
                    >
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium gradient-text">Ready to Begin?</span>
                    </div>
                  </motion.div>

                  {/* Enhanced Main Heading with Floating Letters */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    viewport={{ once: true }}
                    className="space-y-4"
                  >                    <h2 
                      className="text-4xl md:text-6xl font-bold tracking-tight relative"
                      style={{ textShadow: "0 0 20px rgba(0, 194, 255, 0.3)" }}
                    >
                      <span className="inline-block">
                        Start Your Media Journey with{" "}
                      </span>
                      <span className="gradient-text inline-block">
                        Stacked
                      </span>
                    </h2>
                    <motion.p 
                      className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ duration: 1, delay: 0.4 }}
                      viewport={{ once: true }}
                    >
                      Join thousands of users who have transformed how they track, discover, and organize their entertainment. 
                      <motion.span 
                        className="text-primary font-semibold"
                        animate={{ opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        {" "}Movies, TV shows, books, anime, games, and podcasts
                      </motion.span>
                      {" "}— all in one beautiful place.
                    </motion.p>
                  </motion.div>

                  {/* Enhanced Features Grid with Hover Effects */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    viewport={{ once: true }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
                  >
                    {[
                      { icon: Zap, text: "Quick Setup", subtitle: "Ready in 30 seconds", color: "from-yellow-400 to-orange-500" },
                      { icon: Shield, text: "100% Free", subtitle: "No credit card required", color: "from-green-400 to-emerald-500" },
                      { icon: Star, text: "Smart Tracking", subtitle: "AI-powered insights", color: "from-purple-400 to-pink-500" },
                      { icon: Users, text: "Join 50K+", subtitle: "Active users", color: "from-blue-400 to-cyan-500" }
                    ].map((feature, index) => (
                      <motion.div
                        key={feature.text}
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        whileInView={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                        viewport={{ once: true }}
                        whileHover={{ 
                          scale: 1.05, 
                          y: -5,
                          rotateY: 5,
                          transition: { type: "spring", damping: 10, stiffness: 200 }
                        }}
                        className="glass-card border-border/30 p-6 hover:border-primary/30 transition-all duration-300 group relative overflow-hidden"
                        style={{ perspective: "1000px" }}
                      >
                        {/* Animated background glow */}
                        <motion.div
                          className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500"
                          animate={{
                            background: [
                              `linear-gradient(45deg, transparent, rgba(0, 194, 255, 0.3), transparent)`,
                              `linear-gradient(135deg, transparent, rgba(255, 0, 199, 0.3), transparent)`,
                              `linear-gradient(225deg, transparent, rgba(168, 85, 247, 0.3), transparent)`
                            ]
                          }}
                          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        />
                        
                        <motion.div
                          animate={{ 
                            rotate: [0, 5, -5, 0],
                            scale: [1, 1.1, 1]
                          }}
                          transition={{ 
                            duration: 4, 
                            repeat: Infinity, 
                            ease: "easeInOut",
                            delay: index * 0.5
                          }}
                        >
                          <feature.icon className="w-8 h-8 text-primary mx-auto mb-3 group-hover:scale-110 transition-transform duration-300" />
                        </motion.div>
                        <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">{feature.text}</h3>
                        <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{feature.subtitle}</p>
                      </motion.div>
                    ))}
                  </motion.div>

                  {/* Enhanced CTA Buttons with Magnetic Effect */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                    viewport={{ once: true }}
                    className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto"
                  >                    <Link href="/auth/signup" className="flex-1">
                      <motion.div
                        whileHover={{ 
                          scale: 1.05,
                          rotate: [0, 1, -1, 0],
                          transition: { type: "spring", damping: 10, stiffness: 200 }
                        }}
                        whileTap={{ scale: 0.95 }}
                        className="relative group"
                      >                        {/* Simple static glow */}
                        <div
                          className="absolute -inset-2 rounded-lg opacity-40"
                          style={{
                            background: "linear-gradient(45deg, rgba(0, 194, 255, 0.6), rgba(59, 130, 246, 0.6))",
                            filter: 'blur(8px)'
                          }}
                        />
                        
                        <Button size="lg" className="w-full glow-primary group relative overflow-hidden bg-gradient-to-r from-primary to-blue-500 hover:from-blue-500 hover:to-primary transition-all duration-300">
                          <Play className="w-5 h-5 mr-2 group-hover:scale-125 transition-transform duration-300 drop-shadow-sm" />
                          <span className="font-semibold tracking-wide">Get Started Free</span>
                          <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform duration-300" />
                        </Button>
                      </motion.div>
                    </Link>
                    <Link href="/search" className="flex-1">
                      <motion.div
                        whileHover={{ 
                          scale: 1.03,
                          y: -2,
                          transition: { type: "spring", damping: 15 }
                        }}
                        whileTap={{ scale: 0.97 }}
                        className="relative group"
                      >                        {/* Simple static glow for outline button */}
                        <div
                          className="absolute -inset-1 rounded-lg opacity-0 group-hover:opacity-40 transition-all duration-500"
                          style={{
                            background: "rgba(0, 194, 255, 0.2)",
                            filter: 'blur(6px)'
                          }}
                        />
                        
                        <Button variant="outline" size="lg" className="w-full group relative overflow-hidden border-primary/30 hover:border-primary/60 hover:bg-primary/5 transition-all duration-300">
                          <Search className="w-5 h-5 mr-2 group-hover:text-primary transition-colors duration-300" />
                          <span className="font-medium">Explore Demo</span>
                          
                          {/* Simple wave effect */}
                          <div
                            className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-primary to-blue-400 group-hover:h-1 transition-all duration-300 opacity-0 group-hover:opacity-100"
                            style={{ width: "0%" }}
                          />
                        </Button>
                      </motion.div>
                    </Link>
                  </motion.div>                  {/* Enhanced Trust Indicators with Dynamic Effects */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 1 }}
                    viewport={{ once: true }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-muted-foreground"
                  >                    <div 
                      className="flex items-center gap-2 group cursor-pointer hover:scale-105 transition-transform"
                    >
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <span className="group-hover:text-foreground transition-colors">
                        4.9/5 rating
                      </span>
                    </div>
                    
                    <div 
                      className="flex items-center gap-2 group cursor-pointer hover:scale-105 transition-transform"
                    >
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="group-hover:text-foreground transition-colors text-green-400">
                        50,000+ active users
                      </span>
                    </div>
                    
                    <div 
                      className="flex items-center gap-2 group cursor-pointer hover:scale-105 transition-transform"
                    >
                      <Shield className="w-4 h-4 text-blue-500" />
                      <span className="group-hover:text-foreground transition-colors text-blue-400">
                        100% privacy focused
                      </span>
                    </div>
                  </motion.div>                  {/* Simple Media Type Icons */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, delay: 1.2 }}
                    viewport={{ once: true }}
                    className="flex justify-center items-center gap-6 mt-8 opacity-40"
                  >
                    {[Film, Tv, BookOpen, Star, Gamepad2, Music].map((Icon, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          duration: 0.5,
                          delay: 1.4 + index * 0.1,
                          type: "spring",
                          damping: 15
                        }}
                        whileHover={{ 
                          scale: 1.2,
                          transition: { type: "spring", damping: 10, stiffness: 300 }
                        }}
                        className="p-2 rounded-lg bg-card/50"
                      >
                        <Icon className="w-5 h-5" />
                      </motion.div>
                    ))}
                  </motion.div>                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Spacer element to create scroll height for GSAP */}
      <div className="h-[300vh]"></div>
    </>
  )
}
