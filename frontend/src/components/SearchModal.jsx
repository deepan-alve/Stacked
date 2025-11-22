import { useState, useEffect } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Search {type}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Search for ${type.toLowerCase()}...`}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                autoFocus
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Search'}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="bg-red-900 bg-opacity-50 text-red-200 p-4 rounded-lg">
              {error}
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-blue-500" size={40} />
            </div>
          )}

          {!loading && results.length === 0 && query && (
            <div className="text-center py-12 text-gray-400">
              No results found for "{query}"
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((result) => (
                <div
                  key={result.id}
                  onClick={() => handleSelectResult(result)}
                  className="bg-gray-700 rounded-lg overflow-hidden cursor-pointer hover:bg-gray-600 transition-colors"
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
                    <h3 className="font-semibold text-white text-sm mb-1 line-clamp-2">
                      {result.title}
                    </h3>
                    {result.year && (
                      <p className="text-gray-400 text-xs mb-1">{result.year}</p>
                    )}
                    {result.rating && (
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500 text-xs">★</span>
                        <span className="text-white text-xs">{result.rating.toFixed(1)}</span>
                      </div>
                    )}
                    {result.overview && (
                      <p className="text-gray-400 text-xs mt-2 line-clamp-3">
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
