import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Film, Star, Plus, X, Inbox, ChevronDown, Filter, Calendar, Globe, Tag, Heart, Share2, Link, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE = '';

const DlangView = forwardRef(({ searchQuery = '', isDemo = false }, ref) => {
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
      const endpoint = isDemo ? `${API_BASE}/api/public/dlang` : `${API_BASE}/api/dlang`;
      const res = await fetch(endpoint, {
        credentials: 'include'
      });
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

    if (isDemo) {
      toast.error(
        <div className="flex flex-col gap-1">
          <p className="font-medium text-sm">Read-Only Demo Mode</p>
          <p className="text-xs">This is the creator's data.</p>
          <a href="/#join" className="text-xs text-gold hover:text-gold-light mt-1 underline">Join the waitlist to track your own!</a>
        </div>,
        { duration: 4000 }
      );
      return;
    }

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
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        if (res.status === 401) throw new Error('Not authenticated');
        throw new Error('Failed to save');
      }
      await fetchMovies();
      closeModal();
      toast.success(editingMovie ? 'Movie updated!' : 'Movie added!');
    } catch (error) {
      toast.error('Failed to save: ' + error.message);
    }
  };

  const handleDelete = async () => {
    if (isDemo) {
      toast.error(
        <div className="flex flex-col gap-1">
          <p className="font-medium text-sm">Read-Only Demo Mode</p>
          <p className="text-xs">This is the creator's data.</p>
          <a href="/#join" className="text-xs text-gold hover:text-gold-light mt-1 underline">Join the waitlist to track your own!</a>
        </div>,
        { duration: 4000 }
      );
      return;
    }

    if (!window.confirm('Delete this movie?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/dlang/${editingMovie.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) {
        if (res.status === 401) throw new Error('Not authenticated');
        throw new Error('Failed to delete');
      }
      await fetchMovies();
      closeModal();
      toast.success('Movie deleted!');
    } catch (error) {
      toast.error('Failed to delete: ' + error.message);
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
      {/* Editorial Header */}
      <div className="mb-6">
        <p className="text-xs text-cinema-subtle font-mono uppercase tracking-[0.2em] mb-1">Curated</p>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-2xl md:text-3xl font-serif text-cinema-text tracking-tight flex items-center gap-3">
            Your <em className="text-gold">Favorites</em> <Heart className="w-6 h-6 text-gold fill-current" />
          </h2>
          {!isDemo && (
            <button
              onClick={async () => {
                try {
                  const res = await fetch('/api/share', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ collection: 'favorites' })
                  });
                  if (!res.ok) throw new Error('Failed to create share link');
                  const data = await res.json();
                  const url = `${window.location.origin}/shared/${data.id}`;
                  navigator.clipboard.writeText(url).then(() => {
                    toast.success('Share link copied!');
                  }).catch(() => {
                    toast.success(`Share link: ${url}`);
                  });
                } catch (error) {
                  toast.error('Failed to create share link');
                }
              }}
              className="flex items-center gap-2 border border-gold/30 hover:border-gold/50 text-gold text-xs font-medium py-2 px-4 rounded-full transition-colors w-fit"
            >
              <Share2 className="w-3.5 h-3.5" />
              Share Favorites
            </button>
          )}
        </div>
      </div>

      {/* Filter Toggle */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-cinema-subtle font-mono tracking-wider">
          {filteredMovies.length} of {movies.length} movies
          {(hasActiveFilters || searchQuery) && <span> · Filtered</span>}
        </span>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
            hasActiveFilters
              ? 'border-gold-200 bg-gold/10 text-gold'
              : 'border-cinema-border bg-cinema-card text-cinema-muted hover:text-cinema-text'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filters
          {hasActiveFilters && (
            <span className="bg-gold/20 text-gold text-xs px-1.5 py-0.5 rounded-full font-medium">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="cinema-card p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Language */}
            <div className="space-y-1.5">
              <label className="text-xs text-cinema-subtle font-mono uppercase tracking-[0.15em] flex items-center gap-1">
                <Globe className="w-3 h-3" /> Language
              </label>
              <select
                value={filters.language}
                onChange={(e) => setFilters({ ...filters, language: e.target.value })}
                className="w-full bg-gold-50 border border-cinema-border text-cinema-text text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-gold/30"
              >
                {uniqueLanguages.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>

            {/* Genre */}
            <div className="space-y-1.5">
              <label className="text-xs text-cinema-subtle font-mono uppercase tracking-[0.15em] flex items-center gap-1">
                <Tag className="w-3 h-3" /> Genre
              </label>
              <select
                value={filters.genre}
                onChange={(e) => setFilters({ ...filters, genre: e.target.value })}
                className="w-full bg-gold-50 border border-cinema-border text-cinema-text text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-gold/30"
              >
                {uniqueGenres.map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
            </div>

            {/* Year From */}
            <div className="space-y-1.5">
              <label className="text-xs text-cinema-subtle font-mono uppercase tracking-[0.15em] flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Year From
              </label>
              <input
                type="number"
                placeholder="1900"
                value={filters.yearFrom}
                onChange={(e) => setFilters({ ...filters, yearFrom: e.target.value })}
                className="w-full bg-gold-50 border border-cinema-border text-cinema-text text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-gold/30 placeholder-cinema-subtle"
              />
            </div>

            {/* Year To */}
            <div className="space-y-1.5">
              <label className="text-xs text-cinema-subtle font-mono uppercase tracking-[0.15em] flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Year To
              </label>
              <input
                type="number"
                placeholder="2025"
                value={filters.yearTo}
                onChange={(e) => setFilters({ ...filters, yearTo: e.target.value })}
                className="w-full bg-gold-50 border border-cinema-border text-cinema-text text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-gold/30 placeholder-cinema-subtle"
              />
            </div>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 text-xs text-cinema-subtle hover:text-gold transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="text-center py-20 text-cinema-subtle">Loading...</div>
      ) : filteredMovies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-cinema-border rounded-xl bg-cinema-card">
          <div className="w-12 h-12 bg-gold-50 border border-gold-100 rounded-full flex items-center justify-center mb-4 text-gold">
            <Inbox className="w-5 h-5" />
          </div>
          <h3 className="text-cinema-text font-serif font-medium text-sm mb-1">No movies found</h3>
          <p className="text-cinema-subtle text-xs max-w-xs mx-auto">
            {movies.length === 0 ? 'Add your first movie to Dlang.' : 'Try adjusting your search.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredMovies.map(movie => (
            <MovieCard key={movie.id} movie={movie} onClick={() => openEditModal(movie)} isDemo={isDemo} />
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-cinema-bg/80 backdrop-blur-md transition-opacity"
            onClick={closeModal}
          />

          <div
            className="relative w-full max-w-md bg-cinema-card backdrop-blur-xl border border-cinema-border shadow-2xl rounded-2xl flex flex-col max-h-[85vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Gold glow at top */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-16 bg-gold/10 blur-2xl pointer-events-none" />

            <div className="p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-serif text-cinema-text tracking-tight">
                  {editingMovie ? 'Edit Movie' : 'Add Movie'}
                </h2>
                <button onClick={closeModal} className="text-cinema-subtle hover:text-cinema-muted transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-cinema-subtle font-mono uppercase tracking-[0.15em]">Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full bg-gold-50 border border-cinema-border text-cinema-text text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-gold/30 focus:ring-1 focus:ring-gold-200 placeholder-cinema-subtle"
                    placeholder="Movie title"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs text-cinema-subtle font-mono uppercase tracking-[0.15em]">Year</label>
                    <input
                      type="number"
                      value={formData.year}
                      onChange={(e) => setFormData({...formData, year: e.target.value})}
                      className="w-full bg-gold-50 border border-cinema-border text-cinema-text text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-gold/30 focus:ring-1 focus:ring-gold-200 placeholder-cinema-subtle"
                      placeholder="2024"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-cinema-subtle font-mono uppercase tracking-[0.15em]">Rating (0-5)</label>
                    <input
                      type="number"
                      min="0" max="5" step="0.25"
                      value={formData.rating}
                      onChange={(e) => setFormData({...formData, rating: e.target.value})}
                      className="w-full bg-gold-50 border border-cinema-border text-cinema-text text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-gold/30 focus:ring-1 focus:ring-gold-200 placeholder-cinema-subtle"
                      placeholder="-"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs text-cinema-subtle font-mono uppercase tracking-[0.15em]">Language</label>
                    <div className="relative">
                      <select
                        value={formData.language}
                        onChange={(e) => setFormData({...formData, language: e.target.value})}
                        className="w-full appearance-none bg-gold-50 border border-cinema-border text-cinema-text text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-gold/30 focus:ring-1 focus:ring-gold-200"
                      >
                        <option value="">Select</option>
                        {languages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-cinema-subtle pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-cinema-subtle font-mono uppercase tracking-[0.15em]">Genre</label>
                    <div className="relative">
                      <select
                        value={formData.genre}
                        onChange={(e) => setFormData({...formData, genre: e.target.value})}
                        className="w-full appearance-none bg-gold-50 border border-cinema-border text-cinema-text text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-gold/30 focus:ring-1 focus:ring-gold-200"
                      >
                        <option value="">Select</option>
                        {genres.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-cinema-subtle pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-cinema-subtle font-mono uppercase tracking-[0.15em]">Director</label>
                  <input
                    type="text"
                    value={formData.director}
                    onChange={(e) => setFormData({...formData, director: e.target.value})}
                    className="w-full bg-gold-50 border border-cinema-border text-cinema-text text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-gold/30 focus:ring-1 focus:ring-gold-200 placeholder-cinema-subtle"
                    placeholder="Director name"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-cinema-subtle font-mono uppercase tracking-[0.15em]">Poster URL</label>
                  <input
                    type="url"
                    value={formData.poster_url}
                    onChange={(e) => setFormData({...formData, poster_url: e.target.value})}
                    className="w-full bg-gold-50 border border-cinema-border text-cinema-text text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-gold/30 focus:ring-1 focus:ring-gold-200 placeholder-cinema-subtle"
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-cinema-subtle font-mono uppercase tracking-[0.15em]">Notes</label>
                  <textarea
                    rows="2"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full bg-gold-50 border border-cinema-border text-cinema-text text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-gold/30 focus:ring-1 focus:ring-gold-200 placeholder-cinema-subtle resize-none"
                    placeholder="Notes..."
                  />
                </div>

                <div className="flex flex-col gap-2 pt-4 border-t border-cinema-border">
                  {isDemo ? (
                    <div className="text-center py-2">
                      <p className="text-cinema-subtle text-sm">View-only in demo mode</p>
                      <a href="/#join" className="text-xs text-gold hover:text-gold-light underline">Join waitlist to track your own!</a>
                    </div>
                  ) : (
                    <>
                      <button
                        type="submit"
                        className="w-full bg-gold hover:bg-gold-light text-cinema-bg font-medium text-sm py-2.5 rounded-lg transition-colors"
                      >
                        Save
                      </button>
                      {editingMovie && (
                        <button
                          type="button"
                          onClick={handleDelete}
                          className="w-full bg-transparent hover:bg-red-500/10 text-red-400 hover:text-red-300 border border-cinema-border hover:border-red-500/30 font-medium text-sm py-2.5 rounded-lg transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

function MovieCard({ movie, onClick, isDemo = false }) {
  return (
    <div
      className="group cursor-pointer"
      onClick={onClick}
    >
      <div className="relative aspect-[2/3] rounded-lg border border-cinema-border overflow-hidden">
        {movie.poster_url ? (
          <>
            <img
              src={movie.poster_url}
              alt={movie.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              onError={(e) => {
                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="150"%3E%3Crect fill="%23111110" width="100" height="150"/%3E%3C/svg%3E';
              }}
            />
            {/* Always-visible bottom gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-cinema-bg/90 via-cinema-bg/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <h3 className="text-cinema-text font-serif font-medium text-xs leading-tight line-clamp-2 mb-1">{movie.title}</h3>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-gold font-medium uppercase tracking-wider">{movie.language || 'Movie'}</span>
                {movie.rating && (
                  <div className="flex items-center gap-1 text-gold text-[10px]">
                    <Star className="w-2.5 h-2.5 fill-current" />
                    <span>{movie.rating}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-cinema-bg/85 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
              <h3 className="text-cinema-text font-serif font-semibold text-sm leading-tight mb-1.5 line-clamp-2">{movie.title}</h3>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] text-gold font-medium uppercase tracking-wider">{movie.language || 'Movie'}</span>
                {movie.year && (
                  <span className="text-[10px] font-medium bg-gold-50 text-cinema-muted px-2 py-0.5 rounded border border-gold-100">{movie.year}</span>
                )}
                {movie.rating && (
                  <div className="flex items-center gap-1 text-gold text-[10px]">
                    <Star className="w-2.5 h-2.5 fill-current" />
                    <span>{movie.rating}</span>
                  </div>
                )}
              </div>
              {movie.director && (
                <p className="text-cinema-muted text-[10px] mb-1">Dir. {movie.director}</p>
              )}
              {movie.notes && (
                <p className="text-cinema-muted text-[10px] leading-relaxed line-clamp-3 mb-2">{movie.notes}</p>
              )}
              <div className="text-[9px] text-cinema-subtle uppercase tracking-wider">
                {isDemo ? 'Click to view' : 'Click to edit'}
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full bg-cinema-card flex flex-col items-center justify-center p-4 text-center">
            <div className="p-2 rounded bg-gold-50 border border-gold-100 text-gold mb-3">
              <Film className="w-4 h-4" />
            </div>
            <h3 className="text-cinema-text font-serif font-medium text-xs leading-tight line-clamp-3 mb-2">{movie.title}</h3>
            <span className="text-[9px] text-gold font-medium uppercase tracking-wider">{movie.language || 'Movie'}</span>
          </div>
        )}
      </div>
    </div>
  );
}

DlangView.displayName = 'DlangView';

export default DlangView;
