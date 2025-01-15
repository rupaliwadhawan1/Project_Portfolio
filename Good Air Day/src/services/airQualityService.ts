import { format } from 'date-fns';

export interface AirQualityData {
  timestamp: string;
  naqiValue: number;
  category: string;
  pollutants: Array<{
    name: string;
    code: string;
    fullName: string;
    additionalInfo: {
      sources: string;
    };
  }>;
  healthRecommendations?: Record<string, string>;
  station?: string;
  change?: number;
}

let lastNAQIValue = 0;

export function getNAQICategory(naqi: number): string {
  if (naqi <= 50) return 'Good';
  if (naqi <= 100) return 'Satisfactory';
  if (naqi <= 200) return 'Moderate';
  if (naqi <= 300) return 'Poor';
  if (naqi <= 400) return 'Very Poor';
  return 'Severe';
}

export function getNAQIColor(naqi: number): string {
  if (naqi <= 50) return '#009933';
  if (naqi <= 100) return '#58ff09';
  if (naqi <= 200) return '#ffff00';
  if (naqi <= 300) return '#ffa500';
  if (naqi <= 400) return '#ff0000';
  return '#990000';
}

export async function fetchAirQualityData(
  latitude?: number,
  longitude?: number
): Promise<AirQualityData> {
  try {
    if (!latitude || !longitude) {
      throw new Error('Location coordinates required');
    }

    const response = await fetch(
      'https://airquality.googleapis.com/v1/currentConditions:lookup',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': 'AIzaSyCjoOb6DHIJQKeylbqjneymbVcS_oQ5mZU'
        },
        body: JSON.stringify({
          location: {
            latitude,
            longitude
          },
          extraComputations: [
            'HEALTH_RECOMMENDATIONS',
            'DOMINANT_POLLUTANT_CONCENTRATION',
            'POLLUTANT_CONCENTRATION',
            'LOCAL_AQI',
            'POLLUTANT_ADDITIONAL_INFO'
          ],
          languageCode: 'en'
        })
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch air quality data');
    }

    const data = await response.json();

    // Find the NAQI (IN) index
    const naqiIndex = data.indexes?.find((index: any) => index.code === 'ind_cpcb');
    if (!naqiIndex) {
      throw new Error('NAQI data not available');
    }

    const naqi = naqiIndex.aqi;
    const change = lastNAQIValue === 0 ? 0 : ((naqi - lastNAQIValue) / lastNAQIValue) * 100;
    lastNAQIValue = naqi;

    // Extract only the sources from pollutants
    const pollutants = data.pollutants.map((pollutant: any) => ({
      name: pollutant.code,
      code: pollutant.code,
      fullName: pollutant.fullName,
      additionalInfo: {
        sources: pollutant.additionalInfo?.sources || 'Information not available'
      }
    }));

    return {
      timestamp: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
      naqiValue: naqi,
      category: naqiIndex.category || getNAQICategory(naqi),
      pollutants,
      healthRecommendations: data.healthRecommendations || {},
      station: 'Google Air Quality',
      change
    };
  } catch (error) {
    throw new Error('Failed to fetch air quality data: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}