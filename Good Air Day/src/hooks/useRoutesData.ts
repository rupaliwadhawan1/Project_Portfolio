import { useQuery } from '@tanstack/react-query';
import { fetchActiveRoutes } from '../services/routesService';
import { useLocation } from './useLocation';

export function useRoutesData() {
  const { latitude, longitude } = useLocation();

  return useQuery({
    queryKey: ['routes', latitude, longitude],
    queryFn: () => {
      if (!latitude || !longitude) {
        throw new Error('Location not available');
      }
      return fetchActiveRoutes(latitude, longitude);
    },
    enabled: !!latitude && !!longitude,
    refetchInterval: 2 * 60 * 1000, // Refresh every 2 minutes
    staleTime: 1 * 60 * 1000, // Consider data stale after 1 minute
  });
}