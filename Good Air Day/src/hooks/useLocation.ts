import { useState, useEffect } from 'react';
import { getCurrentLocation } from '../services/locationService';

interface UseLocationResult {
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  country: string | null;
  error: string | null;
  loading: boolean;
}

export function useLocation() {
  const [location, setLocation] = useState<UseLocationResult>({
    latitude: null,
    longitude: null,
    city: null,
    country: null,
    error: null,
    loading: true
  });

  useEffect(() => {
    let mounted = true;

    async function detectLocation() {
      try {
        const locationData = await getCurrentLocation();
        
        if (mounted) {
          setLocation({
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            city: locationData.city || null,
            country: locationData.country || null,
            error: null,
            loading: false
          });
        }
      } catch (error) {
        if (mounted) {
          setLocation(prev => ({
            ...prev,
            error: 'Failed to detect location',
            loading: false
          }));
        }
      }
    }

    detectLocation();

    return () => {
      mounted = false;
    };
  }, []);

  return location;
}