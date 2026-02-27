import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, X, Link, Plus, AlertTriangle } from 'lucide-react';

const SpotlightSearch = ({ isOpen, onClose, onSelect }) => {
  const [query, setQuery] = useState('');
  const [includeAnime, setIncludeAnime] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [addingByImdb, setAddingByImdb] = useState(false);
  const [duplicateConfirm, setDuplicateConfirm] = useState(null);
  const inputRef = useRef(null);

  // Extract IMDB ID from URL or direct ID
  const extractImdbId = (input) => {
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
    setResults([]);

    try {
      const searchQuery = includeAnime ? `anime ${query}` : query;

      console.log('Searching for:', searchQuery);

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
      setResults(data.results || []);
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
    onClose();
  };

  const handleAddByImdb = async (type = 'Movie', force = false) => {
    const imdbId = extractImdbId(query);
    if (!imdbId) return;

    setAddingByImdb(true);
    setError(null);

    try {
      const response = await fetch('/api/entries/add-by-imdb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imdbId, type, ...(force && { force: true }) })
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 409 && (errorData.message || errorData.error)) {
          const msg = errorData.message || errorData.error;
          setAddingByImdb(false);
          setDuplicateConfirm({
            message: msg,
            onConfirm: () => { setDuplicateConfirm(null); handleAddByImdb(type, true); },
          });
          return;
        }
        throw new Error(errorData.error || 'Failed to add movie');
      }

      const entry = await response.json();
      onSelect(entry);
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
      className="fixed inset-0 bg-cinema-bg/60 backdrop-blur-md flex items-center justify-center z-50 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Box */}
        <div className="bg-cinema-card/95 backdrop-blur-xl rounded-xl shadow-2xl overflow-hidden border border-cinema-border">
          {/* Gold glow at top */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

          {/* Search Input */}
          <div className="border-b border-cinema-border">
            <div className="flex items-center px-4 py-3">
              <Search className="text-cinema-subtle mr-3" size={20} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Search your workspace or run a command"
                className="flex-1 bg-transparent text-cinema-text text-base placeholder-cinema-subtle focus:outline-none"
              />
              <button
                onClick={onClose}
                className="ml-2 text-cinema-subtle hover:text-cinema-muted transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-gold" size={32} />
              </div>
            )}

            {error && (
              <div className="p-4">
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm text-center">
                  {error}
                </div>
              </div>
            )}

            {!loading && !error && results.length === 0 && !query && (
              <div className="p-6">
                <div className="text-cinema-subtle text-xs font-mono uppercase tracking-wider mb-4">Quick Actions</div>
                <div className="space-y-1">
                  <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gold-50 cursor-pointer transition-colors">
                    <div className="w-8 h-8 bg-gold-50 border border-cinema-border rounded flex items-center justify-center">
                      <Search size={16} className="text-cinema-subtle" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-cinema-text font-medium">Search Movies</div>
                      <div className="text-xs text-cinema-subtle">Find movies and series to add</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!loading && !error && results.length === 0 && query && !isImdbInput && (
              <div className="p-6">
                <div className="text-center py-4 text-cinema-subtle text-sm mb-4">
                  No results found for "{query}"
                </div>
                <div className="text-cinema-subtle text-xs font-mono uppercase tracking-wider mb-2">Or paste an IMDB link</div>
                <div className="text-cinema-subtle/50 text-xs">
                  Paste an IMDB URL like: https://imdb.com/title/tt1234567
                </div>
              </div>
            )}

            {/* IMDB Link Detected */}
            {!loading && !error && isImdbInput && (
              <div className="p-4">
                <div className="text-cinema-subtle text-xs font-mono uppercase tracking-wider flex items-center gap-2 mb-3">
                  <Link size={12} />
                  IMDB Link Detected
                </div>
                <div className="bg-gold-50 border border-cinema-border rounded-lg p-3 mb-3">
                  <div className="text-xs text-cinema-subtle mb-1">IMDB ID:</div>
                  <div className="text-sm text-cinema-text font-mono">{extractImdbId(query)}</div>
                </div>
                <div className="text-cinema-subtle text-xs mb-2">Add as:</div>
                <div className="grid grid-cols-2 gap-2">
                  {['Movie', 'Series', 'Anime'].map((type) => (
                    <button
                      key={type}
                      onClick={() => handleAddByImdb(type)}
                      disabled={addingByImdb}
                      className="flex items-center justify-center gap-2 px-3 py-2.5 bg-gold-50 border border-cinema-border hover:border-gold-200 rounded-lg text-sm text-cinema-text transition-colors disabled:opacity-50"
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
                <div className="text-cinema-subtle text-xs font-mono uppercase tracking-wider px-3 py-2">
                  Results ({results.length})
                </div>
                <div className="space-y-1">
                  {results.map((result) => (
                    <div
                      key={result.imdbId}
                      onClick={() => handleResultClick(result)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gold-50 cursor-pointer transition-colors group"
                    >
                      {/* Poster Thumbnail */}
                      <div className="w-10 h-14 flex-shrink-0 rounded overflow-hidden bg-gold-50 border border-cinema-border shadow-sm">
                        {result.poster ? (
                          <img
                            src={result.poster}
                            alt={result.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="56"%3E%3Crect fill="%23111110" width="40" height="56"/%3E%3C/svg%3E';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Search size={14} className="text-cinema-subtle" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm text-cinema-text font-medium truncate">
                            {result.title}
                          </h3>
                          {result.year && (
                            <span className="text-xs text-cinema-subtle flex-shrink-0">
                              {result.year}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {result.type && (
                            <span className="text-xs text-cinema-subtle capitalize">
                              {result.type}
                            </span>
                          )}
                          {result.rating && (
                            <div className="flex items-center gap-1">
                              <span className="text-gold text-xs">★</span>
                              <span className="text-xs text-cinema-muted">{result.rating}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action hint */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <kbd className="px-1.5 py-0.5 bg-gold-50 border border-cinema-border text-cinema-subtle text-xs rounded">↵</kbd>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {!loading && (
            <div className="border-t border-cinema-border px-4 py-2.5 bg-gold-50">
              <div className="flex items-center justify-between text-xs text-cinema-subtle">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer hover:text-cinema-muted">
                    <input
                      type="checkbox"
                      checked={includeAnime}
                      onChange={(e) => setIncludeAnime(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-cinema-border bg-gold-50 text-gold focus:ring-1 focus:ring-gold-200"
                    />
                    <span>Include anime</span>
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-cinema-card border border-cinema-border text-cinema-subtle text-xs rounded">N</kbd>
                    <span>open</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-cinema-card border border-cinema-border text-cinema-subtle text-xs rounded">/</kbd>
                    <span>search</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-cinema-card border border-cinema-border text-cinema-subtle text-xs rounded">1-6</kbd>
                    <span>tabs</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-cinema-card border border-cinema-border text-cinema-subtle text-xs rounded">esc</kbd>
                    <span>close</span>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Duplicate Confirmation Dialog */}
        {duplicateConfirm && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center px-4" onClick={() => setDuplicateConfirm(null)}>
            <div className="absolute inset-0 bg-cinema-bg/60" />
            <div className="relative w-full max-w-sm bg-cinema-card backdrop-blur-xl border border-cinema-border shadow-2xl rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
              <div className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-6 h-6 text-amber-500" />
                </div>
                <h3 className="text-base font-serif text-cinema-text mb-2">Duplicate Entry</h3>
                <p className="text-sm text-cinema-muted leading-relaxed">{duplicateConfirm.message}</p>
              </div>
              <div className="flex border-t border-cinema-border">
                <button onClick={() => setDuplicateConfirm(null)}
                  className="flex-1 px-4 py-3 text-sm text-cinema-muted hover:text-cinema-text hover:bg-white/[0.03] transition-colors">
                  Cancel
                </button>
                <div className="w-px bg-cinema-border" />
                <button onClick={duplicateConfirm.onConfirm}
                  className="flex-1 px-4 py-3 text-sm text-gold hover:bg-gold/[0.06] font-medium transition-colors">
                  Add Anyway
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpotlightSearch;
