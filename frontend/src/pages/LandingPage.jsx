import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, Command, Search, Zap, Shield, Film, Tv, Book, X, Menu, Layers, Star, Play, Download, Plus, Heart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

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

export default function LandingPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const { login } = useAuth();
  const heroRef = useRef(null);
  const heroContentRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Scrub-based fade — no pinning, no extra spacing, no gap
      gsap.to(heroContentRef.current, {
        opacity: 0,
        scale: 0.95,
        y: -50,
        ease: 'none',
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: '55% top',
          scrub: true,
        },
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

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
      <nav className="absolute top-0 left-0 right-0 z-50 px-6 py-6">
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
      <section ref={heroRef} className="relative z-10 min-h-[90vh] flex items-center">
        <div ref={heroContentRef} className="px-6 max-w-7xl mx-auto w-full">

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
        </div>
      </section>

      {/* Media Types Showcase */}
      <section className="px-6 py-20 max-w-6xl mx-auto relative z-20">
        <FadeIn>
          <div className="mb-10 md:text-center max-w-2xl mx-auto">
            <h2 className="font-serif text-3xl md:text-4xl text-cinema-text mb-4">
              One home for <em className="italic text-gold">everything</em> you watch and read.
            </h2>
            <p className="text-cinema-muted">
              Movies, series, anime, and books — no more scattered spreadsheets and forgotten accounts.
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">

          {/* Movies */}
          <FadeIn delay={0.1}>
            <div className="group relative overflow-hidden rounded-xl aspect-[2/3] cursor-pointer">
              <img
                src="https://image.tmdb.org/t/p/w780/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg"
                alt="Oppenheimer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent group-hover:from-black/90 group-hover:via-black/60 transition-all duration-500" />
              <div className="absolute bottom-3 left-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-[10px] text-gold uppercase tracking-[0.2em] font-medium">
                  <Film className="w-3 h-3" /> Movies
                </span>
              </div>
              <div className="absolute inset-0 flex flex-col justify-center items-center p-5 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <Film className="w-6 h-6 text-gold mb-3" />
                <h4 className="font-serif text-lg text-white mb-2">Blockbusters to indie gems</h4>
                <p className="text-xs text-white/70 leading-relaxed">Posters, cast, ratings & synopses auto-fetched from TMDB.</p>
              </div>
            </div>
          </FadeIn>

          {/* TV Shows */}
          <FadeIn delay={0.2}>
            <div className="group relative overflow-hidden rounded-xl aspect-[2/3] cursor-pointer">
              <img
                src="https://image.tmdb.org/t/p/w780/ggFHVNu6YYI5L9pCfOacjizRGt.jpg"
                alt="Breaking Bad"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent group-hover:from-black/90 group-hover:via-black/60 transition-all duration-500" />
              <div className="absolute bottom-3 left-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-[10px] text-gold uppercase tracking-[0.2em] font-medium">
                  <Tv className="w-3 h-3" /> Series
                </span>
              </div>
              <div className="absolute inset-0 flex flex-col justify-center items-center p-5 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <Tv className="w-6 h-6 text-gold mb-3" />
                <h4 className="font-serif text-lg text-white mb-2">Track every season</h4>
                <p className="text-xs text-white/70 leading-relaxed">Episodes, progress & watchlists — all in one place.</p>
              </div>
            </div>
          </FadeIn>

          {/* Anime */}
          <FadeIn delay={0.3}>
            <div className="group relative overflow-hidden rounded-xl aspect-[2/3] cursor-pointer">
              <img
                src="https://image.tmdb.org/t/p/w780/tCZFfYTIwrR7n94J6G14Y4hAFU6.jpg"
                alt="Death Note"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent group-hover:from-black/90 group-hover:via-black/60 transition-all duration-500" />
              <div className="absolute bottom-3 left-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-[10px] text-gold uppercase tracking-[0.2em] font-medium">
                  <Play className="w-3 h-3" /> Anime
                </span>
              </div>
              <div className="absolute inset-0 flex flex-col justify-center items-center p-5 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <Play className="w-6 h-6 text-gold mb-3" />
                <h4 className="font-serif text-lg text-white mb-2">Powered by AniList</h4>
                <p className="text-xs text-white/70 leading-relaxed">Every title catalogued with full metadata & cover art.</p>
              </div>
            </div>
          </FadeIn>

          {/* Books */}
          <FadeIn delay={0.4}>
            <div className="group relative overflow-hidden rounded-xl aspect-[2/3] cursor-pointer">
              <img
                src="/iron-flame-cover.jpg"
                alt="Iron Flame by Rebecca Yarros"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent group-hover:from-black/90 group-hover:via-black/60 transition-all duration-500" />
              <div className="absolute bottom-3 left-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-[10px] text-gold uppercase tracking-[0.2em] font-medium">
                  <Book className="w-3 h-3" /> Books
                </span>
              </div>
              <div className="absolute inset-0 flex flex-col justify-center items-center p-5 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <Book className="w-6 h-6 text-gold mb-3" />
                <h4 className="font-serif text-lg text-white mb-2">Covers & metadata</h4>
                <p className="text-xs text-white/70 leading-relaxed">Synced from OpenLibrary. Search, add & rate your reads.</p>
              </div>
            </div>
          </FadeIn>

        </div>
      </section>

      {/* Features — Alternating Rows */}
      <section id="features" className="px-6 py-20 max-w-6xl mx-auto relative z-20">
        <FadeIn>
          <div className="mb-14 md:text-center max-w-2xl mx-auto">
            <h2 className="font-serif text-3xl md:text-4xl text-cinema-text mb-4">
              Built for <em className="italic text-gold">collectors.</em>
            </h2>
            <p className="text-cinema-muted">
              Every detail crafted so you can focus on what matters — your library.
            </p>
          </div>
        </FadeIn>

        <div className="space-y-16">
          {/* Feature 1 — Spotlight Search */}
          <FadeIn>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
              <div>
                <span className="font-serif italic text-gold-dark text-xs tracking-widest uppercase block mb-4">Search</span>
                <h3 className="font-serif text-xl md:text-2xl text-cinema-text mb-4">Find anything with <em className="italic text-gold">one keystroke.</em></h3>
                <p className="text-cinema-muted text-sm leading-relaxed mb-6">
                  Press <kbd className="bg-gold-50 px-2 py-1 rounded text-gold text-xs mx-1 border border-cinema-border font-mono">&#8984;K</kbd> to instantly search across your entire library — movies, shows, anime, and books. No menus, no clicking around.
                </p>
                <div className="flex items-center gap-3 text-xs text-cinema-subtle">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gold-50 border border-cinema-border">
                    <Command className="w-3 h-3 text-gold" /> Keyboard-first
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gold-50 border border-cinema-border">
                    <Zap className="w-3 h-3 text-gold" /> Instant results
                  </div>
                </div>
              </div>
              <div className="cinema-card p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-gold/[0.03] to-transparent pointer-events-none" />
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gold-50 border border-cinema-border mb-4">
                  <Search className="w-4 h-4 text-cinema-subtle" />
                  <span className="text-sm text-cinema-muted flex-1">Search your library...</span>
                  <kbd className="px-2 py-0.5 rounded bg-cinema-bg text-[10px] text-cinema-subtle border border-cinema-border font-mono">&#8984;K</kbd>
                </div>
                <div className="space-y-2">
                  {[
                    { title: "Oppenheimer", sub: "Movie · 2023", color: "border-l-gold" },
                    { title: "Breaking Bad", sub: "Series · 5 Seasons", color: "border-l-gold-dark" },
                    { title: "Death Note", sub: "Anime · 37 Episodes", color: "border-l-gold/60" },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      viewport={{ once: true }}
                      className={`flex items-center justify-between px-4 py-3 rounded-lg bg-cinema-bg/50 border-l-2 ${item.color} hover:bg-gold-50 transition-colors cursor-pointer`}
                    >
                      <div>
                        <div className="text-sm text-cinema-text font-medium">{item.title}</div>
                        <div className="text-[11px] text-cinema-subtle">{item.sub}</div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-cinema-subtle" />
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Feature 2 — Privacy / Local First */}
          <FadeIn>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
              <div className="md:order-2">
                <span className="font-serif italic text-gold-dark text-xs tracking-widest uppercase block mb-4">Privacy</span>
                <h3 className="font-serif text-xl md:text-2xl text-cinema-text mb-4">Your data never <em className="italic text-gold">leaves.</em></h3>
                <p className="text-cinema-muted text-sm leading-relaxed mb-6">
                  Stacked is self-hosted. Your collection lives on your device — no cloud accounts, no tracking, no ads. You own your data completely, forever.
                </p>
                <div className="flex items-center gap-3 text-xs text-cinema-subtle">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gold-50 border border-cinema-border">
                    <Shield className="w-3 h-3 text-gold" /> Self-hosted
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gold-50 border border-cinema-border">
                    <Check className="w-3 h-3 text-gold" /> No subscriptions
                  </div>
                </div>
              </div>
              <div className="md:order-1 cinema-card p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-gold/[0.03] to-transparent pointer-events-none" />
                <div className="space-y-6 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <div className="text-sm text-cinema-text font-medium">Data stored locally</div>
                      <div className="text-[11px] text-cinema-subtle">SQLite on your machine</div>
                    </div>
                    <div className="ml-auto px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-[10px] text-green-400">Secure</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <div className="text-sm text-cinema-text font-medium">Zero external calls</div>
                      <div className="text-[11px] text-cinema-subtle">No analytics or tracking</div>
                    </div>
                    <div className="ml-auto px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-[10px] text-green-400">Private</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0">
                      <Star className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <div className="text-sm text-cinema-text font-medium">Auto backups</div>
                      <div className="text-[11px] text-cinema-subtle">Never lose your collection</div>
                    </div>
                    <div className="ml-auto px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-[10px] text-green-400">Active</div>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Feature 3 — Auto Metadata */}
          <FadeIn>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
              <div>
                <span className="font-serif italic text-gold-dark text-xs tracking-widest uppercase block mb-4">Metadata</span>
                <h3 className="font-serif text-xl md:text-2xl text-cinema-text mb-4">Search once, get <em className="italic text-gold">everything.</em></h3>
                <p className="text-cinema-muted text-sm leading-relaxed mb-6">
                  Type a title and Stacked fills in the rest — posters, ratings, cast, synopses, episode counts. Powered by TMDB, AniList, and OpenLibrary.
                </p>
                <div className="flex items-center gap-3 text-xs text-cinema-subtle">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gold-50 border border-cinema-border">
                    <Layers className="w-3 h-3 text-gold" /> 3 data sources
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gold-50 border border-cinema-border">
                    <Search className="w-3 h-3 text-gold" /> Auto-fetched
                  </div>
                </div>
              </div>
              <div className="cinema-card p-5 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-gold/[0.03] to-transparent pointer-events-none" />
                <div className="flex gap-4 relative z-10">
                  <img
                    src="https://image.tmdb.org/t/p/w300/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg"
                    alt="Oppenheimer"
                    className="w-24 h-36 object-cover rounded-lg border border-cinema-border flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-cinema-text mb-1">Oppenheimer</div>
                    <div className="text-[11px] text-cinema-subtle mb-3">2023 · Christopher Nolan · 3h 1m</div>
                    <div className="flex gap-1 mb-3">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={`w-3 h-3 ${s <= 4 ? 'text-gold fill-gold' : 'text-cinema-subtle'}`} />
                      ))}
                      <span className="text-[10px] text-cinema-subtle ml-1">8.4</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {['Drama', 'History', 'Thriller'].map(g => (
                        <span key={g} className="px-2 py-0.5 rounded-full bg-gold-50 border border-cinema-border text-[10px] text-cinema-muted">{g}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-cinema-border relative z-10">
                  <p className="text-[11px] text-cinema-subtle leading-relaxed line-clamp-2">
                    The story of J. Robert Oppenheimer's role in the development of the atomic bomb during World War II...
                  </p>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Stats Strip ── */}
      <section className="px-6 py-20 relative z-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gold/[0.04] rounded-full blur-[120px]" />
        </div>
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-8">
              {[
                { number: "10K+", label: "Titles tracked" },
                { number: "3", label: "Data sources" },
                { number: "0", label: "Cloud dependencies" },
                { number: "∞", label: "Yours forever" },
              ].map((stat, i) => (
                <div key={i} className="text-center relative">
                  <div className="font-serif text-3xl md:text-4xl text-gold mb-3 tracking-tight">{stat.number}</div>
                  <div className="text-xs text-cinema-subtle uppercase tracking-[0.2em]">{stat.label}</div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Poster Marquee ── */}
      <div className="relative z-20 overflow-hidden py-6">
        <div className="absolute left-0 top-0 bottom-0 w-40 bg-gradient-to-r from-cinema-bg to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-40 bg-gradient-to-l from-cinema-bg to-transparent z-10" />
        <motion.div
          className="flex gap-3"
          animate={{ x: ["-50%", "0%"] }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        >
          {[...POSTER_GRID, ...POSTER_GRID].map((poster, i) => (
            <img
              key={i}
              src={poster}
              alt=""
              className="w-28 h-40 object-cover rounded-lg border border-cinema-border/40 opacity-50 hover:opacity-100 hover:border-gold/30 hover:scale-105 transition-all duration-500 flex-shrink-0"
            />
          ))}
        </motion.div>
      </div>

      {/* ── Testimonials ── */}
      <section className="px-6 py-20 max-w-6xl mx-auto relative z-20">
        <FadeIn>
          <div className="mb-12 text-center">
            <span className="font-serif italic text-gold-dark text-xs tracking-widest uppercase block mb-4">Wall of love</span>
            <h2 className="font-serif text-3xl md:text-4xl text-cinema-text">
              Loved by <em className="italic text-gold">collectors.</em>
            </h2>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="cinema-card p-10 md:p-14 relative overflow-hidden mb-6">
            {/* Accent bar */}
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-gold/50 via-gold/20 to-transparent" />
            {/* Quote mark */}
            <div className="absolute top-6 left-8 font-serif text-7xl text-gold/[0.08] select-none leading-none pointer-events-none">&ldquo;</div>
            <div className="max-w-3xl mx-auto pl-6 md:pl-10">
              <blockquote className="font-serif text-xl md:text-2xl text-cinema-text mb-8 leading-relaxed">
                Finally, an app that respects my data and looks <span className="text-gold italic">stunning</span>. I&apos;ve tried Letterboxd, Goodreads, and dozens of spreadsheets. Stacked is the first one that just works.
              </blockquote>
              <div className="flex items-center gap-4">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
                  alt="Alex Chen"
                  className="w-11 h-11 rounded-full object-cover border-2 border-gold/20"
                />
                <div>
                  <div className="text-sm font-medium text-cinema-text">Alex Chen</div>
                  <div className="text-xs text-cinema-subtle">Software Engineer &middot; 1,200+ titles</div>
                </div>
                <div className="ml-auto flex gap-0.5">
                  {[1,2,3,4,5].map((s) => (
                    <Star key={s} className="w-3.5 h-3.5 text-gold fill-gold" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { quote: "The keyboard shortcuts alone make this worth it. \u2318K search is addictive.", name: "Sarah Miller", role: "Designer", img: "photo-1494790108377-be9c29b29330" },
            { quote: "I've catalogued 2,000+ anime titles. Auto-metadata saved me weeks of work.", name: "Takeshi Yamamoto", role: "Anime Collector", img: "photo-1539571696357-5a69c17a67c6" },
            { quote: "Self-hosted means I own my data forever. No more worrying about services shutting down.", name: "Marcus Johnson", role: "Privacy Advocate", img: "photo-1472099645785-5658abf4ff4e" },
          ].map((t, i) => (
            <FadeIn key={i} delay={0.1 + i * 0.08}>
              <div className="cinema-card p-6 h-full flex flex-col group hover:border-gold/20 transition-colors duration-500">
                <div className="flex gap-0.5 mb-4">
                  {[1,2,3,4,5].map((s) => <Star key={s} className="w-3 h-3 text-gold fill-gold" />)}
                </div>
                <p className="text-sm text-cinema-muted leading-relaxed flex-1 mb-6">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3 pt-4 border-t border-cinema-border">
                  <img src={`https://images.unsplash.com/${t.img}?w=80&h=80&fit=crop&crop=face`} alt="" className="w-8 h-8 rounded-full object-cover border border-gold/20" />
                  <div>
                    <div className="text-xs font-medium text-cinema-text">{t.name}</div>
                    <div className="text-[10px] text-cinema-subtle">{t.role}</div>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="px-6 py-24 relative z-20">
        <div className="max-w-4xl mx-auto">
          <FadeIn>
            <div className="mb-14 text-center">
              <h2 className="font-serif text-3xl md:text-5xl text-cinema-text mb-4">
                Questions & <em className="italic text-gold">Answers</em>
              </h2>
              <p className="text-base text-cinema-muted">Everything you need to know about Stacked.</p>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="cinema-card overflow-hidden divide-y divide-cinema-border">
              {[
                { q: "Is Stacked really free?", a: "Yes. Stacked is self-hosted software that runs on your own device or server. No charges, no subscriptions — your data never touches our servers." },
                { q: "Where does the metadata come from?", a: "We pull metadata from TMDB for movies and TV shows, AniList for anime, and OpenLibrary for books. Posters, ratings, descriptions, and more are all fetched automatically." },
                { q: "Can I import my existing data?", a: "We're working on importers for Letterboxd, Goodreads, and CSV files. Join the waitlist to get notified when these are ready." },
                { q: "Is there a mobile app?", a: "Not yet, but the web interface is fully responsive and works great on mobile browsers. Native apps are on the roadmap." },
              ].map((item, i) => (
                <FAQItem key={i} question={item.q} answer={item.a} />
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-6 py-24 relative z-20">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="relative overflow-hidden rounded-3xl border border-cinema-border">
              {/* Background poster collage — very faded */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none overflow-hidden">
                <div className="flex gap-3 -rotate-6 scale-150">
                  {POSTER_GRID.slice(0, 8).map((poster, i) => (
                    <img key={i} src={poster} alt="" className="w-28 h-40 object-cover rounded-lg flex-shrink-0" />
                  ))}
                </div>
              </div>
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-cinema-card via-cinema-card/95 to-cinema-card pointer-events-none" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gold/[0.08] rounded-full blur-[140px] pointer-events-none" />

              <div className="relative z-10 p-12 md:p-20 lg:p-24 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold/20 text-gold text-xs font-medium mb-8 tracking-widest uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                  Private Beta
                </div>
                <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-cinema-text mb-6 tracking-tight">
                  Start your <em className="italic text-gold">collection</em>.
                </h2>
                <p className="text-cinema-muted mb-12 max-w-lg mx-auto text-base leading-relaxed">
                  Join the beta. Track movies, shows, anime, and books — all in one beautiful, private library.
                </p>
                <form onSubmit={handleJoinWaitlist} className="max-w-xl mx-auto mb-8">
                  <div className="flex items-center bg-cinema-bg border border-cinema-border rounded-xl p-2 pl-6 hover:border-gold/20 focus-within:border-gold/30 transition-colors duration-300">
                    <input
                      type="email"
                      placeholder="Enter your email..."
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={status === 'success'}
                      className="flex-1 bg-transparent text-cinema-text placeholder-cinema-subtle focus:outline-none text-base py-1"
                      required
                    />
                    <button
                      type="submit"
                      disabled={status === 'success' || status === 'loading'}
                      className="bg-gold text-cinema-bg rounded-lg px-10 py-3.5 text-sm font-semibold hover:bg-gold-light transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                      {status === 'loading' ? '...' : status === 'success' ? "You're in!" : 'Join Waitlist'}
                    </button>
                  </div>
                </form>
                <div className="flex items-center justify-center gap-5 md:gap-8 text-sm text-cinema-subtle flex-wrap">
                  <a href="/demo" className="inline-flex items-center gap-1.5 text-cinema-muted hover:text-gold transition-colors duration-300">
                    <Play className="w-4 h-4" /> Try the live demo
                  </a>
                  <span className="w-1 h-1 rounded-full bg-cinema-border hidden md:block" />
                  <span>No credit card required</span>
                  <span className="w-1 h-1 rounded-full bg-cinema-border hidden md:block" />
                  <span>Free forever</span>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-20 border-t border-cinema-border">
        <div className="max-w-6xl mx-auto px-6">
          <div className="py-16 grid grid-cols-1 md:grid-cols-12 gap-12">
            {/* Brand */}
            <div className="md:col-span-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="font-serif text-xl text-cinema-text tracking-tight">Stacked</span>
                <span className="text-gold text-xl font-serif">.</span>
              </div>
              <p className="text-sm text-cinema-subtle leading-relaxed max-w-xs">
                The all-in-one sanctuary for your movies, shows, anime, and books. Local-first, forever free.
              </p>
            </div>

            {/* Product */}
            <div className="md:col-span-3 md:col-start-7">
              <div className="text-[10px] text-cinema-subtle uppercase tracking-[0.2em] mb-4 font-medium">Product</div>
              <div className="space-y-3">
                <a href="#features" className="block text-sm text-cinema-muted hover:text-gold transition-colors duration-300">Features</a>
                <a href="#faq" className="block text-sm text-cinema-muted hover:text-gold transition-colors duration-300">FAQ</a>
                <a href="/demo" className="block text-sm text-cinema-muted hover:text-gold transition-colors duration-300">Live Demo</a>
              </div>
            </div>

            {/* Community */}
            <div className="md:col-span-3">
              <div className="text-[10px] text-cinema-subtle uppercase tracking-[0.2em] mb-4 font-medium">Community</div>
              <div className="space-y-3">
                <a href="#" className="block text-sm text-cinema-muted hover:text-gold transition-colors duration-300">GitHub</a>
                <a href="#" className="block text-sm text-cinema-muted hover:text-gold transition-colors duration-300">Twitter</a>
                <a href="#" className="block text-sm text-cinema-muted hover:text-gold transition-colors duration-300">Discord</a>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-cinema-border py-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-cinema-subtle text-xs">&copy; 2026 Stacked. All rights reserved.</p>
            <div className="flex gap-6 text-xs text-cinema-subtle">
              <a href="#" className="hover:text-gold transition-colors duration-300">Privacy</a>
              <a href="#" className="hover:text-gold transition-colors duration-300">Terms</a>
            </div>
          </div>
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
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-8 md:px-10 py-6 flex items-center justify-between text-left group hover:bg-gold/[0.02] transition-colors duration-300"
      >
        <span className="font-serif text-lg md:text-xl text-cinema-text group-hover:text-gold transition-colors duration-300 pr-4">{question}</span>
        <motion.span
          animate={{ rotate: isOpen ? 45 : 0 }}
          className="text-2xl text-gold-dark flex-shrink-0"
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
            <p className="px-8 md:px-10 pb-6 text-cinema-muted leading-relaxed text-sm md:text-base">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
