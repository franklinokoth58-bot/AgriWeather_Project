import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { parseISO, format } from 'date-fns';

/**
 * Normalise a flat hourly array from the WeatherAI API.
 * Actual shape: [{ time: "2026-06-05T14:00", temperature, wind_speed,
 *                  precipitation_probability, condition_code, humidity,
 *                  feels_like, uv_index, wind_gust, icon_path }]
 *
 * @param {Array} hours
 * @returns {{ time, temp, rain }[]}
 */
const normaliseHours = (hours) => {
  if (!Array.isArray(hours) || !hours.length) return [];
  return hours.map((h) => {
    // time is "YYYY-MM-DDTHH:mm"
    let timeLabel = '';
    try {
      timeLabel = format(parseISO(h.time), 'HH:mm');
    } catch {
      timeLabel = h.time || '';
    }
    return {
      time: timeLabel,
      temp: typeof h.temperature === 'number' ? Math.round(h.temperature) : null,
      rain: typeof h.precipitation_probability === 'number'
        ? h.precipitation_probability
        : 0,
    };
  });
};

/**
 * Custom tooltip.
 */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-1.5" style={{ color: entry.color }}>
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: entry.color }} />
          <span className="text-slate-600 dark:text-slate-300">
            {entry.dataKey === 'temp'
              ? `${entry.value}°C`
              : `${entry.value}% rain`}
          </span>
        </div>
      ))}
    </div>
  );
};

/**
 * HourlyChart — temperature line + precipitation probability bar over 24 h.
 *
 * @prop {Array | null} hourlyData - Flat array of hourly objects
 * @prop {string} [label] - Optional heading override
 */
function HourlyChart({ hourlyData, label }) {
  const data = normaliseHours(hourlyData);

  if (!data.length) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 text-center text-slate-400 text-sm">
        Hourly data not available
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-green-100 dark:border-slate-700 shadow-md p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">🕐</span>
        <h3 className="font-semibold text-slate-800 dark:text-slate-100">
          {label || 'Hourly Breakdown'}
        </h3>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={data} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.4} />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
            interval={2}
          />
          <YAxis
            yAxisId="temp"
            orientation="left"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}°`}
          />
          <YAxis
            yAxisId="rain"
            orientation="right"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}%`}
            domain={[0, 100]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            yAxisId="rain"
            dataKey="rain"
            fill="#3b82f6"
            opacity={0.35}
            radius={[3, 3, 0, 0]}
            barSize={8}
          />
          <Line
            yAxisId="temp"
            type="monotone"
            dataKey="temp"
            stroke="#10b981"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 mt-2 text-xs text-slate-400 justify-center">
        <span className="flex items-center gap-1">
          <span className="w-4 h-0.5 bg-emerald-500 inline-block rounded" />
          Temperature (°C)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-blue-400 opacity-40 inline-block rounded-sm" />
          Rain chance (%)
        </span>
      </div>
    </div>
  );
}

export default HourlyChart;
