interface LocationData {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
  error?: string;
}

export async function getCurrentLocation(): Promise<LocationData> {
  try {
    // Try browser geolocation first
    if ('geolocation' in navigator) {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false, // Set to false for faster response
          timeout: 10000, // Increased timeout to 10 seconds
          maximumAge: 300000 // Cache position for 5 minutes
        });
      });

      // After getting coordinates, fetch city and country
      try {
        const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`);
        const data = await response.json();
        
        return {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          city: data.city || data.locality || 'Unknown City',
          country: data.countryName || 'Unknown Country'
        };
      } catch (geocodeError) {
        // Return coordinates even if reverse geocoding fails
        return {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          city: 'Unknown City',
          country: 'Unknown Country'
        };
      }
    }

    // Fallback to IP-based geolocation immediately if browser geolocation is not available
    return await getLocationFromIP();
  } catch (error) {
    console.warn('Browser geolocation failed, falling back to IP geolocation');
    
    // Attempt IP-based geolocation as fallback
    try {
      return await getLocationFromIP();
    } catch (ipError) {
      // Return default location for Delhi as final fallback
      return {
        latitude: 28.6139,
        longitude: 77.2090,
        city: 'New Delhi',
        country: 'India'
      };
    }
  }
}

async function getLocationFromIP(): Promise<LocationData> {
  const response = await fetch('https://api.ipapi.is/');
  if (!response.ok) {
    throw new Error('Failed to fetch location data');
  }

  const data = await response.json();
  return {
    latitude: data.latitude,
    longitude: data.longitude,
    city: data.city || 'Unknown City',
    country: data.country_name || 'Unknown Country'
  };
}