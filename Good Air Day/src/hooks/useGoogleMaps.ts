import { useState, useEffect } from 'react';

const GOOGLE_MAPS_API_KEY = 'AIzaSyCjoOb6DHIJQKeylbqjneymbVcS_oQ5mZU';
const SCRIPT_ID = 'google-maps-script';

// Track script loading state globally
let isLoading = false;
let isLoaded = false;

export function useGoogleMaps() {
  const [scriptLoaded, setScriptLoaded] = useState(isLoaded);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If already loaded, return immediately
    if (isLoaded && window.google?.maps) {
      setScriptLoaded(true);
      return;
    }

    // Check for existing script tag
    const existingScript = document.getElementById(SCRIPT_ID);
    if (existingScript) {
      isLoading = true;
      const checkLoaded = setInterval(() => {
        if (window.google?.maps) {
          isLoaded = true;
          setScriptLoaded(true);
          clearInterval(checkLoaded);
        }
      }, 100);

      return () => clearInterval(checkLoaded);
    }

    // If currently loading in another component, wait for it
    if (isLoading) {
      const checkLoaded = setInterval(() => {
        if (window.google?.maps) {
          isLoaded = true;
          setScriptLoaded(true);
          clearInterval(checkLoaded);
        }
      }, 100);

      return () => clearInterval(checkLoaded);
    }

    // Start loading
    isLoading = true;

    // Create script element
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&v=weekly`;
    script.async = true;
    script.defer = true;

    // Handle script load
    script.onload = () => {
      isLoaded = true;
      setScriptLoaded(true);
    };

    script.onerror = () => {
      setError('Failed to load Google Maps script');
      isLoading = false;
      // Remove the script tag on error
      script.remove();
    };

    document.head.appendChild(script);

    return () => {
      isLoading = false;
    };
  }, []);

  return { isLoaded: scriptLoaded, error };
}

declare global {
  interface Window {
    google: {
      maps: {
        Map: any;
        TrafficLayer: any;
        marker: {
          AdvancedMarkerElement: any;
        };
      };
    };
  }
}