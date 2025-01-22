import { useQuery } from '@tanstack/react-query';
import { fetchAirQualityData, type AirQualityData } from '../services/airQualityService';
import { useAirQualityStore } from '../store/airQualityStore';

// Add proper error handling and retry logic
const RETRY_COUNT = 3;
const RETRY_DELAY = 2000;

export function useAirQualityData(latitude?: number, longitude?: number) {
  const { settings } = useAirQualityStore();
  const addData = useAirQualityStore((state) => state.addData);

  return useQuery({
    queryKey: ['airQuality', latitude, longitude],
    queryFn: async () => {
      if (!latitude || !longitude) {
        throw new Error('Location coordinates are required');
      }

      try {
        const data = await fetchAirQualityData(latitude, longitude);
        return data;
      } catch (error) {
        console.error('Error fetching air quality data:', error);
        throw error;
      }
    },
    refetchInterval: settings.refreshInterval,
    onSuccess: (data) => {
      addData(data);
    },
    retry: RETRY_COUNT,
    retryDelay: (attemptIndex) => Math.min(RETRY_DELAY * Math.pow(2, attemptIndex), 10000),
    staleTime: 60000,
    gcTime: 300000,
    useErrorBoundary: false
  });
}