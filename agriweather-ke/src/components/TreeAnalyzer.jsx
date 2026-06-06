import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTreeAnalysis, useTreesQuota } from '../hooks/useTrees';
import { parseApiError } from '../api/treesApi';

const MAX_SIZE_MB = 20;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * CircleProgress — SVG progress ring.
 * @prop {number} pct - 0..100
 * @prop {string} color - Tailwind color class applied via style
 * @prop {string} label
 */
function CircleProgress({ pct, color, label }) {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
        <text x="50" y="50" textAnchor="middle" dy="0.35em" className="text-base font-bold fill-slate-700 dark:fill-slate-200" style={{ fontSize: 16, fontWeight: 700 }}>
          {pct}%
        </text>
      </svg>
      <span className="text-xs text-slate-500 dark:text-slate-400 text-center">{label}</span>
    </div>
  );
}

/**
 * TreeAnalyzer — farm image upload and analysis results.
 */
function TreeAnalyzer() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [fields, setFields] = useState({
    farmerId: '', county: '', landAcres: '', location: '', notes: '',
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef(null);

  const { data: quota, isLoading: quotaLoading } = useTreesQuota();
  const { mutate: analyze, isPending, data: result, error, reset } = useTreeAnalysis();

  const apiError = error ? parseApiError(error) : null;

  const validateFile = (f) => {
    if (!ACCEPTED.includes(f.type)) {
      return 'Only JPEG, PNG, or WEBP images are supported.';
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      return `File must be under ${MAX_SIZE_MB}MB.`;
    }
    return '';
  };

  const handleFile = (f) => {
    const err = validateFile(f);
    setFileError(err);
    if (err) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    reset();
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  }, []);

  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) return;
    setUploadProgress(0);
    analyze({
      image: file,
      farmerId: fields.farmerId || undefined,
      county: fields.county || undefined,
      landAcres: fields.landAcres !== '' ? parseFloat(fields.landAcres) : undefined,
      location: fields.location || undefined,
      notes: fields.notes || undefined,
      onUploadProgress: (ev) => {
        setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Quota bar */}
      {!quotaLoading && quota && (
        <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-green-800 dark:text-green-300">
            <span>🌳</span>
            <span>
              {quota.unlimited
                ? 'Unlimited tree analyses'
                : `${quota.remaining ?? 0} of ${quota.limit ?? 0} analyses remaining`}
            </span>
          </div>
          {quota.resets_at && (
            <span className="text-xs text-slate-400">
              Resets {new Date(quota.resets_at * 1000).toLocaleDateString()}
            </span>
          )}
        </div>
      )}

      {/* Upload form */}
      {!result && (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Drop zone */}
          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
              dragging
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                : preview
                ? 'border-green-400 bg-green-50/50 dark:bg-green-900/10'
                : 'border-slate-300 dark:border-slate-600 hover:border-green-400 dark:hover:border-green-500 bg-slate-50 dark:bg-slate-800/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
            />
            {preview ? (
              <div className="flex flex-col items-center gap-3">
                <img
                  src={preview}
                  alt="Preview"
                  className="max-h-48 rounded-xl object-cover shadow-md"
                />
                <span className="text-sm text-green-700 dark:text-green-400 font-medium">{file?.name}</span>
                <span className="text-xs text-slate-400">Click to change image</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-4xl">🛰️</div>
                <p className="font-semibold text-slate-700 dark:text-slate-200">
                  Drop aerial farm image here
                </p>
                <p className="text-sm text-slate-400">JPEG, PNG, or WEBP • Max 20MB</p>
                <button
                  type="button"
                  className="mt-2 px-4 py-2 bg-green-700 text-white rounded-xl text-sm hover:bg-green-800 transition-colors"
                >
                  Browse Files
                </button>
              </div>
            )}
          </div>
          {fileError && <p className="text-red-500 text-sm">{fileError}</p>}

          {/* Optional fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { key: 'farmerId', label: 'Farm ID', placeholder: 'e.g. KE-001', type: 'text' },
              { key: 'county', label: 'County', placeholder: 'e.g. Kiambu', type: 'text' },
              { key: 'landAcres', label: 'Land Acres', placeholder: 'e.g. 5.5', type: 'number' },
              { key: 'location', label: 'Location', placeholder: 'e.g. Thika', type: 'text' },
            ].map(({ key, label, placeholder, type }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {label} <span className="text-slate-400">(optional)</span>
                </label>
                <input
                  type={type}
                  value={fields[key]}
                  onChange={(e) => setFields((p) => ({ ...p, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  min={type === 'number' ? 0 : undefined}
                  step={type === 'number' ? 'any' : undefined}
                />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Notes <span className="text-slate-400">(optional)</span>
            </label>
            <textarea
              value={fields.notes}
              onChange={(e) => setFields((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Any observations about the farm..."
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
          </div>

          {/* Error */}
          {apiError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-4 text-sm text-red-700 dark:text-red-400">
              {apiError.message}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!file || isPending || !!fileError}
            className="w-full py-3 bg-green-700 hover:bg-green-800 disabled:bg-green-300 dark:disabled:bg-green-900/50 text-white rounded-xl font-semibold text-sm transition-colors shadow-md"
          >
            {isPending ? 'Analyzing...' : 'Analyze Farm Imagery'}
          </button>

          {/* Upload progress */}
          {isPending && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>🔬 Analyzing farm imagery...</span>
                <span className="tabular-nums">{uploadProgress}%</span>
              </div>
              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </form>
      )}

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Big number */}
            <div className="bg-gradient-to-br from-green-700 to-emerald-600 rounded-2xl p-6 text-white text-center shadow-lg">
              <div className="text-6xl font-bold tabular-nums mb-1">{result.total_tree_count ?? '—'}</div>
              <div className="text-green-200">Trees Detected</div>
              {result.tree_species_guess && (
                <div className="mt-2 text-sm text-green-100 italic">
                  Likely species: {result.tree_species_guess}
                </div>
              )}
            </div>

            {/* Progress rings */}
            <div className="flex justify-around flex-wrap gap-4 bg-white dark:bg-slate-800 rounded-2xl border border-green-100 dark:border-slate-700 p-6">
              <CircleProgress
                pct={Math.round(result.canopy_coverage_pct ?? 0)}
                color="#10b981"
                label="Canopy Coverage"
              />
              <CircleProgress
                pct={Math.round((result.confidence_score ?? 0) * 100)}
                color="#f59e0b"
                label="Confidence Score"
              />
              {result.tree_density_per_acre != null && (
                <div className="flex flex-col items-center gap-1">
                  <div className="text-3xl font-bold text-green-700 dark:text-green-400 tabular-nums">
                    {result.tree_density_per_acre.toFixed(1)}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Trees / Acre</div>
                </div>
              )}
            </div>

            {/* Health breakdown */}
            {result.tree_health && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-green-100 dark:border-slate-700 p-5">
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">Tree Health</h3>
                <HealthBar
                  healthy={result.tree_health.healthy ?? 0}
                  needsCare={result.tree_health.needs_care ?? 0}
                  needsReplacement={result.tree_health.needs_replacement ?? 0}
                />
              </div>
            )}

            {/* Images */}
            {(result.original_image_url || result.overlay_image_url) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {result.original_image_url && (
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1">Original</p>
                    <img src={result.original_image_url} alt="Original farm" className="w-full rounded-xl object-cover shadow-md" />
                  </div>
                )}
                {result.overlay_image_url && (
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1">Annotated</p>
                    <img src={result.overlay_image_url} alt="Annotated overlay" className="w-full rounded-xl object-cover shadow-md" />
                  </div>
                )}
              </div>
            )}

            {/* Observations */}
            {result.observations?.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-green-100 dark:border-slate-700 p-5">
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">🍃 Observations</h3>
                <ul className="space-y-2">
                  {result.observations.map((obs, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <span className="text-green-500 shrink-0 mt-0.5">🌿</span>
                      {obs}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {result.recommendations?.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-green-100 dark:border-slate-700 p-5">
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">✅ Recommendations</h3>
                <ul className="space-y-2">
                  {result.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <span className="text-emerald-500 shrink-0 mt-0.5">✔️</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* New analysis button */}
            <button
              onClick={() => { reset(); setFile(null); setPreview(null); setUploadProgress(0); }}
              className="w-full py-3 border-2 border-green-700 dark:border-green-500 text-green-700 dark:text-green-400 rounded-xl font-semibold text-sm hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
            >
              Analyze Another Image
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function HealthBar({ healthy, needsCare, needsReplacement }) {
  const total = healthy + needsCare + needsReplacement;
  if (total === 0) return null;
  const hp = Math.round((healthy / total) * 100);
  const cp = Math.round((needsCare / total) * 100);
  const rp = 100 - hp - cp;

  return (
    <div>
      <div className="flex h-6 rounded-xl overflow-hidden gap-0.5">
        {hp > 0 && (
          <div className="bg-green-500" style={{ width: `${hp}%` }} title={`Healthy: ${healthy}`} />
        )}
        {cp > 0 && (
          <div className="bg-amber-500" style={{ width: `${cp}%` }} title={`Needs care: ${needsCare}`} />
        )}
        {rp > 0 && (
          <div className="bg-red-500" style={{ width: `${rp}%` }} title={`Needs replacement: ${needsReplacement}`} />
        )}
      </div>
      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-500 inline-block" /> Healthy ({healthy})</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-500 inline-block" /> Needs Care ({needsCare})</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-500 inline-block" /> Replace ({needsReplacement})</span>
      </div>
    </div>
  );
}

export default TreeAnalyzer;
