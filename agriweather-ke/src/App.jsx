import { useState, useCallback, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { motion } from 'framer-motion';

import Header from './components/Header';
import SearchBar from './components/SearchBar';
import CurrentWeather, { CurrentWeatherSkeleton } from './components/CurrentWeather';
import AISummary from './components/AISummary';
import CropAdvisory from './components/CropAdvisory';
import ForecastCard from './components/ForecastCard';
import HourlyChart from './components/HourlyChart';
import TreeAnalyzer from './components/TreeAnalyzer';
import UsagePanel from './components/UsagePanel';
import ErrorBoundary from './components/ErrorBoundary';

import { useGeoWeather, useCoordWeather, useCurrentConditions, useHourlyForecast, useRefreshWeather } from './hooks/useWeather';
import { parseApiError } from './api/weatherApi';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

// -----------------------------------------------------------
// Inner App (inside QueryClientProvider context)
// -----------------------------------------------------------
function AppInner() {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('agriweather_dark') === 'true' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [usagePanelOpen, setUsagePanelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('weather'); // 'weather' | 'trees'
  const [searchCoords, setSearchCoords] = useState(null); // { lat, lon } | null
  const [searchQuery, setSearchQuery] = useState('');

  // Apply dark mode class to <body>
  useEffect(() => {
    document.body.classList.toggle('dark', darkMode);
    localStorage.setItem('agriweather_dark', darkMode);
  }, [darkMode]);

  // --- Primary data: geo-based on load ---
  const geoQuery = useGeoWeather();
  const geoData = geoQuery.data;
  const geoGeo = geoData?.geo || {};
  const geoWeather = geoData?.data || null;

  // Derive coords from geo response
  const geoCoords = geoWeather?.location
    ? { lat: geoWeather.location.lat, lon: geoWeather.location.lon }
    : null;

  // --- Search-based weather ---
  const coordQuery = useCoordWeather({
    lat: searchCoords?.lat ?? null,
    lon: searchCoords?.lon ?? null,
  });
  const coordWeather = coordQuery.data?.data || null;

  // Active data = search result if available, else geo
  const activeWeather = coordWeather || geoWeather;
  // For downstream hooks (hourly, current) we need numeric coords
  const resolvedSearchCoords = coordWeather?.location
    ? { lat: coordWeather.location.lat, lon: coordWeather.location.lon }
    : (searchCoords && typeof searchCoords.lat === 'number' ? searchCoords : null);
  const activeCoords = resolvedSearchCoords || geoCoords;

  // Hourly chart (uses active coords)
  const hourlyQuery = useHourlyForecast({
    lat: activeCoords?.lat ?? null,
    lon: activeCoords?.lon ?? null,
  });

  const refreshWeather = useRefreshWeather();

  // -- Refresh current conditions --
  const currentQuery = useCurrentConditions({
    lat: activeCoords?.lat ?? null,
    lon: activeCoords?.lon ?? null,
  });

  const isLoading = geoQuery.isLoading || (searchCoords && coordQuery.isLoading);
  const isError = geoQuery.isError && !searchCoords;
  const error = geoQuery.error;

  // Geocode a search string — either "lat,lon" or city name
  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    const latLonMatch = query.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
    if (latLonMatch) {
      // Explicit coordinates
      setSearchCoords({ lat: parseFloat(latLonMatch[1]), lon: parseFloat(latLonMatch[2]) });
    } else {
      // City name — pass as string lat; the hook/API handles city name queries via q=
      setSearchCoords({ lat: query, lon: null });
    }
  }, []);

  const activeCity = searchCoords
    ? (coordWeather?.location?.name || searchQuery)
    : (geoGeo.city || geoWeather?.location?.name || '');
  const activeCountry = searchCoords
    ? (coordWeather?.location?.country || '')
    : (geoGeo.country || geoWeather?.location?.country || '');

  const parsedError = error ? parseApiError(error) : null;

  return (
    <div className={`min-h-screen bg-[#f8fafc] dark:bg-slate-950 transition-colors duration-300`}>
      <ErrorBoundary>
        <Header
          city={activeCity}
          country={activeCountry}
          darkMode={darkMode}
          onToggleDark={() => setDarkMode((d) => !d)}
          onOpenUsage={() => setUsagePanelOpen(true)}
        />
      </ErrorBoundary>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Search bar */}
        <ErrorBoundary>
          <SearchBar
            onSearch={handleSearch}
            loading={coordQuery.isLoading}
          />
        </ErrorBoundary>

        {/* API key missing warning */}
        {!import.meta.env.VITE_WEATHER_API_KEY && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-xl p-4 text-amber-800 dark:text-amber-300 text-sm">
            <strong>⚠️ API key missing.</strong> Create a <code>.env.local</code> file and add{' '}
            <code>VITE_WEATHER_API_KEY=wai_your_key_here</code>, then restart the dev server.
          </div>
        )}

        {/* Tab nav */}
        <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
          <TabBtn active={activeTab === 'weather'} onClick={() => setActiveTab('weather')}>
            🌤️ Weather
          </TabBtn>
          <TabBtn active={activeTab === 'trees'} onClick={() => setActiveTab('trees')}>
            🌳 Tree Analyzer
          </TabBtn>
        </div>

        {/* Weather tab */}
        {activeTab === 'weather' && (
          <div className="space-y-6">
            {/* Error state */}
            {isError && parsedError && (
              <ErrorCard error={parsedError} onRetry={refreshWeather} />
            )}

            {/* Loading skeleton */}
            {isLoading && !activeWeather && <CurrentWeatherSkeleton />}

            {/* Current weather hero */}
            {activeWeather && (
              <ErrorBoundary>
                <CurrentWeather
                  weatherData={activeWeather}
                  city={activeCity}
                  onRefresh={() => {
                    refreshWeather();
                    currentQuery.refetch();
                  }}
                  refreshing={currentQuery.isFetching}
                />
              </ErrorBoundary>
            )}

            {/* AI Summary */}
            {activeWeather && (
              <ErrorBoundary>
                <AISummary
                  weatherData={activeWeather}
                  lat={activeCoords?.lat}
                  lon={activeCoords?.lon}
                />
              </ErrorBoundary>
            )}

            {/* Crop Advisory */}
            {activeWeather && (
              <ErrorBoundary>
                <CropAdvisory weatherData={activeWeather} />
              </ErrorBoundary>
            )}

            {/* 7-day forecast */}
            {activeWeather && (
              <ErrorBoundary>
                <ForecastCard weatherData={activeWeather} />
              </ErrorBoundary>
            )}

            {/* Hourly chart (today) */}
            {activeCoords && (
              <ErrorBoundary>
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">📈</span>
                    <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100">
                      Today's Hourly
                    </h2>
                  </div>
                  {hourlyQuery.isLoading ? (
                    <div className="skeleton h-48 rounded-2xl" />
                  ) : hourlyQuery.data ? (
                    <HourlyChart
                      hourlyData={
                        hourlyQuery.data?.data?.forecast?.forecastday?.[0]?.hour ||
                        hourlyQuery.data?.data?.hourly ||
                        []
                      }
                    />
                  ) : null}
                </section>
              </ErrorBoundary>
            )}

            {/* Empty state */}
            {!isLoading && !activeWeather && !isError && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20 text-slate-400 dark:text-slate-500"
              >
                <div className="text-6xl mb-4">🌍</div>
                <p className="text-lg font-medium">Detecting your location...</p>
                <p className="text-sm mt-1">Or search for a city above</p>
              </motion.div>
            )}
          </div>
        )}

        {/* Trees tab */}
        {activeTab === 'trees' && (
          <ErrorBoundary>
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-green-100 dark:border-slate-700 shadow-md p-6">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-2xl">🛰️</span>
                <div>
                  <h2 className="font-bold text-xl text-slate-800 dark:text-slate-100">
                    Farm Tree Analyzer
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Upload an aerial or satellite image to analyze tree health and density
                  </p>
                </div>
              </div>
              <TreeAnalyzer />
            </div>
          </ErrorBoundary>
        )}
      </main>

      {/* Usage panel */}
      <UsagePanel isOpen={usagePanelOpen} onClose={() => setUsagePanelOpen(false)} />
    </div>
  );
}

function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
        active
          ? 'bg-white dark:bg-slate-700 text-green-800 dark:text-green-300 shadow-sm'
          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
      }`}
    >
      {children}
    </button>
  );
}

function ErrorCard({ error, onRetry }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-2xl p-6 text-center"
    >
      <div className="text-4xl mb-3">⚠️</div>
      <p className="font-semibold text-red-800 dark:text-red-300 mb-1">
        {error.code === 401 ? 'Authentication Error' :
         error.code === 429 ? 'Quota Exceeded' :
         error.code === 403 ? 'Plan Limitation' : 'Connection Error'}
      </p>
      <p className="text-sm text-red-600 dark:text-red-400 mb-4">{error.message}</p>
      {(error.code === 500 || error.code === 503 || !error.code) && (
        <button
          onClick={onRetry}
          className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors"
        >
          Retry
        </button>
      )}
    </motion.div>
  );
}

// -----------------------------------------------------------
// Root App with QueryClientProvider
// -----------------------------------------------------------
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppInner />
    </QueryClientProvider>
  );
}

export default App;
