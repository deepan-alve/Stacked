import React, { useState, useEffect } from 'react';
import { Film, Tv, Sparkles, Book, Plus, Search, X, ChevronDown, Star, Inbox, ExternalLink } from 'lucide-react';
import { useEntries } from './hooks/useEntries';
import SearchModal from './components/SearchModal';
import SpotlightSearch from './components/SpotlightSearch';

function App() {
  const { entries, loading, createEntry, updateEntry, deleteEntry } = useEntries();
  const [filterType, setFilterType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentView, setCurrentView] = useState('collection');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEntry, setCurrentEntry] = useState(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
  
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
    release_date: ''
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

  const openModal = (entry = null) => {
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
        release_date: entry.release_date || ''
      });
    } else {
      setCurrentEntry(null);
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
        release_date: ''
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

  const handleSpotlightSelect = (result) => {
    // Pre-fill form with IMDB data and open edit modal
    setCurrentEntry(null); // New entry
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
      release_date: result.releaseDate || result.year || ''
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
    try {
      const data = {
        ...formData,
        rating: formData.rating ? parseFloat(formData.rating) : null,
        season: formData.season ? parseInt(formData.season) : null,
      };

      if (currentEntry) {
        await updateEntry(currentEntry.id, data);
      } else {
        await createEntry(data);
      }
      closeModal();
    } catch (error) {
      alert('Failed to save entry: ' + error.message);
    }
  };

  const handleDelete = async () => {
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
                C
              </div>
              <span className="text-zinc-100 font-medium tracking-tight text-sm">COLLECT</span>
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
                onClick={() => setCurrentView('stats')}
                className={`text-xs font-medium px-3 py-1.5 rounded-md transition-all ${
                  currentView === 'stats' 
                    ? 'text-zinc-100 bg-zinc-800/50' 
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30'
                }`}
              >
                Analytics
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
              <span className="hidden sm:inline">Add Entry</span>
            </button>
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
                  <button
                    type="button"
                    onClick={() => setIsSearchModalOpen(true)}
                    className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-xs"
                  >
                    <ExternalLink size={11} />
                    Search API
                  </button>
                </label>
                <input 
                  type="text" 
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
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
                    className="w-full appearance-none bg-zinc-800/50 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-colors cursor-pointer"
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
                    value={formData.season}
                    onChange={(e) => setFormData({...formData, season: e.target.value})}
                    className="w-full bg-zinc-800/50 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-colors placeholder-zinc-600 disabled:cursor-not-allowed disabled:opacity-50" 
                    placeholder="#" 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-zinc-500">Notes</label>
                <textarea 
                  rows="3"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full bg-zinc-800/50 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-colors placeholder-zinc-600 resize-none" 
                  placeholder="Thoughts, memorable quotes, or summary..." 
                />
              </div>

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

  return (
    <div className="fade-in space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-medium text-zinc-100 tracking-tight">Overview</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {types.map(type => (
          <div key={type} className="p-5 rounded-lg border border-zinc-800 bg-zinc-900/30">
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
    </div>
  );
}

export default App;
