import { format } from 'date-fns';

export interface RouteData {
  activeRoutes: number;
  change: number;
  timestamp: string;
  segments?: Array<{
    id: string;
    currentSpeed: number;
    freeFlowSpeed: number;
    congestionLevel: 'low' | 'medium' | 'high';
    coordinates: [number, number][];
  }>;
}

let lastRouteCount = 0;

function getCongestionLevel(currentSpeed: number, freeFlowSpeed: number): 'low' | 'medium' | 'high' {
  const ratio = currentSpeed / freeFlowSpeed;
  if (ratio > 0.7) return 'low';
  if (ratio > 0.4) return 'medium';
  return 'high';
}

export async function fetchActiveRoutes(latitude: number, longitude: number): Promise<RouteData> {
  if (!latitude || !longitude) {
    throw new Error('Location coordinates required');
  }

  // Updated TomTom Traffic Incidents API endpoint
  const url = new URL('https://api.tomtom.com/traffic/services/5/incidentDetails');
  url.searchParams.append('key', '7AQ3YiR2BILGaoptzJ3vC7129K8wdogJ');
  url.searchParams.append('bbox', `${longitude - 0.1},${latitude - 0.1},${longitude + 0.1},${latitude + 0.1}`);
  url.searchParams.append('fields', '{incidents{type,geometry{type,coordinates},properties{iconCategory,magnitudeOfDelay,events{description,code},startTime,endTime,from,to,length,delay,roadNumbers,timeValidity}}}');
  url.searchParams.append('language', 'en-GB');
  url.searchParams.append('categoryFilter', '0,1,2,3,4,5,6,7,8,9,10,11,14');
  url.searchParams.append('timeValidityFilter', 'present');

  try {
    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Failed to fetch traffic data: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.incidents || !Array.isArray(data.incidents)) {
      throw new Error('No traffic incident data available');
    }

    // Filter active incidents and map them to segments
    const activeSegments = data.incidents
      .filter(incident => incident.properties && incident.geometry)
      .map(incident => ({
        id: incident.id || String(Math.random()),
        currentSpeed: incident.properties.magnitudeOfDelay ? 
          Math.max(10, 50 - incident.properties.magnitudeOfDelay) : 30,
        freeFlowSpeed: 50, // Default free flow speed
        congestionLevel: incident.properties.magnitudeOfDelay > 10 ? 'high' : 
          incident.properties.magnitudeOfDelay > 5 ? 'medium' : 'low',
        coordinates: incident.geometry.coordinates
      }));

    const activeRoutes = activeSegments.length;

    // Calculate change
    const change = lastRouteCount === 0 ? 0 : ((activeRoutes - lastRouteCount) / lastRouteCount) * 100;
    lastRouteCount = activeRoutes;

    return {
      activeRoutes,
      change,
      timestamp: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
      segments: activeSegments
    };
  } catch (error) {
    console.error('Error fetching route data:', error);
    throw error;
  }
}