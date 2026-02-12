import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, Command, Search, Zap, Shield, Film, Tv, Book, X, Menu, BarChart3, PieChart, Activity, Layers, Database, Globe, Star, Clock, Play } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

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

const StatBar = ({ label, value, color = "bg-gold-dark" }) => (
  <div className="flex flex-col gap-2">
    <div className="flex justify-between text-xs text-cinema-muted font-medium uppercase tracking-wider">
      <span>{label}</span>
      <span>{value}%</span>
    </div>
    <div className="h-1 w-full bg-gold-50 rounded-full overflow-hidden">
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
  const [loginLoading, setLoginLoading] = useState(false);

  const { login } = useAuth();

  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 400], [1, 0.95]);

  const handleJoinWaitlist = async (e) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    // Waitlist disabled - just show success
    setTimeout(() => {
      setStatus('success');
      setEmail('');
    }, 500);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    // Only allow beta user
    const ALLOWED_EMAIL = 'deepanalve@gmail.com';
    if (loginEmail.toLowerCase() !== ALLOWED_EMAIL.toLowerCase()) {
      setLoginError('Only beta users allowed. Join the waitlist!');
      setLoginLoading(false);
      return;
    }

    try {
      // Use the new HTTP-only cookie auth
      const user = await login(loginEmail, loginPassword);
      if (user) {
        onLogin(user);
        setIsLoginModalOpen(false);
      }
    } catch (error) {
      setLoginError(error.message);
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cinema-bg text-cinema-text selection:bg-gold/30 font-sans overflow-x-hidden">
      {/* Ambient Background Glows - warm cinematic tones */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[80vw] h-[40vw] bg-[rgba(196,162,101,0.03)] rounded-[100%] blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-[rgba(160,128,80,0.02)] rounded-full blur-[150px]" />
        <div className="absolute top-[20%] right-[-10%] w-[30vw] h-[30vw] bg-[rgba(196,162,101,0.02)] rounded-full blur-[150px]" />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-serif text-xl tracking-tight text-cinema-text">Stacked</span>
            <span className="text-gold text-xl font-serif">.</span>
          </div>

          <div className="hidden md:flex items-center gap-8 px-8 py-3 rounded-full glass border border-cinema-border">
            <a href="#features" className="text-sm text-cinema-muted hover:text-gold transition-colors duration-300">Features</a>
            <a href="#privacy" className="text-sm text-cinema-muted hover:text-gold transition-colors duration-300">Privacy</a>
            <a href="#faq" className="text-sm text-cinema-muted hover:text-gold transition-colors duration-300">FAQ</a>
          </div>

          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="text-sm font-medium text-gold border border-gold/30 px-5 py-2.5 rounded-full hover:bg-gold/10 hover:border-gold/50 transition-all duration-300"
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.main
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative z-10 h-screen flex items-center px-6 max-w-7xl mx-auto"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">
          {/* Left Side - Text Content */}
          <div className="text-left">
            <FadeIn>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold/20 text-gold text-xs font-medium mb-8 tracking-widest uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                Private Beta
              </div>
            </FadeIn>

            <FadeIn delay={0.1}>
              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl tracking-tight mb-6 leading-[1.1]">
                <span className="text-cinema-text">Curate your</span><br />
                <span className="text-gold italic">digital collection.</span>
              </h1>
            </FadeIn>

            <FadeIn delay={0.2}>
              <p className="text-base md:text-lg text-cinema-muted max-w-md mb-8 leading-relaxed">
                The all-in-one sanctuary for your movies, shows, and books.
                Local-first and designed for <em className="font-serif italic text-gold-light not-italic">collectors</em>.
              </p>
            </FadeIn>

            <FadeIn delay={0.3}>
              <div className="flex flex-col sm:flex-row gap-3 max-w-lg">
                <form onSubmit={handleJoinWaitlist} className="flex-1 relative group">
                  <div className="relative flex items-center bg-cinema-card border border-cinema-border rounded-lg p-1.5 pl-4 hover:border-gold/20 transition-colors duration-300">
                    <input
                      type="email"
                      placeholder="Enter your email..."
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={status === 'success'}
                      className="flex-1 bg-transparent text-cinema-text placeholder-cinema-subtle focus:outline-none text-sm py-1"
                      required
                    />
                    <button
                      type="submit"
                      disabled={status === 'success' || status === 'loading'}
                      className="bg-gold text-cinema-bg rounded-md px-5 py-2.5 text-sm font-medium hover:bg-gold-light transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                      {status === 'loading' ? '...' : status === 'success' ? 'Joined' : 'Enter the Collection'}
                    </button>
                  </div>
                </form>
                <a
                  href="/demo"
                  className="inline-flex items-center justify-center gap-2 border border-cinema-border hover:border-gold/20 text-cinema-muted hover:text-gold rounded-lg px-5 py-3 text-sm font-medium transition-all duration-300 group"
                >
                  <Play className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  Live Demo
                </a>
              </div>
            </FadeIn>
          </div>

          {/* Right Side - App Preview */}
          <FadeIn delay={0.3} className="relative hidden lg:block perspective-1000">
            <motion.div
              className="relative"
              initial={{ rotateY: -5, rotateX: 5 }}
              animate={{ rotateY: 0, rotateX: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Ambient Glow */}
              <div className="absolute -inset-12 bg-gradient-to-br from-[rgba(196,162,101,0.08)] via-[rgba(160,128,80,0.05)] to-transparent rounded-[3rem] blur-3xl" />

              {/* Reflection/Shadow */}
              <div className="absolute -bottom-8 left-4 right-4 h-20 bg-gradient-to-b from-gold/5 to-transparent blur-2xl rounded-full" />

              {/* Main App Window */}
              <motion.div
                className="relative bg-gradient-to-b from-cinema-card to-cinema-bg border border-cinema-border rounded-2xl shadow-[0_20px_70px_-10px_rgba(0,0,0,0.8)] overflow-hidden"
                whileHover={{ scale: 1.02, rotateY: 2 }}
                transition={{ duration: 0.4 }}
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* Glass shine effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-gold/[0.04] via-transparent to-transparent pointer-events-none" />

                {/* Window Header */}
                <div className="h-11 bg-cinema-bg/80 backdrop-blur-xl border-b border-cinema-border flex items-center px-4">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#FF5F57] shadow-[0_0_8px_rgba(255,95,87,0.3)]" />
                    <div className="w-3 h-3 rounded-full bg-gold shadow-[0_0_8px_rgba(196,162,101,0.3)]" />
                    <div className="w-3 h-3 rounded-full bg-[#28C840] shadow-[0_0_8px_rgba(40,200,64,0.3)]" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="px-3 py-1 rounded-md bg-gold-50 text-[10px] text-cinema-muted font-mono border border-cinema-border">
                      stacked.app
                    </div>
                  </div>
                  <div className="w-16" />
                </div>

                {/* App Content */}
                <div className="flex">
                  {/* Sidebar */}
                  <div className="w-44 border-r border-cinema-border p-3 bg-cinema-bg/40">
                    <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-gold-50 mb-3 border border-cinema-border">
                      <Search className="w-3.5 h-3.5 text-cinema-subtle" />
                      <span className="text-[11px] text-cinema-subtle">Search...</span>
                      <div className="ml-auto flex gap-0.5">
                        <kbd className="px-1 py-0.5 rounded bg-gold-50 text-[8px] text-cinema-muted border border-cinema-border">&#8984;K</kbd>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-gold/10 text-gold text-[11px] border border-gold/10">
                        <Layers className="w-3.5 h-3.5" /> All Media
                      </div>
                      <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-cinema-subtle text-[11px] hover:bg-gold-50 hover:text-cinema-muted transition-colors">
                        <Film className="w-3.5 h-3.5" /> Movies
                      </div>
                      <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-cinema-subtle text-[11px] hover:bg-gold-50 hover:text-cinema-muted transition-colors">
                        <Tv className="w-3.5 h-3.5" /> TV Shows
                      </div>
                      <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-cinema-subtle text-[11px] hover:bg-gold-50 hover:text-cinema-muted transition-colors">
                        <Book className="w-3.5 h-3.5" /> Books
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-cinema-border">
                      <div className="text-[9px] text-cinema-subtle uppercase tracking-wider px-2 mb-2">Stats</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-gold-50 rounded-lg p-2 text-center border border-cinema-border">
                          <div className="text-sm font-medium text-gold">1,240</div>
                          <div className="text-[8px] text-cinema-subtle">Movies</div>
                        </div>
                        <div className="bg-gold-50 rounded-lg p-2 text-center border border-cinema-border">
                          <div className="text-sm font-medium text-gold">84</div>
                          <div className="text-[8px] text-cinema-subtle">Shows</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-serif text-cinema-text">Recently Added</h3>
                      <div className="flex items-center gap-1 text-[10px] text-gold">
                        <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
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
                            className="w-full aspect-[2/3] object-cover rounded-md border border-cinema-border group-hover/poster:border-gold/30 transition-all duration-300 shadow-lg"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-cinema-bg/60 via-transparent to-transparent opacity-0 group-hover/poster:opacity-100 transition-opacity rounded-md flex items-end p-1.5">
                            <div className="flex gap-0.5">
                              {[1,2,3,4,5].map(s => (
                                <Star key={s} className="w-2 h-2 text-gold fill-gold" />
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

      {/* Gold Divider */}
      <div className="gold-divider max-w-7xl mx-auto" />

      {/* Dashboard Preview / Stats Section */}
      <section className="px-6 py-32 max-w-7xl mx-auto relative z-20">
        <FadeIn delay={0.4}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Main Stats Card */}
            <div className="cinema-card md:col-span-2 p-8 md:p-12 flex flex-col justify-between min-h-[400px]">
              <div>
                <h3 className="font-serif text-3xl text-cinema-text mb-2">Your Collection</h3>
                <p className="text-cinema-muted text-sm">Real-time insights into your media consumption.</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-12">
                <div>
                  <div className="font-serif text-4xl text-gold mb-1">1,240</div>
                  <div className="text-xs text-cinema-subtle uppercase tracking-widest">Movies</div>
                </div>
                <div>
                  <div className="font-serif text-4xl text-gold mb-1">84</div>
                  <div className="text-xs text-cinema-subtle uppercase tracking-widest">Shows</div>
                </div>
                <div>
                  <div className="font-serif text-4xl text-gold mb-1">328</div>
                  <div className="text-xs text-cinema-subtle uppercase tracking-widest">Books</div>
                </div>
                <div>
                  <div className="font-serif text-4xl text-gold mb-1">12k</div>
                  <div className="text-xs text-cinema-subtle uppercase tracking-widest">Hours</div>
                </div>
              </div>

              <div className="mt-12 space-y-6">
                <StatBar label="Storage Used" value={78} color="bg-gold" />
                <StatBar label="Metadata Synced" value={100} color="bg-gold-dark" />
              </div>
            </div>

            {/* Activity Card */}
            <div className="cinema-card p-8 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-serif text-lg text-cinema-text">Recent Activity</h3>
                <Activity className="w-5 h-5 text-gold-dark" />
              </div>

              <div className="space-y-4 flex-1">
                {SAMPLE_MEDIA.slice(0, 5).map((item) => (
                  <motion.div
                    key={item.id}
                    className="flex items-center gap-4 group cursor-pointer p-2 -mx-2 rounded-lg hover:bg-gold-50 transition-colors duration-300"
                    whileHover={{ x: 4 }}
                  >
                    <img
                      src={item.poster}
                      alt={item.title}
                      className="w-10 h-14 object-cover rounded-md border border-cinema-border group-hover:border-gold/30 transition-colors shadow-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-cinema-text truncate">{item.title}</div>
                      <div className="text-xs text-cinema-subtle capitalize flex items-center gap-1">
                        {item.type === 'movie' && <Film className="w-3 h-3" />}
                        {item.type === 'show' && <Tv className="w-3 h-3" />}
                        {item.type === 'anime' && <Play className="w-3 h-3" />}
                        {item.type}
                      </div>
                    </div>
                    <div className="text-xs text-cinema-subtle flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.time}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

          </div>
        </FadeIn>
      </section>

      {/* Gold Divider */}
      <div className="gold-divider max-w-7xl mx-auto" />

      {/* Features Grid */}
      <section id="features" className="px-6 py-32 max-w-7xl mx-auto relative z-20">
        <FadeIn>
          <div className="mb-16 md:text-center max-w-2xl mx-auto">
            <h2 className="font-serif text-3xl md:text-4xl text-cinema-text mb-4">
              Everything in its <em className="italic text-gold">place.</em>
            </h2>
            <p className="text-cinema-muted">
              Designed for the obsessive collector. Every detail crafted to help you manage, discover, and enjoy your library.
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">

          {/* 01 - Spotlight Search */}
          <div className="cinema-card md:col-span-2 relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
              <div className="w-[500px] h-[300px] bg-gradient-to-r from-gold/5 to-transparent rounded-full blur-3xl" />
            </div>
            <div className="relative z-10 p-10 h-full flex flex-col justify-center items-start">
              <span className="font-serif italic text-gold-dark text-sm mb-4 tracking-wide">01</span>
              <div className="gold-divider w-12 mb-6" />
              <h3 className="font-serif text-2xl text-cinema-text mb-3">Spotlight Search</h3>
              <p className="text-cinema-muted max-w-md mb-6 text-sm leading-relaxed">
                Navigate your entire library without lifting your hands.
                Press <kbd className="bg-gold-50 px-1.5 py-0.5 rounded text-gold text-xs mx-1 border border-cinema-border">&#8984;K</kbd>
                to find anything instantly.
              </p>
            </div>
            <div className="absolute right-10 top-1/2 -translate-y-1/2 hidden md:block">
              <div className="w-64 h-48 bg-cinema-bg border border-cinema-border rounded-xl shadow-2xl p-4 flex flex-col gap-3">
                <div className="h-8 bg-gold-50 rounded-lg w-full animate-pulse" />
                <div className="h-4 bg-gold-50 rounded w-2/3" />
                <div className="h-4 bg-gold-50 rounded w-1/2" />
              </div>
            </div>
          </div>

          {/* 02 - Local First */}
          <div className="cinema-card p-8 flex flex-col justify-between">
            <div>
              <span className="font-serif italic text-gold-dark text-sm tracking-wide">02</span>
              <div className="gold-divider w-8 mt-3 mb-4" />
              <Shield className="w-8 h-8 text-gold-dark mb-4" />
            </div>
            <div>
              <h3 className="font-serif text-xl text-cinema-text mb-2">Local First</h3>
              <p className="text-sm text-cinema-muted leading-relaxed">
                Your data lives on your device. No tracking, no ads, no selling your history.
              </p>
            </div>
          </div>

          {/* 03 - Instant */}
          <div className="cinema-card p-8 flex flex-col justify-between">
            <div>
              <span className="font-serif italic text-gold-dark text-sm tracking-wide">03</span>
              <div className="gold-divider w-8 mt-3 mb-4" />
              <Zap className="w-8 h-8 text-gold-dark mb-4" />
            </div>
            <div>
              <h3 className="font-serif text-xl text-cinema-text mb-2">Instant</h3>
              <p className="text-sm text-cinema-muted leading-relaxed">
                Built with modern web tech but runs locally. Zero latency, infinite speed.
              </p>
            </div>
          </div>

          {/* 04 - Unified Library */}
          <div className="cinema-card md:col-span-2 p-10 flex items-center justify-between relative overflow-hidden">
            <div className="relative z-10 max-w-md">
              <span className="font-serif italic text-gold-dark text-sm tracking-wide">04</span>
              <div className="gold-divider w-8 mt-3 mb-6" />
              <div className="flex gap-3 mb-6">
                <div className="p-2 bg-gold-50 rounded-lg border border-cinema-border"><Film className="w-5 h-5 text-gold" /></div>
                <div className="p-2 bg-gold-50 rounded-lg border border-cinema-border"><Tv className="w-5 h-5 text-gold" /></div>
                <div className="p-2 bg-gold-50 rounded-lg border border-cinema-border"><Book className="w-5 h-5 text-gold" /></div>
              </div>
              <h3 className="font-serif text-2xl text-cinema-text mb-3">Unified Library</h3>
              <p className="text-cinema-muted text-sm leading-relaxed">
                Movies, Series, Anime, and Books. All your media types live together in <em className="font-serif italic text-gold-light">harmony</em>.
              </p>
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-gold/5 to-transparent" />
          </div>

        </div>
      </section>

      {/* Gold Divider */}
      <div className="gold-divider max-w-7xl mx-auto" />

      {/* How It Works Section */}
      <section className="px-6 py-32 max-w-7xl mx-auto relative z-20">
        <FadeIn>
          <div className="mb-16 md:text-center max-w-2xl mx-auto">
            <h2 className="font-serif text-3xl md:text-4xl text-cinema-text mb-4">
              How it <em className="italic text-gold">works</em>
            </h2>
            <p className="text-cinema-muted">
              Get started in minutes. No complicated setup, no cloud accounts required.
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FadeIn delay={0.1}>
            <div className="text-center md:text-left">
              <span className="font-serif italic text-gold text-4xl block mb-4">01</span>
              <div className="gold-divider w-12 mb-6 mx-auto md:mx-0" />
              <h3 className="font-serif text-xl text-cinema-text mb-3">Install & Launch</h3>
              <p className="text-cinema-muted text-sm leading-relaxed">
                Download Stacked and run it locally. Your data stays on your machine from day one.
              </p>
            </div>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="text-center md:text-left">
              <span className="font-serif italic text-gold text-4xl block mb-4">02</span>
              <div className="gold-divider w-12 mb-6 mx-auto md:mx-0" />
              <h3 className="font-serif text-xl text-cinema-text mb-3">Add Your Media</h3>
              <p className="text-cinema-muted text-sm leading-relaxed">
                Search and add movies, shows, or books. Metadata is fetched automatically from TMDB & OpenLibrary.
              </p>
            </div>
          </FadeIn>
          <FadeIn delay={0.3}>
            <div className="text-center md:text-left">
              <span className="font-serif italic text-gold text-4xl block mb-4">03</span>
              <div className="gold-divider w-12 mb-6 mx-auto md:mx-0" />
              <h3 className="font-serif text-xl text-cinema-text mb-3">Enjoy Forever</h3>
              <p className="text-cinema-muted text-sm leading-relaxed">
                Track what you've watched, rate your favorites, and discover new content. All without subscriptions.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Gold Divider */}
      <div className="gold-divider max-w-7xl mx-auto" />

      {/* Poster Showcase */}
      <section className="py-32 relative z-20 overflow-hidden">
        <FadeIn>
          <div className="mb-12 px-6 max-w-7xl mx-auto">
            <h2 className="font-serif text-3xl md:text-4xl text-cinema-text mb-4 text-center">
              Your entire collection. One <em className="italic text-gold">beautiful</em> interface.
            </h2>
            <p className="text-cinema-muted text-center max-w-xl mx-auto">From blockbuster movies to hidden anime gems, Stacked displays your library with stunning visuals.</p>
          </div>
        </FadeIn>

        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-cinema-bg to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-cinema-bg to-transparent z-10" />

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
                className="w-36 h-52 object-cover rounded-lg border border-cinema-border shadow-2xl flex-shrink-0 hover:scale-105 hover:border-gold/30 transition-all duration-300"
                whileHover={{ y: -10 }}
              />
            ))}
          </motion.div>
        </div>
      </section>

      {/* Gold Divider */}
      <div className="gold-divider max-w-7xl mx-auto" />

      {/* Testimonials / Social Proof */}
      <section className="px-6 py-32 max-w-7xl mx-auto relative z-20">
        <FadeIn>
          <div className="cinema-card p-12 md:p-16 text-center relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-gold/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="max-w-3xl mx-auto relative z-10">
              <div className="flex justify-center gap-1 mb-8">
                {[1,2,3,4,5].map((i) => (
                  <Star key={i} className="w-5 h-5 text-gold fill-gold" />
                ))}
              </div>
              <blockquote className="font-serif text-2xl md:text-3xl text-cinema-text mb-8 leading-relaxed italic">
                "Finally, an app that respects my data and looks <span className="text-gold">stunning</span>. I've tried Letterboxd, Goodreads, and dozens of spreadsheets. Stacked is the first one that just works."
              </blockquote>
              <div className="gold-divider w-16 mx-auto mb-8" />
              <div className="flex items-center justify-center gap-4">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
                  alt="Alex Chen"
                  className="w-14 h-14 rounded-full object-cover border-2 border-gold/20"
                />
                <div className="text-left">
                  <div className="font-medium text-cinema-text">Alex Chen</div>
                  <div className="text-sm text-cinema-muted">Software Engineer & Movie Collector</div>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Multiple Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <FadeIn delay={0.1}>
            <div className="cinema-card p-8">
              <div className="flex gap-1 mb-4">
                {[1,2,3,4,5].map((i) => <Star key={i} className="w-4 h-4 text-gold fill-gold" />)}
              </div>
              <p className="text-cinema-muted mb-6 text-sm leading-relaxed">"The keyboard shortcuts alone make this worth it. &#8984;K search is addictive."</p>
              <div className="gold-divider w-8 mb-4" />
              <div className="flex items-center gap-3">
                <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face" alt="" className="w-10 h-10 rounded-full object-cover border border-gold/20" />
                <div>
                  <div className="text-sm font-medium text-cinema-text">Sarah Miller</div>
                  <div className="text-xs text-cinema-subtle">Designer</div>
                </div>
              </div>
            </div>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="cinema-card p-8">
              <div className="flex gap-1 mb-4">
                {[1,2,3,4,5].map((i) => <Star key={i} className="w-4 h-4 text-gold fill-gold" />)}
              </div>
              <p className="text-cinema-muted mb-6 text-sm leading-relaxed">"I've catalogued 2000+ anime titles. The auto-metadata feature saved me weeks."</p>
              <div className="gold-divider w-8 mb-4" />
              <div className="flex items-center gap-3">
                <img src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=80&h=80&fit=crop&crop=face" alt="" className="w-10 h-10 rounded-full object-cover border border-gold/20" />
                <div>
                  <div className="text-sm font-medium text-cinema-text">Takeshi Yamamoto</div>
                  <div className="text-xs text-cinema-subtle">Anime Enthusiast</div>
                </div>
              </div>
            </div>
          </FadeIn>
          <FadeIn delay={0.3}>
            <div className="cinema-card p-8">
              <div className="flex gap-1 mb-4">
                {[1,2,3,4,5].map((i) => <Star key={i} className="w-4 h-4 text-gold fill-gold" />)}
              </div>
              <p className="text-cinema-muted mb-6 text-sm leading-relaxed">"Self-hosted means I own my data forever. No more worrying about services shutting down."</p>
              <div className="gold-divider w-8 mb-4" />
              <div className="flex items-center gap-3">
                <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face" alt="" className="w-10 h-10 rounded-full object-cover border border-gold/20" />
                <div>
                  <div className="text-sm font-medium text-cinema-text">Marcus Johnson</div>
                  <div className="text-xs text-cinema-subtle">Data Privacy Advocate</div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Gold Divider */}
      <div className="gold-divider max-w-3xl mx-auto" />

      {/* FAQ Section */}
      <section id="faq" className="px-6 py-32 max-w-3xl mx-auto relative z-20">
        <FadeIn>
          <div className="mb-12 text-center">
            <h2 className="font-serif text-3xl md:text-4xl text-cinema-text mb-4">
              Questions & <em className="italic text-gold">Answers</em>
            </h2>
            <p className="text-cinema-muted">Everything you need to know about Stacked.</p>
          </div>
        </FadeIn>

        <div className="space-y-0">
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

      {/* Gold Divider */}
      <div className="gold-divider max-w-4xl mx-auto" />

      {/* CTA Section */}
      <section id="join" className="px-6 py-32 max-w-4xl mx-auto relative z-20 text-center">
        <FadeIn>
          <h2 className="font-serif text-4xl md:text-5xl text-cinema-text mb-6">
            Ready to <em className="italic text-gold">begin</em>?
          </h2>
          <p className="text-lg text-cinema-muted mb-10 max-w-xl mx-auto">
            Join the private beta and be among the first to experience a new way to manage your media collection.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <form onSubmit={handleJoinWaitlist} className="flex-1 relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-gold/10 to-gold/5 rounded-lg blur opacity-0 group-hover:opacity-100 transition duration-1000" />
              <div className="relative flex items-center bg-cinema-card border border-cinema-border rounded-lg p-1.5 pl-5 hover:border-gold/20 transition-colors duration-300">
                <input
                  type="email"
                  placeholder="Enter your email..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={status === 'success'}
                  className="flex-1 bg-transparent text-cinema-text placeholder-cinema-subtle focus:outline-none text-sm"
                  required
                />
                <button
                  type="submit"
                  disabled={status === 'success' || status === 'loading'}
                  className="bg-gold text-cinema-bg rounded-md px-6 py-2.5 text-sm font-medium hover:bg-gold-light transition-colors disabled:opacity-50"
                >
                  {status === 'loading' ? '...' : status === 'success' ? 'Joined' : 'Join Waitlist'}
                </button>
              </div>
            </form>
            <a
              href="/demo"
              className="inline-flex items-center justify-center gap-2 border border-cinema-border hover:border-gold/20 text-cinema-muted hover:text-gold rounded-lg px-6 py-3 text-sm font-medium transition-all duration-300"
            >
              <Play className="w-4 h-4" />
              Try Demo
            </a>
          </div>
        </FadeIn>
      </section>

      {/* Footer */}
      <footer className="border-t border-cinema-border py-12 px-6 bg-cinema-bg">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="font-serif text-sm text-cinema-text">Stacked</span>
            <span className="text-gold font-serif">.</span>
          </div>
          <div className="flex gap-8 text-xs text-cinema-subtle uppercase tracking-widest font-medium">
            <a href="#" className="hover:text-gold transition-colors duration-300">Twitter</a>
            <a href="#" className="hover:text-gold transition-colors duration-300">GitHub</a>
            <a href="#" className="hover:text-gold transition-colors duration-300">Discord</a>
          </div>
          <p className="text-cinema-subtle text-xs">&copy; 2025 Stacked Inc.</p>
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
              className="absolute inset-0 bg-cinema-bg/80 backdrop-blur-sm"
              onClick={() => setIsLoginModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-cinema-card border border-cinema-border rounded-2xl p-8 shadow-2xl"
            >
              {/* Subtle gold glow at top */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-gold/5 rounded-full blur-3xl pointer-events-none" />

              <button
                onClick={() => setIsLoginModalOpen(false)}
                className="absolute top-4 right-4 text-cinema-subtle hover:text-gold transition-colors duration-300"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-8 relative z-10">
                <h2 className="font-serif text-xl text-cinema-text mb-2">Welcome <em className="italic text-gold">back</em></h2>
                <p className="text-cinema-muted text-sm">Enter your credentials to access your collection.</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4 relative z-10">
                <div>
                  <input
                    type="email"
                    placeholder="Email address"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    disabled={loginLoading}
                    className="w-full bg-gold-50 border border-cinema-border rounded-lg px-4 py-3 text-cinema-text placeholder-cinema-subtle focus:outline-none focus:border-gold/30 transition-all duration-300 text-sm disabled:opacity-50"
                    required
                  />
                </div>
                <div>
                  <input
                    type="password"
                    placeholder="Password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    disabled={loginLoading}
                    className="w-full bg-gold-50 border border-cinema-border rounded-lg px-4 py-3 text-cinema-text placeholder-cinema-subtle focus:outline-none focus:border-gold/30 transition-all duration-300 text-sm disabled:opacity-50"
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
                  disabled={loginLoading}
                  className="w-full bg-gold text-cinema-bg font-medium rounded-lg px-4 py-3 hover:bg-gold-light transition-colors duration-300 mt-2 text-sm disabled:opacity-50"
                >
                  {loginLoading ? 'Signing in...' : 'Sign In'}
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
    <div className="border-b border-cinema-border">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-left group"
      >
        <span className="font-serif text-lg text-cinema-text group-hover:text-gold transition-colors duration-300">{question}</span>
        <motion.span
          animate={{ rotate: isOpen ? 45 : 0 }}
          className="text-2xl text-gold-dark"
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
            <p className="pb-6 text-cinema-muted leading-relaxed text-sm">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
