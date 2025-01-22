import React from 'react';
import { Car, Wind, Navigation, Thermometer, Heart, Info } from 'lucide-react';
import { MetricsCard } from './MetricsCard';
import Map from './Map';
import { LocationInfo } from './LocationInfo';
import { useLocation } from '../hooks/useLocation';
import { useTrafficData } from '../hooks/useTrafficData';
import { useAirQualityData } from '../hooks/useAirQualityData';
import { useRoutesData } from '../hooks/useRoutesData';
import { useWeatherData } from '../hooks/useWeatherData';

export default function Dashboard() {
  const { 
    latitude, 
    longitude, 
    city, 
    loading: locationLoading 
  } = useLocation();

  const { 
    data: trafficData, 
    isLoading: trafficLoading
  } = useTrafficData();

  const {
    data: airQualityData,
    isLoading: aqiLoading
  } = useAirQualityData(latitude, longitude);

  const {
    data: routesData,
    isLoading: routesLoading
  } = useRoutesData();

  const {
    data: weatherData,
    isLoading: weatherLoading
  } = useWeatherData();

  return (
    <div className="min-h-screen bg-[#baa0b9]">
      <div className="w-full p-6 space-y-6">
        <header>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <p className="text-sm lg:text-base text-[#6e3972]">
                {locationLoading ? 'Detecting location...' : 
                  city ? `Real-time monitoring for ${city}` : 'Real-time monitoring and analysis'}
              </p>
            </div>
            <LocationInfo />
          </div>
        </header>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricsCard
            title="Traffic Free Flow Speed"
            value={trafficLoading ? "Loading..." : trafficData?.flowData?.freeFlowSpeed || "N/A"}
            icon={<Car className="text-brand-secondary" />}
            flowData={trafficData?.flowData}
            type="speed"
          />

          <MetricsCard
            title="Air Quality Index"
            value={aqiLoading ? "Loading..." : airQualityData?.naqiValue || "N/A"}
            icon={<Wind className="text-brand-secondary" />}
            type="aqi"
            category={airQualityData?.category}
          />

          <MetricsCard
            title="Active Routes"
            value={routesLoading ? "Loading..." : routesData?.activeRoutes || "N/A"}
            icon={<Navigation className="text-brand-secondary" />}
            type="number"
          />

          <MetricsCard
            title="Temperature"
            value={weatherLoading ? "Loading..." : weatherData ? weatherData.temp : "N/A"}
            icon={<Thermometer className="text-brand-secondary" />}
            type="temperature"
          />
        </div>

        {/* Map Section - Full Width */}
        <div className="bg-[#fcfcfc] rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-6">
          <h2 className="text-xl font-semibold text-brand-primary mb-4">Traffic Heat Map</h2>
          <div className="w-full h-[600px] relative">
            <Map />
          </div>
        </div>

        {/* Info Cards Below Map */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Health Recommendations Card */}
          <div className="bg-[#fcfcfc] rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-brand-primary">Health Recommendations</h2>
              <Heart className="text-brand-secondary" />
            </div>
            <div className="space-y-4">
              {aqiLoading ? (
                <div className="text-brand-tertiary">Loading recommendations...</div>
              ) : airQualityData?.healthRecommendations ? (
                Object.entries(airQualityData.healthRecommendations).map(([group, recommendation]) => (
                  <div key={group} className="space-y-1">
                    <h3 className="font-medium text-brand-primary capitalize">
                      {group.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </h3>
                    <p className="text-sm text-brand-tertiary">{recommendation}</p>
                  </div>
                ))
              ) : (
                <div className="text-brand-tertiary">No health recommendations available</div>
              )}
            </div>
          </div>

          {/* Pollutant Sources Card */}
          <div className="bg-[#fcfcfc] rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-brand-primary">Pollutant Sources</h2>
              <Info className="text-brand-secondary" />
            </div>
            <div className="space-y-4">
              {aqiLoading ? (
                <div className="text-brand-tertiary">Loading pollutant details...</div>
              ) : airQualityData?.pollutants?.length ? (
                airQualityData.pollutants.map((pollutant) => (
                  <div key={pollutant.code} className="space-y-2">
                    <h3 className="font-medium text-brand-primary">{pollutant.fullName} ({pollutant.code})</h3>
                    <p className="text-sm text-brand-tertiary">
                      {pollutant.additionalInfo.sources}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-brand-tertiary">No pollutant details available</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}