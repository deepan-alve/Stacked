import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Film, Tv, Sparkles, Book, Plus, Search, X, ChevronDown, Star, Inbox, ExternalLink, LogOut, Calendar, BarChart3, Menu, Download, Home, LayoutGrid, Heart, Flame, Target, Clock, TrendingUp, Upload, Share2, Tag, ArrowUpDown, Play, List, Eye, Trash2, Archive, User, Link, Copy, Check, Lock, Settings } from 'lucide-react';
import { useEntries } from './hooks/useEntries';
import SearchModal from './components/SearchModal';
import SpotlightSearch from './components/SpotlightSearch';
import DlangView from './components/DlangView';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import toast, { Toaster } from 'react-hot-toast';
import { setDemoMode, entryService, activityService, goalService, recommendationService, csvService, shareService } from './services/api';
import authService from './services/auth';

const currentYear = new Date().getFullYear();

function Dashboard({ isDemo = false, onLogout }) {
  const { user: authUser, updateUser } = useAuth();
  const { entries, loading, createEntry, updateEntry, deleteEntry, quickRate, loadEntries } = useEntries(null);
  const [filterType, setFilterType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentView, setCurrentView] = useState('home');
  const [selectedYear, setSelectedYear] = useState(null);
  const [availableYears, setAvailableYears] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEntry, setCurrentEntry] = useState(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [librarySort, setLibrarySort] = useState('recently_added');
  const [watchlistStatus, setWatchlistStatus] = useState('all');
  const [archiveYearFrom, setArchiveYearFrom] = useState(null);
  const [archiveYearTo, setArchiveYearTo] = useState(null);
  const dlangViewRef = useRef(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    entryService.getAvailableYears().then(years => {
      setAvailableYears(years);
    }).catch(err => console.error('Failed to load years:', err));
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      if (isModalOpen || isSpotlightOpen || isSearchModalOpen) {
        if (e.key === 'Escape') {
          setIsModalOpen(false);
          setIsSpotlightOpen(false);
          setIsSearchModalOpen(false);
          setIsMobileSearchOpen(false);
        }
        return;
      }

      switch (e.key) {
        case 'n':
        case 'N':
          e.preventDefault();
          setIsSpotlightOpen(true);
          break;
        case '/':
          e.preventDefault();
          setIsMobileSearchOpen(true);
          break;
        case '1':
          setCurrentView('home');
          break;
        case '2':
          setCurrentView('library');
          break;
        case '3':
          setCurrentView('watchlist');
          break;
        case '4':
          setCurrentView('archive');
          break;
        case '5':
          setCurrentView('favorites');
          break;
        case '6':
          setCurrentView('stats');
          break;
        case 'Escape':
          setIsMobileSearchOpen(false);
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, isSpotlightOpen, isSearchModalOpen]);

  // Form state
  const [formData, setFormData] = useState({
    title: '', type: 'Movie', rating: '', season: '', notes: '',
    poster_url: '', api_id: '', api_provider: '', description: '',
    release_date: '', watch_date: new Date().toISOString().split('T')[0],
    year: currentYear, status: 'completed', progress_current: 0,
    progress_total: 0, tags: '[]'
  });

  // Filter entries for library (completed, current year only)
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const status = entry.status || 'completed';
      if (status !== 'completed') return false;
      if (entry.year !== currentYear) return false; // Library = this year only
      const matchesType = filterType === 'All' || entry.type === filterType;
      const matchesSearch = entry.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    }).sort((a, b) => {
      switch (librarySort) {
        case 'title_asc': return a.title.localeCompare(b.title);
        case 'title_desc': return b.title.localeCompare(a.title);
        case 'rating_desc': return (b.rating || 0) - (a.rating || 0);
        case 'rating_asc': return (a.rating || 0) - (b.rating || 0);
        case 'release_date': return (b.release_date || '').localeCompare(a.release_date || '');
        default: return 0;
      }
    });
  }, [entries, filterType, searchQuery, librarySort]);

  // Filter entries for archive (completed, past years, with year range)
  const archiveEntries = useMemo(() => {
    return entries.filter(entry => {
      const status = entry.status || 'completed';
      if (status !== 'completed') return false;
      if (entry.year >= currentYear) return false;
      if (archiveYearFrom && entry.year < archiveYearFrom) return false;
      if (archiveYearTo && entry.year > archiveYearTo) return false;
      const matchesType = filterType === 'All' || entry.type === filterType;
      const matchesSearch = entry.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    }).sort((a, b) => {
      switch (librarySort) {
        case 'title_asc': return a.title.localeCompare(b.title);
        case 'title_desc': return b.title.localeCompare(a.title);
        case 'rating_desc': return (b.rating || 0) - (a.rating || 0);
        case 'rating_asc': return (a.rating || 0) - (b.rating || 0);
        case 'release_date': return (b.release_date || '').localeCompare(a.release_date || '');
        default: return 0;
      }
    });
  }, [entries, filterType, searchQuery, archiveYearFrom, archiveYearTo, librarySort]);

  // Filter entries for watchlist (watching, planned, dropped)
  const watchlistEntries = useMemo(() => {
    return entries.filter(entry => {
      const status = entry.status || 'completed';
      if (status === 'completed') return false;
      const matchesStatus = watchlistStatus === 'all' || status === watchlistStatus;
      const matchesType = filterType === 'All' || entry.type === filterType;
      const matchesSearch = entry.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesType && matchesSearch;
    });
  }, [entries, watchlistStatus, filterType, searchQuery]);

  // Statistics
  const stats = {
    total: entries.length,
    movies: entries.filter(e => e.type === 'Movie').length,
    series: entries.filter(e => e.type === 'Series').length,
    anime: entries.filter(e => e.type === 'Anime').length,
    books: entries.filter(e => e.type === 'Book').length,
    watching: entries.filter(e => (e.status || 'completed') === 'watching').length,
    thisMonth: entries.filter(e => {
      const d = new Date(e.created_at);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length,
    avgRating: (() => {
      const rated = entries.filter(e => e.rating);
      return rated.length > 0 ? (rated.reduce((s, e) => s + e.rating, 0) / rated.length).toFixed(1) : '0.0';
    })(),
  };

  const openModal = (entry = null, defaultYear = null) => {
    if (isDemo && !entry) {
      toast.error(
        <div className="flex flex-col gap-1">
          <p className="font-medium text-sm">Read-Only Demo Mode</p>
          <p className="text-xs">This is the creator's data.</p>
          <a href="/#join" className="text-xs text-blue-400 hover:text-blue-300 mt-1 underline">Join the waitlist to track your own!</a>
        </div>,
        { duration: 4000 }
      );
      return;
    }

    if (entry) {
      setCurrentEntry(entry);
      let parsedTags = '[]';
      try { parsedTags = entry.tags || '[]'; } catch { parsedTags = '[]'; }
      setFormData({
        title: entry.title, type: entry.type, rating: entry.rating || '',
        season: entry.season || '', notes: entry.notes || '',
        poster_url: entry.poster_url || '', api_id: entry.api_id || '',
        api_provider: entry.api_provider || '', description: entry.description || '',
        release_date: entry.release_date || '',
        watch_date: entry.watch_date ? entry.watch_date.split('T')[0] : new Date().toISOString().split('T')[0],
        year: entry.year || currentYear,
        status: entry.status || 'completed',
        progress_current: entry.progress_current || 0,
        progress_total: entry.progress_total || 0,
        tags: parsedTags
      });
    } else {
      setCurrentEntry(null);
      const yearToUse = defaultYear || currentYear;
      setFormData({
        title: '', type: 'Movie', rating: '', season: '', notes: '',
        poster_url: '', api_id: '', api_provider: '', description: '',
        release_date: '', watch_date: new Date().toISOString().split('T')[0],
        year: yearToUse, status: 'completed', progress_current: 0,
        progress_total: 0, tags: '[]'
      });
    }
    setIsModalOpen(true);
  };

  const handleSearchSelect = (apiData) => {
    setFormData(prev => ({ ...prev, ...apiData }));
  };

  const handleSpotlightSelect = async (result) => {
    if (isDemo) {
      toast.error(<div className="flex flex-col gap-1"><p className="font-medium text-sm">Read-Only Demo Mode</p></div>, { duration: 4000 });
      return;
    }

    if (currentView === 'favorites') {
      try {
        const payload = {
          title: result.title || '', year: result.year ? parseInt(result.year) : null,
          language: 'English', genre: result.genre || '', director: result.director || '',
          rating: result.rating ? parseFloat(result.rating) : null,
          poster_url: result.poster || '', notes: result.plot || ''
        };
        const res = await fetch('/api/dlang', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error('Failed to save');
        if (dlangViewRef.current?.refresh) dlangViewRef.current.refresh();
        setIsSpotlightOpen(false);
      } catch (error) {
        toast.error('Failed to add movie: ' + error.message);
      }
      return;
    }

    setCurrentEntry(null);
    setFormData({
      title: result.title || '', type: result.type || 'Movie', rating: result.rating || '',
      season: '', notes: '', poster_url: result.poster || '', api_id: result.imdbId || '',
      api_provider: 'imdb', description: result.plot || '',
      release_date: result.releaseDate || result.year || '',
      watch_date: new Date().toISOString().split('T')[0], year: currentYear,
      status: 'completed', progress_current: 0, progress_total: 0, tags: '[]'
    });
    setIsSpotlightOpen(false);
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setCurrentEntry(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isDemo) return;

    try {
      const data = {
        ...formData,
        rating: formData.rating ? parseFloat(formData.rating) : null,
        season: formData.season ? parseInt(formData.season) : null,
        year: formData.year ? parseInt(formData.year) : currentYear,
        progress_current: parseInt(formData.progress_current) || 0,
        progress_total: parseInt(formData.progress_total) || 0,
      };

      if (currentEntry) {
        await updateEntry(currentEntry.id, data);
        if (currentEntry.year !== data.year) {
          toast.success(`Entry moved to ${data.year}`);
        }
      } else {
        await createEntry(data);
      }
      closeModal();
      entryService.getAvailableYears().then(years => setAvailableYears(years)).catch(() => {});
    } catch (error) {
      if (error.message.includes('Duplicate') || error.message.includes('already added')) {
        toast.error(error.message);
      } else {
        toast.error('Failed to save entry: ' + error.message);
      }
    }
  };

  const handleDelete = async () => {
    if (isDemo) return;
    if (window.confirm('Delete this entry?')) {
      try {
        await deleteEntry(currentEntry.id);
        closeModal();
      } catch (error) {
        toast.error('Failed to delete entry: ' + error.message);
      }
    }
  };

  const handleQuickRate = async (entryId, rating) => {
    if (isDemo) return;
    try {
      await quickRate(entryId, rating);
      toast.success(`Rated ${rating}/5`);
    } catch (error) {
      toast.error('Failed to rate');
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'Movie': return <Film className="w-4 h-4" />;
      case 'Series': return <Tv className="w-4 h-4" />;
      case 'Anime': return <Sparkles className="w-4 h-4" />;
      case 'Book': return <Book className="w-4 h-4" />;
      default: return <Film className="w-4 h-4" />;
    }
  };

  // Tags helpers
  const allTags = useMemo(() => {
    const tagSet = new Set();
    entries.forEach(e => {
      try {
        const parsed = JSON.parse(e.tags || '[]');
        parsed.forEach(t => tagSet.add(t));
      } catch {}
    });
    return [...tagSet];
  }, [entries]);

  const [tagInput, setTagInput] = useState('');
  const parsedFormTags = useMemo(() => {
    try { return JSON.parse(formData.tags || '[]'); } catch { return []; }
  }, [formData.tags]);

  const addTag = (tag) => {
    if (!tag.trim()) return;
    const current = parsedFormTags;
    if (!current.includes(tag.trim())) {
      setFormData(prev => ({ ...prev, tags: JSON.stringify([...current, tag.trim()]) }));
    }
    setTagInput('');
  };

  const removeTag = (tag) => {
    const current = parsedFormTags.filter(t => t !== tag);
    setFormData(prev => ({ ...prev, tags: JSON.stringify(current) }));
  };

  return (
    <div className="min-h-screen flex flex-col text-cinema-muted selection:bg-gold-200 selection:text-cinema-text">
      <Toaster toastOptions={{ style: { background: '#111110', color: '#fff', border: '1px solid rgba(196,162,101,0.12)' } }} />

      {/* Ambient Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gold/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-gold/3 rounded-full blur-3xl" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-40 border-b border-cinema-border glass">
        <div className="w-full px-6 lg:px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setCurrentView('home')}>
            <span className="text-cinema-text font-serif text-xl tracking-tight">Stacked<span className="text-gold">.</span></span>
          </div>

          <div className="hidden md:flex items-center gap-1 bg-cinema-card/60 backdrop-blur-sm border border-cinema-border rounded-full px-1.5 py-1">
            {[
              { key: 'home', label: 'Library' },
              { key: 'watchlist', label: 'Watchlist' },
              { key: 'archive', label: 'Archive' },
              { key: 'favorites', label: 'Favorites' },
              { key: 'stats', label: 'Stats' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setCurrentView(tab.key)}
                className={`text-xs font-medium px-4 py-1.5 rounded-full transition-all ${
                  (currentView === tab.key || (tab.key === 'home' && currentView === 'library')) ? 'text-gold' : 'text-cinema-muted hover:text-gold'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setIsSpotlightOpen(true)} className="flex items-center gap-2 border border-gold/30 hover:border-gold/50 text-gold text-xs font-medium py-1.5 px-4 rounded-full transition-colors">
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{currentView === 'favorites' ? 'Add Movie' : 'Add Entry'}</span>
            </button>

            {!isDemo && onLogout && (
              <>
                <button onClick={() => setCurrentView('profile')} className={`hidden md:flex items-center justify-center w-8 h-8 transition-colors ${currentView === 'profile' ? 'text-gold' : 'text-cinema-subtle hover:text-gold'}`} title="Profile">
                  <User className="w-4 h-4" />
                </button>
                <button onClick={onLogout} className="hidden md:flex items-center justify-center w-8 h-8 text-cinema-subtle hover:text-gold transition-colors" title="Sign out">
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow pt-24 pb-24 md:pb-12 px-4 md:px-6 max-w-6xl mx-auto w-full">
        {(currentView === 'home' || currentView === 'library') ? (
          <LibraryView
            entries={filteredEntries}
            allEntries={entries}
            loading={loading}
            filterType={filterType}
            setFilterType={setFilterType}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            librarySort={librarySort}
            setLibrarySort={setLibrarySort}
            onEntryClick={openModal}
            onAddEntry={(year) => openModal(null, year)}
            onQuickRate={handleQuickRate}
            getTypeIcon={getTypeIcon}
            isDemo={isDemo}
            onShareClick={() => setIsShareModalOpen(true)}
          />
        ) : currentView === 'watchlist' ? (
          <WatchlistView
            entries={watchlistEntries}
            loading={loading}
            watchlistStatus={watchlistStatus}
            setWatchlistStatus={setWatchlistStatus}
            filterType={filterType}
            setFilterType={setFilterType}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onEntryClick={openModal}
            onQuickRate={handleQuickRate}
            getTypeIcon={getTypeIcon}
            isDemo={isDemo}
            setIsSpotlightOpen={setIsSpotlightOpen}
          />
        ) : currentView === 'archive' ? (
          <ArchiveView
            entries={archiveEntries}
            allEntries={entries}
            loading={loading}
            filterType={filterType}
            setFilterType={setFilterType}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            archiveYearFrom={archiveYearFrom}
            setArchiveYearFrom={setArchiveYearFrom}
            archiveYearTo={archiveYearTo}
            setArchiveYearTo={setArchiveYearTo}
            availableYears={availableYears.filter(y => y < currentYear)}
            librarySort={librarySort}
            setLibrarySort={setLibrarySort}
            onEntryClick={openModal}
            onQuickRate={handleQuickRate}
            getTypeIcon={getTypeIcon}
            isDemo={isDemo}
          />
        ) : currentView === 'favorites' ? (
          <DlangView ref={dlangViewRef} searchQuery={searchQuery} isDemo={isDemo} />
        ) : currentView === 'profile' ? (
          <ProfileView user={authUser} updateUser={updateUser} entries={entries} />
        ) : (
          <StatsView entries={entries} isDemo={isDemo} />
        )}
      </main>

      {/* Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-cinema-bg/80 backdrop-blur-md" onClick={closeModal} />
          <div className="relative w-full max-w-md bg-cinema-card backdrop-blur-xl border border-cinema-border shadow-2xl rounded-2xl flex flex-col max-h-[85vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-16 bg-gold/10 blur-2xl pointer-events-none" />

            <div className="p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-serif text-cinema-text tracking-tight">
                  {currentEntry ? 'Edit Entry' : 'Add Entry'}
                </h2>
                <button onClick={closeModal} className="text-cinema-subtle hover:text-cinema-muted transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-xs text-cinema-subtle font-mono uppercase tracking-[0.15em] flex items-center justify-between">
                    <span>Title</span>
                    {!isDemo && (
                      <button type="button" onClick={() => setIsSearchModalOpen(true)} className="text-gold hover:text-gold-light flex items-center gap-1 text-xs normal-case tracking-normal">
                        <ExternalLink size={11} /> Search API
                      </button>
                    )}
                  </label>
                  <input type="text" required value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    readOnly={isDemo}
                    className="w-full bg-gold-50 border border-gold-100 text-cinema-text text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-gold-200 focus:ring-1 focus:ring-gold-200 transition-colors placeholder-cinema-subtle"
                    placeholder="e.g. Inception"
                  />
                </div>

                {/* Type */}
                <div className="space-y-1.5">
                  <label className="text-xs text-cinema-subtle font-mono uppercase tracking-[0.15em]">Type</label>
                  <div className="relative">
                    <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} disabled={isDemo}
                      className="w-full appearance-none bg-gold-50 border border-gold-100 text-cinema-text text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-gold-200 focus:ring-1 focus:ring-gold-200 transition-colors cursor-pointer disabled:opacity-70">
                      <option value="Movie">Movie</option><option value="Series">Series</option><option value="Anime">Anime</option><option value="Book">Book</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-cinema-subtle pointer-events-none" />
                  </div>
                </div>

                {/* Status selector */}
                <div className="space-y-1.5">
                  <label className="text-xs text-cinema-subtle font-mono uppercase tracking-[0.15em]">Status</label>
                  <div className="flex gap-1 p-1 bg-gold-50 rounded-lg border border-gold-100">
                    {['completed', 'watching', 'planned', 'dropped'].map(s => (
                      <button key={s} type="button" onClick={() => setFormData({...formData, status: s})}
                        className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-all capitalize ${
                          formData.status === s ? 'bg-gold/20 text-gold border border-gold-200' : 'text-cinema-subtle hover:text-cinema-muted border border-transparent'
                        }`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Progress (visible when watching) */}
                {formData.status === 'watching' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs text-cinema-subtle font-mono uppercase tracking-[0.15em]">Current Ep/Page</label>
                      <input type="number" min="0" value={formData.progress_current}
                        onChange={(e) => setFormData({...formData, progress_current: e.target.value})}
                        className="w-full bg-gold-50 border border-gold-100 text-cinema-text text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-gold-200 focus:ring-1 focus:ring-gold-200 placeholder-cinema-subtle"
                        placeholder="0" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-cinema-subtle font-mono uppercase tracking-[0.15em]">Total Ep/Pages</label>
                      <input type="number" min="0" value={formData.progress_total}
                        onChange={(e) => setFormData({...formData, progress_total: e.target.value})}
                        className="w-full bg-gold-50 border border-gold-100 text-cinema-text text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-gold-200 focus:ring-1 focus:ring-gold-200 placeholder-cinema-subtle"
                        placeholder="0" />
                    </div>
                  </div>
                )}

                {/* Rating + Season */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs text-cinema-subtle font-mono uppercase tracking-[0.15em]">Rating (0-5)</label>
                    <input type="number" min="0" max="5" step="0.25" value={formData.rating}
                      onChange={(e) => setFormData({...formData, rating: e.target.value})} readOnly={isDemo}
                      className="w-full bg-gold-50 border border-gold-100 text-cinema-text text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-gold-200 focus:ring-1 focus:ring-gold-200 placeholder-cinema-subtle"
                      placeholder="-" />
                  </div>
                  <div className={`space-y-1.5 ${formData.type !== 'Series' && formData.type !== 'Anime' ? 'opacity-50' : ''}`}>
                    <label className="text-xs text-cinema-subtle font-mono uppercase tracking-[0.15em]">Season</label>
                    <input type="number" min="1" disabled={formData.type !== 'Series' && formData.type !== 'Anime'} readOnly={isDemo}
                      value={formData.season} onChange={(e) => setFormData({...formData, season: e.target.value})}
                      className="w-full bg-gold-50 border border-gold-100 text-cinema-text text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-gold-200 focus:ring-1 focus:ring-gold-200 placeholder-cinema-subtle disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="#" />
                  </div>
                </div>

                {/* Watch Date + Year */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs text-cinema-subtle font-mono uppercase flex items-center gap-1"><Calendar className="w-3 h-3" /> Watch Date</label>
                    <input type="date" value={formData.watch_date}
                      onChange={(e) => setFormData({...formData, watch_date: e.target.value})} readOnly={isDemo}
                      className="w-full bg-gold-50 border border-gold-100 text-cinema-text text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-gold-200 focus:ring-1 focus:ring-gold-200" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-cinema-subtle font-mono uppercase tracking-[0.15em]">Year</label>
                    <div className="relative">
                      <select value={formData.year} onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})} disabled={isDemo}
                        className="w-full appearance-none bg-gold-50 border border-gold-100 text-cinema-text text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-gold-200 focus:ring-1 focus:ring-gold-200 cursor-pointer disabled:opacity-70">
                        {[...new Set([currentYear, ...availableYears])].sort((a, b) => b - a).map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-cinema-subtle pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-1.5">
                  <label className="text-xs text-cinema-subtle font-mono uppercase tracking-[0.15em] flex items-center gap-1"><Tag className="w-3 h-3" /> Tags</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {parsedFormTags.map(tag => (
                      <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-gold/10 border border-gold-200 text-gold text-xs rounded-full">
                        {tag}
                        {!isDemo && <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-400"><X className="w-3 h-3" /></button>}
                      </span>
                    ))}
                  </div>
                  {!isDemo && (
                    <div className="flex gap-2">
                      <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput); } }}
                        className="flex-1 bg-gold-50 border border-gold-100 text-cinema-text text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-gold-200 placeholder-cinema-subtle"
                        placeholder="Add tag..." list="tag-suggestions" />
                      <datalist id="tag-suggestions">{allTags.map(t => <option key={t} value={t} />)}</datalist>
                      <button type="button" onClick={() => addTag(tagInput)} className="px-3 py-1.5 bg-gold-50 border border-gold-100 text-cinema-subtle hover:text-gold rounded-lg text-xs">Add</button>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <label className="text-xs text-cinema-subtle font-mono uppercase tracking-[0.15em]">Notes</label>
                  <textarea rows="3" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} readOnly={isDemo}
                    className="w-full bg-gold-50 border border-gold-100 text-cinema-text text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-gold-200 focus:ring-1 focus:ring-gold-200 placeholder-cinema-subtle resize-none"
                    placeholder="Thoughts, memorable quotes, or summary..." />
                </div>

                {!isDemo && (
                  <div className="flex flex-col gap-2 pt-4 border-t border-cinema-border">
                    <button type="submit" className="w-full bg-gold hover:bg-gold-light text-cinema-bg font-medium text-sm py-2.5 rounded-lg transition-colors">
                      Save Entry
                    </button>
                    {currentEntry && (
                      <button type="button" onClick={handleDelete}
                        className="w-full bg-transparent hover:bg-red-500/10 text-red-400 hover:text-red-300 border border-cinema-border hover:border-red-500/30 font-medium text-sm py-2.5 rounded-lg transition-colors">
                        Delete Entry
                      </button>
                    )}
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}

      <SearchModal isOpen={isSearchModalOpen} onClose={() => setIsSearchModalOpen(false)} onSelect={handleSearchSelect} type={formData.type} />
      <SpotlightSearch isOpen={isSpotlightOpen} onClose={() => setIsSpotlightOpen(false)} onSelect={handleSpotlightSelect} />
      <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} />

      {/* Mobile Search Overlay */}
      {isMobileSearchOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-cinema-bg/80 backdrop-blur-sm" onClick={() => setIsMobileSearchOpen(false)} />
          <div className="relative p-4 pt-safe">
            <div className="flex items-center gap-3 bg-cinema-card border border-cinema-border rounded-xl p-3">
              <Search className="w-5 h-5 text-cinema-subtle flex-shrink-0" />
              <input type="text" placeholder="Search your collection..." value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)} autoFocus
                className="flex-1 bg-transparent text-cinema-text text-base outline-none placeholder-cinema-subtle" />
              <button onClick={() => setIsMobileSearchOpen(false)} className="text-cinema-subtle hover:text-cinema-muted"><X className="w-5 h-5" /></button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden glass border-t border-cinema-border">
        <div className="flex items-center justify-around py-2 px-2 safe-area-bottom">
          {[
            { key: 'home', icon: LayoutGrid, label: 'Library' },
            { key: 'watchlist', icon: List, label: 'Watchlist' },
            { key: 'archive', icon: Archive, label: 'Archive' },
            { key: 'favorites', icon: Heart, label: 'Favorites' },
            { key: 'stats', icon: BarChart3, label: 'Stats' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setCurrentView(tab.key)}
              className={`flex flex-col items-center gap-1 py-2 px-4 transition-all ${(currentView === tab.key || (tab.key === 'home' && currentView === 'library')) ? 'text-gold' : 'text-cinema-subtle'}`}>
              <tab.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
              {currentView === tab.key && <div className="w-1 h-1 rounded-full bg-gold" />}
            </button>
          ))}
          {!isDemo && onLogout && (
            <>
              <button onClick={() => setCurrentView('profile')}
                className={`flex flex-col items-center gap-1 py-2 px-4 transition-all ${currentView === 'profile' ? 'text-gold' : 'text-cinema-subtle hover:text-gold'}`}>
                <User className="w-5 h-5" /><span className="text-[10px] font-medium">Profile</span>
                {currentView === 'profile' && <div className="w-1 h-1 rounded-full bg-gold" />}
              </button>
            </>
          )}
        </div>
      </nav>
    </div>
  );
}

// =================== HOME VIEW ===================
function HomeView({ entries, stats, onEntryClick, onQuickRate, getTypeIcon, isDemo, setCurrentView, setIsSpotlightOpen }) {
  const [streak, setStreak] = useState({ streak: 0, dates: [] });
  const [activities, setActivities] = useState([]);
  const [goals, setGoals] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [heatmap, setHeatmap] = useState([]);

  useEffect(() => {
    if (isDemo) return;
    activityService.getStreak().then(setStreak).catch(e => console.error('Streak fetch failed:', e));
    activityService.getRecent(10).then(setActivities).catch(e => console.error('Activity fetch failed:', e));
    activityService.getHeatmap(30).then(setHeatmap).catch(e => console.error('Heatmap fetch failed:', e));
    goalService.getAll().then(setGoals).catch(e => console.error('Goals fetch failed:', e));
    recommendationService.get().then(setRecommendations).catch(e => console.error('Recommendations fetch failed:', e));
  }, [isDemo]);

  const typeConfig = {
    Movie: { color: '#c4a265', icon: Film, label: 'Movies' },
    Series: { color: '#60a5fa', icon: Tv, label: 'Series' },
    Anime: { color: '#f472b6', icon: Sparkles, label: 'Anime' },
    Book: { color: '#34d399', icon: Book, label: 'Books' },
  };

  const recentEntries = [...entries].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 8);
  const topRated = [...entries].filter(e => e.rating).sort((a, b) => b.rating - a.rating).slice(0, 5);

  // Gamification: Level system (every 10 entries = 1 level)
  const level = Math.floor(stats.total / 10);
  const xpCurrent = stats.total % 10;
  const xpNeeded = 10;
  const xpPct = (xpCurrent / xpNeeded) * 100;
  const levelTitles = ['Newcomer', 'Casual', 'Regular', 'Enthusiast', 'Cinephile', 'Aficionado', 'Connoisseur', 'Veteran', 'Master', 'Legend', 'Mythic'];
  const levelTitle = levelTitles[Math.min(level, levelTitles.length - 1)] || 'Mythic';

  // Achievements
  const achievements = [
    { id: 'first', icon: '🎬', label: 'First Entry', desc: 'Add your first entry', unlocked: stats.total >= 1 },
    { id: 'ten', icon: '🔟', label: 'Double Digits', desc: 'Track 10 entries', unlocked: stats.total >= 10 },
    { id: 'century', icon: '💯', label: 'Century Club', desc: 'Track 100 entries', unlocked: stats.total >= 100 },
    { id: 'movies50', icon: '🎥', label: 'Film Buff', desc: '50 movies tracked', unlocked: stats.movies >= 50 },
    { id: 'series10', icon: '📺', label: 'Binge Watcher', desc: '10 series tracked', unlocked: stats.series >= 10 },
    { id: 'anime5', icon: '✨', label: 'Otaku', desc: '5 anime tracked', unlocked: stats.anime >= 5 },
    { id: 'books5', icon: '📚', label: 'Bookworm', desc: '5 books tracked', unlocked: stats.books >= 5 },
    { id: 'rated50', icon: '⭐', label: 'Critic', desc: 'Rate 50 entries', unlocked: entries.filter(e => e.rating).length >= 50 },
    { id: 'streak3', icon: '🔥', label: 'On Fire', desc: '3-day streak', unlocked: streak.streak >= 3 },
    { id: 'streak7', icon: '💎', label: 'Diamond Streak', desc: '7-day streak', unlocked: streak.streak >= 7 },
    { id: 'triple', icon: '🏆', label: 'Triple Threat', desc: 'Track movies, series & anime', unlocked: stats.movies > 0 && stats.series > 0 && stats.anime > 0 },
    { id: 'mega', icon: '👑', label: 'Completionist', desc: 'Track 300+ entries', unlocked: stats.total >= 300 },
  ];

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const avgRating = parseFloat(stats.avgRating) || 0;
  const ratingPct = (avgRating / 5) * 100;

  // SVG circle math for rating ring
  const ringRadius = 40;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (ratingPct / 100) * ringCircumference;

  return (
    <div className="fade-in space-y-3">

      {/* ---- Row 1: Player Card + Rating Ring + Streak ---- */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3">

        {/* Player Card — Level + XP */}
        <div className="cinema-card p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gold/[0.04] via-transparent to-transparent pointer-events-none" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="px-2 py-0.5 rounded bg-gold/10 border border-gold/20">
                    <span className="text-[10px] font-mono text-gold font-bold">LVL {level}</span>
                  </div>
                  <span className="text-[11px] font-serif text-gold/60 italic">{levelTitle}</span>
                </div>
                <div className="text-2xl font-serif text-cinema-text leading-none">{stats.total} <span className="text-sm text-cinema-subtle/40">titles tracked</span></div>
              </div>
              <button onClick={() => setIsSpotlightOpen(true)} className="px-3 py-1.5 rounded-lg bg-gold/10 border border-gold/20 hover:bg-gold/20 hover:border-gold/40 transition-all text-[10px] font-mono text-gold flex items-center gap-1.5">
                <Plus className="w-3 h-3" /> Add Entry
              </button>
            </div>

            {/* XP Bar */}
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] font-mono text-cinema-subtle/40 uppercase tracking-wider">XP to next level</span>
                <span className="text-[9px] font-mono text-gold/50">{xpCurrent}/{xpNeeded}</span>
              </div>
              <div className="h-2 bg-gold-50 rounded-full overflow-hidden relative">
                <div className="h-full rounded-full xp-bar-fill relative" style={{ width: `${xpPct}%`, background: 'linear-gradient(90deg, #c4a265, #d4b87a)' }}>
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-full" />
                </div>
              </div>
            </div>

            {/* Type mastery inline */}
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-cinema-border/15">
              {[
                { type: 'Movie', count: stats.movies },
                { type: 'Series', count: stats.series },
                { type: 'Anime', count: stats.anime },
                { type: 'Book', count: stats.books },
              ].map(item => {
                const Icon = typeConfig[item.type].icon;
                return (
                  <div key={item.type} className="flex items-center gap-1.5">
                    <Icon className="w-3 h-3" style={{ color: typeConfig[item.type].color, opacity: 0.5 }} />
                    <span className="text-[12px] font-mono font-semibold" style={{ color: typeConfig[item.type].color }}>{item.count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Rating Ring */}
        <div className="cinema-card p-4 flex flex-col items-center justify-center min-w-[130px]">
          <div className="relative w-24 h-24">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r={ringRadius} fill="none" stroke="rgba(196,162,101,0.06)" strokeWidth="6" />
              <circle cx="50" cy="50" r={ringRadius} fill="none" stroke="url(#goldGrad)" strokeWidth="6"
                strokeLinecap="round" strokeDasharray={ringCircumference}
                strokeDashoffset={ringOffset} className="ring-fill" />
              <defs>
                <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#c4a265" />
                  <stop offset="100%" stopColor="#d4b87a" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-serif text-gold leading-none">{stats.avgRating}</span>
              <span className="text-[8px] font-mono text-cinema-subtle/30 mt-0.5">AVG</span>
            </div>
          </div>
          <div className="flex items-center gap-0.5 mt-2">
            {[1,2,3,4,5].map(i => (
              <Star key={i} className={`w-2.5 h-2.5 ${i <= Math.round(avgRating) ? 'text-gold fill-current' : 'text-cinema-subtle/10'}`} />
            ))}
          </div>
        </div>

        {/* Streak */}
        <div className="cinema-card p-4 flex flex-col items-center justify-center min-w-[120px] relative overflow-hidden">
          {streak.streak > 0 && (
            <div className="absolute inset-0 bg-gradient-to-t from-orange-500/[0.04] to-transparent pointer-events-none" />
          )}
          <div className="relative">
            <Flame className={`w-8 h-8 mx-auto mb-1 ${streak.streak > 0 ? 'text-orange-400 streak-flame' : 'text-cinema-subtle/10'}`} />
            <div className="text-2xl font-serif text-cinema-text text-center leading-none">{streak.streak}</div>
            <div className="text-[9px] font-mono text-cinema-subtle/30 text-center mt-1 uppercase tracking-wider">day streak</div>
          </div>
        </div>
      </div>

      {/* ---- Row 2: Achievements ---- */}
      <div className="cinema-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-cinema-subtle uppercase tracking-wider">Achievements</span>
            <span className="px-1.5 py-0.5 rounded bg-gold/10 text-[9px] font-mono text-gold">{unlockedCount}/{achievements.length}</span>
          </div>
          <div className="h-1 flex-1 mx-4 bg-gold-50 rounded-full overflow-hidden max-w-[200px]">
            <div className="h-full bg-gold/40 rounded-full bar-fill" style={{ width: `${(unlockedCount / achievements.length) * 100}%` }} />
          </div>
        </div>
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
          {achievements.map(a => (
            <div key={a.id} className={`achievement-badge rounded-lg p-2 flex flex-col items-center text-center ${!a.unlocked ? 'locked' : ''}`}
              title={`${a.label}: ${a.desc}`}>
              <span className="text-lg leading-none">{a.icon}</span>
              <span className="text-[8px] font-mono text-cinema-subtle mt-1 leading-tight">{a.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ---- Row 3: Recent + Activity ---- */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-3">

        {/* Recent Entries */}
        <div className="cinema-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-cinema-border/30">
            <span className="text-[10px] font-mono text-cinema-subtle uppercase tracking-wider">Recent Activity</span>
            <button onClick={() => setCurrentView('library')} className="text-[10px] text-gold hover:text-gold-light">View Library</button>
          </div>
          {recentEntries.length > 0 ? (
            <div className="divide-y divide-cinema-border/10">
              {recentEntries.map((entry, i) => (
                <div key={entry.id} onClick={() => onEntryClick(entry)}
                  className={`flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-gold/[0.03] transition-colors group fade-in stagger-${Math.min(i + 1, 6)}`}>
                  {entry.poster_url ? (
                    <div className="w-7 h-10 flex-shrink-0 rounded overflow-hidden border border-cinema-border/20">
                      <img src={entry.poster_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-7 h-10 flex-shrink-0 rounded border border-cinema-border/15 flex items-center justify-center" style={{ background: `${typeConfig[entry.type]?.color}08` }}>
                      <div style={{ color: typeConfig[entry.type]?.color }} className="opacity-40">{getTypeIcon(entry.type)}</div>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-cinema-text truncate group-hover:text-gold transition-colors">{entry.title}</p>
                    <span className="text-[9px] font-mono" style={{ color: typeConfig[entry.type]?.color, opacity: 0.5 }}>{entry.type}</span>
                  </div>
                  {entry.rating ? (
                    <div className="flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 text-gold fill-current" />
                      <span className="text-[10px] text-gold font-mono">{entry.rating}</span>
                    </div>
                  ) : (
                    <span className="text-[9px] text-cinema-subtle/15 font-mono">—</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center">
              <p className="text-cinema-subtle/30 text-xs">No entries yet</p>
              <button onClick={() => setIsSpotlightOpen(true)} className="text-[10px] text-gold mt-1">Add your first</button>
            </div>
          )}
        </div>

        {/* Right: Top Rated + Goals */}
        <div className="space-y-3">
          {/* Top Rated */}
          {topRated.length > 0 && (
            <div className="cinema-card overflow-hidden">
              <div className="px-4 py-2.5 border-b border-cinema-border/30">
                <span className="text-[10px] font-mono text-cinema-subtle uppercase tracking-wider">Hall of Fame</span>
              </div>
              <div className="divide-y divide-cinema-border/10">
                {topRated.map((entry, i) => (
                  <div key={entry.id} onClick={() => onEntryClick(entry)}
                    className="flex items-center gap-2.5 px-4 py-2 cursor-pointer hover:bg-gold/[0.03] transition-colors group">
                    <span className="text-[10px] font-mono w-4 text-right" style={{ color: i === 0 ? '#c4a265' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'rgba(245,240,232,0.15)' }}>
                      {i === 0 ? '👑' : `#${i + 1}`}
                    </span>
                    <div className="w-6 h-8 flex-shrink-0 rounded overflow-hidden border border-cinema-border/20">
                      {entry.poster_url ? <img src={entry.poster_url} alt="" className="w-full h-full object-cover" /> :
                        <div className="w-full h-full flex items-center justify-center" style={{ background: `${typeConfig[entry.type]?.color}08` }}>
                          <div className="opacity-30" style={{ color: typeConfig[entry.type]?.color }}>{getTypeIcon(entry.type)}</div>
                        </div>}
                    </div>
                    <p className="text-[11px] text-cinema-text truncate flex-1 group-hover:text-gold transition-colors">{entry.title}</p>
                    <div className="flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 text-gold fill-current" />
                      <span className="text-[10px] text-gold font-mono font-bold">{entry.rating}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Goals / Activity */}
          <div className="cinema-card overflow-hidden">
            <div className="px-4 py-2.5 border-b border-cinema-border/30">
              <span className="text-[10px] font-mono text-cinema-subtle uppercase tracking-wider">Activity Log</span>
            </div>
            <div className="px-4 py-3">
              {activities.length > 0 ? (
                <div className="space-y-2 relative before:absolute before:left-[5px] before:top-1 before:bottom-1 before:w-px before:bg-cinema-border/15">
                  {activities.slice(0, 5).map(activity => (
                    <div key={activity.id} className="flex items-start gap-3 pl-4 relative">
                      <div className={`absolute left-0 top-1 w-[11px] h-[11px] rounded-full border-2 border-cinema-bg ${
                        activity.action === 'added' ? 'bg-green-400' :
                        activity.action === 'rated' ? 'bg-gold' :
                        activity.action === 'completed' ? 'bg-blue-400' :
                        activity.action === 'deleted' ? 'bg-red-400' : 'bg-cinema-subtle'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] text-cinema-muted truncate block"><span className="capitalize text-cinema-text">{activity.action}</span> {activity.entry_title}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-cinema-subtle/20 text-[10px]">Appears as you track entries</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =================== LIBRARY VIEW ===================
function LibraryView({ entries, allEntries, loading, filterType, setFilterType, searchQuery, setSearchQuery,
  librarySort, setLibrarySort, onEntryClick, onAddEntry, onQuickRate, getTypeIcon, isDemo, onShareClick }) {

  const [viewMode, setViewMode] = useState('grid');

  const stats = {
    total: entries.length,
    movies: entries.filter(e => e.type === 'Movie').length,
    series: entries.filter(e => e.type === 'Series').length,
    anime: entries.filter(e => e.type === 'Anime').length,
    books: entries.filter(e => e.type === 'Book').length,
  };

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-serif text-cinema-text tracking-tight">Your <em className="text-gold">Library</em></h2>
          {/* Inline Stats */}
          <div className="flex items-center gap-3 mt-2">
            <span className="text-sm font-mono text-gold">{stats.total}</span>
            <span className="text-[10px] text-cinema-subtle/40">|</span>
            <div className="flex items-center gap-3">
              {[
                { label: 'Movies', value: stats.movies },
                { label: 'Series', value: stats.series },
                { label: 'Anime', value: stats.anime },
                { label: 'Books', value: stats.books },
              ].filter(s => s.value > 0).map(s => (
                <span key={s.label} className="text-[11px] text-cinema-subtle">
                  <span className="text-cinema-muted font-mono">{s.value}</span> {s.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* View Toggle + Share */}
        <div className="flex items-center gap-2">
          {!isDemo && onShareClick && (
            <button onClick={onShareClick}
              className="p-1.5 cinema-card rounded-full text-cinema-subtle hover:text-gold transition-colors"
              title="Share library">
              <Share2 className="w-3.5 h-3.5" />
            </button>
          )}
          <div className="flex items-center p-1 cinema-card rounded-full">
            <button onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-full transition-all ${viewMode === 'grid' ? 'text-gold bg-gold/10' : 'text-cinema-subtle hover:text-cinema-muted'}`}
              title="Grid view">
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-full transition-all ${viewMode === 'list' ? 'text-gold bg-gold/10' : 'text-cinema-subtle hover:text-cinema-muted'}`}
              title="List view">
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Type Filter */}
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-1 p-1 cinema-card rounded-full w-max">
              {['All', 'Movie', 'Series', 'Anime', 'Book'].map(type => (
                <button key={type} onClick={() => setFilterType(type)}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-all whitespace-nowrap ${
                    filterType === type ? 'text-gold bg-gold/10 border border-gold-200' : 'text-cinema-subtle hover:text-cinema-muted border border-transparent'
                  }`}>
                  {type === 'All' ? 'All' : type === 'Movie' ? 'Movies' : type === 'Series' ? 'Series' : type === 'Anime' ? 'Anime' : type === 'Book' ? 'Books' : type}
                </button>
              ))}
            </div>
          </div>

          {/* Sort Dropdown */}
          <SortDropdown value={librarySort} onChange={setLibrarySort} />
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 md:w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-cinema-subtle" />
            <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gold-50 border border-cinema-border text-cinema-text text-xs rounded-full py-1.5 pl-8 pr-3 focus:outline-none focus:ring-1 focus:ring-gold-200 placeholder-cinema-subtle" />
          </div>
          <span className="text-xs text-cinema-subtle font-mono tracking-wider whitespace-nowrap">{entries.length} entr{entries.length === 1 ? 'y' : 'ies'}</span>
        </div>
      </div>

      {/* Entries */}
      {loading ? (
        <div className="text-center py-20 text-cinema-subtle">Loading...</div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-cinema-border rounded-xl bg-cinema-card">
          <div className="w-12 h-12 bg-gold-50 border border-gold-100 rounded-full flex items-center justify-center mb-4 text-gold">
            <Inbox className="w-5 h-5" />
          </div>
          <h3 className="text-cinema-text font-serif font-medium text-sm mb-1">No entries found</h3>
          <p className="text-cinema-subtle text-xs max-w-xs mx-auto">Try adjusting your filters or add new items.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {entries.map(entry => (
            <EntryCard key={entry.id} entry={entry} onClick={() => onEntryClick(entry)} getTypeIcon={getTypeIcon} onQuickRate={onQuickRate} isDemo={isDemo} />
          ))}
        </div>
      ) : (
        <div className="cinema-card rounded-lg border border-cinema-border overflow-hidden divide-y divide-cinema-border">
          {/* List Header */}
          <div className="hidden md:grid grid-cols-[1fr_72px_64px_56px_72px] gap-3 px-4 py-2 text-[10px] text-cinema-subtle font-mono uppercase tracking-wider bg-cinema-bg/50">
            <span>Title</span>
            <span>Type</span>
            <span className="text-center">Rating</span>
            <span className="text-center">Season</span>
            <span className="text-right">Added</span>
          </div>
          {entries.map(entry => (
            <EntryListRow key={entry.id} entry={entry} onClick={() => onEntryClick(entry)} getTypeIcon={getTypeIcon} onQuickRate={onQuickRate} isDemo={isDemo} />
          ))}
        </div>
      )}
    </div>
  );
}

// =================== WATCHLIST VIEW ===================
function WatchlistView({ entries, loading, watchlistStatus, setWatchlistStatus, filterType, setFilterType,
  searchQuery, setSearchQuery, onEntryClick, onQuickRate, getTypeIcon, isDemo, setIsSpotlightOpen }) {

  const statusCounts = {
    all: entries.length,
    watching: entries.filter(e => (e.status || 'completed') === 'watching').length,
    planned: entries.filter(e => (e.status || 'completed') === 'planned').length,
    dropped: entries.filter(e => (e.status || 'completed') === 'dropped').length,
  };

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs text-cinema-subtle font-mono uppercase tracking-[0.2em] mb-1">Tracking</p>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-2xl md:text-3xl font-serif text-cinema-text tracking-tight">Your <em className="text-gold">Watchlist</em></h2>
          <button onClick={() => setIsSpotlightOpen(true)}
            className="flex items-center gap-2 border border-gold/30 hover:border-gold/50 text-gold text-xs font-medium py-1.5 px-4 rounded-full transition-colors w-max">
            <Plus className="w-3.5 h-3.5" /> Add to Watchlist
          </button>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="mb-4 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex items-center gap-1 p-1 cinema-card rounded-full w-max">
          {[
            { key: 'all', label: 'All', icon: List },
            { key: 'watching', label: 'Watching', icon: Eye },
            { key: 'planned', label: 'Planned', icon: Clock },
            { key: 'dropped', label: 'Dropped', icon: Trash2 },
          ].map(s => (
            <button key={s.key} onClick={() => setWatchlistStatus(s.key)}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-full transition-all whitespace-nowrap ${
                watchlistStatus === s.key ? 'text-gold bg-gold/10 border border-gold-200' : 'text-cinema-subtle hover:text-cinema-muted border border-transparent'
              }`}>
              <s.icon className="w-3 h-3" />
              {s.label}
              <span className="text-[10px] opacity-60">({statusCounts[s.key]})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Type Filter */}
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-1 p-1 cinema-card rounded-full w-max">
              {['All', 'Movie', 'Series', 'Anime', 'Book'].map(type => (
                <button key={type} onClick={() => setFilterType(type)}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-all whitespace-nowrap ${
                    filterType === type ? 'text-gold bg-gold/10 border border-gold-200' : 'text-cinema-subtle hover:text-cinema-muted border border-transparent'
                  }`}>
                  {type === 'All' ? 'All' : type === 'Movie' ? 'Movies' : type === 'Series' ? 'Series' : type === 'Anime' ? 'Anime' : type === 'Book' ? 'Books' : type}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 md:w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-cinema-subtle" />
            <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gold-50 border border-cinema-border text-cinema-text text-xs rounded-full py-1.5 pl-8 pr-3 focus:outline-none focus:ring-1 focus:ring-gold-200 placeholder-cinema-subtle" />
          </div>
          <span className="text-xs text-cinema-subtle font-mono tracking-wider whitespace-nowrap">{entries.length} item{entries.length === 1 ? '' : 's'}</span>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-20 text-cinema-subtle">Loading...</div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-cinema-border rounded-xl bg-cinema-card">
          <div className="w-12 h-12 bg-gold-50 border border-gold-100 rounded-full flex items-center justify-center mb-4 text-gold">
            <List className="w-5 h-5" />
          </div>
          <h3 className="text-cinema-text font-serif font-medium text-sm mb-1">Your watchlist is empty</h3>
          <p className="text-cinema-subtle text-xs max-w-xs mx-auto mb-4">Add movies and shows you plan to watch or are currently watching.</p>
          <button onClick={() => setIsSpotlightOpen(true)}
            className="flex items-center gap-2 bg-gold hover:bg-gold-light text-cinema-bg text-xs font-medium py-2 px-4 rounded-lg transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Entry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {entries.map(entry => (
            <EntryCard key={entry.id} entry={entry} onClick={() => onEntryClick(entry)} getTypeIcon={getTypeIcon} onQuickRate={onQuickRate} isDemo={isDemo} />
          ))}
        </div>
      )}
    </div>
  );
}

// =================== ARCHIVE VIEW ===================
function ArchiveView({ entries, allEntries, loading, filterType, setFilterType, searchQuery, setSearchQuery,
  archiveYearFrom, setArchiveYearFrom, archiveYearTo, setArchiveYearTo, availableYears,
  librarySort, setLibrarySort, onEntryClick, onQuickRate, getTypeIcon, isDemo }) {

  const minYear = availableYears.length > 0 ? Math.min(...availableYears, currentYear - 10) : currentYear - 10;
  const maxYear = currentYear - 1;
  const yearRange = Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i);

  const isFiltered = archiveYearFrom || archiveYearTo;

  const presets = [
    { label: 'All time', from: null, to: null },
    { label: `${currentYear - 1}`, from: currentYear - 1, to: currentYear - 1 },
    { label: `${currentYear - 2}`, from: currentYear - 2, to: currentYear - 2 },
    { label: `${currentYear - 3}`, from: currentYear - 3, to: currentYear - 3 },
    { label: 'Last 5 yrs', from: currentYear - 5, to: currentYear - 1 },
    { label: 'Last 10 yrs', from: currentYear - 10, to: currentYear - 1 },
  ].filter(p => p.from === null || p.from >= minYear);

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs text-cinema-subtle font-mono uppercase tracking-[0.2em] mb-1">Past Years</p>
        <h2 className="text-2xl md:text-3xl font-serif text-cinema-text tracking-tight">The <em className="text-gold">Archive</em></h2>
      </div>

      {/* Unified filter bar */}
      <div className="mb-6 space-y-3">
        {/* Row 1: Year presets + custom range */}
        <div className="flex items-center gap-2 flex-wrap">
          {presets.map(preset => {
            const active = archiveYearFrom === preset.from && archiveYearTo === preset.to;
            return (
              <button key={preset.label}
                onClick={() => { setArchiveYearFrom(preset.from); setArchiveYearTo(preset.to); }}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                  active ? 'text-gold bg-gold/10 border border-gold-200' : 'text-cinema-subtle hover:text-cinema-muted border border-cinema-border'
                }`}>
                {preset.label}
              </button>
            );
          })}

          {/* Divider */}
          <div className="w-px h-5 bg-cinema-border mx-1 hidden sm:block" />

          {/* Custom range */}
          <div className="flex items-center gap-1.5">
            <YearPickerDropdown value={archiveYearFrom} onChange={setArchiveYearFrom} years={yearRange} placeholder="From" />
            <span className="text-cinema-subtle text-[10px]">—</span>
            <YearPickerDropdown value={archiveYearTo} onChange={setArchiveYearTo} years={yearRange} placeholder="To" />
          </div>

          {isFiltered && (
            <button onClick={() => { setArchiveYearFrom(null); setArchiveYearTo(null); }}
              className="p-1 text-cinema-subtle hover:text-gold transition-colors" title="Clear year filter">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Row 2: Type + Sort + Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1 p-1 cinema-card rounded-full w-max">
              {['All', 'Movie', 'Series', 'Anime', 'Book'].map(type => (
                <button key={type} onClick={() => setFilterType(type)}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-all whitespace-nowrap ${
                    filterType === type ? 'text-gold bg-gold/10 border border-gold-200' : 'text-cinema-subtle hover:text-cinema-muted border border-transparent'
                  }`}>
                  {type === 'All' ? 'All' : type === 'Movie' ? 'Movies' : type === 'Series' ? 'Series' : type === 'Anime' ? 'Anime' : type === 'Book' ? 'Books' : type}
                </button>
              ))}
            </div>
            <SortDropdown value={librarySort} onChange={setLibrarySort} />
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 md:w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-cinema-subtle" />
              <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gold-50 border border-cinema-border text-cinema-text text-xs rounded-full py-1.5 pl-8 pr-3 focus:outline-none focus:ring-1 focus:ring-gold-200 placeholder-cinema-subtle" />
            </div>
            <span className="text-xs text-cinema-subtle font-mono tracking-wider whitespace-nowrap">{entries.length} entr{entries.length === 1 ? 'y' : 'ies'}</span>
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-20 text-cinema-subtle">Loading...</div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-cinema-border rounded-xl bg-cinema-card">
          <div className="w-12 h-12 bg-gold-50 border border-gold-100 rounded-full flex items-center justify-center mb-4 text-gold">
            <Archive className="w-5 h-5" />
          </div>
          <h3 className="text-cinema-text font-serif font-medium text-sm mb-1">No archived entries</h3>
          <p className="text-cinema-subtle text-xs max-w-xs mx-auto">
            {isFiltered ? 'No entries in this year range. Try adjusting the filter.' : 'Entries from previous years will appear here.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {entries.map(entry => (
            <EntryCard key={entry.id} entry={entry} onClick={() => onEntryClick(entry)} getTypeIcon={getTypeIcon} onQuickRate={onQuickRate} isDemo={isDemo} />
          ))}
        </div>
      )}
    </div>
  );
}

// =================== SORT DROPDOWN ===================
const sortOptions = [
  { value: 'recently_added', label: 'Recently Added' },
  { value: 'title_asc', label: 'Title A-Z' },
  { value: 'title_desc', label: 'Title Z-A' },
  { value: 'rating_desc', label: 'Highest Rated' },
  { value: 'rating_asc', label: 'Lowest Rated' },
  { value: 'release_date', label: 'Release Date' },
];

function SortDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = sortOptions.find(o => o.value === value) || sortOptions[0];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-gold-50 border border-cinema-border text-cinema-text text-xs rounded-full px-3 py-1.5 hover:border-gold/30 transition-colors cursor-pointer">
        <span>{selected.label}</span>
        <ChevronDown className={`w-3 h-3 text-cinema-subtle transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full mt-1 right-0 min-w-[160px] bg-cinema-card border border-cinema-border rounded-lg shadow-2xl overflow-hidden z-50">
          {sortOptions.map(option => (
            <button key={option.value} type="button"
              onClick={() => { onChange(option.value); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                value === option.value ? 'text-gold bg-gold/10' : 'text-cinema-muted hover:text-cinema-text hover:bg-gold-50'
              }`}>
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// =================== YEAR PICKER DROPDOWN ===================
function YearPickerDropdown({ label, value, onChange, years, placeholder }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 bg-gold-50 border text-xs rounded-full px-3 py-1.5 transition-colors cursor-pointer ${
          value ? 'border-gold-200 text-gold' : 'border-cinema-border text-cinema-muted hover:border-gold/30'
        }`}>
        <span>{value || placeholder}</span>
        <ChevronDown className={`w-3 h-3 text-cinema-subtle transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 min-w-[100px] max-h-[200px] overflow-y-auto bg-cinema-card border border-cinema-border rounded-lg shadow-2xl z-50 scrollbar-hide">
          <button type="button"
            onClick={() => { onChange(null); setOpen(false); }}
            className={`w-full text-left px-3 py-2 text-xs transition-colors ${
              !value ? 'text-gold bg-gold/10' : 'text-cinema-muted hover:text-cinema-text hover:bg-gold-50'
            }`}>
            {placeholder}
          </button>
          {years.map(year => (
            <button key={year} type="button"
              onClick={() => { onChange(year); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                value === year ? 'text-gold bg-gold/10' : 'text-cinema-muted hover:text-cinema-text hover:bg-gold-50'
              }`}>
              {year}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// =================== STAT CARD ===================
function StatCard({ label, value, icon }) {
  return (
    <div className="p-4 rounded-lg border border-cinema-border bg-cinema-card cursor-default">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-cinema-subtle uppercase tracking-wider font-mono">{label}</p>
        {icon}
      </div>
      <h3 className="text-2xl font-serif text-gold tracking-tight">{value}</h3>
    </div>
  );
}

// =================== ENTRY CARD ===================
function EntryCard({ entry, onClick, getTypeIcon, onQuickRate, isDemo }) {
  const status = entry.status || 'completed';
  const statusColors = {
    watching: 'bg-blue-500/80 text-white',
    planned: 'bg-purple-500/80 text-white',
    dropped: 'bg-red-500/80 text-white',
    completed: '',
  };

  return (
    <div className="group cursor-pointer" onClick={onClick}>
      <div className="relative aspect-[2/3] rounded-lg border border-cinema-border overflow-hidden">
        {entry.poster_url ? (
          <>
            <img src={entry.poster_url} alt={entry.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              onError={(e) => { e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="150"%3E%3Crect fill="%23111110" width="100" height="150"/%3E%3C/svg%3E'; }} />

            {/* Status Badge */}
            {status !== 'completed' && (
              <div className={`absolute top-2 left-2 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${statusColors[status]}`}>
                {status}
              </div>
            )}

            {/* Progress Bar */}
            {status === 'watching' && entry.progress_total > 0 && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-cinema-bg/50">
                <div className="h-full bg-gold" style={{ width: `${(entry.progress_current / entry.progress_total) * 100}%` }} />
              </div>
            )}

            {/* Bottom gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-cinema-bg/90 via-cinema-bg/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <h3 className="text-cinema-text font-serif font-medium text-xs leading-tight line-clamp-2 mb-1">{entry.title}</h3>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-gold font-medium uppercase tracking-wider">{entry.type}</span>
                {entry.rating && (
                  <div className="flex items-center gap-1 text-gold text-[10px]">
                    <Star className="w-2.5 h-2.5 fill-current" /><span>{entry.rating}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-cinema-bg/85 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
              <h3 className="text-cinema-text font-serif font-semibold text-sm leading-tight mb-1.5 line-clamp-2">{entry.title}</h3>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] text-gold font-medium uppercase tracking-wider">{entry.type}</span>
                {(entry.type === 'Series' || entry.type === 'Anime') && entry.season && (
                  <span className="text-[10px] font-medium bg-gold-50 text-cinema-muted px-2 py-0.5 rounded border border-gold-100">S{entry.season}</span>
                )}
                {entry.rating && (
                  <div className="flex items-center gap-1 text-gold text-[10px]">
                    <Star className="w-2.5 h-2.5 fill-current" /><span>{entry.rating}</span>
                  </div>
                )}
              </div>

              {/* Quick Rate Stars */}
              {!isDemo && (
                <div className="flex items-center gap-0.5 mb-2" onClick={(e) => e.stopPropagation()}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} onClick={(e) => { e.stopPropagation(); onQuickRate(entry.id, star); }}
                      className={`transition-colors ${entry.rating >= star ? 'text-gold' : 'text-cinema-subtle hover:text-gold/60'}`}>
                      <Star className={`w-3.5 h-3.5 ${entry.rating >= star ? 'fill-current' : ''}`} />
                    </button>
                  ))}
                </div>
              )}

              {entry.description && (
                <p className="text-cinema-muted text-[10px] leading-relaxed line-clamp-3 mb-2">{entry.description}</p>
              )}

              {/* Progress on hover */}
              {status === 'watching' && entry.progress_total > 0 && (
                <p className="text-[10px] text-cinema-subtle mb-1">{entry.progress_current}/{entry.progress_total} episodes</p>
              )}

              <div className="text-[9px] text-cinema-subtle uppercase tracking-wider">
                {isDemo ? 'Click to view' : 'Click to edit'}
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full bg-cinema-card flex flex-col items-center justify-center p-4 text-center">
            {status !== 'completed' && (
              <div className={`absolute top-2 left-2 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${statusColors[status]}`}>
                {status}
              </div>
            )}
            <div className="p-2 rounded bg-gold-50 border border-gold-100 text-gold mb-3">{getTypeIcon(entry.type)}</div>
            <h3 className="text-cinema-text font-serif font-medium text-xs leading-tight line-clamp-3 mb-2">{entry.title}</h3>
            <span className="text-[9px] text-gold font-medium uppercase tracking-wider">{entry.type}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// =================== ENTRY LIST ROW ===================
function EntryListRow({ entry, onClick, getTypeIcon, onQuickRate, isDemo }) {
  const status = entry.status || 'completed';
  const statusColors = {
    watching: 'text-blue-400',
    planned: 'text-purple-400',
    dropped: 'text-red-400',
  };

  const addedDate = entry.created_at ? new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';

  return (
    <div className="group cursor-pointer hover:bg-gold-50 transition-colors duration-150" onClick={onClick}>
      <div className="flex items-center md:grid md:grid-cols-[1fr_72px_64px_56px_72px] md:gap-3 px-4 py-2.5">
        {/* Title + mobile info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-cinema-text text-[13px] font-medium truncate">{entry.title}</h3>
            {status !== 'completed' && (
              <span className={`flex-shrink-0 text-[9px] font-semibold uppercase tracking-wider ${statusColors[status]}`}>
                {status}
              </span>
            )}
          </div>
          {/* Mobile subtitle */}
          <div className="flex items-center gap-2 mt-0.5 md:hidden">
            <span className="text-[10px] text-gold/70 uppercase tracking-wider">{entry.type}</span>
            {entry.rating > 0 && (
              <span className="text-[10px] text-cinema-subtle"><Star className="w-2.5 h-2.5 inline text-gold fill-gold -mt-px" /> {entry.rating}</span>
            )}
          </div>
        </div>

        {/* Type */}
        <span className="hidden md:block text-[11px] text-gold/70 uppercase tracking-wider">{entry.type}</span>

        {/* Rating */}
        <div className="hidden md:flex items-center justify-center">
          {entry.rating > 0 ? (
            <span className="text-[11px] text-cinema-muted flex items-center gap-1"><Star className="w-2.5 h-2.5 text-gold fill-gold" />{entry.rating}</span>
          ) : (
            <span className="text-cinema-subtle/40 text-[11px]">—</span>
          )}
        </div>

        {/* Season */}
        <div className="hidden md:flex items-center justify-center">
          {(entry.type === 'Series' || entry.type === 'Anime') && entry.season > 0 ? (
            <span className="text-[11px] text-cinema-muted">S{entry.season}</span>
          ) : (
            <span className="text-cinema-subtle/40 text-[11px]">—</span>
          )}
        </div>

        {/* Date */}
        <span className="hidden md:block text-[11px] text-cinema-subtle text-right font-mono">{addedDate}</span>
      </div>
    </div>
  );
}

// =================== STATS VIEW ===================
function StatsView({ entries, isDemo }) {
  const filteredEntries = entries.filter(e => e.year >= 2026);
  const types = ['Movie', 'Series', 'Anime', 'Book'];
  const [goals, setGoals] = useState([]);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalForm, setGoalForm] = useState({ type: 'entries', target: 10, period: 'monthly' });
  const [streak, setStreak] = useState({ streak: 0, dates: [] });
  const [heatmap, setHeatmap] = useState([]);

  useEffect(() => {
    if (isDemo) return;
    goalService.getAll().then(setGoals).catch(e => console.error('Goals fetch failed:', e));
    activityService.getStreak().then(setStreak).catch(e => console.error('Streak fetch failed:', e));
    activityService.getHeatmap(30).then(setHeatmap).catch(e => console.error('Heatmap fetch failed:', e));
  }, [isDemo]);

  const handleCreateGoal = async () => {
    try {
      await goalService.create(goalForm);
      const updated = await goalService.getAll();
      setGoals(updated);
      setShowGoalForm(false);
      toast.success('Goal created!');
    } catch { toast.error('Failed to create goal'); }
  };

  const handleDeleteGoal = async (id) => {
    try {
      await goalService.delete(id);
      setGoals(prev => prev.filter(g => g.id !== id));
      toast.success('Goal deleted');
    } catch { toast.error('Failed to delete goal'); }
  };

  // CSV Export
  const handleExport = async () => {
    try {
      const response = await fetch('/api/csv/export', { credentials: 'include' });
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'stacked-export.csv';
      document.body.appendChild(a); a.click();
      window.URL.revokeObjectURL(url); a.remove();
      toast.success('Exported!');
    } catch { toast.error('Export failed'); }
  };

  // CSV Import
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.csv';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
      const data = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = lines[i].match(/(".*?"|[^,]+)/g) || [];
        const row = {};
        headers.forEach((h, idx) => { row[h] = (values[idx] || '').replace(/^"|"$/g, '').replace(/""/g, '"'); });
        data.push(row);
      }
      try {
        const result = await csvService.importCsv(data);
        toast.success(`Imported ${result.imported} entries (${result.skipped} skipped)`);
      } catch { toast.error('Import failed'); }
    };
    input.click();
  };

  const avgRatings = types.reduce((acc, type) => {
    const typeEntries = filteredEntries.filter(e => e.type === type && e.rating != null);
    acc[type] = typeEntries.length > 0 ? (typeEntries.reduce((sum, e) => sum + e.rating, 0) / typeEntries.length).toFixed(1) : '0.0';
    return acc;
  }, {});

  const distribution = types.map(type => ({
    type, count: filteredEntries.filter(e => e.type === type).length,
    percentage: filteredEntries.length > 0 ? (filteredEntries.filter(e => e.type === type).length / filteredEntries.length) * 100 : 0
  }));

  const typeColors = { Movie: 'bg-gold opacity-90', Series: 'bg-gold opacity-70', Anime: 'bg-gold opacity-50', Book: 'bg-gold opacity-40' };
  const typeIcons = {
    Movie: <Film className="w-4 h-4 text-gold" />, Series: <Tv className="w-4 h-4 text-gold/80" />,
    Anime: <Sparkles className="w-4 h-4 text-gold/60" />, Book: <Book className="w-4 h-4 text-gold/50" />
  };

  const topRated = [...filteredEntries].filter(e => e.rating != null).sort((a, b) => b.rating - a.rating).slice(0, 5);
  const ratingBuckets = [
    { range: '4.5-5', min: 4.5, max: 5, color: 'bg-gold' },
    { range: '3.5-4', min: 3.5, max: 4.4, color: 'bg-gold opacity-80' },
    { range: '2.5-3', min: 2.5, max: 3.4, color: 'bg-gold opacity-60' },
    { range: '1.5-2', min: 1.5, max: 2.4, color: 'bg-gold opacity-40' },
    { range: '0-1', min: 0, max: 1.4, color: 'bg-gold opacity-25' }
  ];
  const ratingDistribution = ratingBuckets.map(bucket => ({
    ...bucket, count: filteredEntries.filter(e => e.rating >= bucket.min && e.rating <= bucket.max).length
  }));
  const maxRatingCount = Math.max(...ratingDistribution.map(r => r.count), 1);

  const ratedEntries = filteredEntries.filter(e => e.rating != null);
  const overallAvg = ratedEntries.length > 0 ? (ratedEntries.reduce((sum, e) => sum + e.rating, 0) / ratedEntries.length).toFixed(1) : '0.0';
  const highestRated = ratedEntries.length > 0 ? Math.max(...ratedEntries.map(e => e.rating)).toFixed(1) : '0.0';
  const lowestRated = ratedEntries.length > 0 ? Math.min(...ratedEntries.map(e => e.rating)).toFixed(1) : '0.0';

  // Monthly chart data
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (11 - i));
    const month = date.getMonth();
    const year = date.getFullYear();
    const count = entries.filter(e => {
      const d = new Date(e.created_at);
      return d.getMonth() === month && d.getFullYear() === year;
    }).length;
    return { month: date.toLocaleString('en', { month: 'short' }), count };
  });
  const maxMonthly = Math.max(...monthlyData.map(d => d.count), 1);

  // Tag breakdown
  const tagCounts = {};
  entries.forEach(e => {
    try {
      const tags = JSON.parse(e.tags || '[]');
      tags.forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1; });
    } catch {}
  });
  const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <div className="mb-2">
        <p className="text-xs text-cinema-subtle font-mono uppercase tracking-[0.2em] mb-1">Insights</p>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl md:text-3xl font-serif text-cinema-text tracking-tight">Your <em className="text-gold">Stats</em></h2>
          <div className="flex items-center gap-2">
            {!isDemo && (
              <>
                <button onClick={handleImport} className="flex items-center gap-1.5 px-3 py-1.5 border border-cinema-border hover:border-gold/30 text-cinema-muted text-xs rounded-full transition-colors">
                  <Upload className="w-3 h-3" /> Import
                </button>
                <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 border border-cinema-border hover:border-gold/30 text-cinema-muted text-xs rounded-full transition-colors">
                  <Download className="w-3 h-3" /> Export
                </button>
              </>
            )}
            <span className="text-xs text-cinema-subtle font-mono">{filteredEntries.length} entries (2026+)</span>
          </div>
        </div>
      </div>

      {/* Streak + Goals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Streak Calendar */}
        <div className="cinema-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <Flame className="w-5 h-5 text-gold" />
            <h3 className="text-sm font-serif text-cinema-text">{streak.streak} Day Streak</h3>
          </div>
          <div className="flex gap-1 flex-wrap">
            {Array.from({ length: 30 }, (_, i) => {
              const date = new Date(); date.setDate(date.getDate() - (29 - i));
              const dateStr = date.toISOString().split('T')[0];
              const dayData = heatmap.find(h => h.date === dateStr);
              const count = dayData?.count || 0;
              const opacity = count === 0 ? 'bg-gold/5' : count <= 2 ? 'bg-gold/20' : count <= 4 ? 'bg-gold/40' : 'bg-gold/70';
              return <div key={i} className={`w-3.5 h-3.5 rounded-sm ${opacity}`} title={`${dateStr}: ${count}`} />;
            })}
          </div>
        </div>

        {/* Goals */}
        <div className="cinema-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-serif text-cinema-text flex items-center gap-2"><Target className="w-4 h-4 text-gold" /> Goals</h3>
            {!isDemo && <button onClick={() => setShowGoalForm(!showGoalForm)} className="text-xs text-gold hover:text-gold-light">
              {showGoalForm ? 'Cancel' : '+ New Goal'}
            </button>}
          </div>
          {showGoalForm && (
            <div className="flex gap-2 mb-4 flex-wrap">
              <select value={goalForm.type} onChange={(e) => setGoalForm({...goalForm, type: e.target.value})}
                className="bg-gold-50 border border-cinema-border text-cinema-text text-xs rounded-lg px-2 py-1.5">
                <option value="entries">Entries</option><option value="movies">Movies</option><option value="books">Books</option>
              </select>
              <input type="number" min="1" value={goalForm.target} onChange={(e) => setGoalForm({...goalForm, target: parseInt(e.target.value)})}
                className="bg-gold-50 border border-cinema-border text-cinema-text text-xs rounded-lg px-2 py-1.5 w-16" />
              <select value={goalForm.period} onChange={(e) => setGoalForm({...goalForm, period: e.target.value})}
                className="bg-gold-50 border border-cinema-border text-cinema-text text-xs rounded-lg px-2 py-1.5">
                <option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option>
              </select>
              <button onClick={handleCreateGoal} className="px-3 py-1.5 bg-gold text-cinema-bg text-xs rounded-lg font-medium">Create</button>
            </div>
          )}
          {goals.length > 0 ? (
            <div className="space-y-3">
              {goals.map(goal => (
                <div key={goal.id}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-cinema-muted capitalize">{goal.type} ({goal.period})</span>
                    <div className="flex items-center gap-2">
                      <span className="text-cinema-subtle font-mono">{goal.current}/{goal.target}</span>
                      {!isDemo && <button onClick={() => handleDeleteGoal(goal.id)} className="text-cinema-subtle hover:text-red-400"><X className="w-3 h-3" /></button>}
                    </div>
                  </div>
                  <div className="h-2 bg-gold-50 rounded-full overflow-hidden">
                    <div className="h-full bg-gold bar-fill" style={{ width: `${goal.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-cinema-subtle text-xs">No goals yet</p>}
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="cinema-card p-4">
          <span className="text-xs font-mono text-cinema-subtle uppercase tracking-wider block mb-2">Overall Average</span>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-serif text-gold tracking-tight">{overallAvg}</h3>
            <span className="text-xs text-cinema-subtle">/ 5</span>
          </div>
        </div>
        <div className="cinema-card p-4">
          <span className="text-xs font-mono text-cinema-subtle uppercase tracking-wider block mb-2">Highest Rated</span>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-serif text-gold tracking-tight">{highestRated}</h3>
            <Star className="w-4 h-4 text-gold fill-current" />
          </div>
        </div>
        <div className="cinema-card p-4">
          <span className="text-xs font-mono text-cinema-subtle uppercase tracking-wider block mb-2">Lowest Rated</span>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-serif text-gold/60 tracking-tight">{lowestRated}</h3>
            <span className="text-xs text-cinema-subtle">/ 5</span>
          </div>
        </div>
        <div className="cinema-card p-4">
          <span className="text-xs font-mono text-cinema-subtle uppercase tracking-wider block mb-2">With Ratings</span>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-serif text-gold tracking-tight">{ratedEntries.length}</h3>
            <span className="text-xs text-cinema-subtle">/ {filteredEntries.length}</span>
          </div>
        </div>
      </div>

      {/* Type Averages */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {types.map(type => (
          <div key={type} className="cinema-card p-5 hover:border-gold-200 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-cinema-subtle uppercase tracking-wider">Avg. {type}</span>
              {typeIcons[type]}
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-serif text-cinema-text tracking-tight">{avgRatings[type]}</h3>
              <span className="text-xs text-cinema-subtle">/ 5</span>
            </div>
          </div>
        ))}
      </div>

      {/* Monthly Chart */}
      <div className="cinema-card p-6">
        <h3 className="text-sm font-serif text-cinema-text mb-6">Monthly Activity (Last 12 Months)</h3>
        <div className="flex items-end gap-2 h-32">
          {monthlyData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[9px] text-cinema-subtle font-mono">{d.count}</span>
              <div className="w-full bg-gold-50 rounded-sm overflow-hidden" style={{ height: `${(d.count / maxMonthly) * 100}%`, minHeight: d.count > 0 ? '4px' : '2px' }}>
                <div className="w-full h-full bg-gold bar-fill" />
              </div>
              <span className="text-[9px] text-cinema-subtle">{d.month}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Collection Distribution */}
        <div className="cinema-card p-6">
          <h3 className="text-sm font-serif text-cinema-text mb-6">Collection Distribution</h3>
          <div className="space-y-5">
            {distribution.map(({ type, count, percentage }) => (
              <div key={type} className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-cinema-muted font-medium">{type}</span>
                  <span className="text-cinema-subtle font-mono">{count} ({percentage.toFixed(0)}%)</span>
                </div>
                <div className="h-2 w-full bg-gold-50 rounded-full overflow-hidden">
                  <div className={`h-full ${typeColors[type]} bar-fill`} style={{ width: `${percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="cinema-card p-6">
          <h3 className="text-sm font-serif text-cinema-text mb-6">Rating Distribution</h3>
          <div className="space-y-4">
            {ratingDistribution.map(({ range, count, color }) => (
              <div key={range} className="flex items-center gap-3">
                <span className="text-xs font-mono text-cinema-subtle w-12">{range}</span>
                <div className="flex-1 h-8 bg-gold-50 rounded overflow-hidden relative">
                  <div className={`h-full ${color} bar-fill`} style={{ width: `${(count / maxRatingCount) * 100}%` }} />
                  <span className="absolute inset-0 flex items-center justify-end pr-3 text-xs font-medium text-cinema-text">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tag Breakdown + Top Rated */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tag Breakdown */}
        <div className="cinema-card p-6">
          <h3 className="text-sm font-serif text-cinema-text mb-4 flex items-center gap-2"><Tag className="w-4 h-4 text-gold" /> Tags</h3>
          {topTags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {topTags.map(([tag, count]) => (
                <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gold/10 border border-gold-200 text-gold text-xs rounded-full">
                  {tag} <span className="text-cinema-subtle">({count})</span>
                </span>
              ))}
            </div>
          ) : <p className="text-cinema-subtle text-xs">No tags yet. Add tags to entries to see breakdown.</p>}
        </div>

        {/* Top Rated */}
        <div className="cinema-card p-6">
          <h3 className="text-sm font-serif text-cinema-text mb-4">Top Rated</h3>
          {topRated.length > 0 ? (
            <div className="space-y-3">
              {topRated.map((entry, idx) => (
                <div key={entry.id} className="flex items-center gap-3 p-3 rounded-lg bg-gold-50 hover:bg-gold-100 transition-colors">
                  <div className="flex items-center justify-center w-6 h-6 rounded bg-gold-100 text-gold text-xs font-mono font-medium">{idx + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-cinema-text font-medium truncate">{entry.title}</div>
                    <div className="text-xs text-cinema-subtle">{entry.type}</div>
                  </div>
                  <div className="flex items-center gap-1 text-gold text-sm font-medium">
                    <Star className="w-3.5 h-3.5 fill-current" />{entry.rating}
                  </div>
                </div>
              ))}
            </div>
          ) : <div className="text-center py-8 text-cinema-subtle text-sm">No rated entries yet</div>}
        </div>
      </div>
    </div>
  );
}

// =================== SHARE MODAL ===================
function ShareModal({ isOpen, onClose }) {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      shareService.getUserLinks().then(setLinks).catch(e => console.error('Failed to load share links:', e)).finally(() => setLoading(false));
    }
  }, [isOpen]);

  const createLink = async () => {
    try {
      const filters = filterType !== 'all' ? { type: filterType } : {};
      const link = await shareService.create(`${new Date().getFullYear()}`, filters);
      setLinks(prev => [link, ...prev]);
      toast.success('Share link created');
    } catch (e) {
      toast.error('Failed to create share link');
    }
  };

  const deleteLink = async (id) => {
    try {
      await shareService.delete(id);
      setLinks(prev => prev.filter(l => l.id !== id));
      toast.success('Link deleted');
    } catch {
      toast.error('Failed to delete link');
    }
  };

  const copyLink = (id) => {
    const url = `${window.location.origin}/share/${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-cinema-bg/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-cinema-card backdrop-blur-xl border border-cinema-border shadow-2xl rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-serif text-cinema-text flex items-center gap-2">
              <Share2 className="w-4 h-4 text-gold" /> Share Library
            </h3>
            <button onClick={onClose} className="text-cinema-subtle hover:text-cinema-muted"><X className="w-4 h-4" /></button>
          </div>

          {/* Create new link */}
          <div className="mb-4 p-3 bg-gold-50 border border-gold-100 rounded-lg">
            <p className="text-[11px] text-cinema-muted mb-2">Create a public link to share your collection</p>
            <div className="flex items-center gap-2">
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
                className="flex-1 bg-cinema-card border border-cinema-border text-cinema-text text-xs rounded-lg px-2 py-1.5">
                <option value="all">All Types</option>
                <option value="Movie">Movies</option>
                <option value="Series">Series</option>
                <option value="Anime">Anime</option>
                <option value="Book">Books</option>
              </select>
              <button onClick={createLink}
                className="px-3 py-1.5 bg-gold hover:bg-gold-light text-cinema-bg text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5">
                <Link className="w-3 h-3" /> Create Link
              </button>
            </div>
          </div>

          {/* Existing links */}
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {loading ? (
              <p className="text-cinema-subtle text-xs text-center py-4">Loading...</p>
            ) : links.length === 0 ? (
              <p className="text-cinema-subtle/40 text-xs text-center py-4">No share links yet</p>
            ) : (
              links.map(link => (
                <div key={link.id} className="flex items-center gap-2 p-2 bg-gold-50 border border-gold-100 rounded-lg">
                  <Link className="w-3 h-3 text-cinema-subtle flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-cinema-muted truncate font-mono">{link.id}</p>
                    <p className="text-[9px] text-cinema-subtle">
                      {link.collection} {link.filters && JSON.parse(link.filters || '{}').type ? `· ${JSON.parse(link.filters).type}` : ''}
                    </p>
                  </div>
                  <button onClick={() => copyLink(link.id)}
                    className="p-1.5 text-cinema-subtle hover:text-gold transition-colors" title="Copy link">
                    {copiedId === link.id ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => deleteLink(link.id)}
                    className="p-1.5 text-cinema-subtle hover:text-red-400 transition-colors" title="Delete link">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// =================== PROFILE VIEW ===================
function ProfileView({ user, updateUser, entries }) {
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [profileSaving, setProfileSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  const { logout } = useAuth();

  const handleProfileSave = async () => {
    setProfileSaving(true);
    try {
      const result = await authService.updateProfile(displayName, bio);
      updateUser(result.user);
      toast.success('Profile updated');
    } catch (e) {
      toast.error(e.message || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setPasswordSaving(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password changed successfully');
    } catch (e) {
      toast.error(e.message || 'Failed to change password');
    } finally {
      setPasswordSaving(false);
    }
  };

  const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '';
  const totalEntries = entries.length;
  const typeCounts = {
    Movie: entries.filter(e => e.type === 'Movie').length,
    Series: entries.filter(e => e.type === 'Series').length,
    Anime: entries.filter(e => e.type === 'Anime').length,
    Book: entries.filter(e => e.type === 'Book').length,
  };
  const favoriteType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="fade-in max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="mb-2">
        <p className="text-xs text-cinema-subtle font-mono uppercase tracking-[0.2em] mb-1">Account</p>
        <h2 className="text-2xl md:text-3xl font-serif text-cinema-text tracking-tight">Your <em className="text-gold">Profile</em></h2>
      </div>

      {/* Profile Info */}
      <div className="cinema-card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gold/10 border-2 border-gold/30 flex items-center justify-center">
            <User className="w-7 h-7 text-gold" />
          </div>
          <div>
            <h3 className="text-cinema-text font-serif text-lg">{displayName || user?.email?.split('@')[0] || 'User'}</h3>
            <p className="text-cinema-subtle text-xs">{user?.email}</p>
            {memberSince && <p className="text-cinema-subtle/50 text-[10px] mt-0.5">Member since {memberSince}</p>}
          </div>
        </div>

        {/* Account Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="p-3 bg-gold-50 border border-gold-100 rounded-lg text-center">
            <div className="text-lg font-serif text-gold">{totalEntries}</div>
            <div className="text-[9px] font-mono text-cinema-subtle uppercase tracking-wider">Total Entries</div>
          </div>
          <div className="p-3 bg-gold-50 border border-gold-100 rounded-lg text-center">
            <div className="text-lg font-serif text-gold">{favoriteType ? favoriteType[1] : 0}</div>
            <div className="text-[9px] font-mono text-cinema-subtle uppercase tracking-wider">{favoriteType ? favoriteType[0] + 's' : 'N/A'}</div>
          </div>
          <div className="p-3 bg-gold-50 border border-gold-100 rounded-lg text-center">
            <div className="text-lg font-serif text-gold">{entries.filter(e => e.rating).length}</div>
            <div className="text-[9px] font-mono text-cinema-subtle uppercase tracking-wider">Rated</div>
          </div>
        </div>

        {/* Edit Profile */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-cinema-subtle font-mono uppercase tracking-[0.15em]">Display Name</label>
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-gold-50 border border-gold-100 text-cinema-text text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-gold-200 focus:ring-1 focus:ring-gold-200 placeholder-cinema-subtle"
              placeholder="Your name" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-cinema-subtle font-mono uppercase tracking-[0.15em]">Bio</label>
            <textarea rows="2" value={bio} onChange={(e) => setBio(e.target.value)}
              className="w-full bg-gold-50 border border-gold-100 text-cinema-text text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-gold-200 focus:ring-1 focus:ring-gold-200 placeholder-cinema-subtle resize-none"
              placeholder="Tell us about yourself..." />
          </div>
          <button onClick={handleProfileSave} disabled={profileSaving}
            className="px-4 py-2 bg-gold hover:bg-gold-light text-cinema-bg text-xs font-medium rounded-lg transition-colors disabled:opacity-50">
            {profileSaving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>

      {/* Change Password */}
      <div className="cinema-card p-6">
        <h3 className="text-sm font-serif text-cinema-text flex items-center gap-2 mb-4">
          <Lock className="w-4 h-4 text-gold" /> Change Password
        </h3>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs text-cinema-subtle font-mono uppercase tracking-[0.15em]">Current Password</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-gold-50 border border-gold-100 text-cinema-text text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-gold-200 focus:ring-1 focus:ring-gold-200 placeholder-cinema-subtle"
              placeholder="Enter current password" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-cinema-subtle font-mono uppercase tracking-[0.15em]">New Password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-gold-50 border border-gold-100 text-cinema-text text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-gold-200 focus:ring-1 focus:ring-gold-200 placeholder-cinema-subtle"
              placeholder="Enter new password" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-cinema-subtle font-mono uppercase tracking-[0.15em]">Confirm New Password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-gold-50 border border-gold-100 text-cinema-text text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-gold-200 focus:ring-1 focus:ring-gold-200 placeholder-cinema-subtle"
              placeholder="Confirm new password" />
          </div>
          <button onClick={handlePasswordChange} disabled={passwordSaving || !currentPassword || !newPassword || !confirmPassword}
            className="px-4 py-2 bg-gold hover:bg-gold-light text-cinema-bg text-xs font-medium rounded-lg transition-colors disabled:opacity-50">
            {passwordSaving ? 'Changing...' : 'Change Password'}
          </button>
        </div>
      </div>

      {/* Sign Out */}
      <div className="cinema-card p-6">
        <button onClick={logout}
          className="flex items-center gap-2 px-4 py-2 border border-red-500/30 hover:border-red-500/50 hover:bg-red-500/10 text-red-400 text-xs font-medium rounded-lg transition-colors">
          <LogOut className="w-3.5 h-3.5" /> Sign Out
        </button>
      </div>
    </div>
  );
}

// =================== APP WRAPPER ===================
function App({ isDemo = false }) {
  const { user, loading: authLoading, logout } = useAuth();

  // Set demo mode synchronously so useEntries fetches the right endpoint
  setDemoMode(isDemo);

  if (authLoading) {
    return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">Loading...</div>;
  }

  if (isDemo) return <Dashboard isDemo={true} />;
  if (!user) return <LandingPage onLogin={() => {}} />;
  return <Dashboard isDemo={false} onLogout={logout} />;
}

function AppWithAuth({ isDemo = false }) {
  return <AuthProvider><App isDemo={isDemo} /></AuthProvider>;
}

export default AppWithAuth;
