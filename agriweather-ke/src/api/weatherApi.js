/**
 * WeatherAI API — weather endpoints
 * Base URL: https://api.weather-ai.co
 */
import axios from 'axios';

const BASE_URL = 'https://api.weather-ai.co';

const getHeaders = () => ({
  Authorization: `Bearer ${import.meta.env.VITE_WEATHER_API_KEY}`,
});

/** Shared axios instance */
const api = axios.create({ baseURL: BASE_URL });

/**
 * Extract rate-limit metadata from response headers.
 * @param {import('axios').AxiosResponse} response
 * @returns {{ limit: string, remaining: string, reset: string }}
 */
export const extractRateLimits = (response) => ({
  limit: response.headers['x-ratelimit-limit'] || null,
  remaining: response.headers['x-ratelimit-remaining'] || null,
  reset: response.headers['x-ratelimit-reset'] || null,
});

/**
 * GET /v1/weather-geo — auto-detect location via IP, return full weather.
 * @param {{ days?: number, lang?: string }} [options]
 */
export const fetchWeatherByGeo = async ({ days = 7, lang = 'en' } = {}) => {
  const response = await api.get('/v1/weather-geo', {
    headers: getHeaders(),
    params: { ip: 'auto', ai: true, days, units: 'metric', lang },
  });
  return {
    data: response.data,
    geo: {
      country: response.headers['x-country'] || '',
      region: response.headers['x-region'] || '',
      city: response.headers['x-city'] || '',
    },
    rateLimits: extractRateLimits(response),
  };
};

/**
 * GET /v1/weather — full forecast by coordinates or city name.
 * @param {{ lat?: number | null, lon?: number | null, q?: string, days?: number, lang?: string }} params
 */
export const fetchWeatherByCoords = async ({ lat, lon, q, days = 7, lang = 'en' }) => {
  const params = { days, ai: true, units: 'metric', lang };
  if (q) {
    params.q = q;
  } else {
    params.lat = lat;
    params.lon = lon;
  }
  const response = await api.get('/v1/weather', {
    headers: getHeaders(),
    params,
  });
  return {
    data: response.data,
    rateLimits: extractRateLimits(response),
  };
};

/**
 * GET /v1/current — present-moment conditions only.
 * @param {{ lat: number, lon: number }} params
 */
export const fetchCurrentConditions = async ({ lat, lon }) => {
  const response = await api.get('/v1/current', {
    headers: getHeaders(),
    params: { lat, lon, ai: true, units: 'metric' },
  });
  return {
    data: response.data,
    rateLimits: extractRateLimits(response),
  };
};

/**
 * GET /v1/daily — 7-day daily forecast.
 * @param {{ lat: number, lon: number, days?: number }} params
 */
export const fetchDailyForecast = async ({ lat, lon, days = 7 }) => {
  const response = await api.get('/v1/daily', {
    headers: getHeaders(),
    params: { lat, lon, days, ai: true, units: 'metric' },
  });
  return {
    data: response.data,
    rateLimits: extractRateLimits(response),
  };
};

/**
 * GET /v1/hourly — hour-by-hour for today.
 * @param {{ lat: number, lon: number }} params
 */
export const fetchHourlyForecast = async ({ lat, lon }) => {
  const response = await api.get('/v1/hourly', {
    headers: getHeaders(),
    params: { lat, lon, days: 1, units: 'metric' },
  });
  return {
    data: response.data,
    rateLimits: extractRateLimits(response),
  };
};

/**
 * GET /v1/usage — plan usage stats.
 */
export const fetchUsage = async () => {
  const response = await api.get('/v1/usage', {
    headers: getHeaders(),
  });
  return response.data;
};

/**
 * Map HTTP error codes to user-friendly messages.
 * @param {unknown} error
 * @returns {{ message: string, code: number | null, resetDate: string | null }}
 */
export const parseApiError = (error) => {
  if (!axios.isAxiosError(error)) {
    return { message: 'An unexpected error occurred.', code: null, resetDate: null };
  }
  const status = error.response?.status;
  const resetDate = error.response?.headers?.['x-ratelimit-reset'] || null;

  switch (status) {
    case 401:
      return { message: 'Invalid or missing API key. Check your .env.local file.', code: 401, resetDate };
    case 403:
      return { message: 'This feature is not available on your current plan.', code: 403, resetDate };
    case 429:
      return {
        message: `Monthly quota exceeded.${resetDate ? ` Resets on ${new Date(resetDate * 1000).toLocaleDateString()}.` : ''}`,
        code: 429,
        resetDate,
      };
    case 400:
      return { message: 'Bad request — please check your search parameters.', code: 400, resetDate };
    case 500:
    case 503:
      return { message: 'Server error. Please try again in a moment.', code: status, resetDate };
    default:
      return { message: error.message || 'Something went wrong.', code: status || null, resetDate };
  }
};
