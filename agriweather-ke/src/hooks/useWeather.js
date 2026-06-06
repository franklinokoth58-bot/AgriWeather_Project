/**
 * useWeather — TanStack Query hooks for all weather endpoints.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchWeatherByGeo,
  fetchWeatherByCoords,
  fetchCurrentConditions,
  fetchHourlyForecast,
  fetchUsage,
} from '../api/weatherApi';

const TEN_MINUTES = 10 * 60 * 1000;

/**
 * Primary hook — loads weather by auto-detected IP location.
 * Refreshes every 10 minutes.
 *
 * @param {{ lang?: string }} [options]
 */
export const useGeoWeather = (options = {}) => {
  const { lang = 'en' } = options;
  return useQuery({
    queryKey: ['weather-geo', lang],
    queryFn: () => fetchWeatherByGeo({ lang }),
    staleTime: TEN_MINUTES,
    refetchInterval: TEN_MINUTES,
    retry: (failureCount, error) => {
      const status = error?.response?.status;
      if (status === 401 || status === 403 || status === 429) return false;
      return failureCount < 3;
    },
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
  });
};

/**
 * Hook — loads weather by explicit coordinates or city name (manual search).
 *
 * @param {{ lat: number | string | null, lon: number | null, lang?: string }} params
 *  - If lat is a string, it's treated as a city name and passed as the `q` param.
 */
export const useCoordWeather = ({ lat, lon, lang = 'en' }) => {
  // Determine if this is a city name query
  const isCityQuery = typeof lat === 'string';

  return useQuery({
    queryKey: ['weather-coords', lat, lon, lang],
    queryFn: async () => {
      if (isCityQuery) {
        // Pass city name as a query parameter
        return fetchWeatherByCoords({ q: lat, lat: null, lon: null, lang });
      }
      return fetchWeatherByCoords({ lat, lon, lang });
    },
    enabled: lat !== null && (isCityQuery || lon !== null),
    staleTime: TEN_MINUTES,
    refetchInterval: TEN_MINUTES,
    retry: (failureCount, error) => {
      const status = error?.response?.status;
      if (status === 401 || status === 403 || status === 429) return false;
      return failureCount < 3;
    },
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
  });
};

/**
 * Hook — refreshes only current conditions without re-fetching full forecast.
 *
 * @param {{ lat: number | null, lon: number | null }} params
 */
export const useCurrentConditions = ({ lat, lon }) => {
  return useQuery({
    queryKey: ['current', lat, lon],
    queryFn: () => fetchCurrentConditions({ lat, lon }),
    enabled: lat !== null && lon !== null,
    staleTime: TEN_MINUTES,
    refetchInterval: TEN_MINUTES,
  });
};

/**
 * Hook — hourly forecast for today.
 *
 * @param {{ lat: number | null, lon: number | null }} params
 */
export const useHourlyForecast = ({ lat, lon }) => {
  return useQuery({
    queryKey: ['hourly', lat, lon],
    queryFn: () => fetchHourlyForecast({ lat, lon }),
    enabled: lat !== null && lon !== null,
    staleTime: TEN_MINUTES,
  });
};

/**
 * Hook — API usage stats.
 */
export const useUsage = () => {
  return useQuery({
    queryKey: ['usage'],
    queryFn: fetchUsage,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
};

/**
 * Returns a function to manually invalidate weather cache.
 */
export const useRefreshWeather = () => {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['weather-geo'] });
    queryClient.invalidateQueries({ queryKey: ['weather-coords'] });
    queryClient.invalidateQueries({ queryKey: ['current'] });
    queryClient.invalidateQueries({ queryKey: ['hourly'] });
  };
};
