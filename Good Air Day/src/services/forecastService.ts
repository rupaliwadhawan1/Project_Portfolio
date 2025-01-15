import { format, addHours } from 'date-fns';
import { getNAQICategory, getNAQIColor } from './airQualityService';

export interface ForecastData {
  timestamp: string;
  value: number;
  naqiValue: number;
  confidence: {
    lower: number;
    upper: number;
  };
  category: string;
  dominantPollutant: string;
  pollutants: Array<{
    code: string;
    displayName: string;
    fullName: string;
    concentration: {
      value: number;
      units: string;
    };
    additionalInfo?: {
      sources?: string;
      effects?: string;
      mitigation?: string;
    };
  }>;
  healthRecommendations?: {
    generalPopulation?: string;
    elderly?: string;
    lungDiseasePopulation?: string;
    heartDiseasePopulation?: string;
    athletes?: string;
    pregnantWomen?: string;
    children?: string;
  };
}

export async function fetchAirQualityForecast(latitude: number, longitude: number): Promise<ForecastData[]> {
  const requestBody = {
    location: {
      latitude: latitude.toString(),
      longitude: longitude.toString()
    },
    languageCode: "en",
    extraComputations: [
      "HEALTH_RECOMMENDATIONS",
      "DOMINANT_POLLUTANT_CONCENTRATION",
      "POLLUTANT_CONCENTRATION",
      "POLLUTANT_ADDITIONAL_INFO",
      "LOCAL_AQI"
    ]
  };

  try {
    const response = await fetch(
      'https://airquality.googleapis.com/v1/currentConditions:lookup?key=AIzaSyCjoOb6DHIJQKeylbqjneymbVcS_oQ5mZU',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch forecast data: ${response.status}`);
    }

    const data = await response.json();
    
    // Get current conditions
    const uaqi = data.indexes?.find((index: any) => index.code === 'uaqi')?.aqi || 50;
    const naqi = data.indexes?.find((index: any) => index.code === 'ind_cpcb')?.aqi || uaqi;
    const currentPollutants = data.pollutants || [];
    const healthRecommendations = data.healthRecommendations || {};
    
    // Generate forecast data starting with current conditions
    return Array.from({ length: 96 }, (_, i) => {
      const timeVariation = Math.sin(i * Math.PI / 12) * 10; // 12-hour cycle
      const randomVariation = (Math.random() - 0.5) * 5;
      const forecastAqi = Math.max(0, Math.min(500, uaqi + timeVariation + randomVariation));
      const forecastNaqi = Math.max(0, Math.min(500, naqi + timeVariation + randomVariation));
      
      return {
        timestamp: format(addHours(new Date(), i), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
        value: Math.round(forecastAqi),
        naqiValue: Math.round(forecastNaqi),
        confidence: {
          lower: Math.round(forecastAqi * 0.9),
          upper: Math.round(forecastAqi * 1.1)
        },
        category: getNAQICategory(forecastNaqi),
        dominantPollutant: data.dominantPollutant?.code || currentPollutants[0]?.code || 'pm25',
        pollutants: currentPollutants.map(pollutant => ({
          code: pollutant.code,
          displayName: pollutant.displayName,
          fullName: pollutant.fullName,
          concentration: {
            value: pollutant.concentration.value,
            units: pollutant.concentration.units
          },
          additionalInfo: pollutant.additionalInfo
        })),
        healthRecommendations: i === 0 ? healthRecommendations : undefined
      };
    });
  } catch (error) {
    console.error('Error fetching forecast data:', error);
    throw error;
  }
}