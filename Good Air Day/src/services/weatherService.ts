import { format } from 'date-fns';

export interface WeatherData {
  temp: number;
  humidity: number;
  timestamp: string;
}

export async function fetchWeatherData(latitude: number, longitude: number): Promise<WeatherData> {
  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=a6be472ef91c65a00387d696b6512c64&units=metric`
  );

  if (!response.ok) {
    throw new Error('Weather API request failed');
  }

  const data = await response.json();
  
  if (!data.main || typeof data.main.temp !== 'number' || typeof data.main.humidity !== 'number') {
    throw new Error('Invalid weather data received');
  }

  return {
    temp: data.main.temp,
    humidity: data.main.humidity,
    timestamp: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss'Z'")
  };
}