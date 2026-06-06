import { useState } from 'react';
import { format, parseISO, isToday } from 'date-fns';
import { motion } from 'framer-motion';
import HourlyChart from './HourlyChart';

/**
 * Maps WMO condition_code to emoji.
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
  if (c === 95 || c === 96 || c === 99) return '⛈️';
  return '🌤️';
};

/**
 * 7-day forecast strip with expandable hourly chart per day.
 *
 * Actual API shape (from /v1/weather-geo):
 *   weatherData.daily = [{ date, temp_min, temp_max, condition_code,
 *                          precipitation_probability, sunrise, sunset, wind_max }]
 *   weatherData.hourly = [{ time, temperature, wind_speed, humidity,
 *                           precipitation_probability, condition_code, ... }]
 *
 * @prop {object} weatherData - Full API response
 */
function ForecastCard({ weatherData }) {
  const [expandedDay, setExpandedDay] = useState(null);

  // Real API uses weatherData.daily (array), not forecast.forecastday
  const dailyDays = weatherData?.daily || [];
  // Hourly data is a flat array at top level, grouped by date for expansion
  const hourlyAll = weatherData?.hourly || [];

  if (!dailyDays.length) return null;

  /**
   * Filter hourly entries for a given date string "YYYY-MM-DD"
   */
  const getHoursForDay = (dateStr) =>
    hourlyAll.filter((h) => h.time && h.time.startsWith(dateStr));

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">📅</span>
        <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100">7-Day Forecast</h2>
      </div>

      {/* Horizontal scrollable strip */}
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
        {dailyDays.map((day, index) => {
          const date    = parseISO(day.date);
          const isToday_ = isToday(date);
          const isExpanded = expandedDay === index;
          const emoji   = conditionEmoji(day.condition_code);
          const maxTemp = day.temp_max != null ? Math.round(day.temp_max) : '—';
          const minTemp = day.temp_min != null ? Math.round(day.temp_min) : '—';
          const rainPct = day.precipitation_probability ?? 0;

          return (
            <motion.button
              key={day.date}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              onClick={() => setExpandedDay(isExpanded ? null : index)}
              className={`shrink-0 w-24 rounded-2xl border p-3 text-center cursor-pointer transition-all duration-200 ${
                isToday_
                  ? 'bg-green-700 dark:bg-green-800 border-green-600 text-white shadow-lg ring-2 ring-green-400'
                  : isExpanded
                  ? 'bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-600 shadow-md'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-green-300 dark:hover:border-green-600 hover:shadow-md'
              }`}
            >
              <div className={`text-xs font-semibold mb-1 ${isToday_ ? 'text-green-100' : 'text-slate-500 dark:text-slate-400'}`}>
                {isToday_ ? 'Today' : format(date, 'EEE')}
              </div>
              <div className="text-2xl my-1">{emoji}</div>
              <div className={`text-sm font-bold tabular-nums ${isToday_ ? 'text-white' : 'text-slate-800 dark:text-slate-100'}`}>
                {maxTemp}°
              </div>
              <div className={`text-xs tabular-nums ${isToday_ ? 'text-green-200' : 'text-slate-400 dark:text-slate-500'}`}>
                {minTemp}°
              </div>
              {rainPct > 0 && (
                <div className={`text-xs mt-1 ${isToday_ ? 'text-blue-200' : 'text-blue-500 dark:text-blue-400'}`}>
                  💧 {rainPct}%
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Expanded hourly for selected day */}
      {expandedDay !== null && dailyDays[expandedDay] && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-3 overflow-hidden"
        >
          <HourlyChart
            hourlyData={getHoursForDay(dailyDays[expandedDay].date)}
            label={format(parseISO(dailyDays[expandedDay].date), 'EEEE, d MMM')}
          />
        </motion.div>
      )}
    </section>
  );
}

export default ForecastCard;
