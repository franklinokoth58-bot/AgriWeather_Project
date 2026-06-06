import { useState, useRef, useEffect } from 'react';

const STORAGE_KEY = 'agriweather_recent_searches';
const MAX_RECENT = 5;

/**
 * SearchBar — location search with recent searches stored in localStorage.
 *
 * @prop {(query: string) => void} onSearch - Called with city name or "lat,lon"
 * @prop {boolean} [loading]
 */
function SearchBar({ onSearch, loading = false }) {
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  });
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const saveSearch = (value) => {
    const updated = [value, ...recentSearches.filter((s) => s !== value)].slice(0, MAX_RECENT);
    setRecentSearches(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    saveSearch(trimmed);
    onSearch(trimmed);
    setShowDropdown(false);
    inputRef.current?.blur();
  };

  const handleRecent = (value) => {
    setQuery(value);
    onSearch(value);
    setShowDropdown(false);
  };

  const clearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-xl mx-auto">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            🔍
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => recentSearches.length > 0 && setShowDropdown(true)}
            placeholder="Search city or lat,lon (e.g. Nairobi or -1.28,36.82)"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 text-sm shadow-sm"
            aria-label="Search location"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-4 py-2.5 bg-green-700 hover:bg-green-800 disabled:bg-green-300 dark:disabled:bg-green-900 text-white rounded-xl font-medium text-sm transition-colors shadow-sm whitespace-nowrap"
        >
          {loading ? '...' : 'Search'}
        </button>
      </form>

      {/* Recent searches dropdown */}
      {showDropdown && recentSearches.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-lg overflow-hidden z-30">
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 dark:border-slate-700">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Recent
            </span>
            <button
              onClick={clearRecent}
              className="text-xs text-red-500 hover:text-red-600 dark:text-red-400"
            >
              Clear
            </button>
          </div>
          {recentSearches.map((s, i) => (
            <button
              key={i}
              onClick={() => handleRecent(s)}
              className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center gap-2 transition-colors"
            >
              <span className="text-slate-400">🕐</span>
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchBar;
