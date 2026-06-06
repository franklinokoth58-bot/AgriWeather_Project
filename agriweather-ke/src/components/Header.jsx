import { useState, useEffect } from 'react';
import { useUsage } from '../hooks/useWeather';

/**
 * Header — App branding, location pill, dark mode toggle, usage badge.
 *
 * @prop {string} city
 * @prop {string} country
 * @prop {boolean} darkMode
 * @prop {() => void} onToggleDark
 * @prop {() => void} onOpenUsage
 */
function Header({ city, country, darkMode, onToggleDark, onOpenUsage }) {
  const { data: usage } = useUsage();

  const countryFlag = (code) => {
    if (!code || code.length !== 2) return '🌍';
    return code
      .toUpperCase()
      .split('')
      .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
      .join('');
  };

  // usage.remaining is { requests, aiRequests } — extract the primitive
  const remaining = usage?.remaining?.requests ?? null;

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-green-100 dark:border-slate-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-700 to-emerald-500 flex items-center justify-center shadow-md">
            <span className="text-white text-lg">🌿</span>
          </div>
          <div>
            <span className="font-bold text-lg text-green-800 dark:text-green-400 leading-none">
              AgriWeather
            </span>
            <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400 leading-none">
              {' '}KE
            </span>
          </div>
        </div>

        {/* Location pill */}
        {city && (
          <div className="flex items-center gap-1.5 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-full px-3 py-1 text-sm font-medium text-green-800 dark:text-green-300 max-w-[200px] truncate">
            <span>{countryFlag(country)}</span>
            <span className="truncate">{city}{country ? `, ${country}` : ''}</span>
          </div>
        )}

        <div className="flex items-center gap-2 ml-auto">
          {/* Usage badge */}
          {remaining !== null && (
            <button
              onClick={onOpenUsage}
              className="hidden sm:flex items-center gap-1.5 text-xs bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-400 rounded-full px-3 py-1 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
              title="API Usage"
            >
              <span>⚡</span>
              <span className="font-semibold tabular-nums">{remaining} left</span>
            </button>
          )}

          {/* Dark mode toggle */}
          <button
            onClick={onToggleDark}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-lg"
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>

          {/* Usage button (mobile) */}
          <button
            onClick={onOpenUsage}
            className="sm:hidden w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            aria-label="View API usage"
          >
            <span>📊</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
