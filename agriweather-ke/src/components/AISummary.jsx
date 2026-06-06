import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { fetchWeatherByCoords } from '../api/weatherApi';

/**
 * AISummary — shows AI weather summary with English / Swahili toggle.
 *
 * The API returns an `ai_summary` string at the top level when the plan
 * supports it. This component handles missing summaries gracefully.
 *
 * @prop {object} weatherData - Full API response (English)
 * @prop {number | null} lat
 * @prop {number | null} lon
 */
function AISummary({ weatherData, lat, lon }) {
  const [lang, setLang] = useState('en');

  // Fetch Swahili version on demand — only when user toggles
  const swahiliQuery = useQuery({
    queryKey: ['weather-sw', lat, lon],
    queryFn: () => fetchWeatherByCoords({ lat, lon, lang: 'sw' }),
    enabled: lang === 'sw' && lat !== null && lon !== null,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });

  // Extract summary string — field is `ai_summary` at the top level
  const enSummary = weatherData?.ai_summary || null;
  const swSummary = swahiliQuery.data?.data?.ai_summary || null;

  const activeSummary = lang === 'sw' ? swSummary : enSummary;
  const isLoading = lang === 'sw' && swahiliQuery.isLoading;

  // Don't render if neither language has a summary and we're not loading
  if (!enSummary && !isLoading && !swSummary) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-green-100 dark:border-slate-700 shadow-md p-5">
        <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
          <span>✨</span>
          <span className="text-sm italic">
            AI summary not available on this plan. Upgrade at{' '}
            <a
              href="https://weather-ai.co"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 dark:text-green-400 underline"
            >
              weather-ai.co
            </a>
          </span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="bg-white dark:bg-slate-800 rounded-2xl border border-green-100 dark:border-slate-700 shadow-md p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">✨</span>
          <h2 className="font-bold text-green-800 dark:text-green-400 text-lg">AI Summary</h2>
          <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-medium">
            Gemini
          </span>
        </div>

        {/* Language toggle — only show when coords are available */}
        {lat !== null && lon !== null && (
          <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-700 rounded-xl">
            <ToggleBtn active={lang === 'en'} onClick={() => setLang('en')}>
              🇬🇧 EN
            </ToggleBtn>
            <ToggleBtn active={lang === 'sw'} onClick={() => setLang('sw')}>
              🇰🇪 SW
            </ToggleBtn>
          </div>
        )}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            <div className="skeleton h-4 w-full rounded" />
            <div className="skeleton h-4 w-5/6 rounded" />
            <div className="skeleton h-4 w-4/6 rounded" />
          </motion.div>
        ) : activeSummary ? (
          <motion.p
            key={lang}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="text-slate-600 dark:text-slate-300 italic leading-relaxed text-sm sm:text-base"
          >
            {activeSummary}
          </motion.p>
        ) : lang === 'sw' && !swSummary ? (
          <motion.p
            key="sw-empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-slate-400 dark:text-slate-500 italic text-sm"
          >
            Swahili summary not available. Showing English below.
          </motion.p>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

function ToggleBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
        active
          ? 'bg-white dark:bg-slate-600 text-green-800 dark:text-green-300 shadow-sm'
          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
      }`}
    >
      {children}
    </button>
  );
}

export default AISummary;
