import React from 'react';
import { useLocation } from '../hooks/useLocation';
import { useQuery } from '@tanstack/react-query';
import { fetchAirQualityForecast } from '../services/forecastService';
import { AQITrendChart } from '../components/charts/AQITrendChart';
import { PollutantBarChart } from '../components/charts/PollutantBarChart';
import { Download, AlertTriangle } from 'lucide-react';

export default function Analytics() {
  const { latitude, longitude } = useLocation();

  const { data: forecastData, isLoading, error } = useQuery({
    queryKey: ['analytics', latitude, longitude],
    queryFn: () => {
      if (!latitude || !longitude) {
        throw new Error('Location not available');
      }
      return fetchAirQualityForecast(latitude, longitude);
    },
    enabled: !!latitude && !!longitude,
    refetchInterval: 30 * 60 * 1000,
  });

  const currentData = forecastData?.[0];
  const trendData = forecastData?.map(data => ({
    timestamp: data.timestamp,
    value: data.naqiValue
  })) || [];

  const pollutantData = currentData?.pollutants.map(pollutant => ({
    name: pollutant.displayName,
    value: pollutant.concentration.value,
    unit: pollutant.concentration.units
  })) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
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
            <h3 className="font-medium">Error loading analytics data</h3>
            <p className="text-sm mt-1">{error instanceof Error ? error.message : 'Failed to load analytics data'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-2">Detailed analysis of air quality data</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AQI Trend Analysis */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="flex justify-between items-center p-4 border-b">
            <div>
              <h2 className="text-xl font-semibold">NAQI Trend Analysis</h2>
              <p className="text-sm text-gray-500">96-hour air quality index progression</p>
            </div>
            <button
              onClick={() => handleExportData(trendData, 'aqi-trend-data.json')}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Download size={16} />
              Export
            </button>
          </div>
          <div className="p-4">
            <AQITrendChart data={trendData} />
          </div>
        </div>
        
        {/* Pollutant Distribution */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="flex justify-between items-center p-4 border-b">
            <div>
              <h2 className="text-xl font-semibold">Pollutant Distribution</h2>
              <p className="text-sm text-gray-500">Current concentration levels</p>
            </div>
            <button
              onClick={() => handleExportData(pollutantData, 'pollutant-data.json')}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Download size={16} />
              Export
            </button>
          </div>
          <div className="p-4">
            <PollutantBarChart data={pollutantData} />
          </div>
        </div>
      </div>
    </div>
  );
}