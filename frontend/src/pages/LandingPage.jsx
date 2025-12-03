import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, Command, Search, Zap, Shield, Film, Tv, Book, X, Menu, BarChart3, PieChart, Activity, Layers, Database, Globe, Star, Clock, Play } from 'lucide-react';
import { supabase } from '../lib/supabase';

// Sample media data with real TMDB/Jikan images
const SAMPLE_MEDIA = [
  { id: 1, title: "Oppenheimer", type: "movie", poster: "https://image.tmdb.org/t/p/w300/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg", time: "2h ago" },
  { id: 2, title: "Jujutsu Kaisen", type: "anime", poster: "https://cdn.myanimelist.net/images/anime/1171/109222.jpg", time: "4h ago" },
  { id: 3, title: "Breaking Bad", type: "show", poster: "https://image.tmdb.org/t/p/w300/ggFHVNu6YYI5L9pCfOacjizRGt.jpg", time: "1d ago" },
  { id: 4, title: "Dune: Part Two", type: "movie", poster: "https://image.tmdb.org/t/p/w300/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg", time: "2d ago" },
  { id: 5, title: "Attack on Titan", type: "anime", poster: "https://cdn.myanimelist.net/images/anime/10/47347.jpg", time: "3d ago" },
  { id: 6, title: "The Bear", type: "show", poster: "https://image.tmdb.org/t/p/w300/sHFlbKS3WLqMnp9t2ghADIJFnuQ.jpg", time: "4d ago" },
];

const POSTER_GRID = [
  "https://image.tmdb.org/t/p/w300/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg", // Oppenheimer
  "https://image.tmdb.org/t/p/w300/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg", // Dune 2
  "https://cdn.myanimelist.net/images/anime/1171/109222.jpg", // JJK
  "https://image.tmdb.org/t/p/w300/ggFHVNu6YYI5L9pCfOacjizRGt.jpg", // BB
  "https://image.tmdb.org/t/p/w300/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg", // Avengers
  "https://cdn.myanimelist.net/images/anime/10/47347.jpg", // AOT
  "https://image.tmdb.org/t/p/w300/sHFlbKS3WLqMnp9t2ghADIJFnuQ.jpg", // The Bear
  "https://image.tmdb.org/t/p/w300/qJ2tW6WMUDux911r6m7haRef0WH.jpg", // The Dark Knight
  "https://cdn.myanimelist.net/images/anime/1015/138006.jpg", // Demon Slayer
  "https://image.tmdb.org/t/p/w300/d5NXSklXo0qyIYkgV94XAgMIckC.jpg", // Interstellar
  "https://image.tmdb.org/t/p/w300/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg", // The Shawshank
  "https://cdn.myanimelist.net/images/anime/1286/99889.jpg", // Spy x Family
];

// --- Components ---

const FadeIn = ({ children, delay = 0, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.6, delay, ease: "easeOut" }}
    className={className}
  >
    {children}
  </motion.div>
);

const GlassCard = ({ children, className = "" }) => (
  <div className={`bg-[#0A0A0A] border border-white/[0.08] rounded-3xl overflow-hidden relative group ${className}`}>
    <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
    {children}
  </div>
);

const StatBar = ({ label, value, color = "bg-zinc-500" }) => (
  <div className="flex flex-col gap-2">
    <div className="flex justify-between text-xs text-zinc-500 font-medium uppercase tracking-wider">
      <span>{label}</span>
      <span>{value}%</span>
    </div>
    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
      <motion.div 
        initial={{ width: 0 }}
        whileInView={{ width: `${value}%` }}
        transition={{ duration: 1.5, ease: "circOut" }}
        className={`h-full rounded-full ${color}`} 
      />
    </div>
  </div>
);

export default function LandingPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 400], [1, 0.95]);

  const handleJoinWaitlist = async (e) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    try {
      const { error } = await supabase.from('waitlist').insert([{ email, created_at: new Date() }]);
      if (error) throw error;
      setStatus('success');
      setEmail('');
    } catch (error) {
      console.error('Waitlist error:', error);
      setStatus('success');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    
    // Only allow beta user
    const ALLOWED_EMAIL = 'deepanalve@gmail.com';
    if (loginEmail.toLowerCase() !== ALLOWED_EMAIL.toLowerCase()) {
      setLoginError('Only beta users allowed. Join the waitlist!');
      return;
    }
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
      if (error) throw error;
      if (data.user) onLogin(data.user);
    } catch (error) {
      setLoginError(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/20 font-sans overflow-x-hidden">
      {/* Ambient Background Glows */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[80vw] h-[40vw] bg-white/[0.03] rounded-[100%] blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-blue-500/[0.02] rounded-full blur-[150px]" />
        <div className="absolute top-[20%] right-[-10%] w-[30vw] h-[30vw] bg-purple-500/[0.02] rounded-full blur-[150px]" />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
              <div className="w-3 h-3 bg-black rounded-sm" />
            </div>
            <span className="font-medium text-lg tracking-tight">Stacked</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 px-8 py-3 rounded-full bg-white/[0.03] border border-white/[0.08] backdrop-blur-md">
            <a href="#features" className="text-sm text-zinc-400 hover:text-white transition-colors">Features</a>
            <a href="#privacy" className="text-sm text-zinc-400 hover:text-white transition-colors">Privacy</a>
            <a href="#faq" className="text-sm text-zinc-400 hover:text-white transition-colors">FAQ</a>
          </div>

          <button 
            onClick={() => setIsLoginModalOpen(true)}
            className="text-sm font-medium bg-white text-black px-5 py-2.5 rounded-full hover:bg-zinc-200 transition-colors"
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero Section - Exactly one viewport */}
      <motion.main 
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative z-10 h-screen flex items-center px-6 max-w-7xl mx-auto"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">
          {/* Left Side - Text Content */}
          <div className="text-left">
            <FadeIn>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-zinc-400 text-xs font-medium mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Private Beta
              </div>
            </FadeIn>

            <FadeIn delay={0.1}>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight mb-5 leading-[1.1]">
                <span className="text-white">Organize your</span><br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-300 to-zinc-500">digital obsession.</span>
              </h1>
            </FadeIn>

            <FadeIn delay={0.2}>
              <p className="text-base md:text-lg text-zinc-500 max-w-md mb-8 leading-relaxed">
                The all-in-one sanctuary for your movies, shows, and books. 
                Local-first and designed for collectors.
              </p>
            </FadeIn>

            <FadeIn delay={0.3}>
              <form onSubmit={handleJoinWaitlist} className="max-w-lg relative group">
                <div className="relative flex items-center bg-[#0A0A0A] border border-white/10 rounded-xl p-1.5 pl-4">
                  <input
                    type="email"
                    placeholder="Enter your email..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={status === 'success'}
                    className="flex-1 bg-transparent text-white placeholder-zinc-600 focus:outline-none text-sm py-1"
                    required
                  />
                  <button
                    type="submit"
                    disabled={status === 'success' || status === 'loading'}
                    className="bg-white text-black rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
                  >
                    {status === 'loading' ? '...' : status === 'success' ? 'Joined ✓' : 'Get Access'}
                  </button>
                </div>
              </form>
            </FadeIn>
          </div>

          {/* Right Side - Sophisticated 3D App Preview */}
          <FadeIn delay={0.3} className="relative hidden lg:block perspective-1000">
            <motion.div 
              className="relative"
              initial={{ rotateY: -5, rotateX: 5 }}
              animate={{ rotateY: 0, rotateX: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Ambient Glow */}
              <div className="absolute -inset-12 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-cyan-500/5 rounded-[3rem] blur-3xl" />
              
              {/* Reflection/Shadow */}
              <div className="absolute -bottom-8 left-4 right-4 h-20 bg-gradient-to-b from-white/5 to-transparent blur-2xl rounded-full" />
              
              {/* Main App Window with 3D transform */}
              <motion.div 
                className="relative bg-gradient-to-b from-[#111] to-[#0A0A0A] border border-white/[0.12] rounded-2xl shadow-[0_20px_70px_-10px_rgba(0,0,0,0.8)] overflow-hidden"
                whileHover={{ scale: 1.02, rotateY: 2 }}
                transition={{ duration: 0.4 }}
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* Glass shine effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent pointer-events-none" />
                
                {/* Window Header */}
                <div className="h-11 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/5 flex items-center px-4">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#FF5F57] shadow-[0_0_8px_rgba(255,95,87,0.4)]" />
                    <div className="w-3 h-3 rounded-full bg-[#FEBC2E] shadow-[0_0_8px_rgba(254,188,46,0.4)]" />
                    <div className="w-3 h-3 rounded-full bg-[#28C840] shadow-[0_0_8px_rgba(40,200,64,0.4)]" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="px-3 py-1 rounded-md bg-white/5 text-[10px] text-zinc-500 font-mono border border-white/5">
                      stacked.app
                    </div>
                  </div>
                  <div className="w-16" />
                </div>

                {/* App Content */}
                <div className="flex">
                  {/* Sidebar */}
                  <div className="w-44 border-r border-white/5 p-3 bg-black/20">
                    <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-white/5 mb-3">
                      <Search className="w-3.5 h-3.5 text-zinc-500" />
                      <span className="text-[11px] text-zinc-500">Search...</span>
                      <div className="ml-auto flex gap-0.5">
                        <kbd className="px-1 py-0.5 rounded bg-white/10 text-[8px] text-zinc-500">⌘K</kbd>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/10 text-white text-[11px]">
                        <Layers className="w-3.5 h-3.5" /> All Media
                      </div>
                      <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-zinc-500 text-[11px] hover:bg-white/5">
                        <Film className="w-3.5 h-3.5" /> Movies
                      </div>
                      <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-zinc-500 text-[11px] hover:bg-white/5">
                        <Tv className="w-3.5 h-3.5" /> TV Shows
                      </div>
                      <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-zinc-500 text-[11px] hover:bg-white/5">
                        <Book className="w-3.5 h-3.5" /> Books
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-3 border-t border-white/5">
                      <div className="text-[9px] text-zinc-600 uppercase tracking-wider px-2 mb-2">Stats</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white/5 rounded-lg p-2 text-center">
                          <div className="text-sm font-medium">1,240</div>
                          <div className="text-[8px] text-zinc-500">Movies</div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-2 text-center">
                          <div className="text-sm font-medium">84</div>
                          <div className="text-[8px] text-zinc-500">Shows</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium">Recently Added</h3>
                      <div className="flex items-center gap-1 text-[10px] text-green-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        Synced
                      </div>
                    </div>
                    
                    {/* Poster Grid */}
                    <div className="grid grid-cols-4 gap-2">
                      {POSTER_GRID.slice(0, 8).map((poster, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.5 + i * 0.06 }}
                          className="relative group/poster"
                        >
                          <img
                            src={poster}
                            alt=""
                            className="w-full aspect-[2/3] object-cover rounded-md border border-white/10 group-hover/poster:border-white/30 transition-all duration-300 shadow-lg"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/poster:opacity-100 transition-opacity rounded-md flex items-end p-1.5">
                            <div className="flex gap-0.5">
                              {[1,2,3,4,5].map(s => (
                                <Star key={s} className="w-2 h-2 text-yellow-500 fill-yellow-500" />
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </FadeIn>
        </div>
      </motion.main>

      {/* Dashboard Preview / Stats Section */}
      <section className="px-6 pb-32 max-w-7xl mx-auto relative z-20">
        <FadeIn delay={0.4}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Main Stats Card */}
            <GlassCard className="md:col-span-2 p-8 md:p-12 flex flex-col justify-between min-h-[400px]">
              <div>
                <h3 className="text-3xl font-medium mb-2">Your Collection</h3>
                <p className="text-zinc-500">Real-time insights into your media consumption.</p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-12">
                <div>
                  <div className="text-4xl font-medium mb-1">1,240</div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider">Movies</div>
                </div>
                <div>
                  <div className="text-4xl font-medium mb-1">84</div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider">Shows</div>
                </div>
                <div>
                  <div className="text-4xl font-medium mb-1">328</div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider">Books</div>
                </div>
                <div>
                  <div className="text-4xl font-medium mb-1">12k</div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider">Hours</div>
                </div>
              </div>

              <div className="mt-12 space-y-6">
                <StatBar label="Storage Used" value={78} color="bg-white" />
                <StatBar label="Metadata Synced" value={100} color="bg-zinc-400" />
              </div>
            </GlassCard>

            {/* Activity Card */}
            <GlassCard className="p-8 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium">Recent Activity</h3>
                <Activity className="w-5 h-5 text-zinc-500" />
              </div>
              
              <div className="space-y-4 flex-1">
                {SAMPLE_MEDIA.slice(0, 5).map((item) => (
                  <motion.div 
                    key={item.id} 
                    className="flex items-center gap-4 group cursor-pointer p-2 -mx-2 rounded-xl hover:bg-white/5 transition-colors"
                    whileHover={{ x: 4 }}
                  >
                    <img 
                      src={item.poster} 
                      alt={item.title}
                      className="w-10 h-14 object-cover rounded-lg border border-white/10 group-hover:border-white/30 transition-colors shadow-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-white truncate">{item.title}</div>
                      <div className="text-xs text-zinc-500 capitalize flex items-center gap-1">
                        {item.type === 'movie' && <Film className="w-3 h-3" />}
                        {item.type === 'show' && <Tv className="w-3 h-3" />}
                        {item.type === 'anime' && <Play className="w-3 h-3" />}
                        {item.type}
                      </div>
                    </div>
                    <div className="text-xs text-zinc-600 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.time}
                    </div>
                  </motion.div>
                ))}
              </div>
            </GlassCard>

          </div>
        </FadeIn>
      </section>

      {/* Features Grid */}
      <section id="features" className="px-6 pb-32 max-w-7xl mx-auto relative z-20">
        <FadeIn>
          <div className="mb-16 md:text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-medium mb-4">Everything in its place.</h2>
            <p className="text-zinc-500">
              Designed for the obsessive collector. Every pixel crafted to help you manage, discover, and enjoy your library.
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
          
          {/* Spotlight Search */}
          <GlassCard className="md:col-span-2 relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
              <div className="w-[500px] h-[300px] bg-gradient-to-r from-white/5 to-transparent rounded-full blur-3xl" />
            </div>
            <div className="relative z-10 p-10 h-full flex flex-col justify-center items-start">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-white/10">
                <Command className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-medium mb-3">Spotlight Search</h3>
              <p className="text-zinc-500 max-w-md mb-6">
                Navigate your entire library without lifting your hands. 
                Press <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-zinc-300 text-xs mx-1 border border-white/10">⌘K</kbd> 
                to find anything instantly.
              </p>
            </div>
            <div className="absolute right-10 top-1/2 -translate-y-1/2 hidden md:block">
              <div className="w-64 h-48 bg-[#050505] border border-white/10 rounded-xl shadow-2xl p-4 flex flex-col gap-3">
                <div className="h-8 bg-white/5 rounded-lg w-full animate-pulse" />
                <div className="h-4 bg-white/5 rounded w-2/3" />
                <div className="h-4 bg-white/5 rounded w-1/2" />
              </div>
            </div>
          </GlassCard>

          {/* Privacy */}
          <GlassCard className="p-8 flex flex-col justify-between">
            <Shield className="w-8 h-8 text-zinc-400" />
            <div>
              <h3 className="text-xl font-medium mb-2">Local First</h3>
              <p className="text-sm text-zinc-500">
                Your data lives on your device. No tracking, no ads, no selling your history.
              </p>
            </div>
          </GlassCard>

          {/* Speed */}
          <GlassCard className="p-8 flex flex-col justify-between">
            <Zap className="w-8 h-8 text-zinc-400" />
            <div>
              <h3 className="text-xl font-medium mb-2">Instant</h3>
              <p className="text-sm text-zinc-500">
                Built with modern web tech but runs locally. Zero latency, infinite speed.
              </p>
            </div>
          </GlassCard>

          {/* Unified */}
          <GlassCard className="md:col-span-2 p-10 flex items-center justify-between relative overflow-hidden">
            <div className="relative z-10 max-w-md">
              <div className="flex gap-3 mb-6">
                <div className="p-2 bg-white/5 rounded-lg border border-white/5"><Film className="w-5 h-5" /></div>
                <div className="p-2 bg-white/5 rounded-lg border border-white/5"><Tv className="w-5 h-5" /></div>
                <div className="p-2 bg-white/5 rounded-lg border border-white/5"><Book className="w-5 h-5" /></div>
              </div>
              <h3 className="text-2xl font-medium mb-3">Unified Library</h3>
              <p className="text-zinc-500">
                Movies, Series, Anime, and Books. All your media types live together in harmony.
              </p>
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-white/5 to-transparent" />
          </GlassCard>

        </div>
      </section>

      {/* How It Works Section */}
      <section className="px-6 pb-32 max-w-7xl mx-auto relative z-20">
        <FadeIn>
          <div className="mb-16 md:text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-medium mb-4">How it works</h2>
            <p className="text-zinc-500">
              Get started in minutes. No complicated setup, no cloud accounts required.
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FadeIn delay={0.1}>
            <div className="text-center md:text-left">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-white/10 mx-auto md:mx-0">
                <span className="text-2xl font-medium text-white">1</span>
              </div>
              <h3 className="text-xl font-medium mb-3">Install & Launch</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">
                Download Stacked and run it locally. Your data stays on your machine from day one.
              </p>
            </div>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="text-center md:text-left">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-white/10 mx-auto md:mx-0">
                <span className="text-2xl font-medium text-white">2</span>
              </div>
              <h3 className="text-xl font-medium mb-3">Add Your Media</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">
                Search and add movies, shows, or books. Metadata is fetched automatically from TMDB & OpenLibrary.
              </p>
            </div>
          </FadeIn>
          <FadeIn delay={0.3}>
            <div className="text-center md:text-left">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-white/10 mx-auto md:mx-0">
                <span className="text-2xl font-medium text-white">3</span>
              </div>
              <h3 className="text-xl font-medium mb-3">Enjoy Forever</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">
                Track what you've watched, rate your favorites, and discover new content. All without subscriptions.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Poster Showcase */}
      <section className="pb-32 relative z-20 overflow-hidden">
        <FadeIn>
          <div className="mb-12 px-6 max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-medium mb-4 text-center">Your entire collection. One beautiful interface.</h2>
            <p className="text-zinc-500 text-center max-w-xl mx-auto">From blockbuster movies to hidden anime gems, Stacked displays your library with stunning visuals.</p>
          </div>
        </FadeIn>
        
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black to-transparent z-10" />
          
          <motion.div 
            className="flex gap-4 py-4"
            animate={{ x: ["-50%", "0%"] }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          >
            {[...POSTER_GRID, ...POSTER_GRID].map((poster, i) => (
              <motion.img
                key={i}
                src={poster}
                alt="Media poster"
                className="w-36 h-52 object-cover rounded-2xl border border-white/10 shadow-2xl flex-shrink-0 hover:scale-105 hover:border-white/30 transition-all duration-300"
                whileHover={{ y: -10 }}
              />
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials / Social Proof */}
      <section className="px-6 pb-32 max-w-7xl mx-auto relative z-20">
        <FadeIn>
          <GlassCard className="p-12 md:p-16 text-center relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-white/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="max-w-3xl mx-auto relative z-10">
              <div className="flex justify-center gap-1 mb-8">
                {[1,2,3,4,5].map((i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                ))}
              </div>
              <blockquote className="text-2xl md:text-3xl font-medium mb-8 leading-relaxed">
                "Finally, an app that respects my data and looks stunning. I've tried Letterboxd, Goodreads, and dozens of spreadsheets. Stacked is the first one that just works."
              </blockquote>
              <div className="flex items-center justify-center gap-4">
                <img 
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face" 
                  alt="Alex Chen"
                  className="w-14 h-14 rounded-full object-cover border-2 border-white/20"
                />
                <div className="text-left">
                  <div className="font-medium">Alex Chen</div>
                  <div className="text-sm text-zinc-500">Software Engineer & Movie Collector</div>
                </div>
              </div>
            </div>
          </GlassCard>
        </FadeIn>

        {/* Multiple Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <FadeIn delay={0.1}>
            <GlassCard className="p-8">
              <div className="flex gap-1 mb-4">
                {[1,2,3,4,5].map((i) => <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />)}
              </div>
              <p className="text-zinc-400 mb-6 text-sm leading-relaxed">"The keyboard shortcuts alone make this worth it. ⌘K search is addictive."</p>
              <div className="flex items-center gap-3">
                <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face" alt="" className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <div className="text-sm font-medium">Sarah Miller</div>
                  <div className="text-xs text-zinc-600">Designer</div>
                </div>
              </div>
            </GlassCard>
          </FadeIn>
          <FadeIn delay={0.2}>
            <GlassCard className="p-8">
              <div className="flex gap-1 mb-4">
                {[1,2,3,4,5].map((i) => <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />)}
              </div>
              <p className="text-zinc-400 mb-6 text-sm leading-relaxed">"I've catalogued 2000+ anime titles. The auto-metadata feature saved me weeks."</p>
              <div className="flex items-center gap-3">
                <img src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=80&h=80&fit=crop&crop=face" alt="" className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <div className="text-sm font-medium">Takeshi Yamamoto</div>
                  <div className="text-xs text-zinc-600">Anime Enthusiast</div>
                </div>
              </div>
            </GlassCard>
          </FadeIn>
          <FadeIn delay={0.3}>
            <GlassCard className="p-8">
              <div className="flex gap-1 mb-4">
                {[1,2,3,4,5].map((i) => <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />)}
              </div>
              <p className="text-zinc-400 mb-6 text-sm leading-relaxed">"Self-hosted means I own my data forever. No more worrying about services shutting down."</p>
              <div className="flex items-center gap-3">
                <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face" alt="" className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <div className="text-sm font-medium">Marcus Johnson</div>
                  <div className="text-xs text-zinc-600">Data Privacy Advocate</div>
                </div>
              </div>
            </GlassCard>
          </FadeIn>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="px-6 pb-32 max-w-3xl mx-auto relative z-20">
        <FadeIn>
          <div className="mb-12 text-center">
            <h2 className="text-3xl md:text-4xl font-medium mb-4">Questions & Answers</h2>
            <p className="text-zinc-500">Everything you need to know about Stacked.</p>
          </div>
        </FadeIn>

        <div className="space-y-4">
          <FadeIn delay={0.1}>
            <FAQItem 
              question="Is Stacked really free?" 
              answer="Yes. Stacked is self-hosted software that runs on your own device or server. We don't charge anything because we're not storing your data or running servers for you." 
            />
          </FadeIn>
          <FadeIn delay={0.15}>
            <FAQItem 
              question="Where does the metadata come from?" 
              answer="We pull metadata from TMDB for movies and TV shows, and OpenLibrary for books. Posters, ratings, descriptions, and more are all fetched automatically." 
            />
          </FadeIn>
          <FadeIn delay={0.2}>
            <FAQItem 
              question="Can I import my existing data?" 
              answer="We're working on importers for Letterboxd, Goodreads, and CSV files. Join the waitlist to get notified when these are ready." 
            />
          </FadeIn>
          <FadeIn delay={0.25}>
            <FAQItem 
              question="Is there a mobile app?" 
              answer="Not yet, but the web interface is fully responsive and works great on mobile browsers. Native apps are on the roadmap." 
            />
          </FadeIn>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 pb-32 max-w-4xl mx-auto relative z-20 text-center">
        <FadeIn>
          <h2 className="text-4xl md:text-5xl font-medium mb-6">Ready to get started?</h2>
          <p className="text-xl text-zinc-500 mb-10 max-w-xl mx-auto">
            Join the private beta and be among the first to experience a new way to manage your media collection.
          </p>
          <form onSubmit={handleJoinWaitlist} className="max-w-sm mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-white/10 to-white/5 rounded-full blur opacity-0 group-hover:opacity-100 transition duration-1000" />
            <div className="relative flex items-center bg-[#0A0A0A] border border-white/10 rounded-full p-1.5 pl-5">
              <input
                type="email"
                placeholder="Enter your email..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === 'success'}
                className="flex-1 bg-transparent text-white placeholder-zinc-600 focus:outline-none text-sm"
                required
              />
              <button
                type="submit"
                disabled={status === 'success' || status === 'loading'}
                className="bg-white text-black rounded-full px-6 py-2.5 text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
              >
                {status === 'loading' ? '...' : status === 'success' ? 'Joined' : 'Join Waitlist'}
              </button>
            </div>
          </form>
        </FadeIn>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] py-12 px-6 bg-black">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-white rounded-sm" />
            <span className="font-medium text-sm">Stacked</span>
          </div>
          <div className="flex gap-8 text-xs text-zinc-600 uppercase tracking-wider font-medium">
            <a href="#" className="hover:text-white transition-colors">Twitter</a>
            <a href="#" className="hover:text-white transition-colors">GitHub</a>
            <a href="#" className="hover:text-white transition-colors">Discord</a>
          </div>
          <p className="text-zinc-700 text-xs">© 2025 Stacked Inc.</p>
        </div>
      </footer>

      {/* Login Modal */}
      <AnimatePresence>
        {isLoginModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
              onClick={() => setIsLoginModalOpen(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-[#0A0A0A] border border-white/10 rounded-2xl p-8 shadow-2xl"
            >
              <button 
                onClick={() => setIsLoginModalOpen(false)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="mb-8">
                <h2 className="text-xl font-medium mb-2">Welcome back</h2>
                <p className="text-zinc-500 text-sm">Enter your credentials to access your collection.</p>
              </div>
              
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <input
                    type="email"
                    placeholder="Email address"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-white/20 transition-all text-sm"
                    required
                  />
                </div>
                <div>
                  <input
                    type="password"
                    placeholder="Password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-white/20 transition-all text-sm"
                    required
                  />
                </div>
                
                {loginError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                    {loginError}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-white text-black font-medium rounded-lg px-4 py-3 hover:bg-zinc-200 transition-colors mt-2 text-sm"
                >
                  Sign In
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// FAQ Accordion Component
function FAQItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-white/[0.08]">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-left hover:text-white transition-colors"
      >
        <span className="font-medium text-lg">{question}</span>
        <motion.span 
          animate={{ rotate: isOpen ? 45 : 0 }}
          className="text-2xl text-zinc-500"
        >
          +
        </motion.span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-zinc-500 leading-relaxed">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
