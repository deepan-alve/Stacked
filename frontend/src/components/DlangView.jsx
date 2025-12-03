import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Film, Star, Plus, X, Inbox, ChevronDown, Filter, Calendar, Globe, Tag } from 'lucide-react';

const API_BASE = '';

const DlangView = forwardRef(({ searchQuery = '' }, ref) => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState({
    language: 'All',
    genre: 'All',
    yearFrom: '',
    yearTo: ''
  });
  
  const [formData, setFormData] = useState({
    title: '',
    year: '',
    language: '',
    genre: '',
    director: '',
    rating: '',
    poster_url: '',
    notes: ''
  });

  const languages = ['English', 'Tamil', 'Hindi', 'Telugu', 'Malayalam', 'Korean', 'Japanese', 'Spanish', 'French', 'German', 'Other'];
  const genres = ['Action', 'Comedy', 'Drama', 'Horror', 'Thriller', 'Romance', 'Sci-Fi', 'Fantasy', 'Animation', 'Documentary', 'Crime', 'Mystery', 'Adventure', 'Other'];

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/dlang`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setMovies(data);
    } catch (error) {
      console.error('Error fetching dlang movies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        year: formData.year ? parseInt(formData.year) : null,
        rating: formData.rating ? parseFloat(formData.rating) : null
      };

      const url = editingMovie 
        ? `${API_BASE}/api/dlang/${editingMovie.id}`
        : `${API_BASE}/api/dlang`;
      
      const res = await fetch(url, {
        method: editingMovie ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to save');
      await fetchMovies();
      closeModal();
    } catch (error) {
      alert('Failed to save: ' + error.message);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this movie?')) return;
    try {
      await fetch(`${API_BASE}/api/dlang/${editingMovie.id}`, { method: 'DELETE' });
      await fetchMovies();
      closeModal();
    } catch (error) {
      alert('Failed to delete: ' + error.message);
    }
  };

  const openAddModal = () => {
    setEditingMovie(null);
    setFormData({ title: '', year: '', language: '', genre: '', director: '', rating: '', poster_url: '', notes: '' });
    setIsModalOpen(true);
  };

  useImperativeHandle(ref, () => ({ 
    openAddModal,
    refresh: fetchMovies
  }));

  const openEditModal = (movie) => {
    setEditingMovie(movie);
    setFormData({
      title: movie.title || '',
      year: movie.year || '',
      language: movie.language || '',
      genre: movie.genre || '',
      director: movie.director || '',
      rating: movie.rating || '',
      poster_url: movie.poster_url || '',
      notes: movie.notes || ''
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingMovie(null);
  };

  const uniqueLanguages = ['All', ...new Set(movies.map(m => m.language).filter(Boolean))];
  const uniqueGenres = ['All', ...new Set(movies.map(m => m.genre).filter(Boolean))];

  const filteredMovies = movies.filter(movie => {
    const matchesSearch = movie.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLanguage = filters.language === 'All' || movie.language === filters.language;
    const matchesGenre = filters.genre === 'All' || movie.genre === filters.genre;
    const matchesYearFrom = !filters.yearFrom || (movie.year && movie.year >= parseInt(filters.yearFrom));
    const matchesYearTo = !filters.yearTo || (movie.year && movie.year <= parseInt(filters.yearTo));
    return matchesSearch && matchesLanguage && matchesGenre && matchesYearFrom && matchesYearTo;
  });

  const hasActiveFilters = filters.language !== 'All' || filters.genre !== 'All' || filters.yearFrom || filters.yearTo;
  const activeFilterCount = [filters.language !== 'All', filters.genre !== 'All', filters.yearFrom, filters.yearTo].filter(Boolean).length;

  const clearFilters = () => {
    setFilters({ language: 'All', genre: 'All', yearFrom: '', yearTo: '' });
  };

  return (
    <div className="fade-in">
      {/* Filter Toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs text-zinc-500">
          {filteredMovies.length} of {movies.length} movies
          {(hasActiveFilters || searchQuery) && <span> • Filtered</span>}
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
            hasActiveFilters 
              ? 'border-zinc-600 bg-zinc-800 text-zinc-200' 
              : 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:text-zinc-300'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filters
          {hasActiveFilters && (
            <span className="bg-zinc-600 text-zinc-100 text-xs px-1.5 py-0.5 rounded-full font-medium">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Language */}
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-500 flex items-center gap-1">
                <Globe className="w-3 h-3" /> Language
              </label>
              <select
                value={filters.language}
                onChange={(e) => setFilters({ ...filters, language: e.target.value })}
                className="w-full bg-zinc-800/50 border border-zinc-700 text-zinc-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-zinc-600"
              >
                {uniqueLanguages.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>

            {/* Genre */}
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-500 flex items-center gap-1">
                <Tag className="w-3 h-3" /> Genre
              </label>
              <select
                value={filters.genre}
                onChange={(e) => setFilters({ ...filters, genre: e.target.value })}
                className="w-full bg-zinc-800/50 border border-zinc-700 text-zinc-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-zinc-600"
              >
                {uniqueGenres.map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
            </div>

            {/* Year From */}
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Year From
              </label>
              <input
                type="number"
                placeholder="1900"
                value={filters.yearFrom}
                onChange={(e) => setFilters({ ...filters, yearFrom: e.target.value })}
                className="w-full bg-zinc-800/50 border border-zinc-700 text-zinc-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-zinc-600 placeholder-zinc-600"
              />
            </div>

            {/* Year To */}
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Year To
              </label>
              <input
                type="number"
                placeholder="2025"
                value={filters.yearTo}
                onChange={(e) => setFilters({ ...filters, yearTo: e.target.value })}
                className="w-full bg-zinc-800/50 border border-zinc-700 text-zinc-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-zinc-600 placeholder-zinc-600"
              />
            </div>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="text-center py-20 text-zinc-500">Loading...</div>
      ) : filteredMovies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/10">
          <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center mb-4 text-zinc-600">
            <Inbox className="w-5 h-5" />
          </div>
          <h3 className="text-zinc-200 font-medium text-sm mb-1">No movies found</h3>
          <p className="text-zinc-500 text-xs max-w-xs mx-auto">
            {movies.length === 0 ? 'Add your first movie to Dlang.' : 'Try adjusting your search.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filteredMovies.map(movie => (
            <MovieCard key={movie.id} movie={movie} onClick={() => openEditModal(movie)} />
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 overflow-hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={closeModal} />
          
          <div 
            className="relative w-full max-w-md bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 shadow-2xl rounded-xl p-6 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-medium text-white tracking-tight">
                {editingMovie ? 'Edit Movie' : 'Add Movie'}
              </h2>
              <button onClick={closeModal} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-500">Title</label>
                <input 
                  type="text" 
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-zinc-800/50 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 placeholder-zinc-600" 
                  placeholder="Movie title" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-500">Year</label>
                  <input 
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: e.target.value})}
                    className="w-full bg-zinc-800/50 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 placeholder-zinc-600" 
                    placeholder="2024" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-500">Rating (0-10)</label>
                  <input 
                    type="number" 
                    min="0" max="10" step="0.1"
                    value={formData.rating}
                    onChange={(e) => setFormData({...formData, rating: e.target.value})}
                    className="w-full bg-zinc-800/50 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 placeholder-zinc-600" 
                    placeholder="-" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-500">Language</label>
                  <div className="relative">
                    <select 
                      value={formData.language}
                      onChange={(e) => setFormData({...formData, language: e.target.value})}
                      className="w-full appearance-none bg-zinc-800/50 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600"
                    >
                      <option value="">Select</option>
                      {languages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-zinc-500 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-500">Genre</label>
                  <div className="relative">
                    <select 
                      value={formData.genre}
                      onChange={(e) => setFormData({...formData, genre: e.target.value})}
                      className="w-full appearance-none bg-zinc-800/50 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600"
                    >
                      <option value="">Select</option>
                      {genres.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-zinc-500 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-zinc-500">Director</label>
                <input 
                  type="text"
                  value={formData.director}
                  onChange={(e) => setFormData({...formData, director: e.target.value})}
                  className="w-full bg-zinc-800/50 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 placeholder-zinc-600" 
                  placeholder="Director name" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-zinc-500">Poster URL</label>
                <input 
                  type="url"
                  value={formData.poster_url}
                  onChange={(e) => setFormData({...formData, poster_url: e.target.value})}
                  className="w-full bg-zinc-800/50 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 placeholder-zinc-600" 
                  placeholder="https://..." 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-zinc-500">Notes</label>
                <textarea 
                  rows="2"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full bg-zinc-800/50 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 placeholder-zinc-600 resize-none" 
                  placeholder="Notes..." 
                />
              </div>

              <div className="flex flex-col gap-2 pt-4 border-t border-zinc-800">
                <button 
                  type="submit"
                  className="w-full bg-white hover:bg-gray-100 text-zinc-950 font-medium text-sm py-2.5 rounded-lg transition-colors"
                >
                  Save
                </button>
                {editingMovie && (
                  <button 
                    type="button"
                    onClick={handleDelete}
                    className="w-full bg-transparent hover:bg-red-500/10 text-red-400 hover:text-red-300 border border-zinc-700 hover:border-red-500/50 font-medium text-sm py-2.5 rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
});

function MovieCard({ movie, onClick }) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleClick = (e) => {
    e.stopPropagation();
    if (isFlipped) {
      onClick();
    } else {
      setIsFlipped(true);
    }
  };

  return (
    <div 
      className="flip-card-container h-72 cursor-pointer"
      onClick={handleClick}
      onMouseLeave={() => setIsFlipped(false)}
    >
      <div className={`flip-card ${isFlipped ? 'flipped' : ''}`}>
        {/* Front */}
        <div className="flip-card-front">
          {movie.poster_url ? (
            <div className="relative w-full h-full overflow-hidden rounded-lg border border-zinc-800/60">
              <img 
                src={movie.poster_url} 
                alt={movie.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="150"%3E%3Crect fill="%2318181b" width="100" height="150"/%3E%3C/svg%3E';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <h3 className="text-white font-medium text-xs leading-tight line-clamp-2 mb-1">{movie.title}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-zinc-300 font-medium uppercase tracking-wider">{movie.language || 'Movie'}</span>
                  {movie.rating && (
                    <div className="flex items-center gap-1 text-yellow-400 text-[10px]">
                      <Star className="w-2.5 h-2.5 fill-current" />
                      <span>{movie.rating}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-full bg-zinc-900/30 border border-zinc-800/60 rounded-lg flex flex-col items-center justify-center p-4 text-center">
              <div className="p-2 rounded bg-zinc-800/50 border border-zinc-700/50 text-zinc-400 mb-3">
                <Film className="w-4 h-4" />
              </div>
              <h3 className="text-zinc-100 font-medium text-xs leading-tight line-clamp-3 mb-2">{movie.title}</h3>
              <span className="text-[9px] text-zinc-500 font-medium uppercase tracking-wider">{movie.language || 'Movie'}</span>
            </div>
          )}
        </div>

        {/* Back */}
        <div className="flip-card-back">
          <div className="w-full h-full bg-zinc-900/90 border border-zinc-600/50 rounded-lg p-4 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-indigo-500/10 to-transparent opacity-30" />
            
            <div className="relative z-10 flex-1 flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="p-1.5 rounded bg-zinc-800/50 border border-zinc-700/50 text-zinc-400">
                  <Film className="w-4 h-4" />
                </div>
                {movie.rating ? (
                  <div className="flex items-center gap-1 text-yellow-400 text-xs">
                    <Star className="w-3 h-3 fill-current" />
                    <span>{movie.rating}</span>
                  </div>
                ) : (
                  <span className="text-zinc-600 text-xs">-</span>
                )}
              </div>

              <h3 className="text-zinc-100 font-semibold text-sm leading-tight mb-2 line-clamp-2">{movie.title}</h3>

              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">{movie.language || 'Movie'}</span>
                {movie.year && (
                  <span className="text-[10px] font-medium bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded border border-zinc-700">{movie.year}</span>
                )}
              </div>

              {movie.director && (
                <p className="text-zinc-500 text-[11px] mb-2">Dir. {movie.director}</p>
              )}

              {movie.notes && (
                <div className="mt-auto pt-2 border-t border-zinc-700/50">
                  <p className="text-zinc-500 text-[10px] leading-relaxed line-clamp-2">{movie.notes}</p>
                </div>
              )}

              <div className="mt-auto pt-3">
                <div className="text-[9px] text-zinc-600 uppercase tracking-wider">Click again to edit</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

DlangView.displayName = 'DlangView';

export default DlangView;
