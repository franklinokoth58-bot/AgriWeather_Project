/**
 * Derives actionable crop advisory messages from weather data.
 *
 * @typedef {{ level: 'good' | 'caution' | 'warning', icon: string, title: string, message: string }} Advisory
 */

/**
 * Generate advisories from normalised weather conditions.
 *
 * @param {{
 *   rain_mm?: number,
 *   temp_c?: number,
 *   wind_kph?: number,
 *   humidity?: number,
 *   uv_index?: number,
 * }} conditions
 * @returns {Advisory[]}
 */
export const getCropAdvisories = (conditions) => {
  const {
    rain_mm   = 0,
    temp_c    = 25,
    wind_kph  = 0,
    humidity  = 50,
    uv_index  = 3,
  } = conditions || {};

  const advisories = [];

  if (rain_mm > 5) {
    advisories.push({
      level: 'good',
      icon: '🌧️',
      title: 'Rain Forecast',
      message: 'Good for planting. Delay pesticide application — rain will wash off chemicals.',
    });
  }

  if (temp_c > 32) {
    advisories.push({
      level: 'warning',
      icon: '🌡️',
      title: 'Heat Stress Risk',
      message: 'High heat stress. Water crops in the early morning or evening to reduce evaporation.',
    });
  }

  if (wind_kph > 30) {
    advisories.push({
      level: 'warning',
      icon: '💨',
      title: 'High Wind Alert',
      message: 'Avoid spraying. High wind drift risk — chemicals may miss target crops.',
    });
  }

  if (humidity > 80) {
    advisories.push({
      level: 'caution',
      icon: '💧',
      title: 'High Humidity',
      message: 'Monitor for fungal disease and blight. Improve air circulation where possible.',
    });
  }

  if (uv_index > 7) {
    advisories.push({
      level: 'caution',
      icon: '☀️',
      title: 'High UV Index',
      message: 'Harvest leafy vegetables before noon. Protect farmworkers with sunscreen and hats.',
    });
  }

  if (
    rain_mm <= 5 &&
    temp_c >= 18 && temp_c <= 28 &&
    wind_kph <= 30 &&
    humidity <= 80
  ) {
    advisories.push({
      level: 'good',
      icon: '✅',
      title: 'Favorable Conditions',
      message: 'Ideal weather for field operations. Good day for planting, weeding, and spraying.',
    });
  }

  return advisories;
};

/**
 * Derive advisories from a raw WeatherAI API response.
 *
 * Handles the actual field names returned by /v1/weather-geo and /v1/weather:
 *   current.temperature, current.wind_speed, current.humidity, current.uv_index
 *   daily[0].precipitation_sum (mm for today)
 *
 * @param {object} weatherData - Full API response
 * @returns {Advisory[]}
 */
export const getAdvisoriesFromWeatherData = (weatherData) => {
  if (!weatherData) return [];

  const current = weatherData.current || {};
  const today   = weatherData.daily?.[0]  || {};

  const conditions = {
    // precipitation_sum is daily mm total; precipitation_probability is 0-100 %
    rain_mm:  today.precipitation_sum         ?? 0,
    temp_c:   current.temperature             ?? current.temp_c ?? 25,
    wind_kph: current.wind_speed              ?? current.wind_kph ?? 0,
    humidity: current.humidity                ?? 50,
    uv_index: current.uv_index               ?? current.uv ?? 3,
  };

  return getCropAdvisories(conditions);
};
