/**
 * useTrees — TanStack Query hooks for tree analysis endpoints.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { analyzeTreeImage, fetchTreesQuota } from '../api/treesApi';

/**
 * Hook — fetch remaining tree analysis quota.
 */
export const useTreesQuota = () => {
  return useQuery({
    queryKey: ['trees-quota'],
    queryFn: fetchTreesQuota,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      const status = error?.response?.status;
      if (status === 401 || status === 403) return false;
      return failureCount < 2;
    },
  });
};

/**
 * Hook — mutation for submitting a tree analysis image.
 * Invalidates quota on success.
 *
 * @param {{ onSuccess?: Function, onError?: Function }} [options]
 */
export const useTreeAnalysis = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: analyzeTreeImage,
    onSuccess: (data) => {
      // Invalidate quota so the remaining count updates
      queryClient.invalidateQueries({ queryKey: ['trees-quota'] });
      options.onSuccess?.(data);
    },
    onError: (error) => {
      options.onError?.(error);
    },
    retry: false,
  });
};
