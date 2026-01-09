import React, { useState, useEffect, useRef } from 'react';
import { Film, Tv, Sparkles, Book, Plus, Search, X, ChevronDown, Star, Inbox, ExternalLink, LogOut, Calendar } from 'lucide-react';
import { useEntries } from './hooks/useEntries';
import SearchModal from './components/SearchModal';
import SpotlightSearch from './components/SpotlightSearch';
import DlangView from './components/DlangView';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import toast, { Toaster } from 'react-hot-toast';
import { setDemoMode, entryService } from './services/api';

// Archive feature is always enabled
const currentYear = new Date().getFullYear();

function Dashboard({ isDemo = false, onLogout }) {
  // Collection always shows current year only
  const { entries, loading, createEntry, updateEntry, deleteEntry, loadEntries } = useEntries(currentYear);
  const [filterType, setFilterType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentView, setCurrentView] = useState('collection');
  const [selectedYear, setSelectedYear] = useState(null); // For archive view (null = all years)
  const [availableYears, setAvailableYears] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEntry, setCurrentEntry] = useState(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
  const dlangViewRef = useRef(null);

  // Set demo mode in API service
  useEffect(() => {
    setDemoMode(isDemo);
  }, [isDemo]);

  // Load available years for archive view
  useEffect(() => {
    entryService.getAvailableYears().then(years => {
      setAvailableYears(years); // All years
    }).catch(err => console.error('Failed to load years:', err));
  }, []);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    type: 'Movie',
    rating: '',
    season: '',
    notes: '',
    poster_url: '',
    api_id: '',
    api_provider: '',
    description: '',
    release_date: '',
    watch_date: new Date().toISOString().split('T')[0], // Default to today
    year: currentYear // Default to current year
  });

  // Filter entries
  const filteredEntries = entries.filter(entry => {
    const matchesType = filterType === 'All' || entry.type === filterType;
    const matchesSearch = entry.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Statistics
  const stats = {
    total: entries.length,
    movies: entries.filter(e => e.type === 'Movie').length,
    series: entries.filter(e => e.type === 'Series').length,
    anime: entries.filter(e => e.type === 'Anime').length,
    books: entries.filter(e => e.type === 'Book').length,
  };

  const openModal = (entry = null, defaultYear = null) => {
    // Allow viewing in demo mode, just not creating new entries
    if (isDemo && !entry) {
      toast.error(
        <div className="flex flex-col gap-1">
          <p className="font-medium text-sm">Read-Only Demo Mode</p>
          <p className="text-xs">This is the creator's data.</p>
          <a href="/#join" className="text-xs text-blue-400 hover:text-blue-300 mt-1 underline">Join the waitlist to track your own!</a>
        </div>,
        {
          duration: 4000,
        }
      );
      return;
    }

    if (entry) {
      setCurrentEntry(entry);
      setFormData({
        title: entry.title,
        type: entry.type,
        rating: entry.rating || '',
        season: entry.season || '',
        notes: entry.notes || '',
        poster_url: entry.poster_url || '',
        api_id: entry.api_id || '',
        api_provider: entry.api_provider || '',
        description: entry.description || '',
        release_date: entry.release_date || '',
        watch_date: entry.watch_date ? entry.watch_date.split('T')[0] : new Date().toISOString().split('T')[0],
        year: entry.year || currentYear
      });
    } else {
      setCurrentEntry(null);
      // Use defaultYear if provided (for adding to archive), otherwise current year
      const yearToUse = defaultYear || currentYear;
      setFormData({
        title: '',
        type: 'Movie',
        rating: '',
        season: '',
        notes: '',
        poster_url: '',
        api_id: '',
        api_provider: '',
        description: '',
        release_date: '',
        watch_date: new Date().toISOString().split('T')[0],
        year: yearToUse
      });
    }
    setIsModalOpen(true);
  };

  const handleSearchSelect = (apiData) => {
    setFormData(prev => ({
      ...prev,
      ...apiData
    }));
  };

  const handleSpotlightSelect = async (result) => {
    if (isDemo) {
      toast.error(
        <div className="flex flex-col gap-1">
          <p className="font-medium text-sm">Read-Only Demo Mode</p>
          <p className="text-xs">This is the creator's data.</p>
          <a href="/#join" className="text-xs text-blue-400 hover:text-blue-300 mt-1 underline">Join the waitlist to track your own!</a>
        </div>,
        {
          duration: 4000,
        }
      );
      return;
    }

    // Check if we're on Dlang page - save directly to dlang database
    if (currentView === 'dlang') {
      try {
        const payload = {
          title: result.title || '',
          year: result.year ? parseInt(result.year) : null,
          language: 'English', // Default, user can edit later
          genre: result.genre || '',
          director: result.director || '',
          rating: result.rating ? parseFloat(result.rating) : null,
          poster_url: result.poster || '',
          notes: result.plot || ''
        };
        
        const res = await fetch('/api/dlang', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (!res.ok) throw new Error('Failed to save');
        
        // Refresh dlang view
        if (dlangViewRef.current && dlangViewRef.current.refresh) {
          dlangViewRef.current.refresh();
        }
        setIsSpotlightOpen(false);
      } catch (error) {
        alert('Failed to add movie: ' + error.message);
      }
      return;
    }
    
    // Pre-fill form with IMDB data and open edit modal for main collection
    setCurrentEntry(null);
    setFormData({
      title: result.title || '',
      type: result.type || 'Movie',
      rating: result.rating || '',
      season: '',
      notes: '',
      poster_url: result.poster || '',
      api_id: result.imdbId || '',
      api_provider: 'imdb',
      description: result.plot || '',
      release_date: result.releaseDate || result.year || '',
      watch_date: new Date().toISOString().split('T')[0] // Add watch_date
    });
    setIsSpotlightOpen(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentEntry(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isDemo) {
      toast.error(
        <div className="flex flex-col gap-1">
          <p className="font-medium text-sm">Read-Only Demo Mode</p>
          <p className="text-xs">Cannot save changes to the creator's data.</p>
          <a href="/#join" className="text-xs text-blue-400 hover:text-blue-300 mt-1 underline">Join the waitlist to track your own!</a>
        </div>,
        {
          duration: 4000,
        }
      );
      return;
    }

    try {
      const data = {
        ...formData,
        rating: formData.rating ? parseFloat(formData.rating) : null,
        season: formData.season ? parseInt(formData.season) : null,
        year: formData.year ? parseInt(formData.year) : currentYear,
      };

      if (currentEntry) {
        await updateEntry(currentEntry.id, data);
        // If year changed, entry will move to different view
        if (currentEntry.year !== data.year) {
          toast.success(`Entry moved to ${data.year}`);
          // Reload entries if we're in collection view (to remove moved entry)
          if (currentView === 'collection') {
            loadEntries(currentYear);
          }
        }
      } else {
        await createEntry(data);
      }
      closeModal();
      // Refresh available years in case a new year was added
      entryService.getAvailableYears().then(years => {
        setAvailableYears(years);
      }).catch(err => console.error('Failed to refresh years:', err));
    } catch (error) {
      // Handle duplicate entry error
      if (error.message.includes('Duplicate entry') || error.message.includes('already added')) {
        toast.error(error.message);
      } else {
        toast.error('Failed to save entry: ' + error.message);
      }
    }
  };

  const handleDelete = async () => {
    if (isDemo) {
      toast.error(
        <div className="flex flex-col gap-1">
          <p className="font-medium text-sm">Read-Only Demo Mode</p>
          <p className="text-xs">Cannot delete the creator's data.</p>
          <a href="/#join" className="text-xs text-blue-400 hover:text-blue-300 mt-1 underline">Join the waitlist to track your own!</a>
        </div>,
        {
          duration: 4000,
        }
      );
      return;
    }

    if (window.confirm('Delete this entry?')) {
      try {
        await deleteEntry(currentEntry.id);
        closeModal();
      } catch (error) {
        alert('Failed to delete entry: ' + error.message);
      }
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

  const getTypeColor = (type) => {
    switch(type) {
      case 'Movie': return 'from-indigo-500/10';
      case 'Series': return 'from-violet-500/10';
      case 'Anime': return 'from-pink-500/10';
      case 'Book': return 'from-emerald-500/10';
      default: return 'from-indigo-500/10';
    }
  };

  return (
    <div className="min-h-screen flex flex-col text-zinc-400 selection:bg-zinc-800 selection:text-zinc-200">
      <Toaster 
        toastOptions={{
          className: '',
          style: {
            background: '#18181b',
            color: '#fff',
            border: '1px solid #27272a',
          },
        }}
      />
      {/* Background Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-40 border-b border-zinc-800/50 glass">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div 
              className="flex items-center gap-2 group cursor-pointer" 
              onClick={() => setCurrentView('collection')}
            >
              <div className="w-6 h-6 bg-zinc-100 rounded text-zinc-950 flex items-center justify-center font-bold text-xs tracking-tighter group-hover:bg-zinc-200 transition-colors">
                S
              </div>
              <span className="text-zinc-100 font-medium tracking-tight text-sm">Stacked</span>
            </div>

            <div className="hidden md:flex items-center gap-1">
              <button
                onClick={() => setCurrentView('collection')}
                className={`text-xs font-medium px-3 py-1.5 rounded-md transition-all ${
                  currentView === 'collection'
                    ? 'text-zinc-100 bg-zinc-800/50'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30'
                }`}
              >
                Collection
              </button>
              <button
                onClick={() => setCurrentView('dlang')}
                className={`text-xs font-medium px-3 py-1.5 rounded-md transition-all ${
                  currentView === 'dlang'
                    ? 'text-zinc-100 bg-zinc-800/50'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30'
                }`}
              >
                Dlang
              </button>
              <button
                onClick={() => setCurrentView('stats')}
                className={`text-xs font-medium px-3 py-1.5 rounded-md transition-all ${
                  currentView === 'stats'
                    ? 'text-zinc-100 bg-zinc-800/50'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30'
                }`}
              >
                Analytics
              </button>
              <button
                onClick={() => setCurrentView('archive')}
                className={`text-xs font-medium px-3 py-1.5 rounded-md transition-all ${
                  currentView === 'archive'
                    ? 'text-zinc-100 bg-zinc-800/50'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30'
                }`}
              >
                Archive
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center relative w-64 group">
              <Search className="absolute left-3 w-4 h-4 text-zinc-500 group-focus-within:text-zinc-300 transition-colors" />
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900/50 border border-zinc-800 text-zinc-300 text-sm rounded-md py-1.5 pl-9 pr-4 focus:outline-none focus:ring-1 focus:ring-zinc-600 focus:border-zinc-600 placeholder-zinc-600 transition-all" 
              />
            </div>

            <button 
              onClick={() => setIsSpotlightOpen(true)}
              className="flex items-center gap-2 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-medium py-1.5 px-3 rounded transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{currentView === 'dlang' ? 'Add Movie' : 'Add Entry'}</span>
            </button>

            {/* Logout button - only show when not in demo mode */}
            {!isDemo && onLogout && (
              <button 
                onClick={onLogout}
                className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 text-xs font-medium py-1.5 px-2 rounded transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow pt-24 pb-12 px-6 max-w-6xl mx-auto w-full">
        {currentView === 'collection' ? (
          <div className="fade-in">
            {/* Statistics Summary */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <StatCard label="Total Items" value={stats.total} />
              <StatCard label="Movies" value={stats.movies} />
              <StatCard label="Series" value={stats.series} />
              <StatCard label="Anime" value={stats.anime} />
              <StatCard label="Books" value={stats.books} />
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-1 p-1 bg-zinc-900/50 border border-zinc-800/50 rounded-lg w-max">
                {['All', 'Movie', 'Series', 'Anime', 'Book'].map(type => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-3 py-1 text-xs font-medium rounded transition-all ${
                      filterType === type
                        ? 'text-zinc-100 bg-zinc-800 shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                    }`}
                  >
                    {type === 'Book' ? 'Books' : type === 'All' ? 'All' : `${type}s`}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span>{filteredEntries.length} entr{filteredEntries.length === 1 ? 'y' : 'ies'}</span>
              </div>
            </div>

            {/* Grid */}
            {loading ? (
              <div className="text-center py-20 text-zinc-500">Loading...</div>
            ) : filteredEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/10">
                <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center mb-4 text-zinc-600">
                  <Inbox className="w-5 h-5" />
                </div>
                <h3 className="text-zinc-200 font-medium text-sm mb-1">No entries found</h3>
                <p className="text-zinc-500 text-xs max-w-xs mx-auto">
                  Try adjusting your search or filters, or add a new item to your collection.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {filteredEntries.map(entry => (
                  <EntryCard 
                    key={entry.id} 
                    entry={entry} 
                    onClick={() => openModal(entry)}
                    getTypeIcon={getTypeIcon}
                    getTypeColor={getTypeColor}
                  />
                ))}
              </div>
            )}
          </div>
        ) : currentView === 'archive' ? (
          <ArchiveView
            selectedYear={selectedYear}
            availableYears={availableYears}
            onYearChange={setSelectedYear}
            onEntryClick={openModal}
            onAddEntry={(year) => openModal(null, year)}
            getTypeIcon={getTypeIcon}
            getTypeColor={getTypeColor}
            isDemo={isDemo}
          />
        ) : currentView === 'dlang' ? (
          <DlangView ref={dlangViewRef} searchQuery={searchQuery} isDemo={isDemo} />
        ) : (
          <StatsView entries={entries} />
        )}
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity" 
            onClick={closeModal}
          />
          
          <div 
            className="relative w-full max-w-md bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 shadow-2xl rounded-xl p-6 flex flex-col max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-medium text-white tracking-tight">
                {currentEntry ? 'Edit Entry' : 'Add Entry'}
              </h2>
              <button onClick={closeModal} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-500 flex items-center justify-between">
                  <span>Title</span>
                  {!isDemo && (
                    <button
                      type="button"
                      onClick={() => setIsSearchModalOpen(true)}
                      className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-xs"
                    >
                      <ExternalLink size={11} />
                      Search API
                    </button>
                  )}
                </label>
                <input 
                  type="text" 
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  readOnly={isDemo}
                  className="w-full bg-zinc-800/50 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-colors placeholder-zinc-600" 
                  placeholder="e.g. Inception" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-zinc-500">Type</label>
                <div className="relative">
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    disabled={isDemo}
                    className="w-full appearance-none bg-zinc-800/50 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    <option value="Movie">Movie</option>
                    <option value="Series">Series</option>
                    <option value="Anime">Anime</option>
                    <option value="Book">Book</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-zinc-500 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-500">Rating (0-10)</label>
                  <input 
                    type="number" 
                    min="0" 
                    max="10" 
                    step="0.1"
                    value={formData.rating}
                    onChange={(e) => setFormData({...formData, rating: e.target.value})}
                    readOnly={isDemo}
                    className="w-full bg-zinc-800/50 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-colors placeholder-zinc-600" 
                    placeholder="-" 
                  />
                </div>
                <div className={`space-y-1.5 ${formData.type !== 'Series' && formData.type !== 'Anime' ? 'opacity-50' : ''}`}>
                  <label className="text-xs text-zinc-500">Season</label>
                  <input 
                    type="number" 
                    min="1"
                    disabled={formData.type !== 'Series' && formData.type !== 'Anime'}
                    readOnly={isDemo}
                    value={formData.season}
                    onChange={(e) => setFormData({...formData, season: e.target.value})}
                    className="w-full bg-zinc-800/50 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-colors placeholder-zinc-600 disabled:cursor-not-allowed disabled:opacity-50" 
                    placeholder="#" 
                  />
                </div>
              </div>

              {/* Watch Date and Year Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Watch Date
                  </label>
                  <input
                    type="date"
                    value={formData.watch_date}
                    onChange={(e) => setFormData({...formData, watch_date: e.target.value})}
                    readOnly={isDemo}
                    className="w-full bg-zinc-800/50 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-500">Year (Collection)</label>
                  <div className="relative">
                    <select
                      value={formData.year}
                      onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
                      disabled={isDemo}
                      className="w-full appearance-none bg-zinc-800/50 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {/* Show available years plus current year */}
                      {[...new Set([currentYear, ...availableYears])].sort((a, b) => b - a).map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-zinc-500 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-zinc-500">Notes</label>
                <textarea 
                  rows="3"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  readOnly={isDemo}
                  className="w-full bg-zinc-800/50 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-colors placeholder-zinc-600 resize-none" 
                  placeholder="Thoughts, memorable quotes, or summary..." 
                />
              </div>

              {!isDemo && (
                <div className="flex flex-col gap-2 pt-4 border-t border-zinc-800">
                  <button 
                    type="submit"
                    className="w-full bg-white hover:bg-gray-100 text-zinc-950 font-medium text-sm py-2.5 rounded-lg transition-colors"
                  >
                    Save Entry
                  </button>
                  {currentEntry && (
                    <button 
                      type="button"
                      onClick={handleDelete}
                      className="w-full bg-transparent hover:bg-red-500/10 text-red-400 hover:text-red-300 border border-zinc-700 hover:border-red-500/50 font-medium text-sm py-2.5 rounded-lg transition-colors"
                    >
                      Delete Entry
                    </button>
                  )}
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Search Modal */}
      <SearchModal 
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelect={handleSearchSelect}
        type={formData.type}
      />

      {/* Spotlight Search */}
      <SpotlightSearch
        isOpen={isSpotlightOpen}
        onClose={() => setIsSpotlightOpen(false)}
        onSelect={handleSpotlightSelect}
      />
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/20 cursor-default">
      <p className="text-xs text-zinc-500 font-medium mb-1">{label}</p>
      <h3 className="text-xl font-medium text-zinc-100 tracking-tight">{value}</h3>
    </div>
  );
}

function EntryCard({ entry, onClick, getTypeIcon, getTypeColor }) {
  const [isFlipped, setIsFlipped] = React.useState(false);

  const handleClick = (e) => {
    e.stopPropagation();
    if (isFlipped) {
      // If flipped, open modal on second click
      onClick();
    } else {
      // First click: flip the card
      setIsFlipped(true);
    }
  };

  const handleCardLeave = () => {
    // Flip back when mouse leaves
    setIsFlipped(false);
  };

  return (
    <div 
      className="flip-card-container h-72 cursor-pointer"
      onClick={handleClick}
      onMouseLeave={handleCardLeave}
    >
      <div className={`flip-card ${isFlipped ? 'flipped' : ''}`}>
        {/* Front Side - Poster */}
        <div className="flip-card-front">
          {entry.poster_url ? (
            <div className="relative w-full h-full overflow-hidden rounded-lg border border-zinc-800/60">
              <img 
                src={entry.poster_url} 
                alt={entry.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="150"%3E%3Crect fill="%2318181b" width="100" height="150"/%3E%3C/svg%3E';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <h3 className="text-white font-medium text-xs leading-tight line-clamp-2 mb-1">
                  {entry.title}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-zinc-300 font-medium uppercase tracking-wider">
                    {entry.type}
                  </span>
                  {entry.rating && (
                    <div className="flex items-center gap-1 text-yellow-400 text-[10px]">
                      <Star className="w-2.5 h-2.5 fill-current" />
                      <span>{entry.rating}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-full bg-zinc-900/30 border border-zinc-800/60 rounded-lg flex flex-col items-center justify-center p-4 text-center">
              <div className="p-2 rounded bg-zinc-800/50 border border-zinc-700/50 text-zinc-400 mb-3">
                {getTypeIcon(entry.type)}
              </div>
              <h3 className="text-zinc-100 font-medium text-xs leading-tight line-clamp-3 mb-2">
                {entry.title}
              </h3>
              <span className="text-[9px] text-zinc-500 font-medium uppercase tracking-wider">
                {entry.type}
              </span>
            </div>
          )}
        </div>

        {/* Back Side - Details */}
        <div className="flip-card-back">
          <div className={`w-full h-full bg-zinc-900/90 border border-zinc-600/50 rounded-lg p-4 flex flex-col relative overflow-hidden`}>
            <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-b ${getTypeColor(entry.type)} to-transparent opacity-30`} />
            
            <div className="relative z-10 flex-1 flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="p-1.5 rounded bg-zinc-800/50 border border-zinc-700/50 text-zinc-400">
                  {getTypeIcon(entry.type)}
                </div>
                {entry.rating ? (
                  <div className="flex items-center gap-1 text-yellow-400 text-xs">
                    <Star className="w-3 h-3 fill-current" />
                    <span>{entry.rating}</span>
                  </div>
                ) : (
                  <span className="text-zinc-600 text-xs">-</span>
                )}
              </div>

              <h3 className="text-zinc-100 font-semibold text-sm leading-tight mb-2 line-clamp-2">
                {entry.title}
              </h3>

              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">
                  {entry.type}
                </span>
                {(entry.type === 'Series' || entry.type === 'Anime') && entry.season && (
                  <span className="text-[10px] font-medium bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded border border-zinc-700">
                    Season {entry.season}
                  </span>
                )}
              </div>

              {entry.description && (
                <p className="text-zinc-400 text-[11px] leading-relaxed line-clamp-4 mb-3">
                  {entry.description}
                </p>
              )}

              {entry.notes && (
                <div className="mt-auto pt-2 border-t border-zinc-700/50">
                  <p className="text-zinc-500 text-[10px] leading-relaxed line-clamp-2">
                    {entry.notes}
                  </p>
                </div>
              )}

              <div className="mt-auto pt-3">
                <div className="text-[9px] text-zinc-600 uppercase tracking-wider">
                  Click again to edit
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ArchiveView({ selectedYear, availableYears, onYearChange, onEntryClick, onAddEntry, getTypeIcon, getTypeColor, isDemo }) {
  const [archiveEntries, setArchiveEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Load entries - all years if selectedYear is null, otherwise specific year
  useEffect(() => {
    setLoading(true);
    entryService.getAll(selectedYear)
      .then(data => {
        setArchiveEntries(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load archive entries:', err);
        setLoading(false);
      });
  }, [selectedYear]);

  // Filter entries
  const filteredEntries = archiveEntries.filter(entry => {
    const matchesType = filterType === 'All' || entry.type === filterType;
    const matchesSearch = entry.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Statistics for displayed entries
  const stats = {
    total: archiveEntries.length,
    movies: archiveEntries.filter(e => e.type === 'Movie').length,
    series: archiveEntries.filter(e => e.type === 'Series').length,
    anime: archiveEntries.filter(e => e.type === 'Anime').length,
    books: archiveEntries.filter(e => e.type === 'Book').length,
  };

  return (
    <div className="fade-in">
      {/* Header with Year Selector */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-medium text-zinc-100 tracking-tight">Archive</h2>
          <div className="relative">
            <select
              value={selectedYear || ''}
              onChange={(e) => onYearChange(e.target.value ? parseInt(e.target.value) : null)}
              className="bg-zinc-900/50 border border-zinc-800 text-zinc-300 text-sm rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-1 focus:ring-zinc-600 focus:border-zinc-600 cursor-pointer appearance-none"
            >
              <option value="">All Years</option>
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
          </div>
          {/* Year tabs for quick access */}
          <div className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => onYearChange(null)}
              className={`px-2 py-1 text-xs font-medium rounded transition-all ${
                selectedYear === null
                  ? 'text-zinc-100 bg-zinc-800'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              All
            </button>
            {availableYears.slice(0, 5).map(year => (
              <button
                key={year}
                onClick={() => onYearChange(year)}
                className={`px-2 py-1 text-xs font-medium rounded transition-all ${
                  selectedYear === year
                    ? 'text-zinc-100 bg-zinc-800'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>
        {!isDemo && (
          <button
            onClick={() => onAddEntry(selectedYear || currentYear)}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-medium py-2 px-3 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add to {selectedYear || 'Archive'}
          </button>
        )}
      </div>

      {/* Statistics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <StatCard label={selectedYear ? `${selectedYear} Total` : "All Time Total"} value={stats.total} />
        <StatCard label="Movies" value={stats.movies} />
        <StatCard label="Series" value={stats.series} />
        <StatCard label="Anime" value={stats.anime} />
        <StatCard label="Books" value={stats.books} />
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-1 p-1 bg-zinc-900/50 border border-zinc-800/50 rounded-lg w-max">
          {['All', 'Movie', 'Series', 'Anime', 'Book'].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1 text-xs font-medium rounded transition-all ${
                filterType === type
                  ? 'text-zinc-100 bg-zinc-800 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
              }`}
            >
              {type === 'Book' ? 'Books' : type === 'All' ? 'All' : `${type}s`}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search archive..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900/50 border border-zinc-800 text-zinc-300 text-sm rounded-md py-1.5 pl-9 pr-4 focus:outline-none focus:ring-1 focus:ring-zinc-600 focus:border-zinc-600 placeholder-zinc-600"
            />
          </div>
          <span className="text-xs text-zinc-500">{filteredEntries.length} entr{filteredEntries.length === 1 ? 'y' : 'ies'}</span>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-20 text-zinc-500">Loading...</div>
      ) : filteredEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/10">
          <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center mb-4 text-zinc-600">
            <Inbox className="w-5 h-5" />
          </div>
          <h3 className="text-zinc-200 font-medium text-sm mb-1">No entries found</h3>
          <p className="text-zinc-500 text-xs max-w-xs mx-auto">
            {selectedYear ? `No entries for ${selectedYear}. Try selecting a different year or add new entries.` : 'Your archive is empty. Start adding entries to build your collection!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filteredEntries.map(entry => (
            <EntryCard
              key={entry.id}
              entry={entry}
              onClick={() => onEntryClick(entry)}
              getTypeIcon={getTypeIcon}
              getTypeColor={getTypeColor}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StatsView({ entries }) {
  const types = ['Movie', 'Series', 'Anime', 'Book'];
  
  const avgRatings = types.reduce((acc, type) => {
    const typeEntries = entries.filter(e => e.type === type && e.rating != null);
    acc[type] = typeEntries.length > 0 
      ? (typeEntries.reduce((sum, e) => sum + e.rating, 0) / typeEntries.length).toFixed(1)
      : '0.0';
    return acc;
  }, {});

  const distribution = types.map(type => ({
    type,
    count: entries.filter(e => e.type === type).length,
    percentage: entries.length > 0 
      ? (entries.filter(e => e.type === type).length / entries.length) * 100 
      : 0
  }));

  const typeColors = {
    Movie: 'bg-indigo-500',
    Series: 'bg-violet-500',
    Anime: 'bg-pink-500',
    Book: 'bg-emerald-500'
  };

  const typeIcons = {
    Movie: <Film className="w-4 h-4 text-indigo-400" />,
    Series: <Tv className="w-4 h-4 text-violet-400" />,
    Anime: <Sparkles className="w-4 h-4 text-pink-400" />,
    Book: <Book className="w-4 h-4 text-emerald-400" />
  };

  // Calculate top rated entries
  const topRated = [...entries]
    .filter(e => e.rating != null)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5);

  // Calculate rating distribution
  const ratingBuckets = [
    { range: '9-10', min: 9, max: 10, color: 'bg-emerald-500' },
    { range: '7-8.9', min: 7, max: 8.9, color: 'bg-green-500' },
    { range: '5-6.9', min: 5, max: 6.9, color: 'bg-yellow-500' },
    { range: '3-4.9', min: 3, max: 4.9, color: 'bg-orange-500' },
    { range: '0-2.9', min: 0, max: 2.9, color: 'bg-red-500' }
  ];

  const ratingDistribution = ratingBuckets.map(bucket => ({
    ...bucket,
    count: entries.filter(e => e.rating >= bucket.min && e.rating <= bucket.max).length
  }));

  const maxRatingCount = Math.max(...ratingDistribution.map(r => r.count), 1);

  // Calculate overall stats
  const ratedEntries = entries.filter(e => e.rating != null);
  const overallAvg = ratedEntries.length > 0
    ? (ratedEntries.reduce((sum, e) => sum + e.rating, 0) / ratedEntries.length).toFixed(1)
    : '0.0';
  
  const highestRated = ratedEntries.length > 0
    ? Math.max(...ratedEntries.map(e => e.rating)).toFixed(1)
    : '0.0';
  
  const lowestRated = ratedEntries.length > 0
    ? Math.min(...ratedEntries.map(e => e.rating)).toFixed(1)
    : '0.0';

  // Recent additions (last 10)
  const recentAdditions = [...entries]
    .sort((a, b) => b.id - a.id)
    .slice(0, 10);

  return (
    <div className="fade-in space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-medium text-zinc-100 tracking-tight">Analytics</h2>
        <span className="text-xs text-zinc-500">{entries.length} total entries</span>
      </div>

      {/* Overall Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg border border-zinc-800 bg-gradient-to-br from-zinc-900/50 to-zinc-900/30">
          <span className="text-xs font-medium text-zinc-400 block mb-2">Overall Average</span>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-semibold text-zinc-100 tracking-tight">{overallAvg}</h3>
            <span className="text-xs text-zinc-600">/ 10</span>
          </div>
        </div>
        <div className="p-4 rounded-lg border border-zinc-800 bg-gradient-to-br from-emerald-900/20 to-zinc-900/30">
          <span className="text-xs font-medium text-emerald-400/70 block mb-2">Highest Rated</span>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-semibold text-emerald-400 tracking-tight">{highestRated}</h3>
            <Star className="w-4 h-4 text-emerald-400 fill-current" />
          </div>
        </div>
        <div className="p-4 rounded-lg border border-zinc-800 bg-gradient-to-br from-red-900/20 to-zinc-900/30">
          <span className="text-xs font-medium text-red-400/70 block mb-2">Lowest Rated</span>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-semibold text-red-400 tracking-tight">{lowestRated}</h3>
            <span className="text-xs text-red-500">/ 10</span>
          </div>
        </div>
        <div className="p-4 rounded-lg border border-zinc-800 bg-gradient-to-br from-blue-900/20 to-zinc-900/30">
          <span className="text-xs font-medium text-blue-400/70 block mb-2">With Ratings</span>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-semibold text-blue-400 tracking-tight">{ratedEntries.length}</h3>
            <span className="text-xs text-zinc-600">/ {entries.length}</span>
          </div>
        </div>
      </div>

      {/* Type Averages */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {types.map(type => (
          <div key={type} className="p-5 rounded-lg border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/40 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium text-zinc-400">Avg. {type} Score</span>
              {typeIcons[type]}
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-semibold text-zinc-100 tracking-tight">{avgRatings[type]}</h3>
              <span className="text-xs text-zinc-600">/ 10</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Collection Distribution */}
        <div className="p-6 rounded-lg border border-zinc-800 bg-zinc-900/30">
          <h3 className="text-sm font-medium text-zinc-200 mb-6">Collection Distribution</h3>
          <div className="space-y-5">
            {distribution.map(({ type, count, percentage }) => (
              <div key={type} className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400 font-medium">{type}</span>
                  <span className="text-zinc-500">{count} items ({percentage.toFixed(0)}%)</span>
                </div>
                <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${typeColors[type]} bar-fill opacity-80`} 
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="p-6 rounded-lg border border-zinc-800 bg-zinc-900/30">
          <h3 className="text-sm font-medium text-zinc-200 mb-6">Rating Distribution</h3>
          <div className="space-y-4">
            {ratingDistribution.map(({ range, count, color }) => (
              <div key={range} className="flex items-center gap-3">
                <span className="text-xs font-medium text-zinc-400 w-12">{range}</span>
                <div className="flex-1 h-8 bg-zinc-800 rounded overflow-hidden relative">
                  <div 
                    className={`h-full ${color} bar-fill opacity-70`} 
                    style={{ width: `${(count / maxRatingCount) * 100}%` }}
                  />
                  <span className="absolute inset-0 flex items-center justify-end pr-3 text-xs font-medium text-zinc-300">
                    {count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Rated & Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Rated */}
        <div className="p-6 rounded-lg border border-zinc-800 bg-zinc-900/30">
          <h3 className="text-sm font-medium text-zinc-200 mb-4">Top Rated</h3>
          {topRated.length > 0 ? (
            <div className="space-y-3">
              {topRated.map((entry, idx) => (
                <div key={entry.id} className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/30 hover:bg-zinc-800/50 transition-colors">
                  <div className="flex items-center justify-center w-6 h-6 rounded bg-zinc-700/50 text-zinc-400 text-xs font-medium">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-zinc-200 font-medium truncate">{entry.title}</div>
                    <div className="text-xs text-zinc-500">{entry.type}</div>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-400 text-sm font-medium">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    {entry.rating}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-zinc-500 text-sm">No rated entries yet</div>
          )}
        </div>

        {/* Recent Additions */}
        <div className="p-6 rounded-lg border border-zinc-800 bg-zinc-900/30">
          <h3 className="text-sm font-medium text-zinc-200 mb-4">Recent Additions</h3>
          {recentAdditions.length > 0 ? (
            <div className="space-y-3">
              {recentAdditions.map((entry) => (
                <div key={entry.id} className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/30 hover:bg-zinc-800/50 transition-colors">
                  <div className="p-1.5 rounded bg-zinc-700/50">
                    {entry.type === 'Movie' && <Film className="w-3.5 h-3.5 text-indigo-400" />}
                    {entry.type === 'Series' && <Tv className="w-3.5 h-3.5 text-violet-400" />}
                    {entry.type === 'Anime' && <Sparkles className="w-3.5 h-3.5 text-pink-400" />}
                    {entry.type === 'Book' && <Book className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-zinc-200 font-medium truncate">{entry.title}</div>
                    <div className="text-xs text-zinc-500">{entry.type}</div>
                  </div>
                  {entry.rating && (
                    <div className="flex items-center gap-1 text-yellow-400 text-sm font-medium">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      {entry.rating}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-zinc-500 text-sm">No entries yet</div>
          )}
        </div>
      </div>
    </div>
  );
}

function App({ isDemo = false }) {
  const { user, loading: authLoading, logout } = useAuth();

  // Set demo mode in API service
  useEffect(() => {
    setDemoMode(isDemo);
  }, [isDemo]);

  if (authLoading) {
    return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">Loading...</div>;
  }

  // In demo mode, always show dashboard
  if (isDemo) {
    return <Dashboard isDemo={true} />;
  }

  if (!user) {
    return <LandingPage onLogin={() => {}} />;
  }

  return <Dashboard isDemo={false} onLogout={logout} />;
}

function AppWithAuth({ isDemo = false }) {
  return (
    <AuthProvider>
      <App isDemo={isDemo} />
    </AuthProvider>
  );
}

export default AppWithAuth;
