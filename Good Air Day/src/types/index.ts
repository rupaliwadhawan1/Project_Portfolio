export interface TrafficData {
  latitude: number;
  longitude: number;
  density: number;
  speed: number;
  timestamp: string;
}

export interface AirQualityData {
  aqi: number;
  pollutants: {
    pm25: number;
    pm10: number;
    no2: number;
    o3: number;
    co: number;
  };
  location: {
    latitude: number;
    longitude: number;
  };
  timestamp: string;
}

export interface EmissionData {
  value: number;
  vehicleType: string;
  location: {
    latitude: number;
    longitude: number;
  };
  timestamp: string;
}

export interface Route {
  id: string;
  points: Array<[number, number]>;
  duration: number;
  distance: number;
  emissions: number;
  congestionLevel: 'low' | 'medium' | 'high';
}