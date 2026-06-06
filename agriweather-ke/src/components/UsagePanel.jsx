import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { useUsage } from '../hooks/useWeather';
import { useTreesQuota } from '../hooks/useTrees';

/**
 * UsagePanel — collapsible modal showing plan usage and quota.
 *
 * API response shape:
 * {
 *   plan: string,
 *   period: { start, end, requestCount, aiRequestCount },
 *   limits: { requests, aiRequests, maxDays, ... },
 *   remaining: { requests, aiRequests }
 * }
 *
 * @prop {boolean} isOpen
 * @prop {() => void} onClose
 */
function UsagePanel({ isOpen, onClose }) {
  const { data: usage, isLoading: loadingUsage, error: usageError } = useUsage();
  const { data: treesQuota, isLoading: loadingTrees } = useTreesQuota();

  const formatDate = (iso) => {
    if (!iso) return '—';
    try {
      return format(new Date(iso), 'dd MMM yyyy');
    } catch {
      return String(iso);
    }
  };

  const formatReset = (ts) => {
    if (!ts) return '—';
    // Unix timestamp (number) vs ISO string
    try {
      const d = typeof ts === 'number' ? new Date(ts * 1000) : new Date(ts);
      return format(d, 'dd MMM yyyy');
    } catch {
      return String(ts);
    }
  };

  // Safely extract primitives from the nested usage object
  const planName      = typeof usage?.plan === 'string' ? usage.plan : 'Free';
  const reqUsed       = usage?.period?.requestCount ?? 0;
  const reqLimit      = usage?.limits?.requests ?? null;
  const reqRemaining  = usage?.remaining?.requests ?? null;
  const aiUsed        = usage?.period?.aiRequestCount ?? 0;
  const aiLimit       = usage?.limits?.aiRequests ?? null;
  const aiRemaining   = usage?.remaining?.aiRequests ?? null;
  const periodEnd     = usage?.period?.end ?? null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-sm bg-white dark:bg-slate-900 shadow-2xl z-50 overflow-y-auto"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📊</span>
                  <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100">
                    API Usage
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-500"
                  aria-label="Close panel"
                >
                  ✕
                </button>
              </div>

              {loadingUsage ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="skeleton h-12 rounded-xl" />
                  ))}
                </div>
              ) : usageError ? (
                <p className="text-red-500 text-sm">Failed to load usage data.</p>
              ) : usage ? (
                <div className="space-y-4">
                  {/* Plan badge */}
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-4">
                    <p className="text-xs text-green-600 dark:text-green-400 uppercase font-semibold tracking-wide mb-1">
                      Current Plan
                    </p>
                    <p className="text-xl font-bold text-green-800 dark:text-green-300 capitalize">
                      {planName}
                    </p>
                  </div>

                  {/* Weather requests */}
                  <UsageRow
                    label="Weather Requests"
                    used={reqUsed}
                    limit={reqLimit}
                    remaining={reqRemaining}
                    icon="🌤️"
                  />

                  {/* AI requests */}
                  <UsageRow
                    label="AI Requests"
                    used={aiUsed}
                    limit={aiLimit}
                    remaining={aiRemaining}
                    icon="✨"
                  />

                  {/* Billing period reset */}
                  {periodEnd && (
                    <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <span>🗓️</span>
                      Billing period resets {formatDate(periodEnd)}
                    </div>
                  )}
                </div>
              ) : null}

              {/* Trees quota */}
              {!loadingTrees && treesQuota && (
                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 mb-3">
                    <span>🌳</span>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-100">
                      Tree Analysis Quota
                    </h3>
                  </div>
                  <UsageRow
                    label="Tree Analyses"
                    used={Number(treesQuota.used) || 0}
                    limit={Number(treesQuota.limit) || null}
                    remaining={Number(treesQuota.remaining) || null}
                    icon="🛰️"
                    unlimited={Boolean(treesQuota.unlimited)}
                  />
                  {treesQuota.resets_at && (
                    <p className="text-xs text-slate-400 mt-2">
                      Resets {formatReset(treesQuota.resets_at)}
                    </p>
                  )}
                </div>
              )}

              {/* Docs link */}
              <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                <a
                  href="https://weather-ai.co/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 transition-colors"
                >
                  <span>📖</span>
                  View API Documentation →
                </a>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * @prop {string} label
 * @prop {number} used
 * @prop {number | null} limit
 * @prop {number | null} remaining
 * @prop {string} icon
 * @prop {boolean} [unlimited]
 */
function UsageRow({ label, used, limit, remaining, icon, unlimited }) {
  const usedNum      = Number(used) || 0;
  const limitNum     = Number(limit) || 0;
  const remainingNum = remaining !== null && remaining !== undefined ? Number(remaining) : null;

  const pct = unlimited || !limitNum
    ? 0
    : Math.min(100, Math.round((usedNum / limitNum) * 100));
  const barColor = pct > 80 ? 'bg-red-500' : pct > 60 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
          <span>{icon}</span>
          <span>{label}</span>
        </div>
        <span className="text-sm font-bold text-slate-800 dark:text-slate-100 tabular-nums">
          {unlimited ? '∞' : `${remainingNum ?? '?'} left`}
        </span>
      </div>
      {!unlimited && limitNum > 0 && (
        <>
          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${barColor}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-400 mt-1 tabular-nums">
            <span>{usedNum} used</span>
            <span>{limitNum} total</span>
          </div>
        </>
      )}
    </div>
  );
}

export default UsagePanel;
