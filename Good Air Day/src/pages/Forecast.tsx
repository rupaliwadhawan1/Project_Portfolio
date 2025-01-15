import React from 'react';
import { ForecastChart } from '../components/ForecastChart';
import { useLocation } from '../hooks/useLocation';
import { useQuery } from '@tanstack/react-query';
import { fetchAirQualityForecast } from '../services/forecastService';
import { Wind, AlertTriangle, Info } from 'lucide-react';
import { MetricsCard } from '../components/MetricsCard';

export default function Forecast() {
  const { latitude, longitude } = useLocation();

  const { data: forecastData, isLoading, error } = useQuery({
    queryKey: ['forecast', latitude, longitude],
    queryFn: () => {
      if (!latitude || !longitude) {
        throw new Error('Location not available');
      }
      return fetchAirQualityForecast(latitude, longitude);
    },
    enabled: !!latitude && !!longitude,
    refetchInterval: 30 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-lg text-red-600">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-1" size={20} />
          <div>
            <h3 className="font-medium">Error loading forecast</h3>
            <p className="text-sm mt-1">{error instanceof Error ? error.message : 'Failed to load forecast data'}</p>
          </div>
        </div>
      </div>
    );
  }

  const currentForecast = forecastData?.[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Air Quality Forecast</h1>
        <p className="text-gray-600 mt-2">96-hour air quality predictions</p>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        {/* Current Conditions Card */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Current Conditions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* NAQI Card */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Wind className="text-blue-600" size={20} />
                <h3 className="text-sm font-medium text-blue-900">National Air Quality Index</h3>
              </div>
              <p className="text-2xl font-semibold text-blue-700 mt-1">
                {currentForecast?.naqiValue.toFixed(0) || 'N/A'}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {currentForecast?.category || 'No data'}
              </p>
            </div>
            
            {/* Universal AQI Card */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Wind className="text-blue-600" size={20} />
                <h3 className="text-sm font-medium text-blue-900">Universal AQI</h3>
              </div>
              <p className="text-2xl font-semibold text-blue-700 mt-1">
                {currentForecast?.value.toFixed(0) || 'N/A'}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {currentForecast?.category || 'No data'}
              </p>
            </div>
            
            {/* Dominant Pollutant Card */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Info className="text-blue-600" size={20} />
                <h3 className="text-sm font-medium text-blue-900">Dominant Pollutant</h3>
              </div>
              <p className="text-2xl font-semibold text-blue-700 mt-1">
                {currentForecast?.dominantPollutant.toUpperCase() || 'N/A'}
              </p>
              <p className="text-xs text-blue-600 mt-1">Primary concern</p>
            </div>
          </div>
        </div>

        {/* AQI Forecast Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">AQI Forecast</h2>
              <p className="text-sm text-gray-500">
                Predicted air quality index with confidence intervals
              </p>
            </div>
          </div>
          
          {forecastData && <ForecastChart data={forecastData} height={400} />}
        </div>

        {/* Pollutant Details */}
        {currentForecast?.pollutants && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Pollutant Details</h2>
              <Info className="text-gray-400" size={20} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentForecast.pollutants.map((pollutant) => (
                <div key={pollutant.code} className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900">{pollutant.fullName}</h3>
                  <div className="mt-2 space-y-2">
                    <p className="text-sm font-medium text-gray-700">
                      Concentration: {pollutant.concentration.value.toFixed(2)} {pollutant.concentration.units}
                    </p>
                    {pollutant.additionalInfo?.sources && (
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">Sources:</span> {pollutant.additionalInfo.sources}
                      </p>
                    )}
                    {pollutant.additionalInfo?.effects && (
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">Effects:</span> {pollutant.additionalInfo.effects}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}