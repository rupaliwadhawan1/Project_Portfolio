import { useQuery } from '@tanstack/react-query';
import { fetchTrafficDensity } from '../services/trafficService';
import { useLocation } from './useLocation';

export function useTrafficData() {
  const { latitude, longitude } = useLocation();

  return useQuery({
    queryKey: ['traffic', latitude, longitude],
    queryFn: () => {
      if (!latitude || !longitude) {
        return { density: 0, change: 0, timestamp: new Date().toISOString() };
      }
      return fetchTrafficDensity(latitude, longitude);
    },
    enabled: !!latitude && !!longitude,
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    staleTime: 4 * 60 * 1000, // Consider data stale after 4 minutes
  });
}