import { useQuery } from '@tanstack/react-query';
import { calculateEmissions } from '../services/emissionsService';
import { useTrafficData } from './useTrafficData';

export function useEmissionsData() {
  const { data: trafficData } = useTrafficData();

  return useQuery({
    queryKey: ['emissions', trafficData?.density],
    queryFn: () => {
      if (!trafficData) {
        return [];
      }
      return calculateEmissions(trafficData.density);
    },
    enabled: !!trafficData,
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    staleTime: 4 * 60 * 1000, // Consider data stale after 4 minutes
  });
}