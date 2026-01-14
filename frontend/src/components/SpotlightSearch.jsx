import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, CheckCircle2, X, Link, Plus } from 'lucide-react';

const SpotlightSearch = ({ isOpen, onClose, onSelect }) => {
  const [query, setQuery] = useState('');
  const [includeAnime, setIncludeAnime] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [addingByImdb, setAddingByImdb] = useState(false);
  const inputRef = useRef(null);

  // Extract IMDB ID from URL or direct ID
  const extractImdbId = (input) => {
    // Match IMDB ID pattern (tt followed by digits)
    const match = input.match(/tt\d{7,}/);
    return match ? match[0] : null;
  };

  const isImdbInput = extractImdbId(query) !== null;

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      setError(null);
      setIncludeAnime(false);
    }
  }, [isOpen]);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResults([]); // Clear previous results

    try {
      // Add 'anime' prefix if toggle is on
      const searchQuery = includeAnime ? `anime ${query}` : query;
      
      console.log('Searching for:', searchQuery);
      
      // Call backend search endpoint
      const response = await fetch(
        `/api/search/spotlight?query=${encodeURIComponent(searchQuery)}`
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Search failed:', errorText);
        throw new Error('Search failed');
      }

      const data = await response.json();
      console.log('Search results:', data);
      console.log('Results array:', data.results);
      console.log('Results length:', data.results?.length);
      setResults(data.results || []);
      console.log('State updated, results:', data.results || []);
    } catch (err) {
      console.error('Search error:', err);
      setError(err.message || 'Failed to search');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleResultClick = (result) => {
    onSelect(result);
    onClose(); // Auto-close spotlight after selection
  };

  const handleAddByImdb = async (type = 'Movie') => {
    const imdbId = extractImdbId(query);
    if (!imdbId) return;

    setAddingByImdb(true);
    setError(null);

    try {
      const response = await fetch('/api/entries/add-by-imdb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imdbId, type })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add movie');
      }

      const entry = await response.json();
      onSelect(entry); // This will trigger a refresh
      onClose();
    } catch (err) {
      console.error('Add by IMDB error:', err);
      setError(err.message || 'Failed to add from IMDB');
    } finally {
      setAddingByImdb(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 px-4"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Box - Clean Minimal Style */}
        <div className="bg-zinc-900/95 backdrop-blur-xl rounded-xl shadow-2xl overflow-hidden border border-zinc-800">
          {/* Search Input */}
          <div className="border-b border-zinc-800">
            <div className="flex items-center px-4 py-3">
              <Search className="text-zinc-500 mr-3" size={20} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Search your workspace or run a command"
                className="flex-1 bg-transparent text-white text-base placeholder-zinc-500 focus:outline-none"
              />
              <button
                onClick={onClose}
                className="ml-2 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-blue-500" size={32} />
              </div>
            )}

            {error && (
              <div className="p-4">
                <div className="bg-red-900/20 border border-red-800 text-red-400 p-3 rounded-lg text-sm text-center">
                  {error}
                </div>
              </div>
            )}

            {!loading && !error && results.length === 0 && !query && (
              <div className="p-6">
                <div className="text-zinc-500 text-sm mb-4">QUICK ACTIONS</div>
                <div className="space-y-1">
                  <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-800/50 cursor-pointer transition-colors">
                    <div className="w-8 h-8 bg-zinc-800 rounded flex items-center justify-center">
                      <Search size={16} className="text-zinc-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-white font-medium">Search Movies</div>
                      <div className="text-xs text-zinc-500">Find movies and series to add</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!loading && !error && results.length === 0 && query && !isImdbInput && (
              <div className="p-6">
                <div className="text-center py-4 text-zinc-500 text-sm mb-4">
                  No results found for "{query}"
                </div>
                <div className="text-zinc-500 text-xs mb-2 uppercase tracking-wide">Or paste an IMDB link</div>
                <div className="text-zinc-600 text-xs">
                  Paste an IMDB URL like: https://imdb.com/title/tt1234567
                </div>
              </div>
            )}

            {/* IMDB Link Detected */}
            {!loading && !error && isImdbInput && (
              <div className="p-4">
                <div className="text-zinc-500 text-xs mb-3 uppercase tracking-wide flex items-center gap-2">
                  <Link size={12} />
                  IMDB Link Detected
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-3 mb-3">
                  <div className="text-xs text-zinc-400 mb-1">IMDB ID:</div>
                  <div className="text-sm text-white font-mono">{extractImdbId(query)}</div>
                </div>
                <div className="text-zinc-500 text-xs mb-2">Add as:</div>
                <div className="grid grid-cols-2 gap-2">
                  {['Movie', 'Series', 'Anime'].map((type) => (
                    <button
                      key={type}
                      onClick={() => handleAddByImdb(type)}
                      disabled={addingByImdb}
                      className="flex items-center justify-center gap-2 px-3 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm text-white transition-colors disabled:opacity-50"
                    >
                      {addingByImdb ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Plus size={14} />
                      )}
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!loading && results.length > 0 && (
              <div className="p-2">
                <div className="text-zinc-500 text-xs px-3 py-2 uppercase tracking-wide">
                  Results ({results.length})
                </div>
                <div className="space-y-1">
                  {results.map((result, index) => (
                    <div
                      key={result.imdbId}
                      onClick={() => handleResultClick(result)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-800/50 cursor-pointer transition-colors group"
                    >
                      {/* Poster Thumbnail */}
                      <div className="w-10 h-14 flex-shrink-0 rounded overflow-hidden bg-zinc-800 shadow-sm">
                        {result.poster ? (
                          <img
                            src={result.poster}
                            alt={result.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="56"%3E%3Crect fill="%2327272a" width="40" height="56"/%3E%3C/svg%3E';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Search size={14} className="text-zinc-600" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm text-white font-medium truncate">
                            {result.title}
                          </h3>
                          {result.year && (
                            <span className="text-xs text-zinc-500 flex-shrink-0">
                              {result.year}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {result.type && (
                            <span className="text-xs text-zinc-500 capitalize">
                              {result.type}
                            </span>
                          )}
                          {result.rating && (
                            <div className="flex items-center gap-1">
                              <span className="text-yellow-500 text-xs">★</span>
                              <span className="text-xs text-zinc-400">{result.rating}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action hint */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <kbd className="px-1.5 py-0.5 bg-zinc-800 text-zinc-400 text-xs rounded">↵</kbd>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {!loading && (
            <div className="border-t border-zinc-800 px-4 py-2.5 bg-zinc-800/30">
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer hover:text-zinc-400">
                    <input
                      type="checkbox"
                      checked={includeAnime}
                      onChange={(e) => setIncludeAnime(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-zinc-700 bg-zinc-800 text-blue-600 focus:ring-1 focus:ring-blue-500"
                    />
                    <span>Include anime</span>
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-zinc-800 text-zinc-400 text-xs rounded border border-zinc-700">↵</kbd>
                    <span>to select</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-zinc-800 text-zinc-400 text-xs rounded border border-zinc-700">esc</kbd>
                    <span>to close</span>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpotlightSearch;
