/**
 * WeatherAI API — trees / forestry endpoints
 */
import axios from 'axios';
import { parseApiError } from './weatherApi';

const BASE_URL = 'https://api.weather-ai.co';

const getHeaders = () => ({
  Authorization: `Bearer ${import.meta.env.VITE_WEATHER_API_KEY}`,
});

/**
 * POST /v1/trees/analyze — analyze farm aerial/satellite image.
 * @param {{
 *   image: File,
 *   farmerId?: string,
 *   county?: string,
 *   landAcres?: number,
 *   location?: string,
 *   notes?: string,
 *   onUploadProgress?: (progressEvent: ProgressEvent) => void
 * }} params
 */
export const analyzeTreeImage = async ({
  image,
  farmerId,
  county,
  landAcres,
  location,
  notes,
  onUploadProgress,
}) => {
  const formData = new FormData();
  formData.append('image', image);
  if (farmerId) formData.append('farmerId', farmerId);
  if (county) formData.append('county', county);
  if (landAcres !== undefined && landAcres !== '') formData.append('landAcres', String(landAcres));
  if (location) formData.append('location', location);
  if (notes) formData.append('notes', notes);

  const response = await axios.post(`${BASE_URL}/v1/trees/analyze`, formData, {
    headers: {
      ...getHeaders(),
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
  });

  return response.data;
};

/**
 * GET /v1/trees/quota — fetch remaining tree analysis quota.
 */
export const fetchTreesQuota = async () => {
  const response = await axios.get(`${BASE_URL}/v1/trees/quota`, {
    headers: getHeaders(),
  });
  return response.data;
};

export { parseApiError };
