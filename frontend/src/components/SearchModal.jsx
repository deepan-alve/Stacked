import { useState, useEffect } from 'react';
import { Search, X, Loader2, Star } from 'lucide-react';
import { searchService } from '../services/api';

const SearchModal = ({ isOpen, onClose, onSelect, type }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      setError(null);
    }
  }, [isOpen]);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      let data;
      switch (type) {
        case 'Movie':
          data = await searchService.searchMovies(query);
          break;
        case 'Series':
          data = await searchService.searchSeries(query);
          break;
        case 'Anime':
          data = await searchService.searchAnime(query);
          break;
        case 'Book':
          data = await searchService.searchBooks(query);
          break;
        default:
          throw new Error('Invalid type');
      }
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSelectResult = (result) => {
    onSelect({
      title: result.title,
      rating: result.rating,
      poster_url: result.poster,
      api_id: result.id.toString(),
      api_provider: result.provider,
      description: result.overview,
      release_date: result.releaseDate,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-cinema-bg/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-cinema-card border border-cinema-border rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Gold glow at top */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

        {/* Header */}
        <div className="p-4 border-b border-cinema-border flex items-center justify-between">
          <h2 className="text-lg font-serif text-cinema-text">Search {type}</h2>
          <button
            onClick={onClose}
            className="text-cinema-subtle hover:text-cinema-muted transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-cinema-border">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cinema-subtle" size={18} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Search for ${type.toLowerCase()}...`}
                className="w-full pl-10 pr-4 py-2.5 bg-gold-50 text-cinema-text text-sm rounded-lg border border-cinema-border focus:border-gold/30 focus:ring-1 focus:ring-gold-200 focus:outline-none placeholder-cinema-subtle"
                autoFocus
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="px-6 py-2.5 bg-gold text-cinema-bg text-sm font-medium rounded-lg hover:bg-gold-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : 'Search'}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg text-sm">
              {error}
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-gold" size={32} />
            </div>
          )}

          {!loading && results.length === 0 && query && (
            <div className="text-center py-12 text-cinema-subtle text-sm">
              No results found for "{query}"
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((result) => (
                <div
                  key={result.id}
                  onClick={() => handleSelectResult(result)}
                  className="cinema-card rounded-lg overflow-hidden cursor-pointer hover:border-gold-200 transition-colors"
                >
                  {result.poster && (
                    <img
                      src={result.poster}
                      alt={result.title}
                      className="w-full h-64 object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                  <div className="p-3">
                    <h3 className="font-serif font-medium text-cinema-text text-sm mb-1 line-clamp-2">
                      {result.title}
                    </h3>
                    {result.year && (
                      <p className="text-cinema-subtle text-xs mb-1">{result.year}</p>
                    )}
                    {result.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-gold fill-current" />
                        <span className="text-cinema-text text-xs">{result.rating.toFixed(1)}</span>
                      </div>
                    )}
                    {result.overview && (
                      <p className="text-cinema-muted text-xs mt-2 line-clamp-3">
                        {result.overview}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
