import { format } from 'date-fns';

export interface TrafficData {
  density: number;
  change: number;
  timestamp: string;
  flowData?: {
    currentSpeed: number;
    freeFlowSpeed: number;
    confidence: number;
  };
}

let lastDensity = 0;
const JAM_DENSITY = 200; // vehicles/km

function calculateTrafficDensity(currentSpeed: number, freeFlowSpeed: number): number {
  // Validate input values
  if (typeof currentSpeed !== 'number' || typeof freeFlowSpeed !== 'number') {
    throw new Error('Speed values must be numbers');
  }

  if (currentSpeed < 0 || freeFlowSpeed <= 0) {
    throw new Error('Speed values must be positive');
  }

  // Calculate traffic density using the formula
  const density = JAM_DENSITY * (1 - currentSpeed / freeFlowSpeed);
  return Math.max(0, Math.min(100, Math.round(density))); // Ensure density is between 0 and 100
}

export async function fetchTrafficDensity(latitude: number, longitude: number): Promise<TrafficData> {
  if (!latitude || !longitude) {
    return {
      density: 0,
      change: 0,
      timestamp: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
      flowData: {
        currentSpeed: 0,
        freeFlowSpeed: 0,
        confidence: 0
      }
    };
  }

  try {
    const url = new URL('https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json');
    url.searchParams.append('key', '7AQ3YiR2BILGaoptzJ3vC7129K8wdogJ');
    url.searchParams.append('point', `${latitude},${longitude}`);
    url.searchParams.append('unit', 'KMPH');

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.flowSegmentData) {
      throw new Error('No traffic data available');
    }

    const { currentSpeed = 0, freeFlowSpeed = 0, confidence = 0 } = data.flowSegmentData;

    // Calculate traffic density
    const density = calculateTrafficDensity(currentSpeed, freeFlowSpeed);

    // Calculate change from last measurement
    const change = lastDensity === 0 ? 0 : ((density - lastDensity) / lastDensity) * 100;
    lastDensity = density;

    return {
      density,
      change,
      timestamp: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
      flowData: {
        currentSpeed,
        freeFlowSpeed,
        confidence
      }
    };
  } catch (error) {
    console.error('Error fetching traffic data:', error);
    // Return default values instead of throwing
    return {
      density: 0,
      change: 0,
      timestamp: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
      flowData: {
        currentSpeed: 0,
        freeFlowSpeed: 0,
        confidence: 0
      }
    };
  }
}