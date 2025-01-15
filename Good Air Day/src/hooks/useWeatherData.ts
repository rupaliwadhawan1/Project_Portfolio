import { useQuery } from '@tanstack/react-query';
import { fetchWeatherData } from '../services/weatherService';
import { useLocation } from './useLocation';

export function useWeatherData() {
  const { latitude, longitude } = useLocation();

  return useQuery({
    queryKey: ['weather', latitude, longitude],
    queryFn: () => {
      if (!latitude || !longitude) {
        throw new Error('Location not available');
      }
      return fetchWeatherData(latitude, longitude);
    },
    enabled: !!latitude && !!longitude,
    refetchInterval: 15 * 60 * 1000, // Refresh every 15 minutes
    staleTime: 10 * 60 * 1000, // Consider data stale after 10 minutes
  });
}