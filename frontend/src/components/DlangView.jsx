import React, { useState, useEffect } from 'react';
import { Film, Star, Plus, X, Search, ChevronDown, Filter, Heart, Trash2, Edit2, Globe, Calendar, Tag } from 'lucide-react';

const API_BASE = '';  // Uses Vite proxy to /api

function DlangView() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filters
  const [filters, setFilters] = useState({
    language: 'All',
    genre: 'All',
    yearFrom: '',
    yearTo: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Form state
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

  // Available options for filters
  const languages = ['All', 'English', 'Tamil', 'Hindi', 'Telugu', 'Malayalam', 'Korean', 'Japanese', 'Spanish', 'French', 'German', 'Other'];
  const genres = ['All', 'Action', 'Comedy', 'Drama', 'Horror', 'Thriller', 'Romance', 'Sci-Fi', 'Fantasy', 'Animation', 'Documentary', 'Crime', 'Mystery', 'Adventure', 'Other'];

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

      let res;
      if (editingMovie) {
        res = await fetch(`${API_BASE}/api/dlang/${editingMovie.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${API_BASE}/api/dlang`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) throw new Error('Failed to save');
      
      await fetchMovies();
      closeModal();
    } catch (error) {
      alert('Failed to save: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this movie from Dlang?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/dlang/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      await fetchMovies();
    } catch (error) {
      alert('Failed to delete: ' + error.message);
    }
  };

  const openAddModal = () => {
    setEditingMovie(null);
    setFormData({
      title: '',
      year: '',
      language: '',
      genre: '',
      director: '',
      rating: '',
      poster_url: '',
      notes: ''
    });
    setIsAddModalOpen(true);
  };

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
    setIsAddModalOpen(true);
  };

  const closeModal = () => {
    setIsAddModalOpen(false);
    setEditingMovie(null);
  };

  // Filter movies
  const filteredMovies = movies.filter(movie => {
    const matchesSearch = movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (movie.director && movie.director.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesLanguage = filters.language === 'All' || movie.language === filters.language;
    const matchesGenre = filters.genre === 'All' || movie.genre === filters.genre;
    const matchesYearFrom = !filters.yearFrom || (movie.year && movie.year >= parseInt(filters.yearFrom));
    const matchesYearTo = !filters.yearTo || (movie.year && movie.year <= parseInt(filters.yearTo));
    
    return matchesSearch && matchesLanguage && matchesGenre && matchesYearFrom && matchesYearTo;
  });

  // Get unique values from current movies for filter dropdowns
  const uniqueLanguages = ['All', ...new Set(movies.map(m => m.language).filter(Boolean))];
  const uniqueGenres = ['All', ...new Set(movies.map(m => m.genre).filter(Boolean))];

  const clearFilters = () => {
    setFilters({ language: 'All', genre: 'All', yearFrom: '', yearTo: '' });
  };

  const hasActiveFilters = filters.language !== 'All' || filters.genre !== 'All' || filters.yearFrom || filters.yearTo;

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-zinc-100 tracking-tight flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-400 fill-current" />
            Dlang Collection
          </h2>
          <p className="text-sm text-zinc-500 mt-1">Your favorite movies of all time</p>
        </div>
        
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-red-500 hover:bg-red-400 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add to Dlang
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search movies or directors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900/50 border border-zinc-800 text-zinc-300 text-sm rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-red-500/50 focus:border-red-500/50 placeholder-zinc-600"
            />
          </div>
          
          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
              hasActiveFilters 
                ? 'border-red-500/50 bg-red-500/10 text-red-400' 
                : 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:text-zinc-300'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {[filters.language !== 'All', filters.genre !== 'All', filters.yearFrom, filters.yearTo].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Language Filter */}
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-500 flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Language
                </label>
                <select
                  value={filters.language}
                  onChange={(e) => setFilters({ ...filters, language: e.target.value })}
                  className="w-full bg-zinc-800/50 border border-zinc-700 text-zinc-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-red-500/50"
                >
                  {uniqueLanguages.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>

              {/* Genre Filter */}
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-500 flex items-center gap-1">
                  <Tag className="w-3 h-3" /> Genre
                </label>
                <select
                  value={filters.genre}
                  onChange={(e) => setFilters({ ...filters, genre: e.target.value })}
                  className="w-full bg-zinc-800/50 border border-zinc-700 text-zinc-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-red-500/50"
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
                  className="w-full bg-zinc-800/50 border border-zinc-700 text-zinc-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-red-500/50 placeholder-zinc-600"
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
                  className="w-full bg-zinc-800/50 border border-zinc-700 text-zinc-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-red-500/50 placeholder-zinc-600"
                />
              </div>
            </div>

            {hasActiveFilters && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-6 text-sm text-zinc-500">
        <span>{filteredMovies.length} of {movies.length} movies</span>
        {hasActiveFilters && (
          <span className="text-red-400">• Filtered</span>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-20 text-zinc-500">Loading...</div>
      ) : filteredMovies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/10">
          <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center mb-4 text-red-400">
            <Heart className="w-5 h-5" />
          </div>
          <h3 className="text-zinc-200 font-medium text-sm mb-1">
            {movies.length === 0 ? 'No Dlang movies yet' : 'No matches found'}
          </h3>
          <p className="text-zinc-500 text-xs max-w-xs mx-auto">
            {movies.length === 0 
              ? 'Add your all-time favorite movies to your Dlang collection.' 
              : 'Try adjusting your search or filters.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredMovies.map(movie => (
            <DlangCard 
              key={movie.id} 
              movie={movie}
              onEdit={() => openEditModal(movie)}
              onDelete={() => handleDelete(movie.id)}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={closeModal} />
          
          <div className="relative w-full max-w-md bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 shadow-2xl rounded-xl p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-medium text-white tracking-tight flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-400 fill-current" />
                {editingMovie ? 'Edit Movie' : 'Add to Dlang'}
              </h2>
              <button onClick={closeModal} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-500">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-zinc-800/50 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-red-500/50"
                  placeholder="Movie title"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-500">Year</label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="w-full bg-zinc-800/50 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-red-500/50"
                    placeholder="2024"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-500">Rating (0-10)</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                    className="w-full bg-zinc-800/50 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-red-500/50"
                    placeholder="9.0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-500">Language</label>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    className="w-full bg-zinc-800/50 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-red-500/50"
                  >
                    <option value="">Select...</option>
                    {languages.filter(l => l !== 'All').map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-500">Genre</label>
                  <select
                    value={formData.genre}
                    onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                    className="w-full bg-zinc-800/50 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-red-500/50"
                  >
                    <option value="">Select...</option>
                    {genres.filter(g => g !== 'All').map(genre => (
                      <option key={genre} value={genre}>{genre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-zinc-500">Director</label>
                <input
                  type="text"
                  value={formData.director}
                  onChange={(e) => setFormData({ ...formData, director: e.target.value })}
                  className="w-full bg-zinc-800/50 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-red-500/50"
                  placeholder="Director name"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-zinc-500">Poster URL</label>
                <input
                  type="url"
                  value={formData.poster_url}
                  onChange={(e) => setFormData({ ...formData, poster_url: e.target.value })}
                  className="w-full bg-zinc-800/50 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-red-500/50"
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-zinc-500">Notes</label>
                <textarea
                  rows="2"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-zinc-800/50 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-red-500/50 resize-none"
                  placeholder="Why is this a favorite?"
                />
              </div>

              <div className="flex gap-2 pt-4 border-t border-zinc-800">
                <button
                  type="submit"
                  className="flex-1 bg-red-500 hover:bg-red-400 text-white font-medium text-sm py-2.5 rounded-lg transition-colors"
                >
                  {editingMovie ? 'Save Changes' : 'Add to Dlang'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-sm py-2.5 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function DlangCard({ movie, onEdit, onDelete }) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div 
      className="relative group h-72 rounded-lg overflow-hidden border border-zinc-800/60 bg-zinc-900/30 hover:border-red-500/30 transition-all"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {movie.poster_url ? (
        <img 
          src={movie.poster_url} 
          alt={movie.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="150"%3E%3Crect fill="%2318181b" width="100" height="150"/%3E%3C/svg%3E';
          }}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
          <Film className="w-8 h-8 text-zinc-600 mb-2" />
          <span className="text-zinc-400 text-xs">{movie.title}</span>
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

      {/* Heart badge */}
      <div className="absolute top-2 right-2">
        <Heart className="w-4 h-4 text-red-400 fill-current drop-shadow-lg" />
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <h3 className="text-white font-medium text-xs leading-tight line-clamp-2 mb-1">
          {movie.title}
        </h3>
        <div className="flex items-center gap-2 text-[10px]">
          {movie.year && <span className="text-zinc-400">{movie.year}</span>}
          {movie.language && <span className="text-zinc-500">• {movie.language}</span>}
          {movie.rating && (
            <div className="flex items-center gap-0.5 text-yellow-400 ml-auto">
              <Star className="w-2.5 h-2.5 fill-current" />
              <span>{movie.rating}</span>
            </div>
          )}
        </div>
        {movie.director && (
          <p className="text-zinc-500 text-[9px] mt-1 truncate">Dir. {movie.director}</p>
        )}
      </div>

      {/* Action buttons */}
      {showActions && (
        <div className="absolute top-2 left-2 flex gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="p-1.5 bg-zinc-900/80 hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-white transition-colors"
          >
            <Edit2 className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 bg-zinc-900/80 hover:bg-red-600 rounded-md text-zinc-400 hover:text-white transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}

export default DlangView;
