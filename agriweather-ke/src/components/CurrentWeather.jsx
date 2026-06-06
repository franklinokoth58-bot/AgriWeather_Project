import { format, parseISO } from 'date-fns';
import { motion } from 'framer-motion';

/**
 * Maps WMO condition_code (string or number) to an emoji.
 * WeatherAI uses WMO codes: 0=clear, 1-2=partly cloudy, 3=overcast,
 * 45/48=fog, 51-67=drizzle/rain, 71-77=snow, 80-82=showers,
 * 85-86=snow showers, 95=thunderstorm, 96/99=hail.
 */
const conditionEmoji = (code) => {
  const c = parseInt(code, 10);
  if (isNaN(c)) return '🌤️';
  if (c === 0) return '☀️';
  if (c === 1) return '🌤️';
  if (c === 2) return '⛅';
  if (c === 3) return '☁️';
  if (c === 45 || c === 48) return '🌫️';
  if (c >= 51 && c <= 57) return '🌦️';
  if (c >= 61 && c <= 67) return '🌧️';
  if (c >= 71 && c <= 77) return '🌨️';
  if (c >= 80 && c <= 82) return '🌧️';
  if (c >= 85 && c <= 86) return '🌨️';
  if (c === 95) return '⛈️';
  if (c === 96 || c === 99) return '⛈️';
  return '🌤️';
};

/**
 * Maps WMO condition_code to a human-readable description.
 */
const conditionText = (code) => {
  const c = parseInt(code, 10);
  if (isNaN(c)) return '';
  if (c === 0) return 'Clear sky';
  if (c === 1) return 'Mainly clear';
  if (c === 2) return 'Partly cloudy';
  if (c === 3) return 'Overcast';
  if (c === 45 || c === 48) return 'Foggy';
  if (c >= 51 && c <= 57) return 'Drizzle';
  if (c >= 61 && c <= 67) return 'Rain';
  if (c >= 71 && c <= 77) return 'Snow';
  if (c >= 80 && c <= 82) return 'Rain showers';
  if (c >= 85 && c <= 86) return 'Snow showers';
  if (c === 95) return 'Thunderstorm';
  if (c === 96 || c === 99) return 'Thunderstorm with hail';
  return 'Cloudy';
};

/**
 * Skeleton placeholder for CurrentWeather.
 */
export function CurrentWeatherSkeleton() {
  return (
    <div className="bg-gradient-to-br from-green-700 to-emerald-600 rounded-2xl shadow-lg p-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
        <div>
          <div className="skeleton h-5 w-32 rounded mb-3 opacity-40" />
          <div className="skeleton h-24 w-48 rounded-lg opacity-40" />
        </div>
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-xl opacity-30" />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * CurrentWeather — hero section with temperature and conditions.
 *
 * Actual API fields (from /v1/weather-geo and /v1/weather):
 *   current.temperature, current.wind_speed, current.feels_like,
 *   current.uv_index, current.humidity, current.condition_code
 *   daily[0].sunrise, daily[0].sunset
 *
 * @prop {object} weatherData - Full API response
 * @prop {string} city
 * @prop {Function} onRefresh
 * @prop {boolean} refreshing
 */
function CurrentWeather({ weatherData, city, onRefresh, refreshing }) {
  const current  = weatherData?.current  || {};
  const location = weatherData?.location || {};
  const today    = weatherData?.daily?.[0] || {};

  // Use real API field names — fallback chain handles both endpoint shapes
  const temp      = current.temperature    ?? current.temp_c       ?? '—';
  const feelsLike = current.feels_like     ?? current.feelslike_c  ?? '—';
  const humidity  = current.humidity       ?? '—';
  const windKph   = current.wind_speed     ?? current.wind_kph     ?? '—';
  const uvIndex   = current.uv_index       ?? current.uv           ?? '—';
  const code      = current.condition_code ?? current.weathercode  ?? null;

  const emoji = conditionEmoji(code);
  const desc  = conditionText(code);

  // Sunrise / sunset come from daily[0] as ISO strings e.g. "2026-06-05T06:29"
  const sunriseStr = today.sunrise
    ? (() => { try { return format(parseISO(today.sunrise), 'HH:mm'); } catch { return today.sunrise; } })()
    : null;
  const sunsetStr = today.sunset
    ? (() => { try { return format(parseISO(today.sunset), 'HH:mm'); } catch { return today.sunset; } })()
    : null;

  // Last updated from current.time ISO string
  const lastUpdated = current.time
    ? (() => { try { return format(parseISO(current.time), 'HH:mm'); } catch { return ''; } })()
    : format(new Date(), 'HH:mm');

  const displayCity = city || location.name || location.country || 'Current Location';
  const displayCountry = location.country && !city ? '' : (location.country ? `, ${location.country}` : '');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-gradient-to-br from-green-700 to-emerald-600 dark:from-green-900 dark:to-emerald-800 rounded-2xl shadow-lg text-white overflow-hidden"
    >
      <div className="p-6">
        {/* Top row */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div>
            <p className="text-green-200 text-sm font-medium mb-2">
              {displayCity}{displayCountry}
            </p>
            <div className="flex items-end gap-4">
              <span className="text-8xl leading-none" role="img" aria-label={desc}>
                {emoji}
              </span>
              <div>
                <div className="text-7xl font-bold tabular-nums leading-none">
                  {typeof temp === 'number' ? Math.round(temp) : temp}°
                </div>
                <div className="text-green-200 mt-1 text-sm">{desc}</div>
              </div>
            </div>
          </div>

          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="self-start flex items-center gap-1.5 text-xs bg-white/20 hover:bg-white/30 rounded-full px-3 py-1.5 transition-colors disabled:opacity-60"
            title="Refresh current conditions"
          >
            <span className={refreshing ? 'animate-spin inline-block' : 'inline-block'}>🔄</span>
            <span>{lastUpdated}</span>
          </button>
        </div>

        {/* Conditions grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <ConditionBadge
            icon="🌡️"
            label="Feels Like"
            value={typeof feelsLike === 'number' ? `${Math.round(feelsLike)}°C` : '—'}
          />
          <ConditionBadge
            icon="💧"
            label="Humidity"
            value={humidity !== '—' ? `${humidity}%` : '—'}
          />
          <ConditionBadge
            icon="💨"
            label="Wind"
            value={windKph !== '—' ? `${windKph} km/h` : '—'}
          />
          <ConditionBadge
            icon="☀️"
            label="UV Index"
            value={uvIndex !== '—' ? String(uvIndex) : '—'}
          />
          {sunriseStr && (
            <ConditionBadge icon="🌅" label="Sunrise" value={sunriseStr} />
          )}
          {sunsetStr && (
            <ConditionBadge icon="🌇" label="Sunset" value={sunsetStr} />
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ConditionBadge({ icon, label, value }) {
  return (
    <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 text-center">
      <div className="text-xl mb-1">{icon}</div>
      <div className="text-xs text-green-200 mb-0.5">{label}</div>
      <div className="font-bold tabular-nums text-sm">{value}</div>
    </div>
  );
}

export default CurrentWeather;
