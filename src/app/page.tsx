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
  Shield,
  Users,
  Search,
  BarChart3,  Heart,
  Sparkles,
  Star,
  LucideIcon
}from 'lucide-react'

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

  useEffect(() => {
    // Generate particles only on client side to avoid hydration mismatch
    setParticles(Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1,
      duration: Math.random() * 20 + 20,
      delay: Math.random() * 5,
      xMovement: Math.random() * 100 - 50
    })))
  }, [])

  if (particles.length === 0) {
    // Don't render anything during SSR
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

  const features = [
    {
      icon: Film,
      title: "Track Everything",
      description: "Movies, TV shows, books, games, anime, and more in one place",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Search,
      title: "Smart Discovery",
      description: "Find your next obsession with AI-powered recommendations",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: BarChart3,
      title: "Visual Stats",
      description: "See your entertainment journey with beautiful charts and insights",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: Users,
      title: "Social Features",
      description: "Share reviews, create lists, and connect with fellow fans",
      color: "from-orange-500 to-red-500"
    },
    {
      icon: Zap,
      title: "Real-time Sync",
      description: "Access your library anywhere with instant synchronization",
      color: "from-yellow-500 to-orange-500"
    },
    {
      icon: Shield,
      title: "Privacy First",
      description: "Your data is yours. Complete control over what you share",      color: "from-indigo-500 to-purple-500"
    }
  ]
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
                        <div className="text-white/80 text-sm font-medium tracking-wide uppercase">
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
        </div>        {/* Features Section - Hidden initially */}
        <div 
          ref={featuresRef}
          className="absolute inset-0 z-20 py-8 overflow-hidden flex items-center justify-center"
          style={{ opacity: 0 }}
        >
          {/* Smooth transition overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/80 to-transparent opacity-70 h-32 -top-32 pointer-events-none"></div>
          <div className="absolute inset-0 bg-gradient-radial from-blue-500/10 via-transparent to-transparent opacity-40"></div>
          
          <div className="max-w-7xl mx-auto px-4">            <motion.div 
              className="text-center mb-8"
              initial={{ opacity: 0, y: 80 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              viewport={{ once: true, amount: 0.3 }}
            >
              <div className="inline-block relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent blur-xl opacity-70 rounded-lg"></div>
                <h2 className="relative text-5xl md:text-7xl font-black gradient-text mb-6 tracking-tight">
                  Why Stacked?
                </h2>
                {/* Glowing underline effect */}
                <motion.div
                  className="w-32 h-1 bg-gradient-to-r from-primary to-accent rounded-full mx-auto"
                  initial={{ width: 0, opacity: 0 }}
                  whileInView={{ width: 128, opacity: 1 }}
                  transition={{ duration: 1, delay: 0.6 }}
                  viewport={{ once: true, amount: 0.2 }}
                />
              </div>
              <p className="text-xl text-white/80 max-w-3xl mx-auto mt-4 leading-relaxed">
                Experience the future of media tracking with premium design,
                AI-powered discovery, and an experience that adapts to you.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {features.map((feature, index) => (                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 60 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.8, 
                    delay: 0.3 + index * 0.2, 
                    ease: "easeOut" 
                  }}
                  viewport={{ once: true, amount: 0.1 }}
                >
                  <motion.div
                    whileHover={{ 
                      scale: 1.05,
                      y: -8,
                      transition: { type: "spring", damping: 12, stiffness: 200 }
                    }}
                  >
                    <div className="group relative">
                      <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
                      <div className="relative bg-black/40 backdrop-blur-xl p-8 rounded-2xl border border-white/10 h-full overflow-hidden">
                        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-40 h-40 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-2xl opacity-70"></div>
                        
                        <motion.div 
                          className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-lg`}
                          whileHover={{ rotate: 5, scale: 1.05 }}
                          transition={{ type: "spring", damping: 10 }}
                        >
                          <feature.icon className="w-8 h-8 text-white" />
                        </motion.div>
                        
                        <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                        <p className="text-white/70 leading-relaxed">{feature.description}</p>
                        
                        <motion.div 
                          className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          whileHover={{ scale: 1.1, rotate: 45 }}
                        >
                          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
                            <ArrowRight className="w-5 h-5 text-white" />
                          </div>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              ))}            </div>
          </div>
        </div>        {/* CTA Section - Hidden initially */}
        <div 
          ref={ctaRef}
          className="absolute inset-0 z-10 py-32 px-4 flex items-center justify-center"
          style={{ opacity: 0 }}
        >
          <div className="max-w-4xl mx-auto text-center">
            <TiltCard>
              <motion.div
                className="glass-card p-12 rounded-3xl border-white/20 bg-gradient-to-br from-white/10 to-white/5 relative overflow-hidden"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", damping: 10 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
                
                <motion.h2 
                  className="text-4xl md:text-5xl font-bold gradient-text mb-6 relative z-10"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                >
                  Ready to Stack Your World?
                </motion.h2>
                
                <motion.p 
                  className="text-xl text-white/80 mb-8 relative z-10"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  viewport={{ once: true }}
                >
                  Join thousands of users who&apos;ve already transformed their media experience.
                </motion.p>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  viewport={{ once: true }}
                  className="relative z-10"
                >
                  <Link href="/auth/signup">
                    <MagneticButton size="lg" className="px-12 py-6 text-xl font-bold">
                      <Heart className="w-6 h-6 mr-3" />
                      Get Started Free
                      <Sparkles className="w-6 h-6 ml-3" />
                    </MagneticButton>
                  </Link>
                </motion.div>
                
                <p className="text-sm text-white/50 mt-4 relative z-10">
                  No credit card required • Start tracking in 30 seconds                </p>
              </motion.div>            </TiltCard>
          </div>
        </div>
      </div>
      
      {/* Spacer element to create scroll height for GSAP */}
      <div className="h-[300vh]"></div>
    </>
  )
}
